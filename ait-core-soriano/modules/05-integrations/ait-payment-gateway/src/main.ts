/**
 * Payment Gateway Application Bootstrap
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PaymentGatewayModule } from './payment-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentGatewayModule, {
    rawBody: true, // Required for webhook signature validation
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AIT Payment Gateway API')
    .setDescription(
      'Multi-provider payment gateway supporting Stripe, Redsys, and Bizum',
    )
    .setVersion('1.0.0')
    .addTag('payments', 'Payment operations')
    .addTag('webhooks', 'Webhook handlers')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       AIT Payment Gateway Service Started             ║
║                                                       ║
║       Port: ${port}                                      ║
║       Environment: ${process.env.NODE_ENV || 'development'}              ║
║       API Docs: http://localhost:${port}/api/docs        ║
║                                                       ║
║       Providers:                                      ║
║       - Stripe: ${process.env.STRIPE_ENABLED === 'true' ? '✓' : '✗'}                              ║
║       - Redsys: ${process.env.REDSYS_ENABLED === 'true' ? '✓' : '✗'}                              ║
║       - Bizum:  ${process.env.BIZUM_ENABLED === 'true' ? '✓' : '✗'}                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
