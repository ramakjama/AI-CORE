# Testing Quick Start Guide

Get up and running with the test suite in 5 minutes!

## Prerequisites

Ensure you have installed:
- Node.js 20+
- pnpm 8+
- Docker Desktop (for integration tests)

## Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Install Playwright browsers (for E2E tests)
npx playwright install
```

## Run Your First Tests

### Unit Tests (Fastest - ~15 seconds)

```bash
# Run all unit tests
pnpm test:unit

# Run in watch mode (auto-rerun on file changes)
pnpm test:unit:watch

# Run specific test file
pnpm test modules/01-core-business/ai-accountant/src/services/accountant.service.spec.ts
```

### Integration Tests (~1 minute)

```bash
# 1. Start test services (first time only, or after restart)
pnpm docker:test:up

# 2. Run integration tests
pnpm test:integration

# 3. Stop test services (when done)
pnpm docker:test:down
```

### E2E Tests (~3-5 minutes)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI (interactive mode - recommended for development)
pnpm test:e2e:ui

# Run in headed mode (see the browser)
pnpm test:e2e:headed

# View test report
pnpm test:e2e:report
```

### Component Tests (~10 seconds)

```bash
# Run frontend component tests
pnpm test:components

# Or run from web app directory
cd apps/web
pnpm test
```

## View Coverage

```bash
# Generate coverage report for all tests
pnpm test:coverage

# Open HTML coverage report (Windows)
start coverage/lcov-report/index.html

# Or (macOS/Linux)
open coverage/lcov-report/index.html
```

## Common Commands

```bash
# Run ALL tests (unit + integration + e2e)
pnpm test:all

# Run only tests affected by your changes
pnpm test:changed

# Run tests as they run in CI
pnpm test:ci

# Run in watch mode (best for development)
pnpm test:watch
```

## Writing Your First Test

### 1. Create a test file

Place it next to the source file with `.spec.ts` or `.spec.tsx` extension:

```
src/
  services/
    user.service.ts
    user.service.spec.ts  ← Your test file
```

### 2. Write a simple test

```typescript
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const userData = { email: 'test@example.com', name: 'Test User' };
    const result = await service.create(userData);

    expect(result).toHaveProperty('id');
    expect(result.email).toBe(userData.email);
  });
});
```

### 3. Run your test

```bash
pnpm test user.service.spec.ts
```

## Using Test Utilities

### Generate test data with factories

```typescript
import { UserFactory } from '../test/mocks/factories/user.factory';

// Create a user
const user = UserFactory.create();

// Create an admin
const admin = UserFactory.createAdmin();

// Create 5 users
const users = UserFactory.createMany(5);
```

### Mock repositories

```typescript
import { createMockRepository } from '../test/utils/test-helpers';

const mockRepo = createMockRepository<User>();
mockRepo.findOne.mockResolvedValue(user);
mockRepo.save.mockResolvedValue(savedUser);
```

### Test API endpoints

```typescript
import * as request from 'supertest';

it('should login user', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'test@example.com', password: 'password' })
    .expect(200);

  expect(response.body).toHaveProperty('accessToken');
});
```

## Development Workflow

### TDD (Test-Driven Development)

1. **Write test first** (it will fail)
```typescript
it('should calculate premium', () => {
  const premium = service.calculatePremium(30, 100000);
  expect(premium).toBeGreaterThan(0);
});
```

2. **Run test** - See it fail
```bash
pnpm test:watch  # Leave this running
```

3. **Write implementation**
```typescript
calculatePremium(age: number, coverage: number): number {
  return coverage * 0.01 * (age / 100);
}
```

4. **See test pass** automatically (watch mode)

5. **Refactor** if needed (tests ensure you don't break anything)

### Normal Development

1. **Write code**
2. **Write tests** for new functionality
3. **Run tests** to verify
```bash
pnpm test:changed  # Only runs tests for files you changed
```
4. **Commit** (tests run automatically via pre-commit hook)

## Troubleshooting

### Tests are failing

```bash
# Run specific test with more details
pnpm test user.service.spec.ts --verbose

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand user.service.spec.ts
```

### "Cannot find module" error

```bash
# Clear Jest cache
pnpm test --clearCache

# Reinstall dependencies
pnpm install
```

### Docker services not starting

```bash
# Check if ports are already in use
docker ps

# Stop all containers
docker stop $(docker ps -q)

# Restart test services
pnpm docker:test:down
pnpm docker:test:up
```

### Playwright tests failing

```bash
# Reinstall browsers
npx playwright install --force

# Run in headed mode to see what's happening
pnpm test:e2e:headed
```

## Best Practices Checklist

✅ **Write tests for new features**
✅ **Run tests before committing**
✅ **Use factories for test data**
✅ **Mock external dependencies**
✅ **One assertion per test (when possible)**
✅ **Descriptive test names**
✅ **Clean up in afterEach**

## Key Files to Know

```
ait-core-soriano/
├── jest.config.js              # Main test config
├── test/
│   ├── README.md               # Detailed utilities guide
│   ├── utils/
│   │   ├── test-helpers.ts     # Generic helpers
│   │   └── nestjs-test-helpers.ts  # NestJS helpers
│   └── mocks/
│       └── factories/          # Test data factories
├── e2e/                        # E2E tests
├── TEST_DOCUMENTATION.md       # Complete testing guide
└── TEST_COVERAGE_REPORT.md     # Coverage tracking
```

## Next Steps

1. ✅ **Run your first test** - Try the examples above
2. 📖 **Read [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)** - Comprehensive guide
3. 🔍 **Explore existing tests** - See patterns in action
4. ✍️ **Write tests for your feature** - Follow TDD
5. 📊 **Check coverage** - `pnpm test:coverage`

## Getting Help

- 📖 Read [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)
- 📋 Check [test/README.md](./test/README.md) for utilities
- 👀 Look at existing test files for examples
- 💬 Ask the development team
- 🐛 Open an issue on GitHub

## Quick Reference

| Command | What it does | Speed |
|---------|--------------|-------|
| `pnpm test:unit` | Run unit tests | ⚡ Fast (~15s) |
| `pnpm test:integration` | Run integration tests | 🐢 Slow (~1m) |
| `pnpm test:e2e` | Run E2E tests | 🐢🐢 Slower (~5m) |
| `pnpm test:watch` | Run tests on file change | ⚡ Fast |
| `pnpm test:coverage` | Generate coverage report | 🐢 Slow (~30s) |
| `pnpm test:changed` | Run tests for changed files | ⚡ Fast |

---

**Ready to start testing?** Run `pnpm test:unit` right now! 🚀
