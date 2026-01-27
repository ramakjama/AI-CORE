# AI-CORE: Guia de Desarrollo

## Estandares de Codigo

### Estructura de Archivos

```
src/
├── modules/              # Feature modules (dominio)
│   └── policy/
│       ├── policy.module.ts
│       ├── policy.controller.ts
│       ├── policy.service.ts
│       ├── policy.repository.ts
│       ├── dto/
│       │   ├── create-policy.dto.ts
│       │   └── update-policy.dto.ts
│       ├── entities/
│       │   └── policy.entity.ts
│       └── __tests__/
│           ├── policy.service.spec.ts
│           └── policy.e2e.spec.ts
│
├── common/               # Shared utilities
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
│
├── config/               # Configuration
│   └── configuration.ts
│
└── main.ts              # Entry point
```

### Convenciones de Nombrado

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Archivos | kebab-case | `create-policy.dto.ts` |
| Clases | PascalCase | `PolicyService` |
| Interfaces | PascalCase con I prefix | `IPolicy`, `IUserRepository` |
| Types | PascalCase | `PolicyStatus` |
| Variables | camelCase | `policyCount` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Funciones | camelCase | `calculatePremium()` |
| Eventos | dot.notation | `policy.created` |

### TypeScript Guidelines

```typescript
// =============================================================================
// IMPORTS: Ordenar por tipo
// =============================================================================

// 1. Node.js built-ins
import { EventEmitter } from 'events';
import { readFile } from 'fs/promises';

// 2. External dependencies
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

// 3. Internal modules (absolute imports)
import { DatabaseService } from '@/common/database';
import { LoggerService } from '@/common/logger';

// 4. Relative imports
import { CreatePolicyDto } from './dto/create-policy.dto';
import { PolicyEntity } from './entities/policy.entity';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

// Prefer interfaces for object shapes
interface IPolicy {
  id: string;
  customerId: string;
  type: PolicyType;
  status: PolicyStatus;
  premium: number;
  createdAt: Date;
  updatedAt: Date;
}

// Use type for unions, intersections, and aliases
type PolicyType = 'auto' | 'home' | 'life' | 'health';
type PolicyStatus = 'draft' | 'active' | 'suspended' | 'cancelled';

// Use const assertions for literal types
const POLICY_STATUSES = ['draft', 'active', 'suspended', 'cancelled'] as const;
type PolicyStatus = (typeof POLICY_STATUSES)[number];

// =============================================================================
// CLASSES
// =============================================================================

@Injectable()
export class PolicyService {
  // Private readonly fields first
  private readonly logger = new Logger(PolicyService.name);
  private readonly MAX_POLICIES_PER_CUSTOMER = 10;

  // Constructor with dependency injection
  constructor(
    private readonly repository: PolicyRepository,
    private readonly eventEmitter: EventEmitter,
    private readonly cacheService: CacheService,
  ) {}

  // Public methods
  async create(dto: CreatePolicyDto): Promise<IPolicy> {
    this.logger.log(`Creating policy for customer: ${dto.customerId}`);

    // Early returns for validation
    if (!this.isValidCustomer(dto.customerId)) {
      throw new BadRequestException('Invalid customer');
    }

    const policy = await this.repository.create(dto);

    // Emit domain event
    this.eventEmitter.emit('policy.created', { policy });

    return policy;
  }

  // Private methods at the bottom
  private isValidCustomer(customerId: string): boolean {
    return !!customerId && customerId.length > 0;
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Custom exceptions
export class PolicyNotFoundException extends NotFoundException {
  constructor(policyId: string) {
    super(`Policy with ID ${policyId} not found`);
    this.name = 'PolicyNotFoundException';
  }
}

// Result pattern for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function findPolicy(id: string): Promise<Result<IPolicy>> {
  try {
    const policy = await repository.findById(id);
    if (!policy) {
      return { success: false, error: new PolicyNotFoundException(id) };
    }
    return { success: true, data: policy };
  } catch (error) {
    return { success: false, error };
  }
}
```

### Zod Validation Schemas

