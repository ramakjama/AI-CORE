# Zod Schemas Guide - Complete Reference

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Core Concepts](#core-concepts)
5. [Domain Schemas](#domain-schemas)
6. [Backend Integration (NestJS)](#backend-integration-nestjs)
7. [Frontend Integration (React)](#frontend-integration-react)
8. [Python Integration (Pydantic)](#python-integration-pydantic)
9. [Best Practices](#best-practices)
10. [Migration Guide](#migration-guide)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

`@ait-core/schemas` is a centralized library of Zod schemas that provides:

- **Runtime Validation**: Validate data at runtime with comprehensive error messages
- **Type Safety**: Automatic TypeScript type inference from schemas
- **Framework Agnostic**: Works with NestJS, React, Express, and more
- **Cross-Language**: Generate Pydantic models for Python services
- **Consistent Validation**: Single source of truth for all data validation

### Why Zod?

- **Runtime + Compile-time**: Unlike TypeScript types, Zod validates at runtime
- **Type Inference**: Types are automatically generated from schemas
- **Composable**: Easy to extend and combine schemas
- **Better DX**: Superior error messages and IDE support
- **Zero Dependencies**: Minimal footprint

---

## Architecture

```
@ait-core/schemas
├── src/
│   ├── utils.ts              # Common validators & utilities
│   ├── auth.ts               # User & authentication schemas
│   ├── policy.ts             # Insurance policy schemas
│   ├── claim.ts              # Claim management schemas
│   ├── invoice.ts            # Billing & invoicing schemas
│   ├── customer.ts           # Customer management schemas
│   ├── decorators/           # Framework integrations
│   │   ├── zod-validation.decorator.ts
│   │   ├── react-hook-form.ts
│   │   └── index.ts
│   └── index.ts              # Main exports
├── test/
│   └── schemas.spec.ts       # Comprehensive test suite
├── scripts/
│   └── generate-pydantic.ts  # Python model generator
└── examples/
    ├── nestjs-example.ts
    └── react-example.tsx
```

### Data Flow

```
Frontend (React)                Backend (NestJS)               Database
     ↓                               ↓                            ↓
useZodForm() ──→ API Request ──→ ZodValidationPipe ──→ Service ──→ Prisma
     ↓                               ↓                            ↓
Type-safe form            Validated DTO              Type-safe queries
```

---

## Installation & Setup

### In Monorepo Workspace

```bash
# The package is already part of the workspace
# Just add it to package dependencies

# In your app's package.json
{
  "dependencies": {
    "@ait-core/schemas": "workspace:*"
  }
}
```

### Install Dependencies

```bash
# For React projects
pnpm add react-hook-form @hookform/resolvers

# For NestJS projects
pnpm add @nestjs/common @nestjs/core reflect-metadata

# Zod is already included
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true
  }
}
```

---

## Core Concepts

### Schema Definition

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive(),
});

// Infer type from schema
type User = z.infer<typeof UserSchema>;
```

### Parsing vs Safe Parsing

```typescript
// parse() - throws error on validation failure
try {
  const user = UserSchema.parse(data);
  console.log(user); // Type: User
} catch (error) {
  console.error(error); // ZodError
}

// safeParse() - returns result object
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Type: User
} else {
  console.error(result.error); // ZodError with details
}
```

### Schema Composition

```typescript
// Extend schema
const ExtendedUserSchema = UserSchema.extend({
  role: z.enum(['admin', 'user']),
});

// Pick specific fields
const UserPreviewSchema = UserSchema.pick({
  email: true,
  name: true,
});

// Omit fields
const UserWithoutPasswordSchema = UserSchema.omit({
  password: true,
});

// Partial (all fields optional)
const UpdateUserSchema = UserSchema.partial();

// Required (make optional fields required)
const RequiredUserSchema = UserSchema.required();

// Merge schemas
const CombinedSchema = SchemaA.merge(SchemaB);
```

---

## Domain Schemas

### Authentication & Users

#### Available Schemas

```typescript
import {
  UserSchema,              // Complete user entity
  UserProfileSchema,       // Public profile view
  RegisterSchema,          // Registration input
  LoginSchema,             // Login credentials
  ChangePasswordSchema,    // Password change
  JWTPayloadSchema,        // JWT token payload
  SessionSchema,           // User session
  PermissionSchema,        // Permission entity
  APIKeySchema,            // API key entity
} from '@ait-core/schemas';
```

#### Example Usage

```typescript
// Validate login
const credentials = LoginSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123!',
});

// Type inference
type LoginInput = z.infer<typeof LoginSchema>;

// Validate JWT payload
const payload = JWTPayloadSchema.parse(decodedToken);
```

### Policies

#### Available Schemas

```typescript
import {
  PolicySchema,            // Complete policy entity
  CreatePolicySchema,      // Create policy input
  UpdatePolicySchema,      // Update policy input
  FilterPoliciesSchema,    // Filter/search parameters
  CancelPolicySchema,      // Cancel policy input
  RenewPolicySchema,       // Renew policy input
  PolicyQuoteSchema,       // Quote request
  CoverageSchema,          // Coverage details
  PolicyHolderSchema,      // Policy holder info
  BeneficiarySchema,       // Beneficiary details
} from '@ait-core/schemas';
```

#### Example Usage

```typescript
// Create policy
const policyData = CreatePolicySchema.parse({
  type: 'AUTO',
  customerId: 'cuid123',
  insurerId: 'cuid456',
  holder: {
    name: 'John Doe',
    documentType: 'NIF',
    documentNumber: '12345678Z',
    email: 'john@example.com',
    phone: '+34612345678',
    address: 'Main St 123',
    city: 'Madrid',
    postalCode: '28001',
  },
  coverages: [
    {
      name: 'Third Party Liability',
      amount: 50000,
      currency: 'EUR',
    },
  ],
  premium: 500,
  currency: 'EUR',
  paymentFrequency: 'ANNUAL',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

### Claims

#### Available Schemas

```typescript
import {
  ClaimSchema,             // Complete claim entity
  CreateClaimSchema,       // Create claim input
  UpdateClaimSchema,       // Update claim input
  FilterClaimsSchema,      // Filter parameters
  ApproveClaimSchema,      // Approve claim input
  RejectClaimSchema,       // Reject claim input
  ProcessClaimPaymentSchema, // Payment processing
  ClaimDocumentSchema,     // Document attachment
  ClaimExpenseSchema,      // Expense line item
} from '@ait-core/schemas';
```

### Invoices

#### Available Schemas

```typescript
import {
  InvoiceSchema,           // Complete invoice entity
  CreateInvoiceSchema,     // Create invoice input
  UpdateInvoiceSchema,     // Update invoice input
  InvoiceItemSchema,       // Invoice line item
  SendInvoiceSchema,       // Send invoice via email
  RecordPaymentSchema,     // Record payment
  FilterInvoicesSchema,    // Filter parameters
} from '@ait-core/schemas';
```

#### Invoice Calculations

```typescript
// Invoice items automatically validate calculations
const item = InvoiceItemSchema.parse({
  description: 'Premium Payment',
  quantity: 1,
  unitPrice: 500,
  discount: 10,          // 10%
  taxRate: 21,           // 21% IVA
  subtotal: 450,         // 500 - 10% = 450
  total: 544.5,          // 450 + 21% = 544.5
});

// If calculations don't match, validation fails
```

### Customers

#### Available Schemas

```typescript
import {
  CustomerSchema,          // Complete customer entity
  CreateCustomerSchema,    // Create customer input
  UpdateCustomerSchema,    // Update customer input
  FilterCustomersSchema,   // Filter parameters
  IndividualDetailsSchema, // Individual person details
  BusinessDetailsSchema,   // Business details
  ContactPersonSchema,     // Contact person (for businesses)
  CustomerInteractionSchema, // Interaction log
} from '@ait-core/schemas';
```

---

## Backend Integration (NestJS)

### Method 1: ZodValidationPipe

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
    // data is validated and typed
    return this.policiesService.create(data);
  }
}
```

### Method 2: ValidateBody Decorator

```typescript
import { ValidateBody } from '@ait-core/schemas';

@Controller('policies')
export class PoliciesController {
  @Post()
  @ValidateBody(CreatePolicySchema)
  async create(@Body() data: CreatePolicyInput) {
    return this.policiesService.create(data);
  }
}
```

### Method 3: Manual Validation in Service

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { safeValidate, CreatePolicySchema } from '@ait-core/schemas';

@Injectable()
export class PoliciesService {
  async create(data: unknown) {
    const result = safeValidate(CreatePolicySchema, data);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    return this.repository.save(result.data);
  }
}
```

### Custom Error Handling

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';

@Catch(BadRequestException)
export class ZodValidationFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: exception.getResponse()['errors'],
      },
    });
  }
}
```

---

## Frontend Integration (React)

### Method 1: useZodForm Hook

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

### Method 2: Multi-Step Forms

```typescript
import { useZodMultiStepForm } from '@ait-core/schemas';

