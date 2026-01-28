/**
 * AIT-NERVE Module
 * Main NestJS module for the motor manager
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

// Services
import { EngineOrchestratorService } from './services/engine-orchestrator.service';
import { HealthMonitorService } from './services/health-monitor.service';
import { RequestRouterService } from './services/request-router.service';
import { FailoverManagerService } from './services/failover-manager.service';
import { PerformanceMetricsService } from './services/performance-metrics.service';
import { AlertingService } from './services/alerting.service';

// Controllers
import { NerveController } from './controllers/nerve.controller';

// Gateways
import { NerveGateway } from './gateways/nerve.gateway';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Enable scheduled tasks for health monitoring and metrics collection
    ScheduleModule.forRoot(),

    // Optional: Bull queue for async request processing
    // BullModule.forRoot({
    //   redis: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //   },
    // }),
  ],
  controllers: [NerveController],
  providers: [
    EngineOrchestratorService,
    HealthMonitorService,
    RequestRouterService,
    FailoverManagerService,
    PerformanceMetricsService,
    AlertingService,
    NerveGateway,
  ],
  exports: [
    EngineOrchestratorService,
    HealthMonitorService,
    RequestRouterService,
    FailoverManagerService,
    PerformanceMetricsService,
    AlertingService,
  ],
})
export class NerveModule {}
