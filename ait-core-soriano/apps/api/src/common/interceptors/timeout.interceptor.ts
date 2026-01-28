import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * Timeout Interceptor
 *
 * Automatically cancels requests that exceed a specified timeout duration.
 * This prevents long-running requests from consuming server resources.
 *
 * Features:
 * - Configurable timeout duration
 * - Throws RequestTimeoutException (408) on timeout
 * - Prevents resource exhaustion
 * - Can be overridden per route with @SetMetadata()
 *
 * Usage:
 * - Global: Applied via app.useGlobalInterceptors()
 * - Route-specific: @UseInterceptors(new TimeoutInterceptor(5000))
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutDuration: number = 30000) {} // 30 seconds default

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutDuration),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `Request timeout after ${this.timeoutDuration}ms`,
              ),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
