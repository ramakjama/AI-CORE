# E2E Testing Guide - AIT-CORE Soriano

## Quick Start

### 1. Initial Setup

```bash
cd e2e
./scripts/setup.sh
```

Or manually:

```bash
# Install dependencies
pnpm install

# Install browsers
pnpm run install-browsers

# Copy environment file
cp .env.example .env
```

### 2. Start the Application

```bash
cd ../apps/web
pnpm dev
```

### 3. Run Tests

```bash
cd ../e2e
pnpm test
```

## Test Workflows Covered

### Authentication Flow
- ✅ User login with valid credentials
- ✅ Login with invalid credentials
- ✅ Form validation
- ✅ Remember me functionality
- ✅ User registration
- ✅ Password strength validation
- ✅ Logout functionality

### Dashboard Navigation
- ✅ Dashboard loading
- ✅ WebSocket connection status
- ✅ System statistics display
- ✅ Navigation to all sections
- ✅ Module overview
- ✅ Recent activity
- ✅ Responsive navigation

### Client Management
- ✅ View client list
- ✅ Create new client
- ✅ Edit client details
- ✅ Delete client
- ✅ Search clients
- ✅ Filter by status and type
- ✅ Sort by columns
- ✅ Export data
- ✅ View client details
- ✅ Form validation

### Policy Creation
- ✅ View policies list
- ✅ Create new policy
- ✅ Edit policy details
- ✅ Delete policy
- ✅ Search policies
- ✅ Filter by status and type
- ✅ Sort by columns
- ✅ Export data
- ✅ View policy details
- ✅ Policy documents
- ✅ Form validation

### Claims Processing
- ✅ View claims list
- ✅ Create new claim
- ✅ Edit claim details
- ✅ Delete claim
- ✅ Search claims
- ✅ Filter by status, type, and priority
- ✅ Sort by columns
- ✅ Export data
- ✅ View claim details
- ✅ Claim timeline
- ✅ Status workflow
- ✅ Form validation

## Test Organization

```
tests/
├── auth/                   # Authentication tests
│   ├── login.spec.ts      # Login flow (13 tests)
│   └── registration.spec.ts # Registration flow (11 tests)
├── dashboard/             # Dashboard tests
│   └── navigation.spec.ts # Navigation and layout (18 tests)
├── clients/               # Client management tests
│   └── client-management.spec.ts # Full CRUD (25 tests)
├── policies/              # Policy management tests
│   └── policy-management.spec.ts # Full CRUD (24 tests)
└── claims/                # Claims processing tests
    └── claims-processing.spec.ts # Full CRUD + workflow (30 tests)
```

Total: **121 comprehensive E2E tests**

## Running Specific Tests

### By Test Suite

```bash
# Authentication tests only
pnpm run test:auth

# Dashboard tests only
pnpm run test:dashboard

# Client management tests only
pnpm run test:clients

# Policy management tests only
pnpm run test:policies

# Claims processing tests only
pnpm run test:claims
```

### By Browser

```bash
# Chromium only
pnpm run test:chromium

# Firefox only
pnpm run test:firefox

# WebKit/Safari only
pnpm run test:webkit

# Mobile browsers
pnpm run test:mobile
```

### By Test Name

```bash
# Run specific test
pnpm exec playwright test -g "should successfully login"

# Run tests matching pattern
pnpm exec playwright test -g "create"
```

### Interactive Modes

```bash
# UI Mode (best for development)
pnpm run test:ui

# Headed mode (see browser)
pnpm run test:headed

# Debug mode (step through)
pnpm run test:debug
```

## Test Data Strategy

### Generated Test Data

All test data is generated uniquely to avoid conflicts:

```typescript
// Client data
const client = generateTestClient(Date.now());
// Result: {
//   firstName: 'TestClient1234567890',
//   email: 'testclient1234567890@test.com',
//   ...
// }

// Policy data
const policy = generateTestPolicy(Date.now());
// Result: {
//   policyNumber: 'TEST-POL-1234567890-1',
//   ...
// }

// Claim data
const claim = generateTestClaim(Date.now());
// Result: {
//   claimNumber: 'TEST-CLM-1234567890-1',
//   ...
// }
```

### Test User Accounts

Pre-configured test users in `fixtures/auth.fixture.ts`:

- **User**: `user@soriano.com` / `User123!`
- **Admin**: `admin@soriano.com` / `Admin123!`
- **Agent**: `agent@soriano.com` / `Agent123!`

## Common Testing Patterns

### 1. Authenticated Tests

```typescript
test('test name', async ({ authenticatedPage: page }) => {
  // Page is already logged in
  await navigateAndWait(page, '/route');
  // Your test code
});
```

### 2. Admin-Only Tests

