/**
 * AIT-ACCOUNTANT Bootstrap
 * Punto de entrada de la aplicación NestJS
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AiAccountantModule } from './ai-accountant.module';

async function bootstrap() {
  const logger = new Logger('AIT-ACCOUNTANT');

  // Crear aplicación NestJS
  const app = await NestFactory.create(AiAccountantModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Obtener ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3003);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Habilitar CORS
  app.enableCors({
    origin: true,
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

  // Prefijo global de API
  app.setGlobalPrefix('');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('AIT-ACCOUNTANT API')
    .setDescription(`
      **Módulo de Contabilidad Automatizada con IA**

      Sistema de contabilidad inteligente que automatiza:
      - Clasificación de transacciones con IA
      - Conciliación bancaria automática (ML)
      - Detección de anomalías contables
      - Cierre contable automatizado
      - Generación de reportes financieros

      **Integrado con:**
      - AIT-PGC-ENGINE (Plan General Contable español)
      - AI-BANK (transacciones bancarias)
      - AI-TREASURY (tesorería)
      - AI-BILLING (facturación)
    `)
    .setVersion('1.0.0')
    .setContact(
      'Ramón Soriano',
      'https://aintech.com',
      'ramon@soriano.es',
    )
    .addBearerAuth()
    .addTag('Accounting - Journal Entries', 'Gestión de asientos contables')
    .addTag('Accounting - Ledger', 'Libro mayor y balances')
    .addTag('Accounting - Reconciliation', 'Conciliación bancaria automática')
    .addTag('Accounting - Period Closing', 'Cierre de periodos contables')
    .addTag('Accounting - Reports', 'Reportes y análisis financiero')
    .addServer(`http://localhost:${port}`, 'Desarrollo local')
    .addServer('http://ai-accountant:3003', 'Docker interno')
    .addServer('http://localhost:3002', 'API Gateway')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      module: 'AIT-ACCOUNTANT',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: nodeEnv,
      integrations: {
        pgcEngine: configService.get('PGC_ENGINE_URL'),
        database: 'accounting_db',
      },
    });
  });

  // Start server
  await app.listen(port, '0.0.0.0');

  logger.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║          🧮 AIT-ACCOUNTANT v1.0.0 RUNNING                  ║
  ║                                                           ║
  ║  Environment:    ${nodeEnv.padEnd(40)}║
  ║  Port:           ${port.toString().padEnd(40)}║
  ║  Swagger Docs:   http://localhost:${port}/api-docs${' '.repeat(18)}║
  ║  Health Check:   http://localhost:${port}/health${' '.repeat(21)}║
  ║                                                           ║
  ║  🔗 Integrations:                                         ║
  ║    • AIT-PGC-ENGINE:  ${configService.get('PGC_ENGINE_URL', 'Not configured').padEnd(34)}║
  ║    • Database:       accounting_db                        ║
  ║                                                           ║
  ║  📊 Features:                                             ║
  ║    ✓ Clasificación automática con IA                     ║
  ║    ✓ Conciliación bancaria (ML)                          ║
  ║    ✓ Detección de anomalías                              ║
  ║    ✓ Cierre contable automatizado                        ║
  ║    ✓ Reportes financieros                                ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((error) => {
  const logger = new Logger('AIT-ACCOUNTANT');
  logger.error('Error during bootstrap:', error);
  process.exit(1);
});