function MultiStepForm() {
  const schemas = [Step1Schema, Step2Schema, Step3Schema];

  const {
    form,
    currentStep,
    isLastStep,
    nextStep,
    prevStep,
  } = useZodMultiStepForm(schemas);

  return (
    <form onSubmit={form.handleSubmit(data => {
      if (isLastStep) {
        submitData(data);
      } else {
        nextStep();
      }
    })}>
      {/* Render current step */}
      <button type="button" onClick={prevStep}>Back</button>
      <button type="submit">{isLastStep ? 'Submit' : 'Next'}</button>
    </form>
  );
}
```

### Method 3: Manual Validation

```typescript
import { useZodValidation } from '@ait-core/schemas';

function CustomForm() {
  const { validate, errors } = useZodValidation(CreateCustomerSchema);
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate(formData)) {
      submitData(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {errors.email && <span>{errors.email}</span>}
    </form>
  );
}
```

---

## Python Integration (Pydantic)

### Generate Pydantic Models

```bash
cd libs/schemas
pnpm generate:pydantic
```

This generates `ait-engines/schemas.py`:

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    AGENT = "AGENT"
    CUSTOMER = "CUSTOMER"

class User(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
```

### Use in Python Services

```python
from schemas import User, Policy, Claim

# Validate data
user_data = {
    'id': 'cuid123',
    'email': 'user@example.com',
    'name': 'John Doe',
    'role': 'ADMIN',
    'status': 'ACTIVE',
    'created_at': datetime.now()
}

user = User(**user_data)  # Validates automatically
print(user.email)  # Type-safe access
```

