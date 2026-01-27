/**
 * AI Gateway - GraphQL Federation Gateway
 * Main entry point and server setup
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';
import gql from 'graphql-tag';

// OpenTelemetry imports
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Local imports
import {
  GraphQLContext,
  GatewayConfig,
  Logger,
} from './types';

import { createDataLoaders, createBasicDataLoaders } from './dataloaders';
import { resolvers } from './resolvers';
import {
  initializeAuth,
  extractUser,
} from './middleware/auth.middleware';
import {
  initializeRateLimiter,
  createRateLimitMiddleware,
} from './middleware/rate-limit.middleware';
import {
  initializeCache,
  createCacheService,
} from './middleware/cache.middleware';
import {
  initializeFederation,
  getFederationHealth,
} from './services/federation.service';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: GatewayConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'ai-gateway:',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'ai-gateway',
    audience: 'ai-core',
  },
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    keyPrefix: 'ratelimit:',
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL || '300', 10),
    keyPrefix: 'cache:',
  },
  federation: {
    subgraphs: [],
    polling: {
      enabled: process.env.FEDERATION_POLLING === 'true',
      intervalMs: parseInt(process.env.FEDERATION_POLLING_INTERVAL || '30000', 10),
    },
  },
  tracing: {
    enabled: process.env.TRACING_ENABLED === 'true',
    serviceName: process.env.SERVICE_NAME || 'ai-gateway',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT,
    samplingRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '0.1'),
  },
};

// ============================================================================
// Logger
// ============================================================================

function createLogger(requestId?: string): Logger {
  const prefix = requestId ? `[${requestId}]` : '[Gateway]';

  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(`${prefix} INFO: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(`${prefix} WARN: ${message}`, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
      console.error(
        `${prefix} ERROR: ${message}`,
        error?.message || '',
        meta ? JSON.stringify(meta) : ''
      );
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.DEBUG === 'true') {
        console.debug(`${prefix} DEBUG: ${message}`, meta ? JSON.stringify(meta) : '');
      }
    },
  };
}

// ============================================================================
// OpenTelemetry Setup
// ============================================================================

let otelSdk: NodeSDK | null = null;

function initializeTracing(config: GatewayConfig['tracing']): void {
  if (!config.enabled) {
    console.log('OpenTelemetry tracing disabled');
    return;
  }

  const exporter = config.jaegerEndpoint
    ? new JaegerExporter({ endpoint: config.jaegerEndpoint })
    : undefined;

  otelSdk = new NodeSDK({
    serviceName: config.serviceName,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  otelSdk.start();
  console.log(`OpenTelemetry initialized for service: ${config.serviceName}`);
}

// ============================================================================
// Schema Loading
// ============================================================================

function loadSchemas(): string {
  const schemaDir = join(__dirname, 'schema');

  try {
    const baseSchema = readFileSync(join(schemaDir, 'base.graphql'), 'utf-8');
    const partySchema = readFileSync(join(schemaDir, 'party.graphql'), 'utf-8');
    const insuranceSchema = readFileSync(join(schemaDir, 'insurance.graphql'), 'utf-8');

    return `
      ${baseSchema}
      ${partySchema}
      ${insuranceSchema}
    `;
  } catch (error) {
    console.error('Error loading schemas:', error);
    // Return minimal schema for development
    return `
      scalar DateTime
      scalar JSON
      scalar UUID
      scalar Decimal

      type Query {
        _health: HealthCheck!
      }

      type Mutation {
        _noop: Boolean
      }

      type HealthCheck {
        status: String!
        timestamp: DateTime!
        version: String!
        uptime: Int!
      }
    `;
  }
}

// ============================================================================
// Apollo Server Plugins
// ============================================================================

function createTracingPlugin() {
  const tracer = trace.getTracer('ai-gateway');

  return {
    async requestDidStart() {
      const span = tracer.startSpan('graphql-request');

      return {
        async didResolveOperation(requestContext: { operationName?: string; operation?: { operation: string } }) {
          span.setAttribute('graphql.operation.name', requestContext.operationName || 'anonymous');
          span.setAttribute('graphql.operation.type', requestContext.operation?.operation || 'unknown');
        },

        async didEncounterErrors(requestContext: { errors?: Array<{ message: string }> }) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: requestContext.errors?.map(e => e.message).join(', '),
          });
        },

        async willSendResponse(requestContext: { response?: { http?: { status?: number } } }) {
          span.setAttribute('http.status_code', requestContext.response?.http?.status || 200);
          span.end();
        },
      };
    },
  };
}

function createLoggingPlugin(logger: Logger) {
  return {
    async requestDidStart(requestContext: { request?: { operationName?: string } }) {
      const startTime = Date.now();
      logger.debug('Request started', {
        operationName: requestContext.request?.operationName,
      });

      return {
        async willSendResponse(responseContext: { response?: { http?: { status?: number } }; errors?: Array<{ message: string }> }) {
          const duration = Date.now() - startTime;
          logger.info('Request completed', {
            duration,
            status: responseContext.response?.http?.status || 200,
            errors: responseContext.errors?.length || 0,
          });
        },
      };
    },
  };
}

// ============================================================================
// Server Creation
// ============================================================================

export async function createGatewayServer(
  config: Partial<GatewayConfig> = {}
): Promise<{
  app: express.Application;
  httpServer: ReturnType<typeof createServer>;
  apolloServer: ApolloServer<GraphQLContext>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}> {
  const mergedConfig: GatewayConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    cors: { ...DEFAULT_CONFIG.cors, ...config.cors },
    redis: { ...DEFAULT_CONFIG.redis, ...config.redis },
    jwt: { ...DEFAULT_CONFIG.jwt, ...config.jwt },
    rateLimit: { ...DEFAULT_CONFIG.rateLimit, ...config.rateLimit },
    cache: { ...DEFAULT_CONFIG.cache, ...config.cache },
    federation: { ...DEFAULT_CONFIG.federation, ...config.federation },
    tracing: { ...DEFAULT_CONFIG.tracing, ...config.tracing },
  };

  const logger = createLogger();

  // Initialize Redis
  const redis = new Redis({
    host: mergedConfig.redis.host,
    port: mergedConfig.redis.port,
    password: mergedConfig.redis.password,
    db: mergedConfig.redis.db,
    keyPrefix: mergedConfig.redis.keyPrefix,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err) => logger.error('Redis error', err));
  redis.on('connect', () => logger.info('Redis connected'));

  // Initialize middleware
  initializeAuth(mergedConfig.jwt);
  initializeRateLimiter(redis);
  initializeCache(redis);
  initializeFederation(mergedConfig.federation);

  // Initialize tracing
  initializeTracing(mergedConfig.tracing);

  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Load schema
  const typeDefs = gql(loadSchemas());

  // Create Apollo Server
  const apolloServer = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      createTracingPlugin(),
      createLoggingPlugin(logger),
    ],
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (formattedError, error) => {
      logger.error('GraphQL Error', error as Error, {
        message: formattedError.message,
        path: formattedError.path,
      });

      // Hide internal errors in production
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'An internal error occurred',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          };
        }
      }

      return formattedError;
    },
  });

  // Apply middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // Health check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const federationHealth = await getFederationHealth();
      const redisHealth = await redis.ping() === 'PONG';

      const healthy = redisHealth; // && federationHealth.healthy;

      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        redis: redisHealth ? 'connected' : 'disconnected',
        federation: {
          healthy: federationHealth.healthy,
          unhealthySubgraphs: federationHealth.unhealthyCount,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Ready check endpoint
  app.get('/ready', (_req: Request, res: Response) => {
    res.status(200).json({ ready: true });
  });

  // Metrics endpoint (basic)
  app.get('/metrics', (_req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send(`
# HELP ai_gateway_uptime_seconds Server uptime in seconds
# TYPE ai_gateway_uptime_seconds gauge
ai_gateway_uptime_seconds ${Math.floor(process.uptime())}

# HELP ai_gateway_memory_bytes Memory usage in bytes
# TYPE ai_gateway_memory_bytes gauge
ai_gateway_memory_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
ai_gateway_memory_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
ai_gateway_memory_bytes{type="rss"} ${process.memoryUsage().rss}
    `.trim());
  });

  // Rate limiting middleware
  app.use('/graphql', createRateLimitMiddleware({
    maxRequests: mergedConfig.rateLimit.maxRequests,
    windowMs: mergedConfig.rateLimit.windowMs,
    keyPrefix: 'ratelimit:graphql:',
    skip: (req) => req.method === 'OPTIONS',
  }));

  const start = async (): Promise<void> => {
    await apolloServer.start();

    // Apply GraphQL middleware
    app.use(
      '/graphql',
      cors<cors.CorsRequest>(mergedConfig.cors),
      express.json({ limit: '10mb' }),
      expressMiddleware(apolloServer, {
        context: async ({ req, res }): Promise<GraphQLContext> => {
          const requestId = (req.headers['x-request-id'] as string) || uuidv4();
          const startTime = Date.now();

          // Extract user from token
          const tempContext = {
            req,
            res,
            requestId,
            startTime,
            dataloaders: createBasicDataLoaders(),
            cacheService: createCacheService(),
            logger: createLogger(requestId),
          };

          return tempContext;
        },
      })
    );

    // Error handling middleware
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error('Unhandled error', err);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? undefined : err.message,
      });
    });

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen({ port: mergedConfig.port, host: mergedConfig.host }, resolve);
    });

    logger.info(`AI Gateway running at http://${mergedConfig.host}:${mergedConfig.port}/graphql`);
  };

  const stop = async (): Promise<void> => {
    logger.info('Shutting down AI Gateway...');

    await apolloServer.stop();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await redis.quit();

    if (otelSdk) {
      await otelSdk.shutdown();
    }

    logger.info('AI Gateway shutdown complete');
  };

  return { app, httpServer, apolloServer, start, stop };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const { start, stop } = await createGatewayServer();

  // Handle graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down...`);
      await stop();
      process.exit(0);
    });
  });

  await start();
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start AI Gateway:', error);
    process.exit(1);
  });
}

// ============================================================================
// Exports
// ============================================================================

export * from './types';
export * from './middleware';
export * from './services';
export * from './resolvers';
export * from './dataloaders';

export { createLogger, DEFAULT_CONFIG };
export default createGatewayServer;
