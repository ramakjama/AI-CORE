# AIT-CORE Soriano - Test Suite Documentation

## Overview

This document provides comprehensive information about the testing infrastructure for the AIT-CORE Soriano project. Our test suite is designed to ensure code quality, reliability, and maintainability across all modules and agents.

## Table of Contents

1. [Test Stack](#test-stack)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)

## Test Stack

### Core Testing Frameworks
- **Jest**: Unit and integration testing framework
- **Playwright**: End-to-end testing
- **React Testing Library**: Frontend component testing
- **Supertest**: API endpoint testing
- **ts-jest**: TypeScript support for Jest

### Supporting Tools
- **@testing-library/jest-dom**: Custom Jest matchers
- **@testing-library/user-event**: User interaction simulation
- **jest-mock**: Advanced mocking capabilities
- **Docker Compose**: Test environment orchestration

## Test Structure

```
ait-core-soriano/
├── test/                              # Shared test utilities
│   ├── setup.ts                       # Jest setup for unit tests
│   ├── setup-integration.ts           # Setup for integration tests
│   ├── global-setup.ts                # Global test environment setup
│   ├── global-teardown.ts             # Global test cleanup
│   ├── utils/
│   │   ├── test-helpers.ts            # Common test utilities
│   │   └── nestjs-test-helpers.ts     # NestJS-specific helpers
│   └── mocks/
│       └── factories/                 # Test data factories
│           ├── user.factory.ts
│           ├── accounting-entry.factory.ts
│           └── insurance-policy.factory.ts
├── e2e/                               # End-to-end tests
│   ├── auth.e2e.spec.ts
│   └── dashboard.e2e.spec.ts
├── modules/                           # Module-specific tests
│   └── */src/**/*.spec.ts             # Unit tests alongside source
├── apps/
│   ├── api/test/                      # API integration tests
│   │   ├── auth.integration.spec.ts
│   │   └── accountant.integration.spec.ts
│   └── web/
│       ├── src/**/*.spec.tsx          # Component tests
│       └── jest.setup.js              # Web-specific setup
├── agents/                            # Agent tests
│   └── */src/**/*.spec.ts             # Agent unit tests
├── jest.config.js                     # Root Jest configuration
├── jest.config.integration.js         # Integration test config
├── playwright.config.ts               # Playwright configuration
└── docker-compose.test.yml            # Test environment services
```

## Running Tests

### All Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### Unit Tests
```bash
# Run unit tests only
pnpm test:unit

# Run unit tests for specific module
pnpm test modules/01-core-business/ai-accountant

# Run unit tests in watch mode
pnpm test:unit:watch
```

### Integration Tests
```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pnpm test:integration

# Stop test environment
docker-compose -f docker-compose.test.yml down -v
```

### E2E Tests
```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run E2E tests in headed mode
pnpm test:e2e:headed

# Generate E2E test report
pnpm test:e2e:report
```

### Component Tests
```bash
# Run frontend component tests
pnpm test:components

# Run component tests in watch mode
cd apps/web && pnpm test:watch
```

### Coverage
```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Tests

Unit tests should be placed alongside the source files with the `.spec.ts` or `.spec.tsx` extension.

**Example: Service Unit Test**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AccountantService } from './accountant.service';
import { createMockRepository } from '../../../../test/utils/test-helpers';

describe('AccountantService', () => {
  let service: AccountantService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountantService,
        { provide: 'Repository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AccountantService>(AccountantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an entry', async () => {
    const createDto = { description: 'Test', amount: 100 };
    mockRepository.save.mockResolvedValue({ id: '1', ...createDto });

    const result = await service.createEntry(createDto);

    expect(result).toHaveProperty('id');
    expect(result.description).toBe(createDto.description);
  });
});
```

### Integration Tests

Integration tests should be placed in the `apps/api/test/` directory.

**Example: API Integration Test**
```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestingApp } from '../../../test/utils/nestjs-test-helpers';

describe('Auth API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestingApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login should authenticate user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
  });
});
```

### E2E Tests

E2E tests should be placed in the `e2e/` directory.

**Example: E2E Test**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should display dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
```

### Component Tests

Component tests should be placed alongside components.

**Example: Component Test**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('should render and handle click', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Coverage Requirements

We enforce the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/lcov-report/index.html

# View console summary
pnpm test:coverage --verbose
```

### Coverage Exclusions

The following are excluded from coverage:
- `*.d.ts` files
- `*.config.js/ts` files
- `*.stories.tsx` files
- `__tests__` directories
- `dist/` and `build/` directories
- `node_modules/`

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks

```typescript
describe('UserService', () => {
  describe('create', () => {
    it('should create user with valid data', () => {});
    it('should throw error when email exists', () => {});
  });
});
```

### 2. Test Organization
- One test file per source file
- Place tests in `__tests__` directory or alongside source
- Group tests logically with nested `describe` blocks

### 3. Mocking
- Use factories for test data generation
- Mock external dependencies
- Reset mocks between tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 4. Assertions
- One logical assertion per test
- Use specific matchers
- Provide meaningful failure messages

```typescript
expect(result).toHaveProperty('id');
expect(result.status).toBe('active');
expect(Array.isArray(result.items)).toBe(true);
```

### 5. Test Data
- Use factories for consistent test data
- Avoid hard-coded magic values
- Create reusable test fixtures

```typescript
const user = UserFactory.create({ role: 'admin' });
const users = UserFactory.createMany(5);
```

### 6. Async Testing
- Always use async/await for async tests
- Handle promise rejections properly
- Set appropriate timeouts

```typescript
it('should process async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

## CI/CD Integration

### GitHub Actions

Our test suite runs automatically on:
- Pull requests
- Pushes to main branch
- Nightly builds

**Workflow Example:**
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Tests run automatically before commits using Husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:changed",
      "pre-push": "pnpm test"
    }
  }
}
```

## Troubleshooting

### Common Issues

**1. Tests Timeout**
```bash
# Increase Jest timeout
jest.setTimeout(30000);

# Or in test file
it('long test', async () => {}, 30000);
```

**2. Database Connection Issues**
```bash
# Ensure test database is running
docker-compose -f docker-compose.test.yml up -d

# Check connection
docker-compose -f docker-compose.test.yml ps
```

**3. Port Conflicts**
```bash
# Change test ports in docker-compose.test.yml
# PostgreSQL: 5433
# Redis: 6380
# Kafka: 9093
```

**4. Flaky Tests**
- Add explicit waits
- Mock time-dependent operations
- Isolate test data

### Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug with VSCode
# Use launch.json configuration
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## Support

For questions or issues:
- Check existing tests for examples
- Review this documentation
- Contact the development team
- Create an issue in the project repository
