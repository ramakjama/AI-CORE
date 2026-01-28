import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AIT-CORE Soriano E2E Tests
 *
 * This configuration sets up comprehensive end-to-end testing for:
 * - Authentication flows
 * - Policy management
 * - Claims processing
 * - Client management
 * - Dashboard navigation
 */

export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Test timeout for each assertion
  expect: {
    timeout: 10000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time each action such as `click()` can take
    actionTimeout: 15000,

    // Whether to ignore HTTPS errors when sending network requests
    ignoreHTTPSErrors: true,

    // Locale and timezone
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet viewports
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'cd ../apps/web && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts'),
});
