/**
 * Logger Utility
 * Custom Winston logger configuration
 */

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (stack) {
    msg += `\n${stack}`;
  }

  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }

  return msg;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        customFormat
      ),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export default logger;
