# Test Suite - AIT-CORE Soriano

Welcome to the comprehensive test suite for AIT-CORE Soriano. This directory contains shared test utilities, mocks, and configurations used across all test types.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

## Directory Structure

```
test/
├── README.md                          # This file
├── setup.ts                           # Jest setup for unit tests
├── setup-integration.ts               # Setup for integration tests
├── global-setup.ts                    # Global test environment setup
├── global-teardown.ts                 # Global test cleanup
├── utils/                             # Test utilities
│   ├── test-helpers.ts                # Generic test utilities
│   └── nestjs-test-helpers.ts         # NestJS-specific helpers
└── mocks/                             # Mock data and factories
    └── factories/                     # Data factories
        ├── user.factory.ts
        ├── accounting-entry.factory.ts
        └── insurance-policy.factory.ts
```

## Test Utilities

### Generic Helpers (`test-helpers.ts`)

#### `createMockRepository<T>()`
Creates a mock TypeORM repository with all common methods pre-mocked.

```typescript
import { createMockRepository } from '../test/utils/test-helpers';

const mockRepo = createMockRepository<User>();
mockRepo.findOne.mockResolvedValue(user);
```

#### `randomString(length: number)`
Generates a random string of specified length.

```typescript
const id = randomString(10); // "a3k9d2m5p1"
```

#### `randomEmail()`
Generates a random test email address.

```typescript
const email = randomEmail(); // "test-a3k9d2m5p1@example.com"
```

#### `randomUUID()`
Generates a random UUID for testing.

```typescript
const id = randomUUID(); // "550e8400-e29b-41d4-a716-446655440000"
```

#### `mockJwtToken(payload: any)`
Creates a mock JWT token for authentication testing.

```typescript
const token = mockJwtToken({ userId: '123', role: 'admin' });
```

#### `mockRequest(overrides: any)`
Creates a mock Express request object.

```typescript
const req = mockRequest({
  body: { email: 'test@example.com' },
  user: { id: '123' }
});
```

#### `mockResponse()`
Creates a mock Express response object.

```typescript
const res = mockResponse();
await handler(req, res);
expect(res.json).toHaveBeenCalled();
```

#### `waitFor(condition, timeout, interval)`
Waits for a condition to be true with timeout.

```typescript
await waitFor(() => element.isVisible(), 5000, 100);
```

### NestJS Helpers (`nestjs-test-helpers.ts`)

#### `createTestingModule()`
Creates a NestJS testing module with common configuration.

```typescript
import { createTestingModule } from '../test/utils/nestjs-test-helpers';

const module = await createTestingModule(
  [AuthModule],              // imports
  [AuthService],             // providers
  [AuthController]           // controllers
);
```

#### `MockConfigService`
Mock implementation of NestJS ConfigService.

```typescript
const mockConfig = new MockConfigService();
mockConfig.set('JWT_SECRET', 'test-secret');
```

#### `MockLogger`
Mock implementation of NestJS Logger.

```typescript
const mockLogger = new MockLogger();
expect(mockLogger.error).toHaveBeenCalled();
```

#### `MockCacheManager`
Mock implementation of NestJS Cache Manager.

```typescript
const cache = new MockCacheManager();
await cache.set('key', 'value');
const value = await cache.get('key');
```

## Data Factories

### User Factory

```typescript
import { UserFactory } from '../test/mocks/factories/user.factory';

// Create single user
const user = UserFactory.create();

// Create with specific attributes
const admin = UserFactory.create({ role: 'admin' });

// Create multiple users
const users = UserFactory.createMany(5);

// Create specific types
const adminUser = UserFactory.createAdmin();
const unverifiedUser = UserFactory.createUnverified();
const mfaUser = UserFactory.createWithMfa();
```

### Accounting Entry Factory

```typescript
import { AccountingEntryFactory } from '../test/mocks/factories/accounting-entry.factory';

// Create entry
const entry = AccountingEntryFactory.create();

// Create specific types
const debit = AccountingEntryFactory.createDebit();
const credit = AccountingEntryFactory.createCredit();
const approved = AccountingEntryFactory.createApproved();

// Create balanced entries
const [debitEntry, creditEntry] = AccountingEntryFactory.createBalanced();
```

### Insurance Policy Factory

