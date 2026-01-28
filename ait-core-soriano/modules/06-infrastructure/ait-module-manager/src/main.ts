import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AitModuleManagerModule } from './ait-module-manager.module';

async function bootstrap() {
  const logger = new Logger('AIT-MODULE-MANAGER');

  const app = await NestFactory.create(AitModuleManagerModule, {
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
    .setTitle('AIT-MODULE-MANAGER API')
    .setDescription('Meta-módulo para gestión dinámica de módulos AIT')
    .setVersion('1.0')
    .addTag('module-manager')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3099;
  await app.listen(port);

  logger.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🏗️  AIT-MODULE-MANAGER is running!                      ║
    ║   📦 Sistema TODO EN UNO para gestión de módulos         ║
    ║                                                           ║
    ║   📍 URL: http://localhost:${port}                        ║
    ║   📊 Swagger: http://localhost:${port}/api-docs          ║
    ║   🏥 Health: http://localhost:${port}/health             ║
    ║                                                           ║
    ║   🔧 Capacidades:                                         ║
    ║   - ✨ Generar módulos nuevos                             ║
    ║   - ✏️  Editar módulos existentes                         ║
    ║   - 🗑️  Eliminar módulos con backup                       ║
    ║   - 🔄 Activar/Desactivar módulos                        ║
    ║   - 📝 Gestionar templates                                ║
    ║   - ⚡ Hot reload                                         ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