```typescript
test('admin test', async ({ adminPage: page }) => {
  // Page is logged in as admin
  await navigateAndWait(page, '/admin/route');
  // Your test code
});
```

### 3. Form Submission

```typescript
// Fill form
await page.fill('input[name="field"]', 'value');

// Submit
await page.click('button[type="submit"]');

// Wait for success
const success = page.locator('text=/éxito|success/i');
await expect(success.first()).toBeVisible({ timeout: 5000 });
```

### 4. Table Interactions

```typescript
// Wait for table
await waitForTableData(page);

// Search
await searchTable(page, 'search term');

// Click row
await clickTableRow(page, 0);

// Verify content
await verifyTableContains(page, 'expected text');
```

### 5. Dialog Handling

```typescript
// Open dialog
await page.click('button:has-text("Delete")');

// Wait for dialog
await waitForDialog(page);

// Interact with dialog
await page.click('button:has-text("Confirm")');
```

## Debugging Failed Tests

### 1. View HTML Report

```bash
pnpm run report
```

The report shows:
- Test results with pass/fail status
- Screenshots of failed tests
- Videos of failed test runs
- Step-by-step traces

### 2. Run in UI Mode

```bash
pnpm run test:ui
```

Benefits:
- Watch tests run in real-time
- Time travel through test steps
- Inspect DOM at any point
- Re-run failed tests

### 3. Debug Mode

```bash
pnpm run test:debug
```

Features:
- Pause at each step
- Step through code
- Use browser DevTools
- Inspect elements

### 4. Console Logs

Add logging to tests:

```typescript
console.log('Current URL:', page.url());
console.log('Element text:', await element.textContent());
```

### 5. Screenshots

Take manual screenshots:

```typescript
await page.screenshot({
  path: 'debug.png',
  fullPage: true
});
```

## Best Practices

### DO ✅

1. **Use meaningful test names**
   ```typescript
   test('should create new client with valid data', ...)
   ```

2. **Wait for elements**
   ```typescript
   await page.waitForSelector('button');
   await page.click('button');
   ```

3. **Use semantic selectors**
   ```typescript
   // Good
   page.locator('button:has-text("Submit")')
   page.locator('[data-testid="submit-btn"]')

   // Bad
   page.locator('.btn.primary')
   ```

4. **Verify outcomes**
   ```typescript
   await expect(page.locator('text=Success')).toBeVisible();
   ```

5. **Handle loading states**
   ```typescript
   await page.waitForLoadState('networkidle');
   await waitForTableData(page);
   ```

### DON'T ❌

1. **Hard-coded waits**
   ```typescript
   await page.waitForTimeout(5000); // Bad
   await page.waitForSelector('element'); // Good
   ```

2. **Brittle selectors**
   ```typescript
   page.locator('.container > div > span:nth-child(2)') // Bad
   page.locator('text=Label') // Good
   ```

3. **Dependent tests**
   ```typescript
   // Each test should be independent
   // Don't rely on state from previous tests
   ```

4. **Testing implementation details**
   ```typescript
   // Test user-visible behavior, not internals
   ```

## Performance Tips

### 1. Parallel Execution

Configure in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : 4
```

### 2. Test Sharding

Split tests across machines:

```bash
pnpm exec playwright test --shard=1/4
pnpm exec playwright test --shard=2/4
pnpm exec playwright test --shard=3/4
pnpm exec playwright test --shard=4/4
```

### 3. Skip Slow Tests in Development

```typescript
test.skip(({ browserName }) => browserName !== 'chromium',
  'Chromium only test'
);
```

### 4. Use Test Fixtures

Reuse authenticated states:

```typescript
// Auth is handled once by fixture
test('test', async ({ authenticatedPage: page }) => {
  // Already logged in
});
```

## Continuous Integration

### GitHub Actions

The E2E suite includes a complete CI/CD workflow:

```yaml
# .github/workflows/e2e-tests.yml
# - Runs on push and PR
# - Tests all browsers
# - Uploads artifacts
# - Publishes reports
```

### Local CI Simulation

```bash
# Run tests as CI would
CI=true pnpm test
```

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout in playwright.config.ts
timeout: 120 * 1000, // 2 minutes
```

### Application Not Starting

```bash
# Check if app is running
curl http://localhost:3000

# Start manually
cd ../apps/web && pnpm dev
```

### Browser Not Installed

```bash
# Reinstall browsers
pnpm run install-browsers
```

### Flaky Tests

1. Add explicit waits
2. Use `waitForLoadState`
3. Check for race conditions
4. Increase timeouts for slow operations

### Port Already in Use

```bash
# Kill process on port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Support

For issues or questions:
1. Check this guide
2. Review test examples
3. Check Playwright documentation
4. Contact the development team
