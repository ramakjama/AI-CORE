import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // Console Transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('AIT-CORE', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // File Transport - Error Logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // File Transport - Combined Logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),

    // File Transport - Daily Rotate (Optional - requires winston-daily-rotate-file)
    // new DailyRotateFile({
    //   filename: 'logs/application-%DATE%.log',
    //   datePattern: 'YYYY-MM-DD',
    //   zippedArchive: true,
    //   maxSize: '20m',
    //   maxFiles: '14d',
    // }),
  ],

  // Default Log Level
  level: process.env.LOG_LEVEL || 'info',

  // Exit on error
  exitOnError: false,

  // Exception Handlers
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],

  // Rejection Handlers
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};
