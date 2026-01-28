# @ait-core/schemas

> Shared Zod schemas for the entire AIT-CORE ecosystem with runtime validation, type inference, and framework integrations.

## Features

- **Runtime Validation**: Validate data at runtime with comprehensive error messages
- **Type Inference**: Automatic TypeScript type generation from schemas
- **Framework Integration**: Built-in support for NestJS and React Hook Form
- **Reusable Schemas**: Centralized schema definitions used across all services
- **Python Support**: Generate Pydantic models from Zod schemas
- **Comprehensive**: 15+ domain schemas covering all business entities

## Installation

```bash
# In monorepo packages
pnpm add @ait-core/schemas

# Install peer dependencies
pnpm add zod @hookform/resolvers react-hook-form
```

## Quick Start

### Basic Usage

```typescript
import { LoginSchema, type LoginInput } from '@ait-core/schemas';

// Parse and validate
const data: LoginInput = LoginSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123!',
});

// Safe parse (returns result object)
const result = LoginSchema.safeParse(userData);
if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation errors:', result.error);
}
```

### With NestJS

```typescript
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import {
  CreatePolicySchema,
  CreatePolicyInput,
  ZodValidationPipe
} from '@ait-core/schemas';

@Controller('policies')
export class PoliciesController {
  @Post()
  @UsePipes(new ZodValidationPipe(CreatePolicySchema))
  async create(@Body() data: CreatePolicyInput) {
    // data is fully typed and validated
    return this.policiesService.create(data);
  }
}
```

### With React Hook Form

```typescript
import { useZodForm } from '@ait-core/schemas';
import { LoginSchema, type LoginInput } from '@ait-core/schemas';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useZodForm(LoginSchema);

  const onSubmit = async (data: LoginInput) => {
    // data is fully typed and validated
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

## Available Schemas

### Authentication & Users

```typescript
import {
  // Schemas
  UserSchema,
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  JWTPayloadSchema,

  // Types
  User,
  RegisterInput,
  LoginInput,
  UserRole,
  UserStatus,
} from '@ait-core/schemas';
```

### Policies

```typescript
import {
  // Schemas
  PolicySchema,
  CreatePolicySchema,
  UpdatePolicySchema,
  FilterPoliciesSchema,
  CoverageSchema,

  // Types
  Policy,
  CreatePolicyInput,
  PolicyType,
  PolicyStatus,
  Coverage,
} from '@ait-core/schemas';
```

### Claims

```typescript
import {
  // Schemas
  ClaimSchema,
  CreateClaimSchema,
  ApproveClaimSchema,
  FilterClaimsSchema,

  // Types
  Claim,
  CreateClaimInput,
  ClaimType,
  ClaimStatus,
} from '@ait-core/schemas';
```

### Invoices

```typescript
import {
  // Schemas
  InvoiceSchema,
  CreateInvoiceSchema,
  InvoiceItemSchema,
  RecordPaymentSchema,

  // Types
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentMethod,
} from '@ait-core/schemas';
```

### Customers

```typescript
import {
  // Schemas
  CustomerSchema,
  CreateCustomerSchema,
  FilterCustomersSchema,

  // Types
  Customer,
  CustomerType,
  CustomerStatus,
  ContactInfo,
} from '@ait-core/schemas';
```

## Validators

Pre-built validators for common data types:

```typescript
import { validators } from '@ait-core/schemas';

// Spanish NIF/NIE
validators.nif.parse('12345678Z');

// Spanish IBAN
validators.iban.parse('ES1234567890123456789012');

// Email
validators.email.parse('user@example.com');

// Phone (international)
validators.phone.parse('+34612345678');

// Strong password
validators.password.parse('SecurePass123!');

// URL
validators.url.parse('https://example.com');

// UUID/CUID
validators.cuid.parse('clj1x2y3z...');
```

## Utility Schemas

### Pagination

```typescript
import { paginationSchema, type Pagination } from '@ait-core/schemas';

