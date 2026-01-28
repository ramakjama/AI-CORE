# Migration Checklist - @ait-core/schemas

## Overview

This checklist helps you migrate from existing validation approaches (class-validator, manual validation, or no validation) to the centralized @ait-core/schemas library.

## Phase 1: Setup (15 minutes)

### 1. Install Dependencies

```bash
# In your app's package.json, add:
{
  "dependencies": {
    "@ait-core/schemas": "workspace:*",
    "zod": "^3.22.4"
  }
}

# For React apps, also add:
{
  "dependencies": {
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0"
  }
}

# Run install
pnpm install
```

### 2. Update TypeScript Config

Ensure strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true
  }
}
```

## Phase 2: Backend Migration (NestJS)

### Step 1: Identify DTOs to Replace

- [ ] List all `@Controller` classes
- [ ] List all DTO classes (CreateXDto, UpdateXDto, etc.)
- [ ] Identify validation decorators used

### Step 2: Replace class-validator DTOs

#### Before (class-validator)

```typescript
// user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}
```

#### After (Zod)

```typescript
// Remove DTO file completely
// Import from @ait-core/schemas instead
import { CreateUserSchema, type CreateUserInput } from '@ait-core/schemas';
```

### Step 3: Update Controllers

#### Option A: Using ZodValidationPipe

```typescript
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import {
  CreatePolicySchema,
  CreatePolicyInput,
  ZodValidationPipe,
} from '@ait-core/schemas';

@Controller('policies')
export class PoliciesController {
  @Post()
  @UsePipes(new ZodValidationPipe(CreatePolicySchema))
  async create(@Body() data: CreatePolicyInput) {
    return this.service.create(data);
  }
}
```

#### Option B: Using Decorator

```typescript
import { ValidateBody } from '@ait-core/schemas';

@Post()
@ValidateBody(CreatePolicySchema)
async create(@Body() data: CreatePolicyInput) {
  return this.service.create(data);
}
```

### Step 4: Update Services

Replace manual validation with Zod:

#### Before

```typescript
async create(data: CreateUserDto) {
  // Manual validation or hope controller validated
  return this.repository.save(data);
}
```

#### After

```typescript
import { safeValidate, CreateUserSchema } from '@ait-core/schemas';

async create(data: unknown) {
  const result = safeValidate(CreateUserSchema, data);

  if (!result.success) {
    throw new BadRequestException(result.errors);
  }

  return this.repository.save(result.data);
}
```

### Step 5: Checklist

- [ ] All DTOs replaced with Zod schemas
- [ ] All controllers using ZodValidationPipe or decorators
- [ ] All services using safeValidate where needed
- [ ] Tests updated to use new schemas
- [ ] All imports updated from DTOs to schemas

## Phase 3: Frontend Migration (React)

### Step 1: Identify Forms to Migrate

- [ ] List all forms in the application
- [ ] Identify validation approach (manual, yup, etc.)
- [ ] Prioritize critical forms (login, register, payment)

### Step 2: Replace Form Validation

#### Before (manual validation)

```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.includes('@')) {
      newErrors.email = 'Invalid email';
    }
    if (password.length < 8) {
      newErrors.password = 'Password too short';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      login({ email, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {errors.email && <span>{errors.email}</span>}
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      {errors.password && <span>{errors.password}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

#### After (Zod + React Hook Form)

```typescript
import { useZodForm } from '@ait-core/schemas';
import { LoginSchema, type LoginInput } from '@ait-core/schemas';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useZodForm(LoginSchema);

  const onSubmit = async (data: LoginInput) => {
    await login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### Step 3: Update API Calls

#### Before

```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ email, password, name }),
});
const data = await response.json();
// Hope the data is valid
```

#### After

```typescript
import { CreateUserSchema, UserSchema } from '@ait-core/schemas';

const userData = CreateUserSchema.parse({ email, password, name });
const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(userData),
});
const data = await response.json();

// Validate response
const user = UserSchema.parse(data.data);
```

### Step 4: Checklist

- [ ] All forms migrated to useZodForm
- [ ] All API calls validate requests
- [ ] All API responses validated
- [ ] Type safety enforced everywhere
- [ ] Tests updated

## Phase 4: Python Integration (Optional)

### Step 1: Generate Pydantic Models

```bash
cd libs/schemas
pnpm generate:pydantic
```

### Step 2: Update Python Services

#### Before

```python
def create_user(data: dict):
    # Manual validation
    if 'email' not in data:
        raise ValueError('Email required')
    # ...
    return save_user(data)
