# AIT-CORE Soriano - E2E Testing Suite

Comprehensive end-to-end testing suite for AIT-CORE Soriano Insurance Management System using Playwright.

## Overview

This E2E testing suite provides production-ready tests covering all critical user workflows:

- **Authentication Flow**: Login, logout, registration, password recovery
- **Dashboard Navigation**: Main dashboard, navigation, WebSocket connections
- **Client Management**: CRUD operations, search, filtering, bulk actions
- **Policy Management**: Create, edit, delete policies, documents handling
- **Claims Processing**: Claims lifecycle, status workflow, priority handling

## Prerequisites

- Node.js 20.x or higher
- pnpm 8.x or higher
- Running AIT-CORE application (web app on port 3000)

## Installation

1. Install dependencies:
```bash
cd e2e
pnpm install
```

2. Install Playwright browsers:
```bash
pnpm run install-browsers
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running Tests

### Run all tests
```bash
pnpm test
```

### Run tests in headed mode (see browser)
```bash
pnpm run test:headed
```

### Run tests with UI mode (interactive)
```bash
pnpm run test:ui
```

### Run tests in debug mode
```bash
pnpm run test:debug
```

### Run specific test suites
```bash
# Authentication tests
pnpm run test:auth

# Dashboard tests
pnpm run test:dashboard

# Client management tests
pnpm run test:clients

# Policy management tests
pnpm run test:policies

# Claims processing tests
pnpm run test:claims
```

### Run tests on specific browsers
```bash
# Chromium only
pnpm run test:chromium

# Firefox only
pnpm run test:firefox

# WebKit (Safari) only
pnpm run test:webkit

# Mobile browsers
pnpm run test:mobile
```

## Test Structure

```
e2e/
├── fixtures/               # Test fixtures and utilities
│   ├── auth.fixture.ts    # Authentication helpers
│   └── test-data.ts       # Test data generators
├── tests/                 # Test suites
│   ├── auth/             # Authentication tests
│   │   ├── login.spec.ts
│   │   └── registration.spec.ts
│   ├── dashboard/        # Dashboard tests
│   │   └── navigation.spec.ts
│   ├── clients/          # Client management tests
│   │   └── client-management.spec.ts
│   ├── policies/         # Policy management tests
│   │   └── policy-management.spec.ts
│   └── claims/           # Claims processing tests
│       └── claims-processing.spec.ts
├── utils/                # Helper functions
│   └── helpers.ts
├── playwright.config.ts  # Playwright configuration
├── global-setup.ts       # Global setup script
├── global-teardown.ts    # Global teardown script
└── package.json
```

## Test Configuration

### Browsers

Tests run on multiple browsers by default:
- Chromium (Desktop Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)
- Tablet (iPad Pro)

### Timeouts

- Test timeout: 60 seconds
- Action timeout: 15 seconds
- Navigation timeout: 30 seconds

### Retries

- CI: 2 retries
- Local: 0 retries

### Parallel Execution

- CI: 1 worker (sequential)
- Local: All available CPU cores

## Test Reports

After running tests, view the HTML report:

```bash
pnpm run report
```

Reports include:
- Test results with pass/fail status
- Screenshots on failure
- Videos of failed tests
- Test traces for debugging

### Report Formats

- **HTML**: Interactive report with screenshots and videos
- **JSON**: Machine-readable results
- **JUnit**: For CI/CD integration

## Writing Tests

### Example Test Structure

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { navigateAndWait, verifyPageTitle } from '../../utils/helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await navigateAndWait(page, '/your-route');
  });

  test('should perform action successfully', async ({ authenticatedPage: page }) => {
    // Arrange
    await verifyPageTitle(page, /Expected Title/i);

    // Act
    await page.click('button:has-text("Action")');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Using Fixtures

#### Authenticated Pages

```typescript
// Use authenticated user
test('my test', async ({ authenticatedPage: page }) => {
  // Page is already logged in as regular user
});

// Use admin user
test('admin test', async ({ adminPage: page }) => {
  // Page is logged in as admin
});

// Use agent user
test('agent test', async ({ agentPage: page }) => {
  // Page is logged in as agent
});
```

#### Test Data Generators

```typescript
import { generateTestClient, generateTestPolicy, generateTestClaim } from '../../fixtures/test-data';

// Generate test client
const client = generateTestClient(1);

// Generate test policy
const policy = generateTestPolicy(1, 'John Doe');

// Generate test claim
const claim = generateTestClaim(1, 'POL-2024-0001');
```

## Best Practices

### 1. Use Page Object Pattern
Extract complex page interactions into reusable functions in `utils/helpers.ts`.

### 2. Wait for Elements
Always wait for elements before interacting:
```typescript
await page.waitForSelector('button:has-text("Submit")');
await page.click('button:has-text("Submit")');
```

### 3. Use Meaningful Selectors
Prefer text content and data-testid attributes:
```typescript
// Good
await page.click('button:has-text("Submit")');
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('.btn.btn-primary.submit');
```

### 4. Handle Asynchronous Operations
Wait for network idle and loading states:
```typescript
await page.waitForLoadState('networkidle');
await waitForTableData(page);
```

### 5. Clean Up Test Data
Use unique identifiers for test data:
```typescript
const testEmail = `test${Date.now()}@example.com`;
```

### 6. Test in Isolation
Each test should be independent and not rely on other tests.

### 7. Use Assertions
Always verify expected outcomes:
```typescript
await expect(page.locator('text=Success')).toBeVisible();
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: pnpm install
      - name: Install Playwright browsers
        run: pnpm --filter e2e run install-browsers
      - name: Run E2E tests
        run: pnpm --filter e2e test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## Debugging

### Visual Debugging
```bash
pnpm run test:ui
```

### Step-by-Step Debugging
```bash
pnpm run test:debug
```

### Generate Test Code
Use Playwright codegen to record actions:
```bash
pnpm run codegen
```

### View Traces
When a test fails, view the trace in the HTML report to see:
- Step-by-step execution
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

## Troubleshooting

### Tests Fail Locally But Pass in CI

1. Check environment variables
2. Ensure database is in correct state
3. Clear browser cache: `pnpm run install-browsers --force`

### Flaky Tests

1. Increase timeouts
2. Add explicit waits
3. Use `waitForLoadState('networkidle')`
4. Avoid hard-coded waits

### Slow Tests

1. Run in parallel: Update `workers` in `playwright.config.ts`
2. Use focused tests: `test.only()` during development
3. Optimize selectors
4. Mock external API calls

## Performance

Average test execution times:
- Authentication tests: ~15 seconds
- Dashboard tests: ~20 seconds
- Client management: ~45 seconds
- Policy management: ~50 seconds
- Claims processing: ~55 seconds

Total suite: ~3-5 minutes (parallel execution)

## Contributing

1. Write tests for new features
2. Ensure all tests pass before committing
3. Update documentation for new test patterns
4. Follow existing code style and conventions

## Support

For issues or questions:
- Check existing issues in the repository
- Create a new issue with detailed information
- Include test logs and screenshots

## License

Proprietary - AIN TECH - Soriano Mediadores
