/**
 * AIT-Authenticator - Authentication Service
 *
 * Features:
 * - Email/Password authentication
 * - OAuth (Google, Microsoft)
 * - JWT tokens
 * - 2FA (TOTP)
 * - RBAC (Role-Based Access Control)
 * - Session management
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import passport from 'passport';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import { setupPassport } from './config/passport';
import { register as registerMetrics } from 'prom-client';

// Load environment variables
dotenv.config();

// ============================================================================
// CONFIGURATION
// ============================================================================

const config = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'aitcore_dev',
    user: process.env.DB_USER || 'aitcore',
    password: process.env.DB_PASSWORD || 'dev_password'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3004/auth/google/callback'
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3004/auth/microsoft/callback'
    }
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
  }
};

// ============================================================================
// DATABASE & REDIS
// ============================================================================

export const db = new Pool(config.database);

db.on('connect', () => {
  logger.info('Connected to PostgreSQL');
});

db.on('error', (err) => {
  logger.error('PostgreSQL error:', err);
  process.exit(1);
});

export const redis = new Redis(config.redis);

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
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
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/metrics'
});

app.use(limiter);

// Passport
app.use(passport.initialize());
setupPassport(passport);

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

// Metrics (Prometheus)
app.get('/metrics', async (req: Request, res: Response) => {
  res.set('Content-Type', registerMetrics.contentType);
  res.end(await registerMetrics.metrics());
});

// Auth routes
app.use('/auth', authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(config.port, () => {
  logger.info(`🔐 AIT-Authenticator running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`CORS origins: ${config.cors.origins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  await db.end();
  await redis.quit();

  process.exit(0);
});

export default app;
