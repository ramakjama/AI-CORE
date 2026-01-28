import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  const { baseURL } = config.projects[0].use;

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    console.log(`⏳ Waiting for application at ${baseURL}...`);
    await page.goto(baseURL || 'http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('✅ Application is ready');

    // You can add additional setup here, such as:
    // - Seeding test database
    // - Creating test users
    // - Setting up test data

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;
