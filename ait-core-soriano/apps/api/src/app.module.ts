import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as redisStore from 'cache-manager-redis-store';

// Configuration
import configuration from './config/configuration';
import validationSchema from './config/validation.schema';
import { loggerConfig } from './config/logger.config';

// Core Modules
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { SmsModule } from './modules/sms/sms.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuditModule } from './modules/audit/audit.module';

// Business Modules
import { InsuranceModule } from './modules/insurance/insurance.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProxyModule } from './modules/proxy/proxy.module';

// Common
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

/**
 * Root Application Module
 *
 * This module bootstraps the entire NestJS application with all necessary
 * modules, configurations, and global providers.
 *
 * Architecture:
 * - Configuration Layer: Environment variables, validation, and app config
 * - Infrastructure Layer: Database, cache, message queue, logging
 * - Core Modules: Authentication, authorization, health checks
 * - Business Modules: Insurance domain logic and operations
 * - Common Layer: Shared guards, filters, interceptors, decorators
 *
 * @module AppModule
 */
@Module({
  imports: [
    // ============================================================================
    // CONFIGURATION LAYER
    // ============================================================================

    /**
     * Configuration Module
     * - Loads environment variables from .env files
     * - Validates configuration against schema
     * - Provides type-safe configuration service
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      cache: true,
      expandVariables: true,
      envFilePath: [
        '.env.local',
        '.env.development',
        '.env.staging',
        '.env.production',
        '.env',
      ],
    }),

    /**
     * Winston Logging Module
     * - Structured logging with multiple transports
     * - Log rotation and archiving
     * - Error tracking and reporting
     */
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => loggerConfig(configService),
    }),

    // ============================================================================
    // INFRASTRUCTURE LAYER
    // ============================================================================

    /**
     * Cache Module with Redis
     * - In-memory caching for performance
     * - Distributed cache across instances
     * - TTL-based cache invalidation
     */
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host', 'localhost'),
        port: configService.get('redis.port', 6379),
        password: configService.get('redis.password'),
        db: configService.get('redis.db', 0),
        ttl: configService.get('redis.ttl', 300), // 5 minutes default
        max: configService.get('redis.maxItems', 1000),
        isGlobal: true,
      }),
    }),

    /**
     * Bull Queue Module
     * - Background job processing
     * - Job scheduling and retries
     * - Queue monitoring and management
     */
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host', 'localhost'),
          port: configService.get('redis.port', 6379),
          password: configService.get('redis.password'),
          db: configService.get('redis.queueDb', 1),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),

    /**
     * Event Emitter Module
     * - Event-driven architecture
     * - Decoupled service communication
     * - Asynchronous event handling
     */
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    /**
     * Scheduler Module
     * - Cron jobs and scheduled tasks
     * - Background maintenance operations
     * - Automated reporting and cleanup
     */
    ScheduleModule.forRoot(),

    /**
     * Rate Limiting (Throttler) Module
     * - API rate limiting per IP/user
     * - DDoS protection
     * - Fair resource distribution
     */
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('throttle.ttl', 60), // Time window in seconds
        limit: configService.get('throttle.limit', 100), // Max requests per window
        ignoreUserAgents: [
          /googlebot/gi,
          /bingbot/gi,
          /slackbot/gi,
        ],
      }),
    }),

    // ============================================================================
    // CORE MODULES
    // ============================================================================

    /**
     * Prisma Database Module
     * - PostgreSQL database connection
     * - Type-safe database queries
     * - Migration management
     * - Connection pooling
     */
    PrismaModule,

    /**
     * Health Check Module
     * - Application health monitoring
     * - Database connectivity checks
     * - External service health checks
     * - Kubernetes readiness/liveness probes
     */
    HealthModule,

    /**
     * Authentication & Authorization Module
     * - JWT-based authentication
     * - Refresh token mechanism
     * - Role-based access control (RBAC)
     * - Password hashing and validation
     * - OAuth2 integration
     */
    AuthModule,

    /**
     * Users Module
     * - User profile management
     * - User registration and activation
     * - Password reset functionality
     * - User preferences
     */
    UsersModule,

    /**
     * WebSocket Module
     * - Real-time bidirectional communication
     * - Live notifications
     * - Collaborative features
     * - Connection management
     */
    WebSocketModule,

    /**
     * Kafka Message Broker Module
     * - Event streaming platform
     * - Microservice communication
     * - Event sourcing
     * - CQRS pattern support
     */
    KafkaModule,

    /**
     * Audit Log Module
     * - User activity tracking
     * - Compliance and security auditing
     * - Change history
     * - Forensic analysis
     */
    AuditModule,

    // ============================================================================
    // COMMUNICATION MODULES
    // ============================================================================

    /**
     * Notifications Module
     * - Multi-channel notification orchestration
     * - Notification preferences
     * - Delivery tracking
     */
    NotificationsModule,

    /**
     * Email Module
     * - Transactional email sending
     * - Email templates
     * - SMTP configuration
     * - Email tracking
     */
    EmailModule,

    /**
     * SMS Module
     * - SMS delivery via Twilio/SNS
     * - SMS templates
     * - Delivery confirmation
     */
    SmsModule,

    // ============================================================================
    // INFRASTRUCTURE SERVICES
    // ============================================================================

    /**
     * Storage Module
     * - File upload and storage
     * - S3/Azure Blob integration
     * - Image processing
     * - File access control
     */
    StorageModule,

    // ============================================================================
    // BUSINESS DOMAIN MODULES
    // ============================================================================

    /**
     * Insurance Module
     * - Insurance product management
     * - Policy lifecycle management
     * - Underwriting rules engine
     * - Premium calculations
     * - Coverage management
     */
    InsuranceModule,

    /**
     * Quotes Module
     * - Insurance quote generation
     * - Quote comparison
     * - Quote-to-policy conversion
     * - Pricing engine integration
     */
    QuotesModule,

    /**
     * Claims Module
     * - Claims submission and processing
     * - Claims adjudication
     * - Claims payment
     * - Fraud detection
     */
    ClaimsModule,

    /**
     * Customers Module
     * - Customer relationship management
     * - Customer profiles
     * - Customer interactions
     * - Customer segmentation
     */
    CustomersModule,

    /**
     * Payments Module
     * - Payment processing
     * - Payment gateway integration
     * - Subscription management
     * - Refund processing
     * - Payment reconciliation
     */
    PaymentsModule,

    /**
     * Documents Module
     * - Policy document generation
     * - Document templates
     * - PDF generation
     * - Document signing
     * - Document versioning
     */
    DocumentsModule,

    // ============================================================================
    // ANALYTICS & REPORTING
    // ============================================================================

    /**
     * Analytics Module
     * - Business intelligence
     * - Data aggregation
     * - Metrics calculation
     * - Trend analysis
     */
    AnalyticsModule,

    /**
     * Reports Module
     * - Report generation
     * - Scheduled reports
     * - Custom report builder
     * - Export functionality
     */
    ReportsModule,

    /**
     * Dashboard Module
     * - Real-time dashboards
     * - Key performance indicators (KPIs)
     * - Data visualization
     * - Executive summaries
     */
    DashboardModule,

    // ============================================================================
    // API GATEWAY / PROXY
    // ============================================================================

    /**
     * Proxy Module
     * - API Gateway functionality
     * - Route requests to microservices
     * - Circuit breaker pattern
     * - Service health monitoring
     * - Load balancing
     */
    ProxyModule,
  ],

  // ============================================================================
  // GLOBAL PROVIDERS
  // ============================================================================

  providers: [
    /**
     * Global JWT Authentication Guard
     * - Protects all routes by default
     * - Can be bypassed with @Public() decorator
     */
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    /**
     * Global Roles Guard
     * - Enforces role-based access control
     * - Works in conjunction with @Roles() decorator
     */
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    /**
     * Global Rate Limiting Guard
     * - Prevents API abuse
     * - Configurable per route with @Throttle() decorator
     */
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    this.logStartupInfo();
  }

  /**
   * Log application startup information
   * Useful for debugging and monitoring application configuration
   */
  private logStartupInfo(): void {
    const environment = this.configService.get('NODE_ENV', 'development');
    const databaseUrl = this.configService.get('DATABASE_URL', 'not configured');
    const redisHost = this.configService.get('redis.host', 'not configured');
    const kafkaEnabled = this.configService.get('kafka.enabled', false);

    console.log('\n' + '='.repeat(80));
    console.log('🏗️  APPLICATION CONFIGURATION');
    console.log('='.repeat(80));
    console.log(`Environment:     ${environment}`);
    console.log(`Database:        ${databaseUrl.includes('postgresql') ? 'PostgreSQL (configured)' : 'Not configured'}`);
    console.log(`Redis Cache:     ${redisHost}`);
    console.log(`Kafka:           ${kafkaEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`WebSocket:       Enabled`);
    console.log(`Rate Limiting:   Enabled`);
    console.log(`Swagger Docs:    ${environment !== 'production' ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(80) + '\n');
  }
}
