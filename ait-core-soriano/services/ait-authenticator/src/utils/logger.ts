/**
 * Winston Logger Configuration
 *
 * Provides structured logging with multiple transports:
 * - Console (colorized for development)
 * - File (daily rotation)
 * - Error file (errors only)
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');

// Define custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if exists
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  })
];

// File transports (only in production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  // All logs with daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'ait-authenticator-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'debug'
    })
  );

  // Error logs only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'ait-authenticator-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
      level: 'error'
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Handle uncaught exceptions and rejections
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  );

  logger.rejections.handle(
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  );
}

// Export convenience methods
export default logger;
