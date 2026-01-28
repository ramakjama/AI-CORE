import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');

  // Add cleanup tasks here, such as:
  // - Cleaning up test data
  // - Removing test users
  // - Resetting test database

  console.log('✅ Global teardown completed');
}

export default globalTeardown;
