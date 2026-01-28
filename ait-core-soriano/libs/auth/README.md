# @ait-core/auth

Authentication and authorization library for AIT-CORE Soriano Mediadores.

## Features

- **JWT Tokens**: Generate and verify JWT access and refresh tokens
- **Password Hashing**: Bcrypt-based password hashing with strength validation
- **Session Management**: Database-backed session management with expiration
- **Permissions**: Fine-grained permission system
- **RBAC**: Role-based access control with predefined roles
- **Middleware**: Express-compatible authentication and authorization middleware

## Installation

This package is part of the AIT-CORE monorepo and is automatically available to all workspace packages.

## Usage

### JWT Authentication

```typescript
import { generateTokens, verifyToken } from '@ait-core/auth';

// Generate tokens
const tokens = generateTokens({
  userId: 'user-123',
  email: 'user@example.com',
  role: 'AGENT',
  permissions: ['policy:read', 'policy:create'],
});

console.log(tokens.accessToken);
console.log(tokens.refreshToken);

// Verify token
const payload = verifyToken(tokens.accessToken);
console.log(payload.userId);
```

### Password Management

```typescript
import { hashPassword, verifyPassword, validatePasswordStrength } from '@ait-core/auth';

// Hash password
const hashedPassword = await hashPassword('MySecureP@ss123');

// Verify password
const isValid = await verifyPassword('MySecureP@ss123', hashedPassword);

// Validate strength
try {
  validatePasswordStrength('weak');
} catch (error) {
  console.error(error.message);
}

// Check strength score
const strength = calculatePasswordStrength('MySecureP@ss123');
console.log(strength); // { score: 7, strength: 'strong', suggestions: [] }
```

### Session Management

```typescript
import { createSession, validateSession, deleteSession } from '@ait-core/auth';

// Create session
const session = await createSession('user-123', {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});

// Validate session
const sessionData = await validateSession(session.token);
if (sessionData) {
  console.log(sessionData.user);
}

// Delete session (logout)
await deleteSession(session.token);
```

### Permissions

```typescript
import {
  hasPermission,
  grantPermission,
  revokePermission,
  requirePermission,
} from '@ait-core/auth';

// Check permission
const canRead = await hasPermission('user-123', 'policy:read');

// Grant permission
await grantPermission('user-123', 'policy:create', 'admin-456');

// Revoke permission
await revokePermission('user-123', 'policy:delete');

// Require permission (throws if not authorized)
await requirePermission('user-123', 'policy:create');
```

### Role-Based Access Control

```typescript
import { assignRole, getRolePermissions, canManageRole } from '@ait-core/auth';

// Assign role (grants all role permissions)
await assignRole('user-123', 'AGENT', 'admin-456');

// Get role permissions
const permissions = getRolePermissions('AGENT');
console.log(permissions);

// Check role hierarchy
const canManage = canManageRole('ADMIN', 'AGENT'); // true
```

### Express Middleware

```typescript
import {
  authenticate,
  requirePermission,
  requireRole,
  requireAnyPermission,
} from '@ait-core/auth';
import express from 'express';

const app = express();

// Authenticate all routes
app.use('/api', authenticate());

// Require specific permission
app.get('/api/policies', requirePermission('policy:read'), (req, res) => {
  // Access user via req.user
  console.log(req.user.userId);
  res.json({ policies: [] });
});

// Require role
app.post('/api/policies', requireRole('AGENT', 'MANAGER'), (req, res) => {
  res.json({ success: true });
});

// Require any of multiple permissions
app.put(
  '/api/policies/:id',
  requireAnyPermission('policy:update', 'policy:manage'),
  (req, res) => {
    res.json({ success: true });
  }
);
```

### Session-Based Authentication

```typescript
import { authenticateSession } from '@ait-core/auth';

// Use session authentication instead of JWT
app.use('/api', authenticateSession());

app.get('/api/profile', (req, res) => {
  // Access user via req.user
  // Access session via req.session
  res.json({
    user: req.user,
    session: req.session,
  });
});
```

## Available Roles

- `SUPER_ADMIN` - Full system access
- `ADMIN` - Administrative access
- `MANAGER` - Management access
- `AGENT` - Agent access
- `CUSTOMER` - Customer access
- `UNDERWRITER` - Underwriting access
- `CLAIMS_ADJUSTER` - Claims processing access
- `ACCOUNTANT` - Financial access
- `AUDITOR` - Read-only audit access

## Available Permissions

### Policies
- `policy:read` - Read policies
- `policy:create` - Create policies
- `policy:update` - Update policies
- `policy:delete` - Delete policies

### Claims
- `claim:read` - Read claims
- `claim:create` - Create claims
- `claim:update` - Update claims
- `claim:delete` - Delete claims
- `claim:approve` - Approve claims

### Customers
- `customer:read` - Read customers
- `customer:create` - Create customers
- `customer:update` - Update customers
- `customer:delete` - Delete customers

### Finance
- `finance:read` - Read financial data
- `finance:manage` - Manage finances

### Reports
- `report:read` - Read reports
- `report:create` - Create reports

### System
- `system:manage` - Manage system
- `audit:read` - Read audit logs

## Configuration

Set environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password Hashing
BCRYPT_SALT_ROUNDS=10

# Session Duration (milliseconds)
SESSION_DURATION=604800000
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store JWT_SECRET securely** (environment variables, secret manager)
3. **Rotate secrets regularly**
4. **Implement rate limiting** for authentication endpoints
5. **Use strong password requirements**
6. **Enable MFA** for sensitive operations
7. **Log authentication events** for audit trails
8. **Implement token blacklisting** for logout
9. **Use short-lived access tokens** with refresh token rotation
10. **Validate all permissions** on the server side

## License

PROPRIETARY - AIT-CORE Soriano Mediadores
