/**
 * SHARED UTILITIES FOR ALL INFRASTRUCTURE MODULES
 * Copy these utilities to each module's src/utils/ directory
 */

// ==================== LOGGER UTILITY ====================
// File: src/utils/logger.utils.ts

import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: process.env.SERVICE_NAME || 'ait-service' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// ==================== METRICS UTILITY ====================
// File: src/utils/metrics.utils.ts

import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

export const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const httpRequestsInProgress = new promClient.Gauge({
  name: 'http_requests_in_progress',
  help: 'Current number of HTTP requests in progress'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsInProgress);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  httpRequestsInProgress.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    httpRequestsInProgress.dec();
  });

  next();
};

// ==================== ERROR MIDDLEWARE ====================
// File: src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  logger.error('Error occurred:', {
    statusCode,
    message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// ==================== HEALTH ROUTES ====================
// File: src/routes/health.routes.ts

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: process.env.SERVICE_NAME || 'ait-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

router.get('/ready', async (req, res) => {
  try {
    // Add service-specific readiness checks here
    res.json({
      success: true,
      status: 'ready'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service not ready'
    });
  }
});

export default router;

// ==================== VALIDATION UTILITIES ====================
// File: src/utils/validation.utils.ts

import Joi from 'joi';

export const validateEmail = (email: string): boolean => {
  const schema = Joi.string().email();
  const { error } = schema.validate(email);
  return !error;
};

export const validateUUID = (uuid: string): boolean => {
  const schema = Joi.string().guid({ version: 'uuidv4' });
  const { error } = schema.validate(uuid);
  return !error;
};

export const validateRequest = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

// ==================== RETRY UTILITY ====================
// File: src/utils/retry.utils.ts

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000
  } = options;

  let lastError: Error;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError!;
}

// ==================== DATE UTILITIES ====================
// File: src/utils/date.utils.ts

import { format, addDays, subDays, startOfDay, endOfDay } from 'date-fns';

export const formatDate = (date: Date, formatString: string = 'yyyy-MM-dd'): string => {
  return format(date, formatString);
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const addDaysToDate = (date: Date, days: number): Date => {
  return addDays(date, days);
};

export const subtractDaysFromDate = (date: Date, days: number): Date => {
  return subDays(date, days);
};

export const getStartOfDay = (date: Date): Date => {
  return startOfDay(date);
};

export const getEndOfDay = (date: Date): Date => {
  return endOfDay(date);
};

// ==================== RESPONSE UTILITIES ====================
// File: src/utils/response.utils.ts

import { Response } from 'express';

export class ResponseHandler {
  static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res: Response, message: string = 'Error', statusCode: number = 500, errors?: any[]) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(errors && { errors })
    });
  }

  static created(res: Response, data: any, message: string = 'Resource created') {
    return ResponseHandler.success(res, data, message, 201);
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    return ResponseHandler.error(res, message, 404);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: any[]) {
    return ResponseHandler.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return ResponseHandler.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden') {
    return ResponseHandler.error(res, message, 403);
  }
}

// ==================== ASYNC HANDLER ====================
// File: src/utils/async-handler.utils.ts

import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== PAGINATION UTILITIES ====================
// File: src/utils/pagination.utils.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(query: any): PaginationParams {
  return {
    page: parseInt(query.page as string) || 1,
    limit: Math.min(parseInt(query.limit as string) || 20, 100),
    sortBy: query.sortBy as string || 'createdAt',
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc'
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// ==================== CRYPTO UTILITIES ====================
// File: src/utils/crypto.utils.ts

import crypto from 'crypto';

export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function hashString(str: string, algorithm: string = 'sha256'): string {
  return crypto.createHash(algorithm).update(str).digest('hex');
}

export function encryptData(data: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string, key: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ==================== FILE UTILITIES ====================
// File: src/utils/file.utils.ts

import fs from 'fs/promises';
import path from 'path';

export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1);
}

export function generateFilename(originalName: string, prefix?: string): string {
  const ext = getFileExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const name = prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
  return `${name}.${ext}`;
}
