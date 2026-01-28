import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ServiceConfig, getServiceByRoute } from './proxy.config';

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();
  private readonly healthStatus = new Map<string, boolean>();

  constructor(private readonly httpService: HttpService) {
    this.logger.log('ProxyService initialized');
  }

  /**
   * Forward request to downstream microservice
   */
  async forwardRequest(
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
    query?: Record<string, any>,
  ): Promise<any> {
    // Get service config based on path
    const service = getServiceByRoute(path);

    if (!service) {
      throw new HttpException(
        `No service configured for path: ${path}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!service.enabled) {
      throw new ServiceUnavailableException(
        `Service ${service.name} is currently disabled`,
      );
    }

    // Check circuit breaker
    if (service.circuitBreaker?.enabled) {
      this.checkCircuitBreaker(service.name);
    }

    // Build target URL
    const targetPath = this.buildTargetPath(path);
    const targetUrl = `${service.baseUrl}${targetPath}`;

    this.logger.debug(
      `Forwarding ${method} request to ${service.name}: ${targetUrl}`,
    );

    try {
      // Configure request
      const config: AxiosRequestConfig = {
        method: method.toLowerCase() as any,
        url: targetUrl,
        headers: this.buildHeaders(headers),
        params: query,
        data: body,
        timeout: service.timeout || 30000,
      };

      // Execute request with retries and timeout
      const response = await this.httpService
        .request(config)
        .pipe(
          timeout(service.timeout || 30000),
          retry({
            count: service.retries || 0,
            delay: 1000,
          }),
          map((res: AxiosResponse) => res.data),
          catchError((error) => {
            this.handleRequestError(service, error);
            return throwError(() => error);
          }),
        )
        .toPromise();

      // Reset circuit breaker on success
      if (service.circuitBreaker?.enabled) {
        this.recordSuccess(service.name);
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to forward request to ${service.name}: ${error.message}`,
      );

      // Record failure for circuit breaker
      if (service.circuitBreaker?.enabled) {
        this.recordFailure(service.name);
      }

      // Re-throw with appropriate status code
      if (error.response) {
        throw new HttpException(
          error.response.data || error.message,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new ServiceUnavailableException(
        `Service ${service.name} is unavailable: ${error.message}`,
      );
    }
  }

  /**
   * Build target path by removing gateway prefix
   */
  private buildTargetPath(path: string): string {
    // Remove /api/v1 prefix if present
    let targetPath = path.replace(/^\/api\/v\d+/, '');

    // Remove service prefix (e.g., /pgc-engine)
    for (const prefix of Object.keys(require('./proxy.config').ROUTE_MAPPING)) {
      if (targetPath.startsWith(prefix)) {
        targetPath = targetPath.substring(prefix.length);
        break;
      }
    }

    // Ensure path starts with /
    if (!targetPath.startsWith('/')) {
      targetPath = `/${targetPath}`;
    }

    return targetPath;
  }

  /**
   * Build headers for downstream request
   */
  private buildHeaders(
    incomingHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Forwarded-By': 'AIT-API-Gateway',
      'X-Gateway-Version': '1.0.0',
    };

    // Forward important headers
    if (incomingHeaders) {
      const headersToForward = [
        'authorization',
        'x-request-id',
        'x-correlation-id',
        'x-api-key',
        'accept',
        'accept-language',
      ];

      for (const header of headersToForward) {
        const value =
          incomingHeaders[header] || incomingHeaders[header.toLowerCase()];
        if (value) {
          headers[header] = value;
        }
      }
    }

    return headers;
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (!state) {
      // Initialize circuit breaker
      this.circuitBreakers.set(serviceName, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED',
      });
      return;
    }

    if (state.state === 'OPEN') {
      const now = Date.now();
      const service = Object.values(
        require('./proxy.config').PROXY_CONFIG,
      ).find((s: any) => s.name === serviceName);

      const timeoutMs = service?.circuitBreaker?.timeout || 60000;

      // Check if timeout has passed
      if (now - state.lastFailure > timeoutMs) {
        this.logger.log(
          `Circuit breaker for ${serviceName} entering HALF_OPEN state`,
        );
        state.state = 'HALF_OPEN';
        state.failures = 0;
      } else {
        throw new ServiceUnavailableException(
          `Circuit breaker OPEN for ${serviceName}. Service temporarily unavailable.`,
        );
      }
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (state) {
      if (state.state === 'HALF_OPEN') {
        this.logger.log(
          `Circuit breaker for ${serviceName} closing after successful request`,
        );
        state.state = 'CLOSED';
      }
      state.failures = 0;
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);

    if (state) {
      state.failures++;
      state.lastFailure = Date.now();

      const service = Object.values(
        require('./proxy.config').PROXY_CONFIG,
      ).find((s: any) => s.name === serviceName);

      const threshold = service?.circuitBreaker?.threshold || 5;

      if (state.failures >= threshold && state.state === 'CLOSED') {
        this.logger.warn(
          `Circuit breaker for ${serviceName} opening after ${state.failures} failures`,
        );
        state.state = 'OPEN';
      }
    }
  }

  /**
   * Handle request error
   */
  private handleRequestError(service: ServiceConfig, error: any): void {
    const errorMessage = error.response
      ? `${error.response.status} - ${error.response.statusText}`
      : error.message;

    this.logger.error(
      `Request to ${service.name} failed: ${errorMessage}`,
      error.stack,
    );
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const status: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, serviceName) => {
      status[serviceName] = { ...state };
    });
    return status;
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.healthStatus.forEach((healthy, serviceName) => {
      status[serviceName] = healthy;
    });
    return status;
  }

  /**
   * Check health of a specific service
   */
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = Object.values(
        require('./proxy.config').PROXY_CONFIG,
      ).find((s: any) => s.name === serviceName);

      if (!service || !service.enabled) {
        return false;
      }

      const healthUrl = `${service.baseUrl}${service.healthCheck?.endpoint || '/health'}`;

      const response = await this.httpService
        .get(healthUrl, { timeout: 5000 })
        .toPromise();

      const isHealthy = response.status === 200;
      this.healthStatus.set(serviceName, isHealthy);

      return isHealthy;
    } catch (error) {
      this.logger.error(
        `Health check failed for ${serviceName}: ${error.message}`,
      );
      this.healthStatus.set(serviceName, false);
      return false;
    }
  }
}
