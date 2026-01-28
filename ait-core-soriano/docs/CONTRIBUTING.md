# AIT-CORE SORIANO - Contributing Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Welcome Contributors!

Thank you for your interest in contributing to AIT-CORE SORIANO. This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Contribution Types](#contribution-types)
5. [Pull Request Process](#pull-request-process)
6. [Coding Standards](#coding-standards)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Communication](#communication)
10. [Recognition](#recognition)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all.

### Expected Behavior

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Violations can be reported to conduct@sorianomediadores.es. All reports will be reviewed and investigated.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 20+
- pnpm 8+
- Docker 24+
- Git
- A GitHub account
- Signed Contributor License Agreement (CLA)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork

git clone https://github.com/YOUR_USERNAME/ait-core-soriano.git
cd ait-core-soriano

# Add upstream remote
git remote add upstream https://github.com/aintech/ait-core-soriano.git

# Install dependencies
pnpm install
```

### Development Setup

```bash
# Copy environment file
cp .env.example .env

# Start infrastructure
pnpm docker:up

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

---

## Development Process

### 1. Find Something to Work On

**Good First Issues**:
- Look for issues labeled `good-first-issue`
- Check the project board for available tasks
- Review the roadmap for upcoming features

**Create New Issue**:
If you have an idea, create an issue first to discuss it with maintainers.

### 2. Create a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Your Changes

- Write clean, readable code
- Follow coding standards
- Add tests for new functionality
- Update documentation
- Commit frequently with clear messages

### 4. Test Your Changes

```bash
# Run all tests
pnpm test

# Run linter
pnpm lint

# Run type checker
pnpm type-check

# Build to ensure no errors
pnpm build
```

### 5. Submit Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

---

## Contribution Types

### Bug Fixes

**Process**:
1. Find or create a bug issue
2. Comment that you're working on it
3. Create a branch: `fix/issue-number-description`
4. Fix the bug with tests
5. Submit PR

**Requirements**:
- Regression test to prevent recurrence
- Clear description of the fix
- Link to the issue

### New Features

**Process**:
1. Create a feature request issue
2. Discuss design with maintainers
3. Get approval before coding
4. Create a branch: `feature/feature-name`
5. Implement with tests and docs
6. Submit PR

**Requirements**:
- Feature design approval
- Comprehensive tests (unit + integration)
- Documentation updates
- Examples in docs if applicable

### Documentation

**What to Document**:
- API changes
- New features
- Architecture decisions
- Setup instructions
- Examples and tutorials

**How to Contribute**:
```bash
# Documentation is in /docs
cd docs

# Edit markdown files
# ... make changes ...

# Preview locally
# Use a markdown viewer or push to your fork to preview on GitHub

# Submit PR
git add .
git commit -m "docs: update API documentation"
git push origin docs/update-api-docs
```

### Tests

**Test Types**:
- Unit tests: Test individual functions/classes
- Integration tests: Test module interactions
- E2E tests: Test complete user flows

**Adding Tests**:
```typescript
// tests/unit/services/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    // Setup
  });

  it('should create a user', async () => {
    // Test logic
  });
});
```

---

## Pull Request Process

### Before Submitting

**Checklist**:
- [ ] Tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm lint`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Title

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

Examples:
feat(accountant): add balance sheet report
fix(auth): resolve token refresh issue
docs(api): update authentication guide
refactor(crm): optimize contact query
test(insurance): add unit tests for vida module
chore(deps): update dependencies
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks
- `perf`: Performance improvement
- `ci`: CI/CD changes

### PR Description

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to break)
- [ ] Documentation update

## Related Issues
Fixes #123
Closes #456

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Tests pass locally
- [ ] Linter passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI/CD runs tests, linting, type checking
2. **Code Review**: At least 2 maintainers review your code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, maintainer will merge

### After Merge

```bash
# Update your local main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## Coding Standards

### TypeScript Style

**Formatting**:
```typescript
// Use Prettier (auto-format on save)
// 2 spaces for indentation
// Single quotes
// Semicolons
// Trailing commas

// Good
const user = {
  name: 'John Doe',
  email: 'john@example.com',
};

// Bad
const user = {
    name: "John Doe",
    email: "john@example.com"
}
```

**Naming**:
```typescript
// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase
interface User {}

// Functions/Variables: camelCase
function getUserById() {}
const userName = 'John';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Files: kebab-case
// user-service.ts
// account-controller.ts
```

**Types**:
```typescript
// Explicit return types
function getUser(id: string): Promise<User> {
  return this.userRepository.findById(id);
}

// No 'any' types
// Good
function processData(data: unknown): ProcessedData {
  // Type guard
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error('Invalid data');
}

// Bad
function processData(data: any) {
  return data.map(x => x.value);
}
```

### Comments

**When to Comment**:
- Complex algorithms
- Non-obvious business logic
- Workarounds for known issues
- TODO/FIXME items

**JSDoc for Public APIs**:
```typescript
/**
 * Creates a new user in the system
 *
 * @param dto - User creation data
 * @returns The created user with generated ID
 * @throws {ValidationError} If user data is invalid
 * @throws {ConflictError} If user already exists
 *
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 * });
 * ```
 */
async createUser(dto: CreateUserDto): Promise<User> {
  // Implementation
}
```

### Error Handling

```typescript
// Use custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Handle errors appropriately
try {
  await userService.createUser(dto);
} catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field,
      },
    });
  }
  throw error; // Re-throw unexpected errors
}
```

---

## Testing Requirements

### Test Coverage

**Minimum Requirements**:
- Overall coverage: 80%
- New code coverage: 90%
- Critical paths: 100%

### Unit Tests

```typescript
// tests/unit/services/user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/services/user.service';
import { PrismaService } from '@ait-core/database';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const expected = { id: '1', ...dto };
      jest.spyOn(prisma.user, 'create').mockResolvedValue(expected);

      const result = await service.createUser(dto);

      expect(result).toEqual(expected);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw error for duplicate email', async () => {
      const dto = {
        name: 'John Doe',
        email: 'existing@example.com',
      };

      jest.spyOn(prisma.user, 'create').mockRejectedValue({
        code: 'P2002',
      });

      await expect(service.createUser(dto)).rejects.toThrow(ConflictError);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/crm.integration.spec.ts
