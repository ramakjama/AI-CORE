# Testing Guide - AIT-CORE Suite Portal

Complete guide for testing the Suite Portal application using Playwright.

## Table of Contents

- [Installation](#installation)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Structure](#test-structure)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Coverage Reports](#coverage-reports)
- [Troubleshooting](#troubleshooting)

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8+
- Modern browser (Chrome, Firefox, or Safari)

### Install Dependencies

```bash
# Install all dependencies including Playwright
pnpm install

# Install Playwright browsers
npx playwright install

# Or install specific browsers
npx playwright install chromium firefox webkit
```

## Running Tests

### All Tests

```bash
# Run all tests in headless mode
pnpm test

# Run with UI (interactive mode)
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed

# Run in debug mode (step through tests)
pnpm test:debug
```

### Specific Browsers

```bash
# Run on Chromium only
pnpm test:chromium

# Run on Firefox only
pnpm test:firefox

# Run on WebKit (Safari) only
pnpm test:webkit
```

### Specific Test Files

```bash
# Run specific test file
npx playwright test tests/auth.spec.ts

# Run specific test by name
npx playwright test -g "should login successfully"

# Run tests matching pattern
npx playwright test tests/auth
```

### Reports

```bash
# Show HTML report
pnpm test:report

# Generate and show report
npx playwright test --reporter=html && npx playwright show-report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await setupAuthenticatedSession(page, TEST_USERS.user);
    await page.goto('/feature');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.locator('[data-testid="my-button"]');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Using Test Utilities

#### Authentication

```typescript
import { login, logout, setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';

// Method 1: Login via UI (slower but tests login flow)
await login(page, TEST_USERS.user);

// Method 2: Login via API (faster, for tests that don't test login)
await setupAuthenticatedSession(page, TEST_USERS.user);

// Logout
await logout(page);
```

#### Test Data Generation

```typescript
import { generateUser, generateDocument, generateTask } from './utils/test-data';

// Generate random user data
const user = generateUser();

// Generate random document
const doc = generateDocument();

// Generate multiple items
import { generateMultiple } from './utils/test-data';
const users = generateMultiple(generateUser, 10);
```

#### Custom Matchers

```typescript
import {
  toHaveNoAccessibilityViolations,
  waitForNetworkIdle,
  scrollIntoView,
  typeWithDelay,
} from './utils/custom-matchers';

// Wait for network to be idle
await waitForNetworkIdle(page);

// Check accessibility
const result = await toHaveNoAccessibilityViolations(page);
expect(result.pass).toBeTruthy();

// Type with human-like delay
await typeWithDelay(input, 'Hello World', 100);

// Scroll element into view
await scrollIntoView(element);
```

### Page Object Model (POM)

Create page objects for better maintainability:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  get emailInput() {
    return this.page.locator('input[type="email"]');
  }

  get passwordInput() {
    return this.page.locator('input[type="password"]');
  }

  get submitButton() {
    return this.page.locator('button[type="submit"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('**/dashboard');
  }
}

// Use in tests
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'password');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Testing Patterns

#### Testing Forms

```typescript
test('should validate form', async ({ page }) => {
  // Fill invalid data
  await page.fill('input[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');

  // Check for validation error
  await expect(page.locator('text=/valid email/i')).toBeVisible();

  // Fill valid data
  await page.fill('input[name="email"]', 'valid@example.com');
  await page.click('button[type="submit"]');

  // Check success
  await expect(page.locator('text=/success/i')).toBeVisible();
});
```

#### Testing API Calls

```typescript
test('should make API call', async ({ page }) => {
  // Wait for specific API response
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/users') && response.status() === 200
  );

  await page.click('[data-testid="load-users"]');

  const response = await responsePromise;
  const data = await response.json();

  expect(data.users).toBeDefined();
});
```

#### Testing WebSocket

```typescript
test.skip('should receive WebSocket messages', async ({ page }) => {
  // Listen for WebSocket
  page.on('websocket', (ws) => {
    ws.on('framereceived', (event) => {
      console.log('Received:', event.payload);
    });

    ws.on('framesent', (event) => {
      console.log('Sent:', event.payload);
    });
  });

  await page.goto('/real-time-feature');
  // Perform actions that trigger WebSocket
});
```

#### Testing File Upload

```typescript
test('should upload file', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');

  await fileInput.setInputFiles({
    name: 'test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('test content'),
  });

  await page.click('button:has-text("Upload")');

  await expect(page.locator('text=/uploaded successfully/i')).toBeVisible();
});
```

#### Testing Drag and Drop

```typescript
test('should drag and drop', async ({ page }) => {
  const source = page.locator('[data-testid="draggable-item"]');
  const target = page.locator('[data-testid="drop-zone"]');

  await source.dragTo(target);

  await expect(target).toContainText('Dropped item');
});
```

## Test Structure

### Directory Layout

```
tests/
├── auth.spec.ts                 # Authentication tests
├── dashboard.spec.ts            # Dashboard tests
├── documents.spec.ts            # Document CRUD tests
├── collaboration.spec.ts        # Y.js collaboration tests
├── video-call.spec.ts          # WebRTC video call tests
├── ai-assistant.spec.ts        # AI assistant tests
├── notifications.spec.ts       # Notification tests
└── utils/
    ├── auth-helpers.ts         # Authentication utilities
    ├── test-data.ts           # Test data generators
    └── custom-matchers.ts     # Custom assertions
```

### Test Categories

1. **Unit Tests** - Test individual components (use Jest/Vitest for these)
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user flows (Playwright)

## Best Practices

### 1. Use Data-TestId Attributes

```html
<!-- Good: Use data-testid for stable selectors -->
<button data-testid="submit-button">Submit</button>

<!-- Avoid: Using class names or text content -->
<button class="btn-primary">Submit</button>
```

```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('.btn-primary');
```

### 2. Wait for Elements Properly

```typescript
// Good: Wait for element to be visible
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// Avoid: Fixed timeouts
await page.waitForTimeout(5000);
```

### 3. Use Descriptive Test Names

```typescript
// Good
test('should display validation error when email format is invalid', async ({ page }) => {
  // ...
});

// Avoid
test('email validation', async ({ page }) => {
  // ...
});
```

### 4. Keep Tests Independent

```typescript
// Good: Each test is independent
test.beforeEach(async ({ page }) => {
  await setupAuthenticatedSession(page);
  await page.goto('/documents');
});

test('should create document', async ({ page }) => {
  // Test creating document
});

test('should edit document', async ({ page }) => {
  // Test editing document
});

// Avoid: Tests depending on each other
```

### 5. Use Page Objects for Complex Pages

```typescript
// Good: Encapsulate page logic
class DocumentPage {
  constructor(private page: Page) {}

  async createDocument(title: string) {
    await this.page.click('[data-testid="new-document"]');
    await this.page.fill('[data-testid="title-input"]', title);
    await this.page.click('[data-testid="save"]');
  }

  async getDocumentTitle() {
    return await this.page.locator('[data-testid="document-title"]').textContent();
  }
}
```

### 6. Handle Flaky Tests

```typescript
// Use retry for flaky tests
test('flaky test', async ({ page }) => {
  test.setTimeout(30000); // Increase timeout
  await page.goto('/');
  // Use waitForLoadState
  await page.waitForLoadState('networkidle');
});

// Or skip flaky tests temporarily
test.skip('temporarily disabled', async ({ page }) => {
  // This test will be skipped
});
```

### 7. Test Accessibility

```typescript
import { toHaveNoAccessibilityViolations } from './utils/custom-matchers';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const result = await toHaveNoAccessibilityViolations(page, {
    tags: ['wcag2a', 'wcag2aa'],
  });

  expect(result.pass).toBeTruthy();
});
```

### 8. Use Visual Regression Testing

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/dashboard');

  // Take screenshot and compare
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100,
  });
});
```

