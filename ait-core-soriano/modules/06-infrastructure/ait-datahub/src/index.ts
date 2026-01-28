import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { graphqlHTTP } from 'express-graphql';
import { logger } from './utils/logger.utils';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { metricsMiddleware, register } from './utils/metrics.utils';
import { schema } from './schema/graphql.schema';
import dataRoutes from './routes/data.routes';
import syncRoutes from './routes/sync.routes';
import healthRoutes from './routes/health.routes';
import { initializeDatabases } from './config/database.config';
import { initializeRedis } from './config/redis.config';
import { initializeQueues } from './config/queue.config';
import { startCronJobs } from './utils/cron.utils';
import { initializeWebSocket } from './utils/websocket.utils';

dotenv.config();

class DataHubServer {
  private app: Application;
  private server: Server | null = null;
  private io: SocketIOServer | null = null;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4002', 10);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.setupInfrastructure();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async setupInfrastructure(): Promise<void> {
    try {
      await initializeDatabases();
      await initializeRedis();
      await initializeQueues();
      logger.info('All infrastructure connections established');
    } catch (error) {
      logger.error('Failed to initialize infrastructure:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true
    }));

    // Parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Logging and metrics
    this.app.use(requestLogger);
    this.app.use(metricsMiddleware);

    logger.info('Middleware configured successfully');
  }

  private setupRoutes(): void {
    // Health and metrics
    this.app.use('/health', healthRoutes);
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // GraphQL endpoint
    this.app.use('/graphql', graphqlHTTP({
      schema,
      graphiql: process.env.NODE_ENV === 'development'
    }));

    // REST API routes
    this.app.use('/api/v1/data', dataRoutes);
    this.app.use('/api/v1/sync', syncRoutes);

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

      // Initialize WebSocket
      this.io = initializeWebSocket(this.server);

      // Start cron jobs
      startCronJobs();

      this.server.listen(this.port, () => {
        logger.info(`📊 AIT-DataHub running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
        logger.info(`GraphQL: http://localhost:${this.port}/graphql`);
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

      if (this.io) {
        this.io.close();
        logger.info('WebSocket server closed');
      }

      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });

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
const dataHubServer = new DataHubServer();
dataHubServer.start();

export default dataHubServer;
