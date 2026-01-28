import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.KAFKA_BROKERS = 'localhost:9092';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
};

// Mock Date.now for consistent testing
const originalDateNow = Date.now;
beforeAll(() => {
  Date.now = jest.fn(() => 1704067200000); // 2024-01-01 00:00:00 UTC
});

afterAll(() => {
  Date.now = originalDateNow;
});

// Clear all mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});
