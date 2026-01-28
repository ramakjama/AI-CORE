import { Repository } from 'typeorm';
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

/**
 * Creates a mock repository for TypeORM entities
 */
export function createMockRepository<T = any>(): Partial<Repository<T>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
    })),
  };
}

/**
 * Creates a testing module with auto-mocked dependencies
 */
export function createMockProvider(token: any) {
  if (typeof token === 'function') {
    const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
    const Mock = moduleMocker.generateFromMetadata(mockMetadata);
    return { provide: token, useClass: Mock };
  }
  return { provide: token, useValue: {} };
}

/**
 * Delays execution for testing async operations
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a random string for testing
 */
export function randomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

/**
 * Generates a random email for testing
 */
export function randomEmail(): string {
  return `test-${randomString()}@example.com`;
}

/**
 * Generates a random UUID for testing
 */
export function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a spy on console methods
 */
export function mockConsole() {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  };

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    console.log = original.log;
    console.error = original.error;
    console.warn = original.warn;
    console.debug = original.debug;
  });
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 50,
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mocks a JWT token for testing
 */
export function mockJwtToken(payload: any = {}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(
    JSON.stringify({
      sub: '123',
      email: 'test@example.com',
      ...payload,
    }),
  ).toString('base64');
  const signature = 'mock-signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Creates a mock request object
 */
export function mockRequest(overrides: any = {}): any {
  return {
    headers: {},
    params: {},
    query: {},
    body: {},
    user: null,
    ...overrides,
  };
}

/**
 * Creates a mock response object
 */
export function mockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Creates a mock next function
 */
export function mockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Captures thrown errors in async functions
 */
export async function catchError<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    return [error as Error, null];
  }
}