### 9. Test Error States

```typescript
test('should handle network error', async ({ page, context }) => {
  // Simulate offline
  await context.setOffline(true);

  await page.goto('/');

  // Should show error message
  await expect(page.locator('text=/network error/i')).toBeVisible();

  // Go back online
  await context.setOffline(false);
});
```

### 10. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await page.evaluate(() => localStorage.clear());
});

test.afterAll(async () => {
  // Clean up global resources
  // Close database connections, etc.
});
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: pnpm test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
image: mcr.microsoft.com/playwright:v1.41.0-focal

stages:
  - test

playwright:
  stage: test
  script:
    - npm install -g pnpm
    - pnpm install
    - pnpm test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 30 days
```

### Docker

Create `Dockerfile.test`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.41.0-focal

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

CMD ["pnpm", "test"]
```

Run tests in Docker:

```bash
docker build -f Dockerfile.test -t suite-portal-tests .
docker run suite-portal-tests
```

## Coverage Reports

### Generate Coverage

```bash
# Run tests with coverage
npx playwright test --reporter=html,json

# View HTML report
npx playwright show-report
```

### Coverage Configuration

Update `playwright.config.ts`:

```typescript
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
});
```

### Analyze Coverage

```bash
# View test results
cat test-results/results.json | jq '.suites[].specs[].tests[]'

# Count tests
cat test-results/results.json | jq '.suites[].specs[].tests | length'
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```typescript
// Increase timeout
test.setTimeout(60000);

// Or globally in playwright.config.ts
export default defineConfig({
  timeout: 60 * 1000,
});
```

#### 2. Element Not Found

```typescript
// Wait for element explicitly
await page.waitForSelector('[data-testid="element"]', { state: 'visible' });

// Or use waitFor
await expect(page.locator('[data-testid="element"]')).toBeVisible({ timeout: 10000 });
```

#### 3. Flaky Network Tests

```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Or wait for specific request
await page.waitForResponse((response) => response.url().includes('/api/data'));
```

#### 4. Authentication Issues

```typescript
// Make sure tokens are set
await page.evaluate(() => {
  const token = localStorage.getItem('access_token');
  console.log('Token:', token);
});

// Clear auth state before test
test.beforeEach(async ({ page }) => {
  await clearAuth(page);
  await setupAuthenticatedSession(page);
});
```

#### 5. Video/Camera Permissions

```typescript
// Grant permissions
test.use({
  permissions: ['camera', 'microphone'],
});

// Or in test
await context.grantPermissions(['camera', 'microphone']);
```

### Debug Mode

```bash
# Run in debug mode
pnpm test:debug

# Or specific test
npx playwright test auth.spec.ts --debug

# Open Playwright Inspector
PWDEBUG=1 npx playwright test
```

### Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Screenshots and Videos

```typescript
// Take screenshot manually
await page.screenshot({ path: 'screenshot.png', fullPage: true });

// Configure in playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com/)
- [Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)

## Need Help?

- Check Playwright logs: `DEBUG=pw:api npx playwright test`
- Enable verbose logging in config
- Join Playwright Discord: [discord.gg/playwright](https://discord.gg/playwright)
- File issues: [GitHub Issues](https://github.com/microsoft/playwright/issues)

---

**Happy Testing!** 🎭
