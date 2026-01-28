# E2E Tests - Quick Reference Card

## Installation & Setup

```bash
# 1. Navigate to e2e directory
cd C:\Users\rsori\codex\ait-core-soriano\e2e

# 2. Install dependencies
pnpm install

# 3. Install browsers
pnpm run install-browsers

# 4. Setup environment
cp .env.example .env

# 5. Start application (in another terminal)
cd ../apps/web && pnpm dev
```

## Common Commands

```bash
# Run all tests
pnpm test

# Run with visible browser
pnpm test:headed

# Interactive UI mode
pnpm test:ui

# Debug mode
pnpm test:debug

# View report
pnpm run report
```

## Test Suites

```bash
pnpm run test:auth        # Authentication (24 tests)
pnpm run test:dashboard   # Dashboard (18 tests)
pnpm run test:clients     # Clients (25 tests)
pnpm run test:policies    # Policies (24 tests)
pnpm run test:claims      # Claims (30 tests)
```

## Browser Selection

```bash
pnpm run test:chromium    # Chrome
pnpm run test:firefox     # Firefox
pnpm run test:webkit      # Safari
pnpm run test:mobile      # Mobile browsers
```

## Test Structure

```
e2e/
├── fixtures/           # Auth & test data
├── utils/             # Helper functions
├── tests/             # Test suites
│   ├── auth/         # 24 tests
│   ├── dashboard/    # 18 tests
│   ├── clients/      # 25 tests
│   ├── policies/     # 24 tests
│   └── claims/       # 30 tests
└── playwright.config.ts
```

## Writing Tests

### Basic Test
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/route');
  await page.click('button:has-text("Click")');
  await expect(page.locator('text=Success')).toBeVisible();
});
```

### Authenticated Test
```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('my test', async ({ authenticatedPage: page }) => {
  // Already logged in
  await page.goto('/protected');
  // Test code...
});
```

### Using Helpers
```typescript
import { navigateAndWait, waitForTableData } from '../../utils/helpers';

test('table test', async ({ authenticatedPage: page }) => {
  await navigateAndWait(page, '/clients');
  await waitForTableData(page);
  // Test code...
});
```

## Helper Functions

```typescript
// Navigation
navigateAndWait(page, '/path')
clickAndWaitForNavigation(page, 'button', '/url')

// Tables
waitForTableData(page, minRows?)
searchTable(page, 'search term')
verifyTableContains(page, 'text')
getTableRowCount(page)
clickTableRow(page, index)

// Forms
fillFieldWithRetry(page, 'input', 'value')
selectDropdownOption(page, 'trigger', 'option')

// Dialogs
waitForDialog(page)
closeDialog(page)

// Verification
verifyPageTitle(page, /Title/)
waitForToast(page, 'message', 'success')
verifyNoLoadingIndicators(page)

// API
waitForAPIResponse(page, '/api/path', 'GET')
mockAPIResponse(page, '/api/path', data, 200)
```

## Test Data Generators

```typescript
import {
  generateTestClient,
  generateTestPolicy,
  generateTestClaim
} from '../../fixtures/test-data';

// Generate unique test data
const client = generateTestClient(Date.now());
const policy = generateTestPolicy(Date.now());
const claim = generateTestClaim(Date.now());
```

## Debugging

### UI Mode (Best for development)
```bash
pnpm run test:ui
```
- Watch tests run
- Time travel through steps
- Inspect DOM
- Re-run tests

### Debug Mode
```bash
pnpm run test:debug
```
- Step through code
- Pause at breakpoints
- Use DevTools
- Inspect elements

### Generate Test Code
```bash
pnpm run codegen
```
- Record actions
- Generate test code
- Copy selectors

## Selectors

```typescript
// Good selectors (prefer these)
page.locator('button:has-text("Submit")')
page.locator('[data-testid="submit-btn"]')
page.locator('text=Label')
page.locator('[role="button"]')

