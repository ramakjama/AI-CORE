import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ELKLoggerService } from './elk-logger.service';

/**
 * Interceptor to automatically log all HTTP requests
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: ELKLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.logRequest(request, response, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.logRequest(request, response, duration);
          this.logger.logError(error, {
            url: request.url,
            method: request.method,
            userId: request.user?.id,
          });
        },
      })
    );
  }
}