```typescript
import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().toLowerCase();
const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);
const moneySchema = z.number().nonnegative().multipleOf(0.01);
const dateSchema = z.string().datetime();

// =============================================================================
// DOMAIN SCHEMAS
// =============================================================================

export const CreatePolicySchema = z.object({
  customerId: uuidSchema,
  type: z.enum(['auto', 'home', 'life', 'health']),
  coverage: z.object({
    amount: moneySchema.max(10_000_000),
    deductible: moneySchema,
  }),
  startDate: dateSchema,
  endDate: dateSchema,
  beneficiaries: z.array(z.object({
    name: z.string().min(2).max(100),
    relationship: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
}).refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  data => !data.beneficiaries ||
    data.beneficiaries.reduce((sum, b) => sum + b.percentage, 0) === 100,
  { message: 'Beneficiary percentages must sum to 100', path: ['beneficiaries'] }
);

export type CreatePolicyDto = z.infer<typeof CreatePolicySchema>;

// =============================================================================
// VALIDATION PIPE
// =============================================================================

import { PipeTransform, BadRequestException } from '@nestjs/common';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: z.ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
```

## Testing

### Estructura de Tests

```
__tests__/
├── unit/                    # Unit tests (*.spec.ts)
├── integration/             # Integration tests (*.int.spec.ts)
├── e2e/                     # End-to-end tests (*.e2e.spec.ts)
└── fixtures/                # Test data
    ├── policies.fixture.ts
    └── users.fixture.ts
```

### Unit Tests

```typescript
// policy.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from '../policy.service';
import { PolicyRepository } from '../policy.repository';
import { createMockPolicy, createMockPolicyDto } from './fixtures';

describe('PolicyService', () => {
  let service: PolicyService;
  let repository: jest.Mocked<PolicyRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: PolicyRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    repository = module.get(PolicyRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a policy successfully', async () => {
      // Arrange
      const dto = createMockPolicyDto();
      const expectedPolicy = createMockPolicy();
      repository.create.mockResolvedValue(expectedPolicy);

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result).toEqual(expectedPolicy);
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid customer', async () => {
      // Arrange
      const dto = createMockPolicyDto({ customerId: '' });

      // Act & Assert
      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return policy when found', async () => {
      const policy = createMockPolicy();
      repository.findById.mockResolvedValue(policy);

      const result = await service.findById(policy.id);

      expect(result).toEqual(policy);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
```

### Integration Tests

```typescript
// policy.repository.int.spec.ts
import { PrismaClient } from '@prisma/client';
import { PolicyRepository } from '../policy.repository';
import { cleanupDatabase, seedTestData } from './helpers';

describe('PolicyRepository (Integration)', () => {
  let prisma: PrismaClient;
  let repository: PolicyRepository;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    await prisma.$connect();
    repository = new PolicyRepository(prisma);
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);
    await seedTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should persist policy to database', async () => {
      const dto = {
        customerId: 'test-customer-id',
        type: 'auto',
        premium: 1000,
      };

      const policy = await repository.create(dto);

      expect(policy.id).toBeDefined();
      expect(policy.type).toBe('auto');

      // Verify in database
      const dbPolicy = await prisma.policy.findUnique({
        where: { id: policy.id },
      });
      expect(dbPolicy).not.toBeNull();
    });
  });
});
```

### E2E Tests

```typescript
// policy.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Policy API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    authToken = authResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /policies', () => {
    it('should create a new policy', () => {
      return request(app.getHttpServer())
        .post('/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: 'customer-uuid',
          type: 'auto',
          coverage: { amount: 50000, deductible: 500 },
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2025-01-01T00:00:00Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.type).toBe('auto');
          expect(res.body.status).toBe('draft');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/policies')
        .send({ type: 'auto' })
        .expect(401);
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/policies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'invalid-type' })
        .expect(400);
    });
  });
});
```

### Test Fixtures

```typescript
// fixtures/policy.fixture.ts
import { faker } from '@faker-js/faker';
import { IPolicy, CreatePolicyDto } from '../types';

export function createMockPolicy(overrides: Partial<IPolicy> = {}): IPolicy {
  return {
    id: faker.string.uuid(),
    customerId: faker.string.uuid(),
    type: 'auto',
    status: 'draft',
    premium: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    coverage: {
      amount: faker.number.int({ min: 10000, max: 1000000 }),
      deductible: faker.number.int({ min: 100, max: 5000 }),
    },
    startDate: faker.date.future(),
    endDate: faker.date.future({ years: 1 }),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPolicyDto(
  overrides: Partial<CreatePolicyDto> = {}
): CreatePolicyDto {
  return {
    customerId: faker.string.uuid(),
    type: 'auto',
    coverage: {
      amount: 50000,
      deductible: 500,
    },
    startDate: faker.date.future().toISOString(),
    endDate: faker.date.future({ years: 1 }).toISOString(),
    ...overrides,
  };
}
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

## IDE Setup

### VS Code Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker",
    "github.copilot",
    "eamodio.gitlens",
    "vitest.explorer"
  ]
}
```

### VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "eslint.validate": ["javascript", "typescript"],
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.turbo": true,
    "**/coverage": true
  }
}
```

## Git Workflow

### Branch Naming

```
+------------------------------------------------------------------+
|                      Branch Naming Convention                     |
+------------------------------------------------------------------+
|                                                                  |
|  feature/AI-123-add-policy-endpoint                              |
|  bugfix/AI-456-fix-auth-token                                    |
|  hotfix/AI-789-critical-security-patch                           |
|  refactor/AI-101-clean-up-services                               |
|  docs/AI-202-update-api-docs                                     |
|  chore/AI-303-upgrade-dependencies                               |
|                                                                  |
|  Format: <type>/<ticket-id>-<short-description>                  |
|                                                                  |
+------------------------------------------------------------------+
```

### Commit Messages

```
+------------------------------------------------------------------+
|                    Conventional Commits                           |
+------------------------------------------------------------------+
|                                                                  |
|  Format:                                                         |
|  <type>(<scope>): <subject>                                      |
|                                                                  |
|  <body>                                                          |
|                                                                  |
|  <footer>                                                        |
|                                                                  |
+------------------------------------------------------------------+

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting, missing semicolons, etc.
- refactor: Code change that neither fixes a bug nor adds a feature
- perf:     Performance improvement
- test:     Adding missing tests
- chore:    Maintenance tasks

Examples:
+------------------------------------------------------------------+
feat(policy): add coverage calculation endpoint

Implement premium calculation based on risk factors.
Includes validation for coverage limits.

Closes AI-123
+------------------------------------------------------------------+
fix(auth): resolve token refresh race condition

Tokens were being refreshed multiple times when multiple
requests failed simultaneously. Added mutex lock to prevent
concurrent refreshes.

Fixes AI-456
+------------------------------------------------------------------+
```

### Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged

// .lintstagedrc.js
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml}': ['prettier --write'],
  '*.prisma': ['prisma format'],
};
```

## Documentation Standards

### Code Comments

```typescript
/**
 * Calculates the premium for a policy based on risk factors.
 *
 * @description
 * The premium is calculated using the base rate multiplied by
 * risk multipliers for age, location, and claims history.
 *
 * @param policy - The policy to calculate premium for
 * @param customer - The customer associated with the policy
 * @returns The calculated annual premium
 *
 * @throws {ValidationError} If policy or customer data is incomplete
 *
 * @example
 * ```typescript
 * const premium = calculatePremium(policy, customer);
 * console.log(`Annual premium: $${premium}`);
 * ```
 */
function calculatePremium(policy: IPolicy, customer: ICustomer): number {
  // Implementation
}
```

### API Documentation

```typescript
// Use OpenAPI/Swagger decorators
@ApiTags('policies')
@Controller('policies')
export class PolicyController {

  @Post()
  @ApiOperation({ summary: 'Create a new policy' })
  @ApiBody({ type: CreatePolicyDto })
  @ApiResponse({ status: 201, description: 'Policy created', type: PolicyDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreatePolicyDto): Promise<PolicyDto> {
    return this.service.create(dto);
  }
}
```

## Performance Guidelines

### Database Queries

```typescript
// BAD: N+1 query problem
const policies = await prisma.policy.findMany();
for (const policy of policies) {
  const customer = await prisma.customer.findUnique({
    where: { id: policy.customerId },
  });
}

// GOOD: Include related data
const policies = await prisma.policy.findMany({
  include: { customer: true },
});

// GOOD: Select only needed fields
const policies = await prisma.policy.findMany({
  select: {
    id: true,
    type: true,
    customer: {
      select: { name: true, email: true },
    },
  },
});
```

### Caching Patterns

```typescript
// Cache-aside pattern
async getPolicy(id: string): Promise<IPolicy> {
  const cacheKey = `policy:${id}`;

  // 1. Check cache
  const cached = await this.cache.get<IPolicy>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Query database
  const policy = await this.repository.findById(id);
  if (!policy) {
    throw new NotFoundException();
  }

  // 3. Store in cache
  await this.cache.set(cacheKey, policy, { ttl: 3600 });

  return policy;
}

// Cache invalidation on update
async updatePolicy(id: string, dto: UpdatePolicyDto): Promise<IPolicy> {
  const policy = await this.repository.update(id, dto);

  // Invalidate cache
  await this.cache.del(`policy:${id}`);

  // Invalidate related caches
  await this.cache.del(`customer:${policy.customerId}:policies`);

  return policy;
}
```

## Referencias

- [Getting Started](./getting-started.md)
- [Deployment Guide](./deployment.md)
- [Architecture Overview](../architecture/overview.md)