// Avoid
page.locator('.btn.primary.large')
page.locator('div > span:nth-child(2)')
```

## Waits

```typescript
// Wait for element
await page.waitForSelector('button')

// Wait for URL
await page.waitForURL('/dashboard')

// Wait for load state
await page.waitForLoadState('networkidle')

// Wait for API
await page.waitForResponse(res =>
  res.url().includes('/api/data')
)

// Avoid hard waits
await page.waitForTimeout(5000) // ❌ Don't use
```

## Assertions

```typescript
// Visibility
await expect(page.locator('text=Hello')).toBeVisible()
await expect(page.locator('text=Hidden')).not.toBeVisible()

// Text content
await expect(page.locator('h1')).toContainText('Dashboard')
await expect(page.locator('h1')).toHaveText('Exact Text')

// Counts
await expect(page.locator('tr')).toHaveCount(5)

// Attributes
await expect(page.locator('input')).toHaveAttribute('type', 'email')

// URL
await expect(page).toHaveURL(/dashboard/)

// State
await expect(page.locator('button')).toBeDisabled()
await expect(page.locator('checkbox')).toBeChecked()
```

## Environment Variables

```bash
# .env file
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=user@soriano.com
TEST_USER_PASSWORD=User123!
DEFAULT_TIMEOUT=30000
```

## Test Users

```typescript
// Available in auth.fixture.ts
testUsers.user  // Regular user
testUsers.admin // Admin user
testUsers.agent // Agent user
```

## CI/CD

### GitHub Actions
- Runs on push/PR
- Tests all browsers
- Uploads artifacts
- 2 retries on failure

### Local CI Simulation
```bash
CI=true pnpm test
```

## Troubleshooting

### Tests fail with timeout
```typescript
// Increase timeout in test
test.setTimeout(120000) // 2 minutes
```

### Application not running
```bash
# Check if running
curl http://localhost:3000

# Start application
cd ../apps/web && pnpm dev
```

### Flaky tests
- Add explicit waits
- Use `waitForLoadState`
- Avoid `waitForTimeout`
- Check for race conditions

### Clean install
```bash
# Remove node_modules
rm -rf node_modules

# Reinstall
pnpm install
pnpm run install-browsers
```

## Reports

### View HTML Report
```bash
pnpm run report
```

### Report Contents
- ✅ Test results
- 📸 Screenshots on failure
- 🎥 Videos of failures
- 📊 Traces for debugging
- 📡 Network activity
- 💬 Console logs

## Performance

### Parallel Execution
- Local: 4 workers (default)
- CI: 1 worker (sequential)

### Test Times
- Auth: ~15s
- Dashboard: ~20s
- Clients: ~45s
- Policies: ~50s
- Claims: ~55s
- **Total: ~3-5 min**

## Best Practices

### DO ✅
- Use semantic selectors
- Wait for elements
- Test user behavior
- Independent tests
- Descriptive names
- Clean test data

### DON'T ❌
- Hard-coded waits
- Brittle CSS selectors
- Dependent tests
- Test implementation
- Production data

## File Locations

```bash
Tests:     e2e/tests/**/*.spec.ts
Fixtures:  e2e/fixtures/**/*.ts
Helpers:   e2e/utils/helpers.ts
Config:    e2e/playwright.config.ts
Reports:   e2e/playwright-report/
Results:   e2e/test-results/
```

## Documentation

- **README.md** - Main documentation
- **TESTING_GUIDE.md** - Detailed guide
- **E2E_TEST_SUMMARY.md** - Test coverage
- **FILE_MANIFEST.md** - File listing
- **QUICK_REFERENCE.md** - This file

## Support

1. Check documentation files
2. Review test examples
3. Check [Playwright docs](https://playwright.dev)
4. Create GitHub issue
5. Contact dev team

## Version

- **Suite Version**: 1.0.0
- **Playwright**: 1.41.0
- **Node**: 20+
- **Status**: ✅ Production Ready

---

**Quick Reference Card** | **Last Updated**: 2026-01-28
