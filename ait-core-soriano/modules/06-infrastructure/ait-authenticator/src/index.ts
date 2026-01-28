import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { createServer, Server } from 'http';
import { logger } from './utils/logger.utils';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { metricsMiddleware, register } from './utils/metrics.utils';
import { initializePassport } from './config/passport.config';
import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import userRoutes from './routes/user.routes';
import healthRoutes from './routes/health.routes';
import { initializeDatabase } from './config/database.config';
import { initializeRedis } from './config/redis.config';

dotenv.config();

class AuthServer {
  private app: Application;
  private server: Server | null = null;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4001', 10);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async setupDatabase(): Promise<void> {
    try {
      await initializeDatabase();
      await initializeRedis();
      logger.info('Database and Redis connections established');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Logging and metrics
    this.app.use(requestLogger);
    this.app.use(metricsMiddleware);

    // Passport initialization
    this.app.use(passport.initialize());
    initializePassport();

    logger.info('Middleware configured successfully');
  }

  private setupRoutes(): void {
    // Health and metrics
    this.app.use('/health', healthRoutes);
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/oauth', oauthRoutes);
    this.app.use('/api/v1/users', userRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    logger.info('Routes configured successfully');
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      this.server = createServer(this.app);

      this.server.listen(this.port, () => {
        logger.info(`🔐 AIT-Authenticator running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`Metrics: http://localhost:${this.port}/metrics`);
      });

      // Graceful shutdown
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
          process.exit(0);
        });

        // Force shutdown after 30 seconds
        setTimeout(() => {
          logger.error('Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      shutdown('unhandledRejection');
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Start server
const authServer = new AuthServer();
authServer.start();

export default authServer;
