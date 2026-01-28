import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Request } from 'express';

/**
 * Audit Interceptor
 *
 * Automatically logs HTTP requests for audit trail purposes.
 *
 * @interceptor AuditInterceptor
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const userId = (request as any).user?.id;
    const userAgent = headers['user-agent'];

    // Only audit write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          const action = this.getAction(method);
          const entity = this.getEntity(url);

          this.auditService.log({
            userId,
            action,
            entity,
            metadata: {
              method,
              url,
              body: (request as any).body,
            },
            ipAddress: ip,
            userAgent,
          });
        }),
      );
    }

    return next.handle();
  }

  private getAction(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  private getEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[1] || 'unknown';
  }
}
