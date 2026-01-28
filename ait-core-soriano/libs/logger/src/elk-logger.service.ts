import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import axios from 'axios';
import * as os from 'os';

/**
 * ELK Logger Service for NestJS
 * Sends structured logs to Logstash/Elasticsearch
 */
@Injectable({ scope: Scope.DEFAULT })
export class ELKLoggerService implements LoggerService {
  private logger: winston.Logger;
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly hostname: string;

  constructor(serviceName = 'ait-core') {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || 'development';
    this.hostname = os.hostname();

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: {
        application: this.serviceName,
        environment: this.environment,
        hostname: this.hostname,
        pid: process.pid,
      },
      transports: this.createTransports(),
      exitOnError: false,
    });
  }

  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}]` : '';
            const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
            return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
          })
        ),
      })
    );

    // File transports (production)
    if (this.environment === 'production') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        })
      );
    }

    // Logstash transport (if configured)
    const logstashHost = process.env.LOGSTASH_HOST;
    const logstashPort = process.env.LOGSTASH_PORT;

    if (logstashHost && logstashPort) {
      transports.push(
        new LogstashTransport({
          host: logstashHost,
          port: parseInt(logstashPort, 10),
          application: this.serviceName,
        })
      );
    }

    return transports;
  }

  /**
   * Log informational message
   */
  log(message: any, context?: string): void {
    if (typeof message === 'object') {
      this.logger.info(message.message || 'Info', { ...message, context });
    } else {
      this.logger.info(message, { context });
    }
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string): void {
    if (typeof message === 'object') {
      this.logger.error(message.message || 'Error', {
        ...message,
        stack: trace || message.stack,
        context,
      });
    } else {
      this.logger.error(message, { stack: trace, context });
    }
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string): void {
    if (typeof message === 'object') {
      this.logger.warn(message.message || 'Warning', { ...message, context });
    } else {
      this.logger.warn(message, { context });
    }
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string): void {
    if (typeof message === 'object') {
      this.logger.debug(message.message || 'Debug', { ...message, context });
    } else {
      this.logger.debug(message, { context });
    }
  }

  /**
   * Log verbose message
   */
  verbose(message: any, context?: string): void {
    if (typeof message === 'object') {
      this.logger.verbose(message.message || 'Verbose', { ...message, context });
    } else {
      this.logger.verbose(message, { context });
    }
  }

  /**
   * Log HTTP request with structured data
   */
  logRequest(req: any, res: any, duration: number): void {
    const logData = {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      client_ip: req.ip || req.connection?.remoteAddress,
      correlationId: req.headers['x-correlation-id'],
      userId: req.user?.id,
      contentLength: res.get('content-length'),
    };

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    this.logger.log(level, 'HTTP Request', logData);
  }

  /**
   * Log error with full context
   */
  logError(error: Error, context?: any): void {
    this.logger.error('Error occurred', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }

  /**
   * Log business event
   */
  logEvent(event: string, data?: any): void {
    this.logger.info('Business Event', {
      event,
      eventData: data,
      eventTimestamp: new Date().toISOString(),
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, params?: any): void {
    this.logger.debug('Database Query', {
      query,
      duration,
      params,
      queryType: this.detectQueryType(query),
    });
  }

  /**
   * Log external API call
   */
  logApiCall(url: string, method: string, statusCode: number, duration: number, data?: any): void {
    this.logger.info('External API Call', {
      url,
      method,
      statusCode,
      duration,
      ...data,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: 'login' | 'logout' | 'failed' | 'token_refresh', userId?: string, ip?: string): void {
    this.logger.info('Authentication Event', {
      authEvent: event,
      userId,
      client_ip: ip,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, value: number, unit = 'ms'): void {
    this.logger.info('Performance Metric', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });
  }

  private detectQueryType(query: string): string {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.startsWith('select')) return 'SELECT';
    if (normalizedQuery.startsWith('insert')) return 'INSERT';
    if (normalizedQuery.startsWith('update')) return 'UPDATE';
    if (normalizedQuery.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }
}

/**
 * Custom Winston Transport for Logstash
 */
class LogstashTransport extends Transport {
  private host: string;
  private port: number;
  private application: string;
  private queue: any[] = [];
  private isProcessing = false;

  constructor(opts: any) {
    super(opts);
    this.host = opts.host;
    this.port = opts.port;
    this.application = opts.application;
  }

  log(info: any, callback: any): void {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Add to queue for batch processing
    this.queue.push({
      ...info,
      application: this.application,
      '@timestamp': new Date().toISOString(),
    });

    // Process queue if not already processing
    if (!this.isProcessing && this.queue.length >= 10) {
      this.processQueue();
    }

    // Also process queue after 1 second
    setTimeout(() => {
      if (!this.isProcessing && this.queue.length > 0) {
        this.processQueue();
      }
    }, 1000);

    callback();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const logs = this.queue.splice(0, 100); // Process max 100 at a time

    try {
      // Send to Logstash via HTTP (more reliable than TCP for batches)
      await axios.post(
        `http://${this.host}:8080`,
        logs.length === 1 ? logs[0] : logs,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err) {
      // Fail silently but log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send logs to Logstash:', err.message);
      }
    } finally {
      this.isProcessing = false;

      // Process remaining queue if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }
}

export default ELKLoggerService;
