# E2E Tests - Suite Portal

Comprehensive end-to-end tests for the AIT-CORE Suite Portal application using Playwright.

## Quick Start

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install

# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run specific browser
pnpm test:chromium
```

## Test Suites

### Authentication Tests (`auth.spec.ts`)
- ✅ Login with valid/invalid credentials
- ✅ Registration flow
- ✅ Password reset
- ✅ Session persistence
- ✅ Protected routes
- ✅ Logout functionality

### Dashboard Tests (`dashboard.spec.ts`)
- ✅ Layout and navigation
- ✅ Sidebar functionality
- ✅ Dashboard widgets
- ✅ User menu
- ✅ Theme toggle
- ✅ Search functionality
- ✅ Notifications panel
- ✅ Responsive design
- ✅ Performance checks
- ✅ Accessibility validation

### Documents Tests (`documents.spec.ts`)
- ✅ Document list view
- ✅ Create new document
- ✅ Edit document content
- ✅ Text formatting (bold, italic, underline)
- ✅ Insert images and links
- ✅ Auto-save functionality
- ✅ Document actions (share, duplicate, export, rename, delete)
- ✅ Search and filter
- ✅ Templates
- ✅ Keyboard shortcuts

### Collaboration Tests (`collaboration.spec.ts`)
- ✅ Real-time text synchronization (Y.js)
- ✅ Remote cursor display
- ✅ Remote selections
- ✅ Presence awareness
- ✅ Conflict resolution (CRDT)
- ✅ Collaboration bar controls
- ✅ Connection status
- ✅ Comments and replies
- ✅ Version history

### Video Call Tests (`video-call.spec.ts`)
- ✅ Video call UI
- ✅ Camera and microphone controls
- ✅ Toggle camera/microphone
- ✅ Call controls (end call, screen share)
- ✅ Incoming call notifications
- ✅ Accept/reject calls
- ✅ Multiple participants
- ✅ Call settings
- ✅ Connection quality
- ✅ Call recording

### AI Assistant Tests (`ai-assistant.spec.ts`)
- ✅ AI assistant panel
- ✅ Chat interface
- ✅ Send messages to AI
- ✅ Chat history
- ✅ Contextual suggestions
- ✅ Command palette
- ✅ AI actions (summarize, improve, translate, generate)
- ✅ AI settings
- ✅ Response quality feedback

### Notifications Tests (`notifications.spec.ts`)
- ✅ Toast notifications (success, error, warning, info)
- ✅ Auto-dismiss and manual dismiss
- ✅ Multiple toast stacking
- ✅ Toast with action buttons
- ✅ Notification center
- ✅ Mark as read/unread
- ✅ Delete notifications
- ✅ Filter and sort
- ✅ Notification types (mention, comment, share)
- ✅ Real-time notifications
- ✅ Accessibility

## Test Utilities

### Authentication Helpers (`utils/auth-helpers.ts`)
```typescript
import { login, logout, setupAuthenticatedSession, TEST_USERS } from './utils/auth-helpers';

// Login via UI
await login(page, TEST_USERS.user);

// Fast API login (recommended for most tests)
await setupAuthenticatedSession(page, TEST_USERS.user);

// Logout
await logout(page);
```

### Test Data Generators (`utils/test-data.ts`)
```typescript
import { generateUser, generateDocument, generateTask } from './utils/test-data';

const user = generateUser();
const doc = generateDocument();
const task = generateTask();
```

### Custom Matchers (`utils/custom-matchers.ts`)
```typescript
import {
  toHaveNoAccessibilityViolations,
  waitForNetworkIdle,
  scrollIntoView,
  typeWithDelay
} from './utils/custom-matchers';

