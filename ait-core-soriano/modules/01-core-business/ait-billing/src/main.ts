import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AitBillingModule } from './ait-billing.module';

async function bootstrap() {
  const logger = new Logger('AIT-BILLING');
  const app = await NestFactory.create(AitBillingModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('AIT-BILLING API')
    .setDescription('Facturación automática con IA')
    .setVersion('1.0')
    .addTag('billing')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = 3006;
  await app.listen(port);

  logger.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║   🧾 AIT-BILLING is running!                          ║
    ║   📍 http://localhost:${port}                         ║
    ║   📊 Swagger: http://localhost:${port}/api-docs      ║
    ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
