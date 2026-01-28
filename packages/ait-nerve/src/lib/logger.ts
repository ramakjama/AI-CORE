import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Console transport (development)
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
});

// File transport with rotation (production)
const fileTransport = new DailyRotateFile({
  filename: config.logFile.replace('.log', '-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '100m',
  maxFiles: '90d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
});

// Error file transport
const errorFileTransport = new DailyRotateFile({
  filename: config.logFile.replace('.log', '-error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '100m',
  maxFiles: '90d',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
});

// Create logger
export const logger = winston.createLogger({
  level: config.logLevel,
  transports: [
    consoleTransport,
    fileTransport,
    errorFileTransport,
  ],
  exitOnError: false,
});

// Stream for Morgan (if needed)
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
