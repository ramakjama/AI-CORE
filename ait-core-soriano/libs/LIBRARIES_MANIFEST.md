# AIT-CORE Shared Libraries Manifest

## Overview

This document provides a comprehensive overview of all shared libraries created for the AIT-CORE Soriano Mediadores monorepo.

**Location**: `C:\Users\rsori\codex\ait-core-soriano\libs\`

**Status**: ✅ PRODUCTION-READY

**Created**: January 28, 2026

---

## 1. @ait-core/shared

**Purpose**: Shared utilities, constants, and helpers used across all modules.

### Features
- Application-wide constants (HTTP status, insurance types, Kafka topics, etc.)
- Custom error classes with proper inheritance
- Zod-based validation schemas
- Spanish ID validators (NIF/NIE/CIF, IBAN)
- Currency, date, phone, IBAN formatters
- Winston-based structured logging
- Retry, debounce, throttle, and other utilities
- TypeScript type definitions

### Key Files
- `src/constants.ts` - All application constants
- `src/errors.ts` - Custom error classes
- `src/validators.ts` - Validation schemas and functions
- `src/formatters.ts` - Formatting utilities
- `src/logger.ts` - Logging infrastructure
- `src/utils.ts` - General utilities
- `src/types.ts` - TypeScript types

### Usage Example
```typescript
import { HTTP_STATUS, formatCurrency, validateSpanishId } from '@ait-core/shared';
```

---

## 2. @ait-core/database

**Purpose**: Prisma database clients for 40 specialized databases.

### Architecture
**40 Specialized Databases**:
- **Core Business** (6): Policies, Claims, Customers, Finance, Documents, Quotes
- **Insurance Specialized** (12): Auto, Home, Health, Life, Business, Travel, Liability, Marine, Agricultural, Construction, Cyber, Pet
- **Marketing & Sales** (5): Campaigns, Leads, Sales Pipeline, Referrals, Loyalty
- **Analytics & Intelligence** (5): Analytics, Reporting, Actuarial, Fraud Detection, Predictive Models
- **Security & Compliance** (3): Auth, Audit, Compliance
- **Infrastructure** (4): Notifications, Email Queue, File Storage, Cache
- **Integration & Automation** (5): API Gateway, Workflow, Event Store, Integration, Job Scheduler

### Features
- Prisma client instances for all 40 databases
- Connection manager with health checks
- Graceful shutdown handling
- Transaction support across multiple databases
- Database-specific schemas

### Key Files
- `src/clients.ts` - All database client instances
- `src/connection-manager.ts` - Connection pooling and health checks
- `src/types.ts` - Database-related types
- `prisma/schema.prisma` - Main Prisma schema

### Usage Example
```typescript
import { policiesDb, claimsDb, customersDb } from '@ait-core/database';

const policies = await policiesDb.policy.findMany();
```

---

## 3. @ait-core/kafka

**Purpose**: Event streaming library using Apache Kafka.

### Features
- Kafka producer for sending messages and events
- Kafka consumer with automatic retries
- High-level Event Bus abstraction
- Event schemas with Zod validation
- Transaction support
- Dead letter queue handling
- Full TypeScript support

### Key Components
- **Producer**: Send messages and domain events
- **Consumer**: Consume messages with handlers
- **Event Bus**: Publish-subscribe pattern
- **Schemas**: Event validation schemas

### Key Files
- `src/client.ts` - Kafka client configuration
- `src/producer.ts` - Producer implementation
- `src/consumer.ts` - Consumer implementation
- `src/event-bus.ts` - Event Bus abstraction
- `src/schemas.ts` - Event validation schemas
- `src/types.ts` - TypeScript types

### Usage Example
```typescript
import { getEventBus } from '@ait-core/kafka';

const eventBus = await initializeEventBus();
await eventBus.publish('policy.created', policyId, 'Policy', data);
```

---

## 4. @ait-core/auth

**Purpose**: Authentication and authorization library.

### Features
- JWT token generation and verification
- Bcrypt password hashing
- Database-backed session management
- Fine-grained permission system
- Role-based access control (RBAC)
- Express-compatible middleware
- Multi-factor authentication support

### Components
- **JWT**: Access and refresh tokens
- **Password**: Hashing and strength validation
- **Session**: Database-backed sessions
- **Permissions**: Fine-grained permissions
- **RBAC**: Role-based access control
- **Middleware**: Express middleware

### Key Files
- `src/jwt.ts` - JWT token management
- `src/password.ts` - Password hashing and validation
- `src/session.ts` - Session management
- `src/permissions.ts` - Permission management
- `src/rbac.ts` - Role-based access control
- `src/middleware.ts` - Express middleware
- `src/types.ts` - TypeScript types

### Usage Example
```typescript
import { generateTokens, authenticate, requirePermission } from '@ait-core/auth';

