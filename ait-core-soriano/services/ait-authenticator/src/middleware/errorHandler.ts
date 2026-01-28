/**
 * Error Handler Middleware
 *
 * Catches and formats all errors in a consistent way
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface APIError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    });
    return;
  }

  // Handle PostgreSQL errors
  if (err.name === 'QueryFailedError' || (err as any).code) {
    const pgError = err as any;

    // Unique constraint violation
    if (pgError.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this data already exists',
          details: pgError.detail
        }
      });
      return;
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Referenced record does not exist',
          details: pgError.detail
        }
      });
      return;
    }

    // Not null violation
    if (pgError.code === '23502') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Required field is missing',
          details: pgError.column
        }
      });
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
    return;
  }

  // Handle known API errors
  const statusCode = err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode === 500 ? 'Internal server error' : err.message)
    : err.message;

  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message
    }
  };

  // Include error details if available (not in production for 500 errors)
  if (err.details && !(process.env.NODE_ENV === 'production' && statusCode === 500)) {
    errorResponse.error.details = err.details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack.split('\n');
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Create an API error
 */
export function createError(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): APIError {
  const error = new Error(message) as APIError;
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Not found handler (404)
 * This should be registered after all routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      details: {
        method: req.method,
        path: req.path
      }
    }
  });
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