```

#### After

```python
from schemas import User, CreateUser

def create_user(data: dict):
    # Automatic validation
    user_data = CreateUser(**data)
    return save_user(user_data)
```

### Step 3: Checklist

- [ ] Pydantic models generated
- [ ] Python services using models
- [ ] Validation errors handled
- [ ] Tests updated

## Phase 5: Testing

### Step 1: Unit Tests

Update tests to use schemas:

```typescript
import { CreateUserSchema } from '@ait-core/schemas';

describe('UserService', () => {
  it('should create user', async () => {
    const userData = CreateUserSchema.parse({
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    });

    const user = await service.create(userData);
    expect(user.email).toBe('test@example.com');
  });

  it('should reject invalid data', () => {
    expect(() => {
      CreateUserSchema.parse({
        email: 'invalid',
        password: 'weak',
      });
    }).toThrow();
  });
});
```

### Step 2: Integration Tests

Test full request/response cycle:

```typescript
describe('POST /users', () => {
  it('should create user with valid data', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });

  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        email: 'invalid',
        password: 'weak',
      })
      .expect(400);

    expect(response.body.error).toHaveProperty('errors');
  });
});
```

### Step 3: Checklist

- [ ] Unit tests updated
- [ ] Integration tests updated
- [ ] E2E tests updated
- [ ] All tests passing

## Phase 6: Cleanup

### Step 1: Remove Old Code

- [ ] Delete DTO files (*.dto.ts)
- [ ] Remove class-validator imports
- [ ] Remove manual validation functions
- [ ] Remove Yup schemas (if used)

### Step 2: Update Documentation

- [ ] Update API documentation
- [ ] Update developer guides
- [ ] Update README files
- [ ] Add schema usage examples

### Step 3: Final Checklist

- [ ] All validations using Zod schemas
- [ ] No class-validator imports remaining
- [ ] No manual validation remaining
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained on new approach

## Common Issues & Solutions

### Issue 1: Type Mismatches

**Problem**: TypeScript complains about types

**Solution**: Use `z.infer<>` to get types from schemas

```typescript
type User = z.infer<typeof UserSchema>;
```

### Issue 2: Optional Fields

**Problem**: Field should be optional but isn't

**Solution**: Use `.optional()` or `.nullable()`

```typescript
const schema = z.object({
  name: z.string(),
  email: z.string().optional(),
  age: z.number().nullable(),
});
```

### Issue 3: Complex Validation

**Problem**: Need custom validation logic

**Solution**: Use `.refine()` or `.superRefine()`

```typescript
const schema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

### Issue 4: Performance

**Problem**: Validation is slow

**Solution**: Parse once at boundaries

```typescript
// ✅ Good: Parse at API boundary
@Post()
@UsePipes(new ZodValidationPipe(CreateUserSchema))
async create(@Body() data: CreateUserInput) {
  // data is already validated
  return this.service.create(data);
}

// ❌ Bad: Parsing multiple times
async create(data: unknown) {
  const parsed = schema.parse(data); // Parse 1
  await this.validate(parsed); // Parse 2 (unnecessary)
  return this.save(parsed);
}
```

## Timeline Estimates

### Small Project (1-5 endpoints)
- Setup: 15 minutes
- Backend migration: 1 hour
- Frontend migration: 2 hours
- Testing: 1 hour
- **Total: 4-5 hours**

### Medium Project (10-20 endpoints)
- Setup: 30 minutes
- Backend migration: 4 hours
- Frontend migration: 8 hours
- Testing: 2 hours
- **Total: 2 days**

### Large Project (50+ endpoints)
- Setup: 1 hour
- Backend migration: 2 days
- Frontend migration: 3 days
- Testing: 1 day
- **Total: 1 week**

## Success Criteria

- ✅ All validation using Zod schemas
- ✅ Type safety throughout the stack
- ✅ No runtime validation errors
- ✅ Reduced code duplication
- ✅ Better error messages
- ✅ Improved developer experience
- ✅ All tests passing
- ✅ Team comfortable with new approach

## Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [@ait-core/schemas README](./README.md)
- [@ait-core/schemas Guide](./ZOD_SCHEMAS_GUIDE.md)
- [Examples](./examples/)

## Support

If you encounter issues during migration:

1. Check the [Troubleshooting section](./ZOD_SCHEMAS_GUIDE.md#troubleshooting)
2. Review [examples](./examples/)
3. Check tests for usage patterns
4. Contact AIT-CORE team

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Maintainer**: AIN TECH - AIT-CORE Team