const params = paginationSchema.parse({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### Date Range

```typescript
import { dateRangeSchema } from '@ait-core/schemas';

const range = dateRangeSchema.parse({
  from: '2024-01-01',
  to: '2024-12-31',
});
```

### Response Wrappers

```typescript
import { createResponseSchema, createPaginatedResponseSchema } from '@ait-core/schemas';

// Single item response
const UserResponseSchema = createResponseSchema(UserSchema);

// Paginated response
const UsersResponseSchema = createPaginatedResponseSchema(UserSchema);
```

## Advanced Usage

### Custom Refinements

```typescript
import { z } from 'zod';
import { CreatePolicySchema } from '@ait-core/schemas';

const ExtendedPolicySchema = CreatePolicySchema.extend({
  customField: z.string(),
}).refine(
  (data) => data.premium >= 100,
  { message: 'Premium must be at least 100', path: ['premium'] }
);
```

### Partial Updates

```typescript
import { UpdatePolicySchema } from '@ait-core/schemas';

// All fields optional
const partialData = UpdatePolicySchema.parse({
  status: 'ACTIVE',
  // Other fields optional
});
```

### Type Extraction

```typescript
import { z } from 'zod';
import { PolicySchema } from '@ait-core/schemas';

// Extract input type (before parsing)
type PolicyInput = z.input<typeof PolicySchema>;

// Extract output type (after parsing)
type PolicyOutput = z.infer<typeof PolicySchema>;
```

## NestJS Integration

### Global Validation Pipe

```typescript
// main.ts
import { ZodValidationPipe } from '@ait-core/schemas';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use globally
  app.useGlobalPipes(new ZodValidationPipe(CreateUserSchema));

  await app.listen(3000);
}
```

### Controller-level Validation

```typescript
import { ValidateBody } from '@ait-core/schemas';

@Controller('users')
export class UsersController {
  @Post()
  @ValidateBody(CreateUserSchema)
  async create(@Body() data: CreateUserInput) {
    return this.usersService.create(data);
  }
}
```

## React Integration

### Multi-step Forms

```typescript
import { useZodMultiStepForm } from '@ait-core/schemas';

function MultiStepForm() {
  const steps = [Step1Schema, Step2Schema, Step3Schema];

  const {
    form,
    currentStep,
    totalSteps,
    isLastStep,
    nextStep,
    prevStep
  } = useZodMultiStepForm(steps);

  return (
    <div>
      <p>Step {currentStep + 1} of {totalSteps}</p>
      {/* Render current step */}
      <button onClick={prevStep}>Back</button>
      <button onClick={nextStep}>Next</button>
    </div>
  );
}
```

### Field-level Validation

```typescript
import { useZodValidation } from '@ait-core/schemas';

function CustomForm() {
  const { validate, validateField, errors } = useZodValidation(LoginSchema);

  const handleFieldBlur = (fieldName: string, value: any) => {
    validateField(fieldName, value);
  };

  return (
    <form>
      <input
        onBlur={(e) => handleFieldBlur('email', e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}
    </form>
  );
}
```

## Generate Pydantic Models

Convert Zod schemas to Python Pydantic models:

```bash
pnpm generate:pydantic
```

This generates `ait-engines/schemas.py` with all models:

```python
from pydantic import BaseModel

class User(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["ADMIN", "AGENT", "CUSTOMER"]

    class Config:
        from_attributes = True
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Best Practices

1. **Always use schemas for validation**: Never trust user input
2. **Reuse schemas**: Import from `@ait-core/schemas` instead of duplicating
3. **Type inference**: Let TypeScript infer types from schemas
4. **Safe parsing**: Use `safeParse()` when you need to handle errors
5. **Custom validators**: Extend schemas when needed for specific use cases

## Schema Organization

```
src/
├── utils.ts              # Common validators & utilities
├── auth.ts               # Authentication & user schemas
├── policy.ts             # Insurance policy schemas
├── claim.ts              # Claim management schemas
├── invoice.ts            # Billing & invoice schemas
├── customer.ts           # Customer management schemas
├── decorators/           # Framework integrations
│   ├── zod-validation.decorator.ts
│   ├── react-hook-form.ts
│   └── index.ts
└── index.ts              # Main export
```

## Migration from class-validator

### Before (class-validator)

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### After (Zod)

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginDto = z.infer<typeof LoginSchema>;
```

## Contributing

When adding new schemas:

1. Add schema to appropriate file in `src/`
2. Export from `src/index.ts`
3. Add tests in `test/schemas.spec.ts`
4. Update this README with examples
5. Run `pnpm generate:pydantic` to update Python models

## License

PROPRIETARY - AIN TECH - Soriano Mediadores
