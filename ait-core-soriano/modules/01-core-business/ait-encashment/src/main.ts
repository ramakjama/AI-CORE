import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AitEncashmentModule } from './ait-encashment.module';

async function bootstrap() {
  const logger = new Logger('AIT-ENCASHMENT');
  const app = await NestFactory.create(AitEncashmentModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('AIT-ENCASHMENT API')
    .setDescription('Gestión de cobros con IA')
    .setVersion('1.0')
    .addTag('encashment')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = 3007;
  await app.listen(port);

  logger.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║   💸 AIT-ENCASHMENT is running!                       ║
    ║   📍 http://localhost:${port}                         ║
    ║   📊 Swagger: http://localhost:${port}/api-docs      ║
    ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
