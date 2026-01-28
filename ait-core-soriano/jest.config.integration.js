/** @type {import('jest').Config} */
module.exports = {
  ...require('./jest.config'),
  testMatch: ['**/?(*.)+(integration|int).+(ts|tsx|js)'],
  setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/test/global-setup.ts',
  globalTeardown: '<rootDir>/test/global-teardown.ts',
};
