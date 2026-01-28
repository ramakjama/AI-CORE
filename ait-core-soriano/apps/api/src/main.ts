import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { WsAdapter } from '@nestjs/platform-ws';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

/**
 * Bootstrap the NestJS application with all production-ready configurations
 *
 * Features:
 * - Swagger API Documentation
 * - API Versioning
 * - Global Validation Pipes
 * - Security Headers (Helmet)
 * - CORS Configuration
 * - Compression
 * - Cookie Parser
 * - WebSocket Support
 * - Global Exception Filters
 * - Global Interceptors
 * - Graceful Shutdown
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true,
      cors: true,
      bodyParser: true,
      abortOnError: false,
    });

    // Winston Logger
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const environment = configService.get<string>('NODE_ENV', 'development');
    const apiPrefix = configService.get<string>('API_PREFIX', 'api');

    // Set global prefix for all routes
    app.setGlobalPrefix(apiPrefix);

    // Enable API versioning
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });

    // Enable CORS with detailed configuration
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', '*').split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
        'X-Correlation-ID',
      ],
      exposedHeaders: [
        'X-Total-Count',
        'X-Page',
        'X-Per-Page',
        'X-Total-Pages',
        'X-Request-ID',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    });

    // Security middleware - Helmet
    app.use(
      helmet({
        contentSecurityPolicy: environment === 'production' ? {
          directives: {
            defaultSrc: [`'self'`],
            styleSrc: [`'self'`, `'unsafe-inline'`],
            imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
            scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          },
        } : false,
        crossOriginEmbedderPolicy: environment === 'production',
        crossOriginOpenerPolicy: environment === 'production',
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
      }),
    );

    // Compression middleware
    app.use(
      compression({
        filter: (req, res) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
        level: 6,
        threshold: 1024, // Only compress if response is larger than 1KB
      }),
    );

    // Cookie parser middleware
    app.use(cookieParser(configService.get<string>('COOKIE_SECRET', 'default-secret')));

    // Global validation pipe with comprehensive options
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Convert primitive types automatically
        },
        disableErrorMessages: environment === 'production', // Hide detailed error messages in production
        errorHttpStatusCode: 422, // Use 422 Unprocessable Entity for validation errors
        forbidUnknownValues: true, // Throw error on unknown values
        stopAtFirstError: false, // Validate all properties, not just the first error
        skipMissingProperties: false, // Validate all properties
        skipNullProperties: false, // Don't skip null properties
        skipUndefinedProperties: false, // Don't skip undefined properties
        validationError: {
          target: false, // Don't expose the target object in errors
          value: environment !== 'production', // Only expose values in non-production
        },
      }),
    );

    // Global exception filters (order matters - most specific first)
    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new AllExceptionsFilter(),
    );

    // Global interceptors
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(),
      new TimeoutInterceptor(configService.get<number>('REQUEST_TIMEOUT', 30000)),
    );

    // WebSocket adapter for real-time communication
    app.useWebSocketAdapter(new WsAdapter(app));

    // Swagger API Documentation
    const swaggerEnabled = configService.get<boolean>('SWAGGER_ENABLED', true);
    if (swaggerEnabled && environment !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('AIT-CORE Soriano API')
        .setDescription(`
          # AIT-CORE Soriano Insurance Platform API

          ## Overview
          Comprehensive RESTful API for managing insurance operations, policies, claims, and customer relationships.

          ## Features
          - **Authentication & Authorization**: JWT-based authentication with role-based access control
          - **User Management**: Complete user lifecycle management
          - **Insurance Operations**: Policies, quotes, claims, and underwriting
          - **Real-time Communication**: WebSocket support for live updates
          - **Analytics**: Advanced reporting and business intelligence
          - **Notifications**: Multi-channel notification system (Email, SMS, Push)
          - **Document Management**: Secure document storage and retrieval
          - **Audit Trail**: Comprehensive activity logging

          ## Versioning
          This API uses URI versioning (e.g., /api/v1/users)

          ## Authentication
          Use the /auth/login endpoint to obtain a JWT token. Include the token in the Authorization header:
          \`Authorization: Bearer <your-token>\`

          ## Rate Limiting
          - Anonymous: 100 requests per hour
          - Authenticated: 1000 requests per hour
          - Premium: 10000 requests per hour

          ## Error Handling
          All errors follow a standard format with appropriate HTTP status codes and detailed error messages.
        `)
        .setVersion('1.0.0')
        .setContact(
          'AIT-CORE Support',
          'https://ait-core.soriano.com',
          'support@soriano.com',
        )
        .setLicense('Proprietary', 'https://ait-core.soriano.com/license')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'Authorization',
            description: 'Enter your JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addApiKey(
          {
            type: 'apiKey',
            name: 'X-API-Key',
            in: 'header',
            description: 'API Key for service-to-service authentication',
          },
          'api-key',
        )
        .addCookieAuth('refresh_token', {
          type: 'apiKey',
          in: 'cookie',
          name: 'refresh_token',
          description: 'Refresh token stored in HTTP-only cookie',
        })
        .addTag('Authentication', 'User authentication and authorization endpoints')
        .addTag('Users', 'User management operations')
        .addTag('Insurance', 'Insurance policies and products')
        .addTag('Quotes', 'Insurance quote generation and management')
        .addTag('Claims', 'Claims processing and management')
        .addTag('Customers', 'Customer relationship management')
        .addTag('Payments', 'Payment processing and transactions')
        .addTag('Documents', 'Document management system')
        .addTag('Notifications', 'Notification management')
        .addTag('Analytics', 'Business intelligence and reporting')
        .addTag('Health', 'System health and monitoring')
        .addTag('WebSocket', 'Real-time communication via WebSockets')
        .addServer(`http://localhost:${port}`, 'Local Development')
        .addServer('https://api-dev.soriano.com', 'Development')
        .addServer('https://api-staging.soriano.com', 'Staging')
        .addServer('https://api.soriano.com', 'Production')
        .build();

      const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
        deepScanRoutes: true,
        ignoreGlobalPrefix: false,
      });

      const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
      SwaggerModule.setup(swaggerPath, app, document, {
        explorer: true,
        swaggerOptions: {
          docExpansion: 'none',
          filter: true,
          showRequestDuration: true,
          syntaxHighlight: {
            activate: true,
            theme: 'monokai',
          },
          tryItOutEnabled: true,
          persistAuthorization: true,
          displayOperationId: true,
          displayRequestDuration: true,
        },
        customSiteTitle: 'AIT-CORE API Documentation',
        customfavIcon: 'https://ait-core.soriano.com/favicon.ico',
        customCss: `
          .swagger-ui .topbar { display: none }
          .swagger-ui .info { margin: 50px 0 }
          .swagger-ui .info .title { font-size: 36px }
        `,
      });

      logger.log(`📚 Swagger documentation available at http://localhost:${port}/${swaggerPath}`);
    }

    // Enable shutdown hooks
    app.enableShutdownHooks();

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.log(`🛑 ${signal} received, starting graceful shutdown...`);

      try {
        // Close server (stop accepting new connections)
        await app.close();
        logger.log('✅ Application closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('🔥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Start the server
    await app.listen(port, '0.0.0.0');

    // Log startup information
    logger.log('='.repeat(80));
    logger.log(`🚀 AIT-CORE Soriano API started successfully!`);
    logger.log(`📦 Environment: ${environment}`);
    logger.log(`🌍 URL: http://localhost:${port}/${apiPrefix}`);
    logger.log(`📚 Swagger Docs: http://localhost:${port}/${swaggerPath || 'docs'}`);
    logger.log(`🏥 Health Check: http://localhost:${port}/${apiPrefix}/health`);
    logger.log(`🔌 WebSocket: ws://localhost:${port}`);
    logger.log(`⚡ Ready to handle requests!`);
    logger.log('='.repeat(80));

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
