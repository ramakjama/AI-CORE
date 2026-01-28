import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('AIT-CORE Authenticator API')
    .setDescription('Authentication Service - OAuth2, SSO, JWT, MFA')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🔐 AIT-CORE AUTHENTICATOR                              ║
    ║                                                           ║
    ║   Server:     http://localhost:${port}                       ║
    ║   Docs:       http://localhost:${port}/api/docs              ║
    ║                                                           ║
    ║   Features:   OAuth2, SSO, JWT, MFA                      ║
    ║   Status:     Ready                                       ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
