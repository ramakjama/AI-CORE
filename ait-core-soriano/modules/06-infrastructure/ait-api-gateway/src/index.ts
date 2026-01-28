import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { createServer, Server } from 'http';
import CircuitBreaker from 'opossum';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from './utils/logger.utils';
import { register } from './utils/metrics.utils';

dotenv.config();

interface ServiceConfig {
  name: string;
  target: string;
  pathPrefix: string;
  timeout?: number;
  retries?: number;
}

class APIGateway {
  private app: Application;
  private server: Server | null = null;
  private readonly port: number;
  private redis: Redis;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private services: ServiceConfig[] = [
    {
      name: 'auth',
      target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
      pathPrefix: '/api/v1/auth',
      timeout: 5000
    },
    {
      name: 'datahub',
      target: process.env.DATAHUB_SERVICE_URL || 'http://localhost:4002',
      pathPrefix: '/api/v1/data',
      timeout: 10000
    },
    {
      name: 'notifications',
      target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
      pathPrefix: '/api/v1/notifications',
      timeout: 5000
    },
    {
      name: 'documents',
      target: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4005',
      pathPrefix: '/api/v1/documents',
      timeout: 15000
    }
  ];

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4003', 10);
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10)
    });
    this.initialize();
  }

  private initialize(): void {
    this.setupMiddleware();
    this.setupCircuitBreakers();
    this.setupProxies();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true
    }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Global rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      store: new RedisStore({
        client: this.redis,
        prefix: 'rl:gateway:'
      }),
      message: { success: false, error: 'Too many requests' }
    }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request processed', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip
        });
      });
      next();
    });

    logger.info('Middleware configured');
  }

  private setupCircuitBreakers(): void {
    for (const service of this.services) {
      const breaker = new CircuitBreaker(
        async (req: Request) => {
          // Circuit breaker wraps the actual request
          return req;
        },
        {
          timeout: service.timeout || 5000,
          errorThresholdPercentage: 50,
          resetTimeout: 30000, // 30 seconds
          rollingCountTimeout: 10000,
          rollingCountBuckets: 10
        }
      );

      breaker.on('open', () => {
        logger.warn(`Circuit breaker opened for service: ${service.name}`);
      });

      breaker.on('halfOpen', () => {
        logger.info(`Circuit breaker half-open for service: ${service.name}`);
      });

      breaker.on('close', () => {
        logger.info(`Circuit breaker closed for service: ${service.name}`);
      });

      this.circuitBreakers.set(service.name, breaker);
    }

    logger.info('Circuit breakers configured');
  }

  private setupProxies(): void {
    for (const service of this.services) {
      const proxyOptions: Options = {
        target: service.target,
        changeOrigin: true,
        pathRewrite: {
          [`^${service.pathPrefix}`]: '/api/v1'
        },
        onProxyReq: (proxyReq, req) => {
          // Add custom headers
          proxyReq.setHeader('X-Forwarded-By', 'AIT-Gateway');
          proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || '');
        },
        onProxyRes: (proxyRes, req, res) => {
          // Add response headers
          proxyRes.headers['X-Proxied-By'] = 'AIT-Gateway';
        },
        onError: (err, req, res) => {
          logger.error(`Proxy error for ${service.name}:`, err);
          (res as Response).status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            service: service.name
          });
        }
      };

      // Apply circuit breaker middleware before proxy
      this.app.use(service.pathPrefix, (req: Request, res: Response, next: NextFunction) => {
        const breaker = this.circuitBreakers.get(service.name);
        if (breaker && breaker.opened) {
          return res.status(503).json({
            success: false,
            error: 'Service circuit breaker is open',
            service: service.name
          });
        }
        next();
      });

      this.app.use(service.pathPrefix, createProxyMiddleware(proxyOptions));

      logger.info(`Proxy configured: ${service.pathPrefix} -> ${service.target}`);
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        service: 'ait-api-gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Readiness check
    this.app.get('/health/ready', async (req, res) => {
      try {
        await this.redis.ping();
        res.json({
          success: true,
          redis: 'connected',
          services: this.services.map(s => ({
            name: s.name,
            circuitOpen: this.circuitBreakers.get(s.name)?.opened || false
          }))
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          error: 'Service not ready'
        });
      }
    });

    // Metrics
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Service discovery
    this.app.get('/services', (req, res) => {
      res.json({
        success: true,
        services: this.services.map(s => ({
          name: s.name,
          path: s.pathPrefix,
          status: this.circuitBreakers.get(s.name)?.opened ? 'unavailable' : 'available'
        }))
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  public async start(): Promise<void> {
    try {
      this.server = createServer(this.app);

      this.server.listen(this.port, () => {
        logger.info(`🚪 AIT-API-Gateway running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health: http://localhost:${this.port}/health`);
        logger.info(`Services: http://localhost:${this.port}/services`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          this.redis.quit();
          process.exit(0);
        });

        setTimeout(() => {
          logger.error('Forced shutdown');
          process.exit(1);
        }, 30000);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const gateway = new APIGateway();
gateway.start();

export default gateway;
