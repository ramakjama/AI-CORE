# Testing Quick Start Guide 🚀

Get up and running with Playwright tests in 5 minutes.

## ⚡ Quick Install

```bash
# Windows
.\install-tests.ps1

# Linux/Mac
chmod +x install-tests.sh && ./install-tests.sh
```

## 🎯 Quick Test

```bash
# Terminal 1: Start app
pnpm dev

# Terminal 2: Run tests
pnpm test
```

## 📋 Essential Commands

```bash
# Run all tests
pnpm test

# Interactive mode (recommended for development)
pnpm test:ui

# Watch mode (see browser)
pnpm test:headed

# Debug specific test
npx playwright test auth.spec.ts --debug

# View report
pnpm test:report
```

## 🏗️ Project Structure

```
suite-portal/
├── playwright.config.ts       # Config
├── tests/
│   ├── auth.spec.ts          # 14 tests
│   ├── dashboard.spec.ts     # 23 tests
│   ├── documents.spec.ts     # 18 tests
│   ├── collaboration.spec.ts # 12 tests
│   ├── video-call.spec.ts   # 15 tests
│   ├── ai-assistant.spec.ts # 16 tests
│   ├── notifications.spec.ts # 20 tests
│   └── utils/
│       ├── auth-helpers.ts
│       ├── test-data.ts
│       └── custom-matchers.ts
└── docs/
    └── TESTING_GUIDE.md      # Full guide
```

## ✍️ Write a Test

```typescript
import { test, expect } from '@playwright/test';
import { setupAuthenticatedSession } from './utils/auth-helpers';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
    await page.goto('/my-feature');
  });

  test('should work correctly', async ({ page }) => {
    // Arrange
    const button = page.locator('[data-testid="my-button"]');

    // Act
    await button.click();

    // Assert
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## 🔑 Key Utilities

```typescript
// Authentication
import { login, setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';

await setupAuthenticatedSession(page, TEST_USERS.user);

// Test Data
import { generateUser, generateDocument } from './utils/test-data';

const user = generateUser();
const doc = generateDocument();

// Custom Matchers
import { waitForNetworkIdle, toHaveNoAccessibilityViolations } from './utils/custom-matchers';

await waitForNetworkIdle(page);
const result = await toHaveNoAccessibilityViolations(page);
```

## 🎨 Best Practices

### 1. Use data-testid
```html
<button data-testid="submit-btn">Submit</button>
```
```typescript
await page.click('[data-testid="submit-btn"]');
```

### 2. Wait properly
```typescript
// Good
await expect(page.locator('[data-testid="result"]')).toBeVisible();

// Avoid
await page.waitForTimeout(5000);
```

### 3. Fast auth setup
```typescript
// Fast (recommended)
await setupAuthenticatedSession(page);

// Slow (only when testing login)
await login(page, TEST_USERS.user);
```

## 🐛 Debug Tests

```bash
# Debug mode (step through)
pnpm test:debug

# Playwright Inspector
PWDEBUG=1 pnpm test

# View trace
npx playwright show-trace trace.zip

# Verbose logs
DEBUG=pw:api pnpm test
```

## 📊 Test Browsers

```bash
# All browsers
pnpm test

# Specific browser
pnpm test:chromium
pnpm test:firefox
pnpm test:webkit
```

## 🎭 Test Patterns

### Login Test
```typescript
test('should login', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Form Validation
```typescript
test('should validate form', async ({ page }) => {
  await page.fill('input[name="email"]', 'invalid');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=/valid email/i')).toBeVisible();
});
```

### API Response
```typescript
test('should call API', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/users') && res.status() === 200
  );
  await page.click('[data-testid="load-users"]');
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
});
```

## 🚦 CI/CD

Tests run automatically on:
- ✅ Push to main/develop
- ✅ Pull requests
- ✅ GitHub Actions workflow included

## 📚 Full Documentation

- **Quick Start**: You're reading it! ⭐
- **Complete Guide**: `docs/TESTING_GUIDE.md`
- **Test Reference**: `tests/README.md`
- **Summary**: `TESTING_INFRASTRUCTURE_COMPLETE.md`
- **Checklist**: `TESTING_CHECKLIST.md`

## 🆘 Common Issues

### Tests won't run
```bash
# Make sure dev server is running
pnpm dev

# Make sure browsers are installed
npx playwright install
```

### Tests timing out
```typescript
// Increase timeout
test.setTimeout(60000);
```

### Element not found
```typescript
// Wait explicitly
await page.waitForSelector('[data-testid="element"]');
```

## 📈 Test Stats

- **Test Suites**: 7
- **Total Tests**: 118+
- **Test Utilities**: 3 files
- **Lines of Code**: ~3,000
- **Documentation**: ~1,500 lines

## 🎯 Next Steps

1. ✅ Install tests: `.\install-tests.ps1`
2. ✅ Run tests: `pnpm test`
3. ✅ Read full guide: `docs/TESTING_GUIDE.md`
4. ✅ Write your first test
5. ✅ Set up CI/CD

## 🤝 Contributing

When adding features:
1. Add `data-testid` attributes
2. Write corresponding tests
3. Run tests locally
4. Ensure CI passes

## 🎉 You're Ready!

```bash
# Let's go!
pnpm dev           # Terminal 1
pnpm test:ui       # Terminal 2
```

**Happy Testing! 🚀**

---

*Need help? Check `docs/TESTING_GUIDE.md` for the complete guide.*