describe('CRM Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and retrieve a contact', async () => {
    const createDto = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const created = await request(app.getHttpServer())
      .post('/api/v1/crm/contacts')
      .send(createDto)
      .expect(201);

    const retrieved = await request(app.getHttpServer())
      .get(`/api/v1/crm/contacts/${created.body.data.id}`)
      .expect(200);

    expect(retrieved.body.data.email).toBe(createDto.email);
  });
});
```

---

## Documentation

### Code Documentation

**Inline Comments**:
```typescript
// Explain WHY, not WHAT
// Good
// Calculate compound interest using the formula A = P(1 + r/n)^(nt)
const amount = principal * Math.pow(1 + rate / periods, periods * time);

// Bad
// Multiply principal by compound interest factor
const amount = principal * Math.pow(1 + rate / periods, periods * time);
```

**API Documentation**:
```typescript
// Use Swagger decorators
@ApiTags('users')
@Controller('/api/v1/users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }
}
```

### README Files

Every module should have a README:

```markdown
# Module Name

Brief description of what this module does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

```bash
pnpm install
```

## Usage

```typescript
import { ModuleService } from './module.service';

const service = new ModuleService();
const result = await service.doSomething();
```

## API

See [API Documentation](./docs/API.md)

## Testing

```bash
pnpm test
```

## License

Proprietary
```

---

## Communication

### Channels

**GitHub Issues**:
- Bug reports
- Feature requests
- Questions

**GitHub Discussions**:
- General discussions
- Ideas
- Show and tell

**Slack** (Internal):
- #development
- #pull-requests
- #architecture

**Email**:
- dev@sorianomediadores.es

### Issue Templates

**Bug Report**:
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable.

**Environment**
- OS: [e.g. Windows 11]
- Node version: [e.g. 20.10.0]
- Browser: [e.g. Chrome 120]

**Additional context**
Any other context.
```

**Feature Request**:
```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots.
```

---

## Recognition

### Contributors

All contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website

### Contributor Levels

**Level 1 - Contributor**:
- 1+ merged PR

**Level 2 - Regular Contributor**:
- 5+ merged PRs
- Active in discussions

**Level 3 - Core Contributor**:
- 20+ merged PRs
- Significant feature contributions
- Helps review others' PRs

**Level 4 - Maintainer**:
- Invited by core team
- Merge permissions
- Architectural decisions

### Hall of Fame

Top contributors are featured on our website and receive:
- Special badge on GitHub
- Invitation to quarterly contributor calls
- Early access to new features
- Exclusive swag

---

## License Agreement

### Contributor License Agreement (CLA)

All contributors must sign our CLA before their first contribution.

**What it covers**:
- Grant of copyright license
- Grant of patent license
- Originality of work
- No implied warranties

**How to sign**:
1. Submit your first PR
2. CLA bot will comment with signing instructions
3. Sign electronically via GitHub
4. PR will be unblocked automatically

---

## Questions?

If you have questions:

1. Check existing documentation
2. Search GitHub issues
3. Ask in GitHub Discussions
4. Contact dev@sorianomediadores.es

**We're here to help! Don't hesitate to ask.**

---

## Thank You!

Thank you for contributing to AIT-CORE SORIANO. Every contribution, no matter how small, makes a difference.

Happy coding!

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
**Contact:** dev@sorianomediadores.es
