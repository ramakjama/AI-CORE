import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaHealthIndicator } from '../prisma/prisma-health.indicator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Health Check Controller
 *
 * Provides endpoints for monitoring application health and readiness.
 * These endpoints are typically used by:
 * - Load balancers
 * - Kubernetes probes
 * - Monitoring systems (DataDog, New Relic, etc.)
 * - Uptime monitoring services
 *
 * @controller health
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  /**
   * Comprehensive health check
   * Checks all critical system components
   *
   * @returns Health check result with status of all components
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description: 'Checks the health of all critical system components including database, memory, and disk',
  })
  @ApiResponse({
    status: 200,
    description: 'All systems operational',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up', message: 'Database connection is healthy' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up', message: 'Database connection is healthy' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'One or more systems are down' })
  check() {
    return this.health.check([
      // Database health check
      () => this.prismaHealth.isHealthy('database'),

      // Memory health checks (150MB heap, 300MB RSS)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk storage check (90% threshold)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Readiness probe
   * Indicates whether the application is ready to accept traffic
   *
   * @returns Health check result
   */
  @Get('ready')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe - indicates if the application is ready to accept traffic',
  })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  readiness() {
    return this.health.check([
      // Check database connectivity
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }

  /**
   * Liveness probe
   * Indicates whether the application is alive and running
   *
   * @returns Health check result
   */
  @Get('live')
  @Public()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe - indicates if the application is alive',
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @ApiResponse({ status: 503, description: 'Application is not responding' })
  liveness() {
    return this.health.check([
      // Basic memory check to ensure application is responsive
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }
}