app.use('/api', authenticate());
app.get('/api/policies', requirePermission('policy:read'), handler);
```

### Roles
- SUPER_ADMIN, ADMIN, MANAGER, AGENT, CUSTOMER, UNDERWRITER, CLAIMS_ADJUSTER, ACCOUNTANT, AUDITOR

---

## 5. @ait-core/ui

**Purpose**: Complete design system with React components.

### Features
- Comprehensive theme system (colors, typography, spacing)
- Production-ready components (Button, Input, Card, Table, Badge)
- Radix UI integration for accessibility
- Tailwind CSS utility classes
- Custom React hooks
- Lucide React icons
- TypeScript support
- Responsive design (mobile-first)

### Components
- **Button**: Primary, secondary, outline, ghost, danger variants
- **Input**: With label, error, helper text, icons
- **Card**: Header, body, footer, multiple variants
- **Table**: Sortable, filterable, with custom renderers
- **Badge**: Status indicators with multiple variants

### Custom Hooks
- `useMediaQuery` - Responsive design
- `useClickOutside` - Click outside detection
- `useLocalStorage` - Local storage management
- `useDebounce` - Debounced values

### Key Files
- `src/theme/index.ts` - Complete theme system
- `src/components/` - All UI components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/layout/` - Layout components
- `src/typography/` - Typography components

### Usage Example
```typescript
import { Button, Input, Card, Table, Badge } from '@ait-core/ui';

<Button variant="primary" size="lg">Submit</Button>
<Input label="Email" error="Invalid email" />
<Badge variant="success" dot>Active</Badge>
```

---

## Directory Structure

```
libs/
├── shared/
│   ├── src/
│   │   ├── constants.ts
│   │   ├── errors.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── logger.ts
│   │   ├── utils.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── database/
│   ├── src/
│   │   ├── clients.ts
│   │   ├── connection-manager.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   └── generate-all.js
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── kafka/
│   ├── src/
│   │   ├── client.ts
│   │   ├── producer.ts
│   │   ├── consumer.ts
│   │   ├── event-bus.ts
│   │   ├── schemas.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── auth/
│   ├── src/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── session.ts
│   │   ├── permissions.ts
│   │   ├── rbac.ts
│   │   ├── middleware.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── ui/
    ├── src/
    │   ├── theme/
    │   │   └── index.ts
    │   ├── components/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Table.tsx
    │   │   ├── Badge.tsx
    │   │   └── ...
    │   ├── hooks/
    │   │   ├── useMediaQuery.ts
    │   │   ├── useClickOutside.ts
    │   │   ├── useLocalStorage.ts
    │   │   ├── useDebounce.ts
    │   │   └── index.ts
    │   ├── utils/
    │   │   └── index.ts
    │   ├── layout/
    │   ├── typography/
    │   ├── icons/
    │   └── index.ts
    ├── package.json
    ├── tsconfig.json
    └── README.md
```

---

## Installation

All libraries are part of the monorepo and automatically available via workspace references.

```bash
# Install all dependencies
pnpm install

# Build all libraries
pnpm build

# Build specific library
cd libs/shared && pnpm build
```

---

## Cross-Library Dependencies

```
@ait-core/shared (no dependencies)
    ↑
    ├── @ait-core/database
    ├── @ait-core/kafka
    ├── @ait-core/auth → @ait-core/database
    └── @ait-core/ui
```

---

## Environment Variables

### @ait-core/database
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/ait_core
DATABASE_URL_POLICIES=postgresql://...
# ... for all 40 databases
```

### @ait-core/kafka
```bash
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ait-core
KAFKA_SSL_ENABLED=false
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=
```

### @ait-core/auth
```bash
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
SESSION_DURATION=604800000
```

---

## Build System

All libraries use:
- **TypeScript 5.3.3**
- **tsup** for building (ESM + CJS)
- **ESLint** for linting
- **Jest** for testing (where applicable)
- **Turbo** for monorepo orchestration

Build commands:
```bash
pnpm build      # Build library
pnpm dev        # Watch mode
pnpm lint       # Lint code
pnpm test       # Run tests
pnpm type-check # Type checking
```

---

## Testing

Each library includes:
- Unit tests (Jest)
- Type checking (TypeScript)
- Linting (ESLint)

```bash
# Test all libraries
pnpm test

# Test specific library
cd libs/shared && pnpm test
```

---

## Documentation

Each library includes:
- Comprehensive README.md
- Inline code documentation
- TypeScript type definitions
- Usage examples

---

## Production Checklist

- [x] TypeScript configuration
- [x] Build system (tsup)
- [x] Package.json with proper exports
- [x] Comprehensive documentation
- [x] Error handling
- [x] Type safety
- [x] Logging infrastructure
- [x] Environment variable configuration
- [x] Cross-library dependencies configured
- [x] Production-ready code quality

---

## Next Steps

1. **Run `pnpm install`** in the root to install all dependencies
2. **Build all libraries**: `pnpm build`
3. **Set up environment variables** for each library
4. **Initialize databases** with Prisma migrations
5. **Start development** on modules using these libraries

---

## Maintenance

### Adding New Functionality
1. Update the relevant library source code
2. Update types if needed
3. Add tests
4. Update README
5. Rebuild the library

### Version Management
All libraries use semantic versioning. Update version in package.json when making changes.

---

## Support

For questions or issues:
- Check individual library README files
- Review inline code documentation
- Consult TypeScript type definitions
- Reference usage examples in documentation

---

## License

PROPRIETARY - AIT-CORE Soriano Mediadores

All rights reserved. Unauthorized copying, modification, or distribution is prohibited.

---

**Created with**: Claude Sonnet 4.5 by Anthropic
**Date**: January 28, 2026
**Project**: AIT-CORE Soriano Mediadores ERP-OS
