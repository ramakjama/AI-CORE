/**
 * AIT-NERVE Standalone Application
 * Bootstrap the NestJS application for standalone deployment
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NerveModule } from './nerve.module';
import { logger } from './utils/logger.util';

async function bootstrap() {
  const app = await NestFactory.create(NerveModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Enable CORS
  if (process.env.CORS_ENABLED === 'true') {
    app.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      credentials: true,
    });
  }

  // API prefix
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AIT-NERVE API')
    .setDescription('Motor Manager & Engine Orchestration System')
    .setVersion('1.0.0')
    .addTag('AIT-NERVE')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Start server
  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  logger.info(`AIT-NERVE is running on: http://localhost:${port}${apiPrefix}`);
  logger.info(`Swagger documentation: http://localhost:${port}${apiPrefix}/docs`);
  logger.info(`Prometheus metrics: http://localhost:${port}${apiPrefix}/nerve/metrics/prometheus`);
}

bootstrap().catch(error => {
  logger.error('Failed to start AIT-NERVE:', error);
  process.exit(1);
});
