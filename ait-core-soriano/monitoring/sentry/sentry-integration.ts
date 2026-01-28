/**
 * Sentry Integration for AIT-CORE Applications
 *
 * This module provides Sentry configuration for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import { Request, Response, NextFunction } from 'express';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  beforeSend?: (event: Sentry.Event, hint: Sentry.EventHint) => Sentry.Event | null;
}

/**
 * Initialize Sentry for Node.js/Express applications
 */
export function initSentry(config: SentryConfig): void {
  Sentry.init({
    dsn: config.dsn || process.env.SENTRY_DSN,
    environment: config.environment || process.env.NODE_ENV || 'development',
    release: config.release || process.env.APP_VERSION,

    // Performance monitoring
    tracesSampleRate: config.tracesSampleRate || 0.1, // 10% of transactions
    profilesSampleRate: config.profilesSampleRate || 0.1, // 10% for profiling

    // Integrations
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app: undefined }),
      new Tracing.Integrations.Postgres(),
      new Tracing.Integrations.Mongo(),
      new Tracing.Integrations.Mysql(),
      new Tracing.Integrations.Prisma({ client: undefined }),
    ],

    // Error filtering
    beforeSend: config.beforeSend || ((event, hint) => {
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Error:', hint.originalException || hint.syntheticException);
        return null;
      }

      // Filter out specific errors
      const error = hint.originalException as Error;
      if (error && error.message) {
        // Ignore validation errors
        if (error.message.includes('Validation error')) {
          return null;
        }

        // Ignore 404 errors
        if (error.message.includes('Not Found') || error.message.includes('404')) {
          return null;
        }
      }

      return event;
    }),

    // Ignore specific errors
    ignoreErrors: [
      'AbortError',
      'CancelledError',
      'NavigationDuplicated',
      /Network request failed/i,
    ],

    // Sample rate for error events
    sampleRate: 1.0, // 100% of errors
  });

  // Set user context if available
  if (process.env.APP_NAME) {
    Sentry.setTag('app', process.env.APP_NAME);
  }
}

/**
 * Express middleware for Sentry request handling
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

/**
 * Express middleware for Sentry tracing
 */
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

/**
 * Express middleware for Sentry error handling
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Handle all errors with status code 500 or above
    return true;
  },
});

/**
 * Capture exception with additional context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id: string; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): string {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });

  return Sentry.lastEventId();
}

/**
 * Capture message with severity level
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message);
  });

  return Sentry.lastEventId();
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string,
  description?: string
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
    description,
  });
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Set custom tag
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

/**
 * Performance monitoring decorator for async functions
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operationName: string,
  operationType: string = 'function'
): T {
  return (async (...args: any[]) => {
    const transaction = Sentry.startTransaction({
      name: operationName,
      op: operationType,
    });

    try {
      const result = await fn(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }) as T;
}

/**
 * Middleware for capturing user context from request
 */
export function sentryUserContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    });
  }

  next();
}

/**
 * Flush Sentry events before shutdown
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return await Sentry.close(timeout);
}

export default {
  init: initSentry,
  requestHandler: sentryRequestHandler,
  tracingHandler: sentryTracingHandler,
  errorHandler: sentryErrorHandler,
  captureException,
  captureMessage,
  startTransaction,
  addBreadcrumb,
  setUser,
  clearUser,
  setTag,
  setContext,
  withPerformanceMonitoring,
  userContextMiddleware: sentryUserContextMiddleware,
  flush: flushSentry,
};
