/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/build/**',
    '!**/__tests__/**',
    '!**/*.config.js',
    '!**/*.config.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/web/src/$1',
    '^@ait-core/shared$': '<rootDir>/libs/shared/src',
    '^@ait-core/database$': '<rootDir>/libs/database/src',
    '^@ait-core/kafka$': '<rootDir>/libs/kafka/src',
    '^@ait-core/auth$': '<rootDir>/libs/auth/src',
    '^@ait-core/ui$': '<rootDir>/libs/ui/src',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/', '/build/'],
  verbose: true,
  maxWorkers: '50%',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
