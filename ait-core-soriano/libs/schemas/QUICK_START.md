# Quick Start Guide - @ait-core/schemas

Get up and running with Zod schemas in 5 minutes.

## Installation

```bash
# Add to your package.json
{
  "dependencies": {
    "@ait-core/schemas": "workspace:*"
  }
}

pnpm install
```

## Basic Usage

### 1. Import and Validate

```typescript
import { LoginSchema } from '@ait-core/schemas';

// Validate data
const credentials = LoginSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123!',
});

// Safe validation (no throw)
const result = LoginSchema.safeParse(data);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### 2. Type Inference

```typescript
import { LoginSchema, type LoginInput } from '@ait-core/schemas';

// Type is automatically inferred
type LoginData = z.infer<typeof LoginSchema>;

// Or use the exported type
const login = async (data: LoginInput) => {
  // data is fully typed
};
```

## NestJS Integration

### Simple Controller

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

That's it! The pipe validates the request body automatically.

## React Integration

### Simple Form

```typescript
import { useZodForm } from '@ait-core/schemas';
import { LoginSchema } from '@ait-core/schemas';

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } =
    useZodForm(LoginSchema);

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
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

### Authentication
- `LoginSchema` - Login credentials
- `RegisterSchema` - User registration
- `ChangePasswordSchema` - Password change

### Business Entities
- `PolicySchema` - Insurance policies
- `ClaimSchema` - Claims
- `InvoiceSchema` - Invoices
- `CustomerSchema` - Customers

### Utilities
- `paginationSchema` - API pagination
- `validators.email` - Email validation
- `validators.nif` - Spanish NIF
- `validators.iban` - Spanish IBAN

## Common Patterns

### Validate API Response

```typescript
import { UserSchema } from '@ait-core/schemas';

const response = await fetch('/api/user');
const data = await response.json();

// Validate response
const user = UserSchema.parse(data);
```

### Create Custom Schema

```typescript
import { z } from '@ait-core/schemas';
import { validators } from '@ait-core/schemas';

const MySchema = z.object({
  email: validators.email,
  name: z.string().min(1).max(100),
  age: z.number().int().positive(),
});
```

### Extend Existing Schema

```typescript
import { UserSchema } from '@ait-core/schemas';

const ExtendedUserSchema = UserSchema.extend({
  customField: z.string(),
});
```

## Error Handling

```typescript
import { z } from 'zod';

try {
  const data = schema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.log(`${err.path}: ${err.message}`);
    });
  }
}
```

## Next Steps

1. Check [README.md](./README.md) for full API reference
2. Read [ZOD_SCHEMAS_GUIDE.md](./ZOD_SCHEMAS_GUIDE.md) for comprehensive guide
3. Review [examples](./examples/) for real-world usage
4. Run tests: `pnpm test`

## Cheat Sheet

```typescript
// Basic types
z.string()
z.number()
z.boolean()
z.date()
z.array(z.string())
z.object({ name: z.string() })

// Modifiers
.optional()          // Makes field optional
.nullable()          // Allows null
.default(value)      // Provides default
.min(n)             // Minimum value/length
.max(n)             // Maximum value/length
.email()            // Email validation
.url()              // URL validation
.regex(/pattern/)   // Regex validation

// Composition
.extend({})         // Add fields
.pick({})           // Select fields
.omit({})           // Remove fields
.partial()          // All optional
.required()         // All required
.merge(otherSchema) // Combine schemas

// Validation
.parse(data)        // Throws on error
.safeParse(data)    // Returns result object
.refine(fn)         // Custom validation
```

## Support

Need help? Check:
- [Full Documentation](./ZOD_SCHEMAS_GUIDE.md)
- [Migration Guide](./MIGRATION_CHECKLIST.md)
- [Examples](./examples/)
- Contact AIT-CORE team

Happy coding! 🚀
