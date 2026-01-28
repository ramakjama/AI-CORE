import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Health Check Module
 *
 * Provides comprehensive health check endpoints for monitoring application status.
 * Integrates with Terminus for standardized health checks.
 *
 * Checks:
 * - Database connectivity (Prisma/PostgreSQL)
 * - Redis cache availability
 * - Memory usage
 * - Disk space
 * - HTTP endpoints
 * - Kafka connectivity
 *
 * Endpoints:
 * - GET /health - Overall health status
 * - GET /health/ready - Readiness probe (Kubernetes)
 * - GET /health/live - Liveness probe (Kubernetes)
 *
 * @module HealthModule
 */
@Module({
  imports: [TerminusModule, HttpModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
