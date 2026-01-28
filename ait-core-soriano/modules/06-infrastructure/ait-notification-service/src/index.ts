import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import Bull from 'bull';
import { logger } from './utils/logger.utils';
import { errorHandler } from './middleware/error.middleware';
import { register } from './utils/metrics.utils';
import notificationRoutes from './routes/notification.routes';
import healthRoutes from './routes/health.routes';
import { emailService } from './services/email.service';
import { smsService } from './services/sms.service';
import { pushService } from './services/push.service';

dotenv.config();

class NotificationService {
  private app: Application;
  private server: Server | null = null;
  private readonly port: number;
  private emailQueue!: Bull.Queue;
  private smsQueue!: Bull.Queue;
  private pushQueue!: Bull.Queue;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4004', 10);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.setupQueues();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.startQueueProcessors();
  }

  private async setupQueues(): Promise<void> {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10)
    };

    this.emailQueue = new Bull('email-notifications', { redis: redisConfig });
    this.smsQueue = new Bull('sms-notifications', { redis: redisConfig });
    this.pushQueue = new Bull('push-notifications', { redis: redisConfig });

    logger.info('Notification queues initialized');
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        logger.info('Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${Date.now() - start}ms`
        });
      });
      next();
    });
  }

  private setupRoutes(): void {
    this.app.use('/health', healthRoutes);
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    this.app.use('/api/v1/notifications', notificationRoutes);

    // Queue management endpoints
    this.app.get('/api/v1/queues/stats', async (req, res) => {
      const [emailStats, smsStats, pushStats] = await Promise.all([
        this.emailQueue.getJobCounts(),
        this.smsQueue.getJobCounts(),
        this.pushQueue.getJobCounts()
      ]);

      res.json({
        success: true,
        queues: {
          email: emailStats,
          sms: smsStats,
          push: pushStats
        }
      });
    });

    this.app.use('*', (req, res) => {
      res.status(404).json({ success: false, error: 'Route not found' });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private startQueueProcessors(): void {
    // Email processor
    this.emailQueue.process(async (job) => {
      logger.info(`Processing email job: ${job.id}`);
      try {
        await emailService.send(job.data);
        return { success: true };
      } catch (error) {
        logger.error('Email job failed:', error);
        throw error;
      }
    });

    // SMS processor
    this.smsQueue.process(async (job) => {
      logger.info(`Processing SMS job: ${job.id}`);
      try {
        await smsService.send(job.data);
        return { success: true };
      } catch (error) {
        logger.error('SMS job failed:', error);
        throw error;
      }
    });

    // Push processor
    this.pushQueue.process(async (job) => {
      logger.info(`Processing push job: ${job.id}`);
      try {
        await pushService.send(job.data);
        return { success: true };
      } catch (error) {
        logger.error('Push job failed:', error);
        throw error;
      }
    });

    logger.info('Queue processors started');
  }

  public async start(): Promise<void> {
    try {
      this.server = createServer(this.app);

      this.server.listen(this.port, () => {
        logger.info(`📧 AIT-Notification-Service running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health: http://localhost:${this.port}/health`);
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

      // Close queues
      await Promise.all([
        this.emailQueue.close(),
        this.smsQueue.close(),
        this.pushQueue.close()
      ]);

      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public getQueues() {
    return {
      email: this.emailQueue,
      sms: this.smsQueue,
      push: this.pushQueue
    };
  }
}

const notificationService = new NotificationService();
notificationService.start();

export default notificationService;
