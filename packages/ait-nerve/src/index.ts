#!/usr/bin/env node
/**
 * ⚡ AIT-NERVE
 * Network Engine Runtime & Vital Executor
 *
 * El Sistema Nervioso Central del Ecosistema AIT-CORE
 *
 * @author AIT-CORE Team
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { motorsRouter } from './api/motors';
import { metricsRouter } from './api/metrics';
import { logsRouter } from './api/logs';
import { configRouter } from './api/config';
import { healthRouter } from './api/health';
import { prometheusMiddleware, metricsEndpoint } from './lib/prometheus';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Prometheus metrics
app.use(prometheusMiddleware);

// ============================================================================
// ROUTES
// ============================================================================

app.get('/', (req, res) => {
  res.json({
    name: 'AIT-NERVE',
    version: '1.0.0',
    tagline: 'Network Engine Runtime & Vital Executor',
    status: 'operational',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api',
      health: '/api/health',
      metrics: '/metrics',
      motors: '/api/motors',
      logs: '/api/logs',
      config: '/api/config',
    },
  });
});

// Health check
app.use('/api/health', healthRouter);

// API routes
app.use('/api/motors', motorsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/config', configRouter);

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler (debe ser el último middleware)
app.use(errorHandler);

// ============================================================================
// WEBSOCKET
// ============================================================================

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('subscribe:motor', (motorId: string) => {
    socket.join(`motor:${motorId}`);
    logger.debug(`Client ${socket.id} subscribed to motor:${motorId}`);
  });

  socket.on('unsubscribe:motor', (motorId: string) => {
    socket.leave(`motor:${motorId}`);
    logger.debug(`Client ${socket.id} unsubscribed from motor:${motorId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Export IO instance for use in services
export { io };

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info('Prisma disconnected');

    // Close Redis connection
    if (redis) {
      await redis.quit();
      logger.info('Redis disconnected');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection (optional)
    if (redis) {
      await redis.ping();
      logger.info('✅ Redis connected');
    }

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                                ║
║                    ⚡ AIT-NERVE v1.0.0 ⚡                     ║
║          Network Engine Runtime & Vital Executor               ║
║                                                                ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  🌐 API Server:        http://localhost:${config.port}                  ║
║  📊 Prometheus:        http://localhost:${config.port}/metrics          ║
║  🔌 WebSocket:         ws://localhost:${config.port}                    ║
║  🏥 Health Check:      http://localhost:${config.port}/api/health       ║
║                                                                ║
║  📝 Environment:       ${config.nodeEnv.toUpperCase().padEnd(39)}║
║  📊 Log Level:         ${config.logLevel.toUpperCase().padEnd(39)}║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
