import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

/**
 * Creates a NestJS testing module with common setup
 */
export async function createTestingModule(
  imports: any[] = [],
  providers: any[] = [],
  controllers: any[] = [],
): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      ...imports,
    ],
    providers,
    controllers,
  });

  return await moduleBuilder.compile();
}

/**
 * Creates a NestJS application for E2E testing
 */
export async function createTestingApp(module: TestingModule): Promise<INestApplication> {
  const app = module.createNestApplication();

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

  await app.init();
  return app;
}

/**
 * Closes a NestJS testing application
 */
export async function closeTestingApp(app: INestApplication): Promise<void> {
  if (app) {
    await app.close();
  }
}

/**
 * Creates an authenticated request for E2E testing
 */
export function authenticatedRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  token: string,
) {
  return request(app.getHttpServer())
    [method](path)
    .set('Authorization', `Bearer ${token}`)
    .set('Accept', 'application/json');
}

/**
 * Mock ConfigService for testing
 */
export class MockConfigService {
  private config: Record<string, any> = {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_EXPIRATION: '1h',
    REDIS_URL: 'redis://localhost:6379',
    KAFKA_BROKERS: 'localhost:9092',
  };

  get<T = any>(key: string, defaultValue?: T): T {
    return (this.config[key] as T) || defaultValue;
  }

  set(key: string, value: any): void {
    this.config[key] = value;
  }
}

/**
 * Mock Logger for testing
 */
export class MockLogger {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
}

/**
 * Mock Cache Manager for testing
 */
export class MockCacheManager {
  private store = new Map();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Mock Event Emitter for testing
 */
export class MockEventEmitter {
  emit = jest.fn();
  on = jest.fn();
  once = jest.fn();
  removeListener = jest.fn();
  removeAllListeners = jest.fn();
}

/**
 * Extracts cookies from response
 */
export function extractCookies(response: request.Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeader = response.headers['set-cookie'];

  if (setCookieHeader) {
    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    cookieArray.forEach((cookie) => {
      const [nameValue] = cookie.split(';');
      const [name, value] = nameValue.split('=');
      cookies[name.trim()] = value.trim();
    });
  }

  return cookies;
}
