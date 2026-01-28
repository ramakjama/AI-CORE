/**
 * Winston logger configuration
 */

import winston from 'winston';

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

/**
 * Custom log format for console
 */
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

/**
 * Create logger instance
 */
export const createLogger = (service: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    defaultMeta: { service },
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    transports: [
      // Console transport
      new winston.transports.Console({
        format: isDevelopment
          ? combine(colorize(), consoleFormat)
          : json(),
      }),

      // File transports for production
      ...(isDevelopment
        ? []
        : [
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: json(),
            }),
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: json(),
            }),
          ]),
    ],
  });
};

/**
 * Default logger instance
 */
export const logger = createLogger('@ait-core/shared');

/**
 * Logger utilities
 */
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logInfo = (message: string, metadata?: Record<string, unknown>) => {
  logger.info(message, metadata);
};

export const logWarn = (message: string, metadata?: Record<string, unknown>) => {
  logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, unknown>) => {
  logger.debug(message, metadata);
};

/**
 * Performance logger
 */
export class PerformanceLogger {
  private startTime: number;
  private readonly operation: string;
  private readonly logger: winston.Logger;

  constructor(operation: string, logger: winston.Logger = createLogger('performance')) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
    this.logger.debug(`Starting: ${operation}`);
  }

  end(metadata?: Record<string, unknown>) {
    const duration = Date.now() - this.startTime;
    this.logger.info(`Completed: ${this.operation}`, {
      duration,
      ...metadata,
    });
  }

  error(error: Error) {
    const duration = Date.now() - this.startTime;
    this.logger.error(`Failed: ${this.operation}`, {
      duration,
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Audit logger
 */
export class AuditLogger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = createLogger('audit');
  }

  log(
    action: string,
    userId: string,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) {
    this.logger.info('Audit log', {
      action,
      userId,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  create(userId: string, resource: string, resourceId: string, metadata?: Record<string, unknown>) {
    this.log('CREATE', userId, resource, resourceId, metadata);
  }

  read(userId: string, resource: string, resourceId?: string, metadata?: Record<string, unknown>) {
    this.log('READ', userId, resource, resourceId, metadata);
  }

  update(userId: string, resource: string, resourceId: string, metadata?: Record<string, unknown>) {
    this.log('UPDATE', userId, resource, resourceId, metadata);
  }

  delete(userId: string, resource: string, resourceId: string, metadata?: Record<string, unknown>) {
    this.log('DELETE', userId, resource, resourceId, metadata);
  }
}

export const auditLogger = new AuditLogger();
