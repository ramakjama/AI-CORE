/**
 * Logger Configuration
 * Winston logger setup for AI experts
 */

import * as winston from 'winston';
import * as path from 'path';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom log format
 */
const customFormat = printf(({ level, message, timestamp, expertName, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;

  if (expertName) {
    msg += ` [${expertName}]`;
  }

  msg += `: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

/**
 * Create logger instance
 */
export function createLogger(serviceName: string = 'experts'): winston.Logger {
  const logDir = process.env['LOG_DIR'] || 'logs';
  const logLevel = process.env['LOG_LEVEL'] || 'info';
  const isProduction = process.env['NODE_ENV'] === 'production';

  const transports: winston.transport[] = [];

  // Console transport
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          errors({ stack: true }),
          customFormat,
        ),
      }),
    );
  }

  // File transports
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logDir, `${serviceName}-error.log`),
      level: 'error',
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json(),
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logDir, `${serviceName}-combined.log`),
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json(),
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  );

  // Add daily rotate for production
  if (isProduction) {
    const DailyRotateFile = require('winston-daily-rotate-file');

    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, `${serviceName}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: combine(
          timestamp(),
          errors({ stack: true }),
          json(),
        ),
      }),
    );
  }

  const logger = winston.createLogger({
    level: logLevel,
    transports,
    exitOnError: false,
  });

  return logger;
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Logger middleware for NestJS
 */
export class LoggerService {
  private logger: winston.Logger;

  constructor(private context?: string) {
    this.logger = createLogger();
  }

  log(message: string, metadata?: any) {
    this.logger.info(message, { ...metadata, context: this.context });
  }

  error(message: string, trace?: string, metadata?: any) {
    this.logger.error(message, { ...metadata, trace, context: this.context });
  }

  warn(message: string, metadata?: any) {
    this.logger.warn(message, { ...metadata, context: this.context });
  }

  debug(message: string, metadata?: any) {
    this.logger.debug(message, { ...metadata, context: this.context });
  }

  verbose(message: string, metadata?: any) {
    this.logger.verbose(message, { ...metadata, context: this.context });
  }
}
