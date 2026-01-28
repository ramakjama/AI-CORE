# @ait-core/shared

Shared utilities and helpers for AIT-CORE Soriano Mediadores.

## Features

- **Constants**: Application-wide constants (HTTP status codes, insurance types, Kafka topics, etc.)
- **Errors**: Custom error classes with proper inheritance and error handling
- **Validators**: Zod-based validation schemas and Spanish ID validators (NIF/NIE/CIF, IBAN)
- **Formatters**: Currency, date, phone, IBAN, and other Spanish format utilities
- **Logger**: Winston-based structured logging with audit and performance loggers
- **Utils**: Common utilities (retry, debounce, throttle, deep merge, etc.)
- **Types**: TypeScript type definitions for common patterns

## Installation

This package is part of the AIT-CORE monorepo and is automatically available to all workspace packages.

## Usage

### Constants

```typescript
import { HTTP_STATUS, INSURANCE_TYPES, KAFKA_TOPICS } from '@ait-core/shared';

console.log(HTTP_STATUS.OK); // 200
console.log(INSURANCE_TYPES.AUTO); // 'AUTO'
console.log(KAFKA_TOPICS.POLICY_CREATED); // 'policy.created'
```

### Error Handling

```typescript
import { ValidationError, NotFoundError, formatError } from '@ait-core/shared';

// Throw custom errors
throw new ValidationError('Invalid email format');
throw new NotFoundError('Policy', 'POL-12345');

// Format any error
try {
  // ... code
} catch (error) {
  const formatted = formatError(error);
  console.error(formatted);
}
```

### Validation

```typescript
import { commonSchemas, validateSpanishId, validateIBAN } from '@ait-core/shared/validators';

// Validate with Zod schemas
const email = commonSchemas.email.parse('user@example.com');

// Validate Spanish IDs
const result = validateSpanishId('12345678Z');
console.log(result); // { valid: true, type: 'NIF' }

// Validate IBAN
const isValid = validateIBAN('ES91 2100 0418 4502 0005 1332');
```

### Formatting

```typescript
import {
  formatCurrency,
  formatDate,
  formatPhoneES,
  formatIBAN
} from '@ait-core/shared/formatters';

formatCurrency(1234.56); // '1.234,56 €'
formatDate(new Date()); // '28/01/2026'
formatPhoneES('612345678'); // '612 34 56 78'
formatIBAN('ES9121000418450200051332'); // 'ES91 2100 0418 4502 0005 1332'
```

### Logging

```typescript
import { createLogger, auditLogger, PerformanceLogger } from '@ait-core/shared/logger';

// Create service logger
const logger = createLogger('my-service');
logger.info('Service started');
logger.error('Error occurred', { error });

// Audit logging
auditLogger.create('user-123', 'Policy', 'POL-456');

// Performance logging
const perf = new PerformanceLogger('database-query');
// ... do work
perf.end({ recordsProcessed: 100 });
```

### Utilities

```typescript
import { retry, sleep, chunk, groupBy } from '@ait-core/shared';

// Retry with exponential backoff
const result = await retry(
  () => fetchData(),
  { maxAttempts: 3, delay: 1000, backoff: true }
);

// Sleep
await sleep(1000);

// Chunk array
const chunks = chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Group by
const grouped = groupBy(
  [{ type: 'A', value: 1 }, { type: 'B', value: 2 }, { type: 'A', value: 3 }],
  'type'
);
// { A: [{ type: 'A', value: 1 }, { type: 'A', value: 3 }], B: [{ type: 'B', value: 2 }] }
```

## License

PROPRIETARY - AIT-CORE Soriano Mediadores
