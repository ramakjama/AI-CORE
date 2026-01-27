/**
 * Jest Configuration for AI-Core Monorepo
 * Root configuration that handles all library tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',

  // Node environment for backend services
  testEnvironment: 'node',

  // Root directory for finding tests
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/libs/**/__tests__/**/*.test.ts',
    '<rootDir>/libs/**/__tests__/**/*.spec.ts'
  ],

  // Module paths for resolving imports
  moduleNameMapper: {
    '@ai-core/types(.*)$': '<rootDir>/libs/shared/types/src$1',
    '@ai-core/utils(.*)$': '<rootDir>/libs/shared/utils/src$1',
    '@ai-core/constants(.*)$': '<rootDir>/libs/shared/constants/src$1',
    '@ai-core/ui(.*)$': '<rootDir>/libs/ui/src$1',
    '@ai-core/database(.*)$': '<rootDir>/libs/database/src$1',
    '@ai-core/ai(.*)$': '<rootDir>/libs/ai-core/src$1',
    '@ai-core/integrations(.*)$': '<rootDir>/libs/integrations/src$1',
    '@ai-core/ai-agents(.*)$': '<rootDir>/libs/ai-agents/src$1',
    '@ai-core/ai-analytics(.*)$': '<rootDir>/libs/ai-analytics/src$1',
    '@ai-core/ai-comms(.*)$': '<rootDir>/libs/ai-comms/src$1',
    '@ai-core/ai-communications(.*)$': '<rootDir>/libs/ai-communications/src$1',
    '@ai-core/ai-documents(.*)$': '<rootDir>/libs/ai-documents/src$1',
    '@ai-core/ai-finance(.*)$': '<rootDir>/libs/ai-finance/src$1',
    '@ai-core/ai-gateway(.*)$': '<rootDir>/libs/ai-gateway/src$1',
    '@ai-core/ai-hr(.*)$': '<rootDir>/libs/ai-hr/src$1',
    '@ai-core/ai-iam(.*)$': '<rootDir>/libs/ai-iam/src$1',
    '@ai-core/ai-insurance(.*)$': '<rootDir>/libs/ai-insurance/src$1',
    '@ai-core/ai-integrations(.*)$': '<rootDir>/libs/ai-integrations/src$1',
    '@ai-core/ai-leads(.*)$': '<rootDir>/libs/ai-leads/src$1',
    '@ai-core/ai-llm(.*)$': '<rootDir>/libs/ai-llm/src$1',
    '@ai-core/ai-mdm(.*)$': '<rootDir>/libs/ai-mdm/src$1',
    '@ai-core/ai-portal(.*)$': '<rootDir>/libs/ai-portal/src$1',
    '@ai-core/ai-projects(.*)$': '<rootDir>/libs/ai-projects/src$1',
    '@ai-core/ai-voice(.*)$': '<rootDir>/libs/ai-voice/src$1',
    '@ai-core/ai-workflows(.*)$': '<rootDir>/libs/ai-workflows/src$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'libs/**/src/**/*.ts',
    '!libs/**/src/**/index.ts',
    '!libs/**/src/**/types/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],

  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Project-specific configurations for parallel execution
  projects: [
    {
      displayName: 'ai-agents',
      testMatch: ['<rootDir>/libs/ai-agents/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-llm',
      testMatch: ['<rootDir>/libs/ai-llm/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-insurance',
      testMatch: ['<rootDir>/libs/ai-insurance/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-workflows',
      testMatch: ['<rootDir>/libs/ai-workflows/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-iam',
      testMatch: ['<rootDir>/libs/ai-iam/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-mdm',
      testMatch: ['<rootDir>/libs/ai-mdm/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
    {
      displayName: 'ai-gateway',
      testMatch: ['<rootDir>/libs/ai-gateway/__tests__/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/libs/test-setup/jest.setup.ts'],
    },
  ],

  // Global settings for ts-jest
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Module directories for resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
};