---

## Best Practices

### 1. Schema Organization

```typescript
// ✅ Good: Export both schema and type
export const UserSchema = z.object({...});
export type User = z.infer<typeof UserSchema>;

// ❌ Bad: Only export schema
export const UserSchema = z.object({...});
```

### 2. Error Messages

```typescript
// ✅ Good: Custom error messages
const EmailSchema = z.string().email('Please enter a valid email address');

// ❌ Bad: Default messages
const EmailSchema = z.string().email();
```

### 3. Refinements for Complex Validation

```typescript
// ✅ Good: Use refine for cross-field validation
const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
```

### 4. Reuse Common Patterns

```typescript
// ✅ Good: Reuse validators
import { validators } from '@ait-core/schemas';
const schema = z.object({
  email: validators.email,
  phone: validators.phone,
});

// ❌ Bad: Duplicate validation logic
const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/.../)
});
```

### 5. Safe Parsing in Production

```typescript
// ✅ Good: Use safeParse in production code
const result = schema.safeParse(data);
if (!result.success) {
  handleError(result.error);
}

// ⚠️ Caution: parse() throws errors
const data = schema.parse(input); // Can crash if invalid
```

---

## Migration Guide

### From class-validator to Zod

#### Before (class-validator)

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

#### After (Zod)

```typescript
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
```

#### Benefits

- **Runtime + Compile-time**: Type safety at both levels
- **Better Errors**: More informative validation errors
- **Type Inference**: No need to maintain separate type definitions
- **Composable**: Easier to extend and combine schemas
- **Smaller Bundle**: No decorators or reflection metadata

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module '@ait-core/schemas'"

**Solution**: Make sure the package is in workspace dependencies:

```json
{
  "dependencies": {
    "@ait-core/schemas": "workspace:*"
  }
}
```

#### 2. Type inference not working

**Solution**: Make sure TypeScript is properly configured:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

#### 3. Validation errors are unclear

**Solution**: Use custom error messages:

```typescript
const schema = z.string().min(8, 'Password must be at least 8 characters');
```

#### 4. Performance issues with large schemas

**Solution**: Use lazy schemas for recursive types:

```typescript
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.string(),
    children: z.array(CategorySchema).optional(),
  })
);
```

### Getting Help

1. Check the [examples](./examples/) directory
2. Review the [test suite](./test/schemas.spec.ts)
3. Search existing issues in the repository
4. Contact the AIT-CORE team

---

## Next Steps

1. **Explore Examples**: Check `examples/` directory for real-world usage
2. **Run Tests**: `pnpm test` to see validation in action
3. **Add Custom Schemas**: Extend existing schemas for your use case
4. **Generate Python Models**: `pnpm generate:pydantic` for AI services

---

## Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [NestJS Pipes](https://docs.nestjs.com/pipes)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Maintainer**: AIN TECH - AIT-CORE Team
