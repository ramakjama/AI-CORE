import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { connectDatabase } from '@ai-core/database';
import { AppModule } from './app.module';

async function bootstrap() {
  await connectDatabase();
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║           AI-CORE API Server                      ║
    ║           Running on port ${port}                    ║
    ║           GraphQL: http://localhost:${port}/graphql  ║
    ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
