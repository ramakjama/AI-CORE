import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AitTreasuryModule } from './ait-treasury.module';

async function bootstrap() {
  const logger = new Logger('AIT-TREASURY');

  const app = await NestFactory.create(AitTreasuryModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AIT-TREASURY API')
    .setDescription('Gestión de tesorería con IA: optimización de liquidez, pagos masivos, forecasting')
    .setVersion('1.0')
    .addTag('treasury')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);

  logger.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   💰 AIT-TREASURY is running!                             ║
    ║                                                           ║
    ║   📍 URL: http://localhost:${port}                        ║
    ║   📊 Swagger: http://localhost:${port}/api-docs          ║
    ║   🏥 Health: http://localhost:${port}/health             ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
