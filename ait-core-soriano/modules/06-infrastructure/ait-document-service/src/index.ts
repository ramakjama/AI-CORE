import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import { logger } from './utils/logger.utils';
import { errorHandler } from './middleware/error.middleware';
import { register } from './utils/metrics.utils';
import documentRoutes from './routes/document.routes';
import uploadRoutes from './routes/upload.routes';
import searchRoutes from './routes/search.routes';
import healthRoutes from './routes/health.routes';
import { storageService } from './services/storage.service';
import { searchService } from './services/search.service';

dotenv.config();

class DocumentService {
  private app: Application;
  private server: Server | null = null;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '4005', 10);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async setupServices(): Promise<void> {
    try {
      await storageService.initialize();
      await searchService.initialize();
      logger.info('Services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true
    }));
    this.app.use(express.json({ limit: '100mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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

    this.app.use('/api/v1/documents', documentRoutes);
    this.app.use('/api/v1/upload', uploadRoutes);
    this.app.use('/api/v1/search', searchRoutes);

    // Storage info
    this.app.get('/api/v1/storage/info', async (req, res) => {
      const info = await storageService.getInfo();
      res.json({ success: true, data: info });
    });

    this.app.use('*', (req, res) => {
      res.status(404).json({ success: false, error: 'Route not found' });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      this.server = createServer(this.app);

      this.server.listen(this.port, () => {
        logger.info(`📄 AIT-Document-Service running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health: http://localhost:${this.port}/health`);
        logger.info(`Storage: ${process.env.STORAGE_PROVIDER || 'local'}`);
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
          logger.info('Server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const documentService = new DocumentService();
documentService.start();

export default documentService;
