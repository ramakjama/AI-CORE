import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging Interceptor
 *
 * Logs all incoming HTTP requests and outgoing responses with detailed information.
 *
 * Features:
 * - Logs request method, URL, headers, body
 * - Logs response status code and duration
 * - Generates unique request IDs for tracking
 * - Logs user information if authenticated
 * - Color-coded console output
 * - Performance monitoring
 *
 * Log Format:
 * [Timestamp] [Level] [Context] [RequestID] Message - Duration
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = (request as any).user?.id || 'anonymous';
    const requestId = headers['x-request-id'] || this.generateRequestId();

    // Add request ID to response headers
    response.setHeader('X-Request-ID', requestId);

    // Log incoming request
    this.logRequest(method, url, ip, userId, requestId, userAgent);

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logResponse(
            method,
            url,
            response.statusCode,
            duration,
            requestId,
            userId,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          this.logError(
            method,
            url,
            statusCode,
            duration,
            requestId,
            userId,
            error,
          );
        },
      }),
    );
  }

  /**
   * Log incoming HTTP request
   */
  private logRequest(
    method: string,
    url: string,
    ip: string,
    userId: string,
    requestId: string,
    userAgent: string,
  ): void {
    const message = `➜ ${method} ${url}`;
    const context = {
      requestId,
      userId,
      ip,
      userAgent,
    };

    this.logger.log(`${message} | ${JSON.stringify(context)}`);
  }

  /**
   * Log outgoing HTTP response
   */
  private logResponse(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId: string,
  ): void {
    const statusEmoji = this.getStatusEmoji(statusCode);
    const message = `${statusEmoji} ${method} ${url} ${statusCode}`;
    const context = {
      requestId,
      userId,
      duration: `${duration}ms`,
    };

    if (statusCode >= 500) {
      this.logger.error(`${message} | ${JSON.stringify(context)}`);
    } else if (statusCode >= 400) {
      this.logger.warn(`${message} | ${JSON.stringify(context)}`);
    } else {
      this.logger.log(`${message} | ${JSON.stringify(context)}`);
    }
  }

  /**
   * Log HTTP error
   */
  private logError(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId: string,
    error: any,
  ): void {
    const message = `✖ ${method} ${url} ${statusCode}`;
    const context = {
      requestId,
      userId,
      duration: `${duration}ms`,
      error: error.message || 'Unknown error',
    };

    this.logger.error(`${message} | ${JSON.stringify(context)}`);
  }

  /**
   * Get emoji based on HTTP status code
   */
  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✓';
    if (statusCode >= 300 && statusCode < 400) return '↻';
    if (statusCode >= 400 && statusCode < 500) return '⚠';
    if (statusCode >= 500) return '✖';
    return '?';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
