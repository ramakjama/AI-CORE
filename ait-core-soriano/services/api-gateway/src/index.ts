/**
 * API Gateway - Centralized entry point for all frontend applications
 *
 * Routes requests to appropriate microservices:
 * - /auth/* → ait-authenticator
 * - /customers/*, /policies/*, /interactions/* → ait-core-soriano (ERP)
 * - /calls/*, /twilio/* → ait-comms-telephony
 * - /quotes/* → ait-qb
 * - /analytics/* → ait-datahub
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';

import { AITCoreClient, EventBus, User } from '@ait-core/shared';

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  services: {
    erp: {
      baseURL: process.env.ERP_SERVICE_URL || 'http://localhost:3001',
      apiKey: process.env.ERP_API_KEY
    },
    comms: {
      baseURL: process.env.COMMS_SERVICE_URL || 'http://localhost:3002',
      apiKey: process.env.COMMS_API_KEY
    },
    quotes: {
      baseURL: process.env.QUOTES_SERVICE_URL || 'http://localhost:3003',
      apiKey: process.env.QUOTES_API_KEY
    },
    auth: {
      baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3004',
      apiKey: process.env.AUTH_API_KEY
    },
    datahub: {
      baseURL: process.env.DATAHUB_SERVICE_URL || 'http://localhost:3005',
      apiKey: process.env.DATAHUB_API_KEY
    }
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
  }
};

// ============================================================================
// LOGGER
// ============================================================================

const logger = createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// ============================================================================
// REDIS & EVENT BUS
// ============================================================================

const redis = new Redis(config.redis);

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

const eventBus = new EventBus({
  redis,
  consumerGroup: 'api-gateway',
  consumerId: `gateway-${process.pid}`
});

// Start consuming events
eventBus.startConsuming('*');

// ============================================================================
// AIT-CORE CLIENT
// ============================================================================

let currentToken: string | null = null;

const aitClient = new AITCoreClient({
  services: config.services,
  onTokenRequest: async () => {
    return currentToken || '';
  }
});

// ============================================================================
// EXPRESS APP
// ============================================================================

const app: Express = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

app.use(limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided'
        }
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, config.jwtSecret) as any;

    // Get user from cache or fetch
    const cacheKey = `user:${decoded.userId}`;
    let user = await redis.get(cacheKey);

    if (!user) {
      // Fetch from auth service
      const userData = await aitClient.auth.getUser(token);
      user = JSON.stringify(userData);
      await redis.set(cacheKey, user, 'EX', 300); // Cache for 5 min
    }

    req.user = JSON.parse(user);
    req.token = token;
    currentToken = token;

    next();
  } catch (err: any) {
    logger.error('Authentication error:', err);
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: err.message || 'Invalid token'
      }
    });
  }
}

// Permission check middleware
function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
      });
      return;
    }

    const hasPermission = permissions.some(p =>
      req.user!.permissions.includes(p as any) ||
      req.user!.permissions.includes('admin:*' as any)
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
      return;
    }

    next();
  };
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// ──────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await aitClient.auth.login(email, password);

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    logger.error('Login error:', err);
    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: err.message || 'Invalid credentials'
      }
    });
  }
});

app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const tokens = await aitClient.auth.refresh(refreshToken);

    res.json({
      success: true,
      data: tokens
    });
  } catch (err: any) {
    logger.error('Refresh error:', err);
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: err.message
      }
    });
  }
});

app.post('/api/auth/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    await aitClient.auth.logout(refreshToken);

    // Clear cache
    if (req.user) {
      await redis.del(`user:${req.user.id}`);
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    });
  } catch (err: any) {
    logger.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: err.message
      }
    });
  }
});

app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user
  });
});

// ──────────────────────────────────────────────────────────────────────────
// CUSTOMER / CRM ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.get('/api/customers/search', authenticate, requirePermission('customer:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, phone } = req.query;

    let customer;
    if (phone) {
      customer = await aitClient.erp.customers.findByPhone(phone as string);
    } else if (q) {
      const customers = await aitClient.erp.customers.search(q as string);
      res.json({ success: true, data: customers });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (err: any) {
    logger.error('Customer search error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_FAILED', message: err.message }
    });
  }
});

app.get('/api/customers/:id', authenticate, requirePermission('customer:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await aitClient.erp.customers.findById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err: any) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Customer not found' }
    });
  }
});

app.get('/api/customers/:id/context', authenticate, requirePermission('customer:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { callSid } = req.query;
    const context = await aitClient.erp.customers.getContext(
      req.params.id,
      callSid as string | undefined
    );

    res.json({ success: true, data: context });
  } catch (err: any) {
    logger.error('Get context error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'CONTEXT_FAILED', message: err.message }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// POLICIES ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.get('/api/policies', authenticate, requirePermission('policy:read'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'customerId required' }
      });
      return;
    }

    const policies = await aitClient.erp.policies.getActive(customerId as string);
    res.json({ success: true, data: policies });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: err.message }
    });
  }
});

app.post('/api/policies', authenticate, requirePermission('policy:write'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const policy = await aitClient.erp.policies.create(req.body);

    // Emit event
    await eventBus.publish('policy.created', {
      policyId: policy.id,
      customerId: policy.customerId,
      type: policy.type,
      premium: policy.premium,
      createdBy: req.user!.id
    });

    res.json({ success: true, data: policy });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: err.message }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// CALLS / TELEPHONY ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.post('/api/twilio/token', authenticate, requirePermission('call:make', 'call:receive'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agentId = req.user!.agentId;

    if (!agentId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'User is not an agent' }
      });
      return;
    }

    const twilioToken = await aitClient.comms.getTwilioToken(agentId);

    res.json({ success: true, data: twilioToken });
  } catch (err: any) {
    logger.error('Twilio token error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'TOKEN_FAILED', message: err.message }
    });
  }
});

app.post('/api/calls/outbound', authenticate, requirePermission('call:make'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const call = await aitClient.comms.calls.initiate({
      ...req.body,
      agentId: req.user!.agentId!
    });

    // Emit event
    await eventBus.publish('call.initiated', {
      callSid: call.callSid,
      agentId: req.user!.agentId,
      customerId: call.customerId,
      direction: 'outbound'
    });

    res.json({ success: true, data: call });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CALL_FAILED', message: err.message }
    });
  }
});

app.get('/api/calls/:callSid/context', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const context = await aitClient.getCallContext(req.params.callSid);
    res.json({ success: true, data: context });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CONTEXT_FAILED', message: err.message }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// QUOTES ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.post('/api/quotes/auto', authenticate, requirePermission('quote:create'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quote = await aitClient.quotes.calculateAuto({
      ...req.body,
      agentId: req.user!.agentId
    });

    await eventBus.publish('quote.created', {
      quoteId: quote.id,
      customerId: quote.customerId,
      type: 'auto',
      premium: quote.calculatedPremium
    });

    res.json({ success: true, data: quote });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'QUOTE_FAILED', message: err.message }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// ANALYTICS ROUTES
// ──────────────────────────────────────────────────────────────────────────

app.get('/api/analytics/calls', authenticate, requirePermission('analytics:view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period = 'today' } = req.query;
    const metrics = await aitClient.datahub.getCallMetrics(period as any);
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_FAILED', message: err.message }
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ──────────────────────────────────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
      stack: config.nodeEnv === 'production' ? undefined : err.stack
    }
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(config.port, () => {
  logger.info(`🚀 API Gateway running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Services:`);
  logger.info(`  - ERP: ${config.services.erp.baseURL}`);
  logger.info(`  - Comms: ${config.services.comms.baseURL}`);
  logger.info(`  - Quotes: ${config.services.quotes.baseURL}`);
  logger.info(`  - Auth: ${config.services.auth.baseURL}`);
  logger.info(`  - DataHub: ${config.services.datahub.baseURL}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  eventBus.stopConsuming();
  await redis.quit();
  process.exit(0);
});

export default app;