```typescript
import { InsurancePolicyFactory } from '../test/mocks/factories/insurance-policy.factory';

// Create policy
const policy = InsurancePolicyFactory.create();

// Create specific types
const vidaPolicy = InsurancePolicyFactory.createVida();
const saludPolicy = InsurancePolicyFactory.createSalud();
const autosPolicy = InsurancePolicyFactory.createAutos();

// Create with status
const active = InsurancePolicyFactory.createActive();
const expired = InsurancePolicyFactory.createExpired();
```

## Setup Files

### Unit Test Setup (`setup.ts`)

Configures the environment for unit tests:
- Loads environment variables
- Sets up global test timeout
- Mocks console methods
- Configures date mocking
- Clears mocks between tests

### Integration Test Setup (`setup-integration.ts`)

Configures the environment for integration tests:
- Initializes test database
- Connects to Redis
- Manages database cleanup
- Handles test isolation

### Global Setup (`global-setup.ts`)

Runs once before all tests:
- Starts Docker containers for test services
- Waits for services to be ready
- Validates test environment

### Global Teardown (`global-teardown.ts`)

Runs once after all tests:
- Stops Docker containers
- Cleans up test data
- Removes temporary files

## Environment Variables

Create a `.env.test` file in the root directory:

```env
NODE_ENV=test
JWT_SECRET=test-secret-key
DATABASE_URL=postgresql://test:test@localhost:5433/test_ait_core
REDIS_URL=redis://localhost:6380
KAFKA_BROKERS=localhost:9093
```

## Docker Test Services

Start test services:

```bash
docker-compose -f docker-compose.test.yml up -d
```

Stop test services:

```bash
docker-compose -f docker-compose.test.yml down -v
```

## Best Practices

### 1. Use Factories for Test Data
```typescript
// ✅ Good
const user = UserFactory.create({ email: 'test@example.com' });

// ❌ Bad
const user = {
  id: '123',
  email: 'test@example.com',
  password: 'hashed',
  // ... many more fields
};
```

### 2. Mock External Dependencies
```typescript
// ✅ Good
const mockRepo = createMockRepository<User>();
mockRepo.findOne.mockResolvedValue(user);

// ❌ Bad
// Testing with real database in unit tests
```

### 3. Clear Mocks Between Tests
```typescript
// ✅ Good
afterEach(() => {
  jest.clearAllMocks();
});

// ❌ Bad
// Letting mocks persist between tests
```

### 4. Use Descriptive Test Names
```typescript
// ✅ Good
it('should throw ConflictException when email already exists', () => {});

// ❌ Bad
it('test create user', () => {});
```

### 5. Test One Thing at a Time
```typescript
// ✅ Good
it('should hash password', async () => {
  // Test only password hashing
});

it('should create user record', async () => {
  // Test only user creation
});

// ❌ Bad
it('should hash password and create user and send email', async () => {
  // Testing too many things
});
```

## Common Patterns

### Testing Async Functions
```typescript
it('should handle async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});
```

### Testing Error Cases
```typescript
it('should throw error for invalid input', async () => {
  await expect(service.create(invalidData))
    .rejects
    .toThrow(BadRequestException);
});
```

### Testing with Mocks
```typescript
it('should call repository with correct params', async () => {
  await service.create(data);

  expect(mockRepo.save).toHaveBeenCalledWith(
    expect.objectContaining({
      email: data.email
    })
  );
});
```

### Testing Conditionals
```typescript
it('should lock account after 5 failed attempts', async () => {
  user.failedLoginAttempts = 4;

  await service.incrementFailedAttempts(user.id);

  expect(mockRepo.update).toHaveBeenCalledWith(
    user.id,
    expect.objectContaining({
      lockedUntil: expect.any(Date)
    })
  );
});
```

## Troubleshooting

### Tests are slow
- Use `jest.setTimeout(30000)` to increase timeout
- Run tests in parallel: `jest --maxWorkers=4`
- Mock expensive operations

### Database tests failing
- Ensure Docker services are running
- Check DATABASE_URL environment variable
- Verify database migrations are applied

### Mocks not working
- Clear mocks with `jest.clearAllMocks()` in `afterEach`
- Reset modules with `jest.resetModules()`
- Check mock implementation

### Coverage not accurate
- Exclude config files in jest.config.js
- Use `--coverage` flag
- Check `collectCoverageFrom` patterns

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Test Coverage Documentation](../TEST_COVERAGE_REPORT.md)
- [Full Test Documentation](../TEST_DOCUMENTATION.md)

## Support

For questions or issues:
- Review examples in existing tests
- Check the main test documentation
- Contact the development team
- Open an issue on GitHub
