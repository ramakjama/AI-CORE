import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from './prisma.service';

/**
 * Prisma Health Indicator
 *
 * Checks the health of the PostgreSQL database connection via Prisma.
 * Used by the /health endpoint to verify database connectivity.
 *
 * @class PrismaHealthIndicator
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  /**
   * Check if database is healthy by executing a simple query
   *
   * @param key - The key for the health check result
   * @returns Promise<HealthIndicatorResult>
   * @throws HealthCheckError if database is unhealthy
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Execute a simple query to check connection
      await this.prismaService.$queryRaw`SELECT 1`;

      return this.getStatus(key, true, {
        message: 'Database connection is healthy',
      });
    } catch (error) {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, {
          message: error.message || 'Database connection failed',
        }),
      );
    }
  }
}