await waitForNetworkIdle(page);
const result = await toHaveNoAccessibilityViolations(page);
```

## Test Users

Predefined test users available in `utils/auth-helpers.ts`:

```typescript
TEST_USERS = {
  admin: {
    email: 'admin@ait-core.com',
    password: 'Admin123!',
    name: 'Admin User',
  },
  user: {
    email: 'user@ait-core.com',
    password: 'User123!',
    name: 'Test User',
  },
  collaborator: {
    email: 'collaborator@ait-core.com',
    password: 'Collab123!',
    name: 'Collaborator User',
  },
};
```

## Running Specific Tests

```bash
# Run single file
npx playwright test tests/auth.spec.ts

# Run specific test
npx playwright test -g "should login successfully"

# Run tests matching pattern
npx playwright test auth

# Run in debug mode
npx playwright test --debug

# Run with UI
npx playwright test --ui
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3002`
- **Browsers**: Chromium, Firefox, WebKit
- **Screenshots**: On failure
- **Videos**: On first retry
- **Traces**: On first retry
- **Timeout**: 60 seconds per test
- **Retries**: 2 on CI, 0 locally

## Best Practices

### 1. Use data-testid for selectors
```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('.btn-primary');
```

### 2. Wait for network to be idle
```typescript
import { waitForNetworkIdle } from './utils/custom-matchers';
await waitForNetworkIdle(page);
```

### 3. Test accessibility
```typescript
import { toHaveNoAccessibilityViolations } from './utils/custom-matchers';
const result = await toHaveNoAccessibilityViolations(page);
expect(result.pass).toBeTruthy();
```

### 4. Use setupAuthenticatedSession for speed
```typescript
// Fast - skips UI login
await setupAuthenticatedSession(page, TEST_USERS.user);

// Slow - goes through UI
await login(page, TEST_USERS.user);
```

### 5. Keep tests independent
```typescript
test.beforeEach(async ({ page }) => {
  await setupAuthenticatedSession(page);
  await page.goto('/documents');
});
```

## Debugging

### Debug Mode
```bash
# Step through test
pnpm test:debug

# Debug specific test
npx playwright test auth.spec.ts --debug
```

### Playwright Inspector
```bash
PWDEBUG=1 npx playwright test
```

### Screenshots
```bash
# Screenshots are automatically taken on failure
# View them in test-results/ directory
```

### Trace Viewer
```bash
# Traces are recorded on first retry
# View trace
npx playwright show-trace trace.zip
```

### Console Logs
```bash
# Enable debug logging
DEBUG=pw:api npx playwright test
```

## CI/CD

Tests run automatically on:
- Pull requests
- Push to main/develop branches

See `.github/workflows/playwright.yml` for configuration.

## Coverage

```bash
# Run tests and generate report
pnpm test

# View HTML report
pnpm test:report
```

## Skipped Tests

Some tests are marked with `test.skip()` because they require:
- Multiple browser contexts (collaboration tests)
- WebSocket/WebRTC connections (real-time features)
- Camera/microphone permissions (video call tests)
- External services (AI API)

These tests serve as documentation and can be enabled when the infrastructure is ready.

## Directory Structure

```
tests/
├── auth.spec.ts              # 14 tests
├── dashboard.spec.ts         # 23 tests
├── documents.spec.ts         # 18 tests
├── collaboration.spec.ts     # 12 tests
├── video-call.spec.ts        # 15 tests
├── ai-assistant.spec.ts      # 16 tests
├── notifications.spec.ts     # 20 tests
└── utils/
    ├── auth-helpers.ts       # Authentication utilities
    ├── test-data.ts          # Data generators (Faker.js)
    └── custom-matchers.ts    # Custom assertions
```

**Total: 118+ test cases**

## Need Help?

- 📚 [Full Testing Guide](../docs/TESTING_GUIDE.md)
- 🎭 [Playwright Docs](https://playwright.dev/)
- 💬 [Playwright Discord](https://discord.gg/playwright)

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Use `data-testid` attributes for test selectors
3. Follow existing test patterns
4. Run tests locally before committing
5. Ensure tests pass in CI

## License

MIT
