/**
 * Jest Setup File
 * Global test configuration and common mocks
 */

import { jest } from '@jest/globals';

// ============================================================================
// Global Test Configuration
// ============================================================================

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// ============================================================================
// Common Mocks
// ============================================================================

// Mock uuid to return predictable values in tests
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock console methods to reduce noise in tests (optional, uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   // Keep error for debugging
// };

// ============================================================================
// Environment Setup
// ============================================================================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MFA_SECRET_KEY = 'test-mfa-secret-key';

// ============================================================================
// Global Test Utilities
// ============================================================================

// Add to global namespace for easy access in tests
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: typeof testUtils;
    }
  }

  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

export const testUtils = {
  /**
   * Generate a random test ID
   */
  generateTestId: (prefix: string = 'test'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Wait for a specified amount of time
   */
  wait: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create a mock function that resolves after a delay
   */
  createDelayedMock: <T>(value: T, delay: number = 100): jest.Mock => {
    return jest.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(value), delay))
    );
  },

  /**
   * Create a mock that fails on first call and succeeds on subsequent calls
   */
  createRetryMock: <T>(successValue: T, failureError: Error = new Error('Temporary failure')): jest.Mock => {
    let callCount = 0;
    return jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(failureError);
      }
      return Promise.resolve(successValue);
    });
  },

  /**
   * Create mock date for consistent testing
   */
  mockDate: (date: Date | string): void => {
    const mockDate = new Date(date);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  },

  /**
   * Restore real timers
   */
  restoreDate: (): void => {
    jest.useRealTimers();
  },
};

// ============================================================================
// Cleanup Hooks
// ============================================================================

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Restore real timers after all tests
afterAll(() => {
  jest.useRealTimers();
});

export default testUtils;
