# AIT-CORE SORIANO - Development Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Module Development](#module-development)
6. [Agent Development](#agent-development)
7. [Testing](#testing)
8. [Database & Prisma](#database--prisma)
9. [API Development](#api-development)
10. [Frontend Development](#frontend-development)

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker 24+
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Clone repository
git clone https://github.com/aintech/ait-core-soriano.git
cd ait-core-soriano

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start infrastructure
pnpm docker:up

# Run migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start development servers
pnpm dev
```

### VS Code Extensions

Recommended extensions:
- ESLint
- Prettier
- Prisma
- TypeScript Vue Plugin (Volar)
- GitLens
- Thunder Client (API testing)
- Docker

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

---

## Project Structure

```
ait-core-soriano/
├── apps/                           # Applications
│   ├── api/                        # NestJS API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── config/
│   │   │   ├── modules/
│   │   │   └── common/
│   │   ├── test/
│   │   └── package.json
│   ├── web/                        # Next.js Web App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   └── admin/                      # Next.js Admin Panel
│
├── modules/                        # 57 Modules
│   ├── 01-core-business/
│   │   ├── ai-accountant/
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── models/
│   │   │   │   └── dto/
│   │   │   ├── tests/
│   │   │   ├── module.config.json
│   │   │   └── package.json
│   │   └── ...
│   └── ...
│
├── agents/                         # 16 AI Agents
│   ├── interfaces.ts               # Base interfaces
│   ├── specialists/
│   │   ├── insurance-specialist/
│   │   │   ├── src/
│   │   │   │   └── index.ts
│   │   │   ├── prompts/
│   │   │   ├── agent.config.json
│   │   │   └── package.json
│   │   └── ...
│   └── executors/
│
├── libs/                           # Shared Libraries
│   ├── shared/                     # Common utilities
│   ├── database/                   # Prisma schemas
│   ├── kafka/                      # Kafka client
│   ├── auth/                       # Auth utilities
│   └── ui/                         # UI components
│
├── scripts/                        # Utility scripts
│   ├── modules-list.js
│   ├── modules-enable.js
│   └── ...
│
├── k8s/                            # Kubernetes manifests
├── .github/workflows/              # CI/CD
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

---

## Development Workflow

### Branch Strategy

**Main Branches**:
- `main`: Production-ready code
- `develop`: Integration branch for features
- `staging`: Pre-production testing

**Feature Branches**:
- `feature/module-name`: New modules
- `feature/agent-name`: New agents
- `feature/description`: New features
- `fix/bug-description`: Bug fixes
- `refactor/description`: Code refactoring
- `docs/description`: Documentation updates

### Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/new-module

# 2. Make changes
# ... code ...

# 3. Commit changes
git add .
git commit -m "feat(module): add new module"

# 4. Push to remote
git push origin feature/new-module

# 5. Create Pull Request on GitHub
# ... review process ...

# 6. Merge to develop
# ... after approval ...

# 7. Delete feature branch
git branch -d feature/new-module
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(accountant): add balance sheet report
fix(auth): resolve token refresh issue
docs(api): update API documentation
refactor(crm): optimize contact query
test(insurance): add unit tests for vida module
```

---

## Coding Standards

### TypeScript Style Guide

**General Principles**:
- Use TypeScript strict mode
- Explicit types over implicit
- Prefer interfaces over type aliases for objects
- Use enums for constants
- No `any` types (use `unknown` if necessary)

**Naming Conventions**:
```typescript
// Files: kebab-case
// user-service.ts, account-controller.ts

// Classes: PascalCase
class UserService {}
class AccountController {}

// Interfaces: PascalCase with "I" prefix (optional)
interface User {}
interface IUserRepository {}

// Functions: camelCase
function getUserById() {}
async function createAccount() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Variables: camelCase
const userId = 123;
const accountBalance = 1000.50;
```

**Code Examples**:

Good:
```typescript
interface CreateUserDto {
  name: string;
  email: string;
  age?: number;
}

class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(dto);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
```

Bad:
```typescript
// Missing types
function createUser(dto) {
  return repository.create(dto);
}

// Using any
function processData(data: any) {
  return data.map(x => x.value);
}

// Inconsistent naming
const UserID = 123;
function Get_User() {}
```

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

---

## Module Development

### Creating a New Module

```bash
# Generate from template
pnpm create-module --name=ai-new-module --category=core-business
```

### Module Structure

```typescript
// module.config.json
{
  "module": {
    "id": "ai-new-module",
    "name": "AI New Module",
    "version": "1.0.0",
    "category": "core-business",
    "enabled": true,
    "license": "standard"
  },
  "connector": {
    "type": "internal",
    "dependencies": ["ait-authenticator"],
    "provides": ["new-module.feature"]
  }
}
```

```typescript
// src/index.ts
import { Module } from '@nestjs/common';
import { NewModuleController } from './controllers/new-module.controller';
import { NewModuleService } from './services/new-module.service';

@Module({
  controllers: [NewModuleController],
  providers: [NewModuleService],
  exports: [NewModuleService],
})
export class NewModule {}
```

```typescript
// src/controllers/new-module.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewModuleService } from '../services/new-module.service';
import { CreateDto } from '../dto/create.dto';

@ApiTags('new-module')
@Controller('/api/v1/new-module')
export class NewModuleController {
  constructor(private readonly service: NewModuleService) {}

  @Get()
  @ApiOperation({ summary: 'List items' })
  async list() {
    return this.service.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create item' })
  async create(@Body() dto: CreateDto) {
    return this.service.create(dto);
  }
}
```

```typescript
// src/services/new-module.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ait-core/database';
import { CreateDto } from '../dto/create.dto';

@Injectable()
export class NewModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.item.findMany();
  }

  async create(dto: CreateDto) {
    return this.prisma.item.create({ data: dto });
  }
}
```

---

## Agent Development

### Creating a Specialist Agent

```typescript
// agents/specialists/new-specialist/src/index.ts
import {
  SpecialistAgent,
  AnalysisRequest,
  RecommendationRequest,
  AgentContext,
  AgentResponse,
} from '../../../interfaces';
import Anthropic from '@anthropic-ai/sdk';

export class NewSpecialist extends SpecialistAgent {
  readonly id = 'new-specialist';
  readonly name = 'New Specialist';
  readonly capabilities = {
    domain: 'New Domain',
    expertise: ['Skill 1', 'Skill 2'],
    languages: ['en', 'es'],
  };

  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  async analyze(
    request: AnalysisRequest,
    context: AgentContext
  ): Promise<AgentResponse<AnalysisResult>> {
    const systemPrompt = `You are an expert in ${this.capabilities.domain}...`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze: ${request.question}\n\nContext: ${JSON.stringify(request.context)}`,
        },
      ],
    });

    // Parse response and return structured data
    return {
      success: true,
      data: {
        summary: '...',
        findings: [],
        insights: [],
      },
      metadata: {
        agentId: this.id,
        processingTime: 1200,
        confidence: 0.85,
      },
    };
  }

  async recommend(
    request: RecommendationRequest,
    context: AgentContext
  ): Promise<AgentResponse<Recommendation[]>> {
    // Implementation
  }

  async answer(question: string, context: AgentContext): Promise<AgentResponse<string>> {
    // Implementation
  }

  async validate(proposal: any, context: AgentContext): Promise<AgentResponse<any>> {
    // Implementation
  }
}
```

---

## Testing

### Unit Tests

```typescript
// modules/ai-accountant/tests/unit/services/accountant.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AccountantService } from '../../../src/services/accountant.service';
import { PrismaService } from '@ait-core/database';

describe('AccountantService', () => {
  let service: AccountantService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountantService,
        {
          provide: PrismaService,
          useValue: {
            accountingEntry: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AccountantService>(AccountantService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEntry', () => {
    it('should create an accounting entry', async () => {
      const dto = {
        date: new Date(),
        description: 'Test entry',
        entries: [
          { account: '600', debit: 1000, credit: 0 },
          { account: '572', debit: 0, credit: 1000 },
        ],
      };

      const expected = { id: '1', ...dto };
      jest.spyOn(prisma.accountingEntry, 'create').mockResolvedValue(expected);

      const result = await service.createEntry(dto);

      expect(result).toEqual(expected);
      expect(prisma.accountingEntry.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
```

### Integration Tests

```typescript
// apps/api/test/crm.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CRM (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    token = loginResponse.body.data.tokens.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/crm/contacts (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/crm/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+34 600 123 456',
      })
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
      });
  });
});
```

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Watch mode
pnpm test:watch

# Specific file
pnpm test accountant.service.spec.ts
```

---

## Database & Prisma

### Prisma Schema

```prisma
// libs/database/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

### Creating Migrations

```bash
# Create migration
pnpm db:migrate:create --name add_user_role

# Apply migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Reset database (careful!)
pnpm db:reset

# Prisma Studio (GUI)
pnpm db:studio
```

### Using Prisma in Code

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@ait-core/database';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

---

## API Development

### Controller Best Practices

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto';

@ApiTags('users')
@Controller('/api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.userService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user' })
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
```

### DTO Validation

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'USER', required: false })
  @IsOptional()
  @IsString()
  role?: string;
}
```

---

## Frontend Development

### Next.js App Router

```typescript
// apps/web/src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetch('http://localhost:3000/api/v1/dashboard', {
    cache: 'no-store',
  }).then(res => res.json());

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### Component Development

```typescript
// apps/web/src/components/user-card.tsx
interface UserCardProps {
  name: string;
  email: string;
  role: string;
}

export function UserCard({ name, email, role }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
      <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs">{role}</span>
    </div>
  );
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
