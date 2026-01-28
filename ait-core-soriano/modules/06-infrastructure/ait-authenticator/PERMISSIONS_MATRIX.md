# AIT-AUTHENTICATOR - Permissions Matrix

## Overview

This document defines the **Role-Based Access Control (RBAC)** permissions matrix for the AIT-CORE ecosystem. Each role has a specific set of permissions that determine what actions users can perform.

## Permission Format

Permissions follow the format: `resource:action:scope`

- **resource**: The entity being accessed (e.g., `policies`, `claims`, `customers`)
- **action**: The operation (e.g., `read`, `create`, `update`, `delete`)
- **scope**: Optional scope modifier (e.g., `own` for user-specific resources)

### Special Permissions

- `*` - Wildcard permission (full access to everything)
- `policies:*` - All actions on policies resource
- `policies:read:own` - Read only own policies

## Roles Overview

| Role | Description | Level |
|------|-------------|-------|
| `SUPER_ADMIN` | Full system access, no restrictions | 5 |
| `ADMIN` | Administrative access, manage most resources | 4 |
| `MANAGER` | Departmental management, limited administrative rights | 3 |
| `USER` | Standard user access, own data only | 2 |
| `GUEST` | Read-only access, minimal permissions | 1 |

## Complete Permissions Matrix

### SUPER_ADMIN

**Description**: System administrators with unrestricted access to all features and data.

| Permission | Description |
|------------|-------------|
| `*` | Full access to all resources and actions |

**Use cases**:
- System configuration
- User management (all users)
- Security audits
- Database access
- Module management

---

### ADMIN

**Description**: Administrators who manage the insurance operations but have some restrictions on system-level configurations.

| Resource | Permissions | Description |
|----------|-------------|-------------|
| **Policies** | `policies:*` | Full policy management |
| **Claims** | `claims:*` | Full claims management |
| **Customers** | `customers:*` | Full customer management |
| **Users** | `users:read`, `users:update` | View and update users (cannot delete) |
| **Invoices** | `invoices:*` | Full invoice management |
| **Payments** | `payments:*` | Full payment management |
| **Reports** | `reports:*` | Generate and view all reports |
| **Documents** | `documents:*` | Full document management |
| **Notifications** | `notifications:*` | Manage notifications |
| **Settings** | `settings:read`, `settings:update` | View and update settings |

**Cannot do**:
- Delete users
- Access system-level configurations
- Modify RBAC permissions
- Access audit logs

---

### MANAGER

**Description**: Department managers who oversee teams and handle operational tasks.

| Resource | Permissions | Description |
|----------|-------------|-------------|
| **Policies** | `policies:read`, `policies:create`, `policies:update` | Manage policies (no delete) |
| **Claims** | `claims:read`, `claims:create`, `claims:update` | Manage claims (no delete) |
| **Customers** | `customers:read`, `customers:create`, `customers:update` | Manage customers (no delete) |
| **Invoices** | `invoices:read`, `invoices:create` | View and create invoices |
| **Payments** | `payments:read` | View payments only |
| **Reports** | `reports:read` | View department reports |
| **Documents** | `documents:read`, `documents:create`, `documents:update` | Manage documents |
| **Notifications** | `notifications:read`, `notifications:create` | View and send notifications |
| **Tasks** | `tasks:*` | Full task management |
| **Teams** | `teams:read`, `teams:update` | Manage own team |

**Cannot do**:
- Delete policies, claims, or customers
- Approve payments
- Access financial reports
- Manage users

---

### USER

**Description**: Standard users who manage their own data and interactions.

| Resource | Permissions | Description |
|----------|-------------|-------------|
| **Policies** | `policies:read:own`, `policies:create:own` | View and create own policies |
| **Claims** | `claims:read:own`, `claims:create:own` | View and create own claims |
| **Invoices** | `invoices:read:own` | View own invoices |
| **Documents** | `documents:read:own`, `documents:upload:own` | Manage own documents |
| **Notifications** | `notifications:read:own` | View own notifications |
| **Profile** | `profile:read`, `profile:update` | Manage own profile |
| **Messages** | `messages:read:own`, `messages:create` | View and send messages |

**Cannot do**:
- Access other users' data
- Modify policies after creation
- Delete any resources
- Access reports
- Manage teams

---

### GUEST

**Description**: Limited access users, typically for prospects or read-only stakeholders.

| Resource | Permissions | Description |
|----------|-------------|-------------|
| **Policies** | `policies:read:own` | View own policies only |
| **Profile** | `profile:read` | View own profile |
| **Documents** | `documents:read:own` | View own documents |
| **Invoices** | `invoices:read:own` | View own invoices |

**Cannot do**:
- Create or modify any data
- Access other users' information
- Send messages
- Upload documents

---

## Permission Matrix Table

| Permission | SUPER_ADMIN | ADMIN | MANAGER | USER | GUEST |
|------------|-------------|-------|---------|------|-------|
| **Policies** |
| `policies:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `policies:read:own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `policies:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `policies:create:own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `policies:update` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `policies:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Claims** |
| `claims:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `claims:read:own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `claims:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `claims:create:own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `claims:update` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `claims:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Customers** |
| `customers:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `customers:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `customers:update` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `customers:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| `users:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `users:create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `users:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Invoices** |
| `invoices:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `invoices:read:own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `invoices:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `invoices:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `invoices:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Payments** |
| `payments:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `payments:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `payments:approve` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `payments:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| `reports:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `reports:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `reports:export` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Documents** |
| `documents:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `documents:read:own` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `documents:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `documents:upload:own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `documents:update` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `documents:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Accounting** |
| `accounting:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `accounting:create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `accounting:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `accounting:delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Notifications** |
| `notifications:read` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `notifications:read:own` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `notifications:create` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `notifications:delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Profile** |
| `profile:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `profile:update` | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Settings** |
| `settings:read` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `settings:update` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** |
| `audit:read` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `audit:export` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Usage Examples

### Example 1: Protect a Route with RBAC

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RBACGuard } from '../guards/rbac.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('policies')
@UseGuards(JwtAuthGuard, RBACGuard)
export class PoliciesController {
  // Only users with 'policies:read' permission can access
  @Get()
  @Permissions('policies:read')
  async findAll() {
    return this.policiesService.findAll();
  }

  // Only users with 'policies:create' permission can access
  @Post()
  @Permissions('policies:create')
  async create(@Body() data) {
    return this.policiesService.create(data);
  }

  // Multiple permissions (user needs ANY of these)
  @Delete(':id')
  @Permissions('policies:delete', 'admin:*')
  async delete(@Param('id') id: string) {
    return this.policiesService.delete(id);
  }
}
```

### Example 2: Check Permissions in Service

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { JwtTokenService } from './jwt.service';

@Injectable()
export class PoliciesService {
  constructor(private jwtService: JwtTokenService) {}

  async findAll(userPermissions: string[]) {
    // Check if user has permission
    if (!this.jwtService.hasPermission(userPermissions, 'policies:read')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.policiesRepository.findAll();
  }
}
```

### Example 3: Dynamic Permission Checks

```typescript
// Check if user owns the resource
async updatePolicy(userId: string, policyId: string, userPermissions: string[]) {
  const policy = await this.findOne(policyId);

  // Check if user has general update permission
  if (this.jwtService.hasPermission(userPermissions, 'policies:update')) {
    return this.update(policy, data);
  }

  // Check if user has own-resource permission AND owns the policy
  if (
    this.jwtService.hasPermission(userPermissions, 'policies:update:own') &&
    policy.userId === userId
  ) {
    return this.update(policy, data);
  }

  throw new ForbiddenException('You can only update your own policies');
}
```

---

## Adding New Permissions

To add new permissions:

1. **Define the permission** in `jwt.service.ts` `PERMISSIONS_MATRIX`
2. **Update this document** with the new permission
3. **Apply the permission** using the `@Permissions()` decorator
4. **Test thoroughly** to ensure proper access control

---

## Security Best Practices

1. **Principle of Least Privilege**: Always assign the minimum required permissions
2. **Regular Audits**: Review permissions regularly and remove unused ones
3. **Scope Resources**: Use `:own` scope whenever possible for user-specific data
4. **Avoid Wildcards**: Only use `*` for super admin roles
5. **Test Permissions**: Always test both positive and negative cases
6. **Document Changes**: Update this matrix when adding/modifying permissions

---

## Related Documentation

- [AIT_AUTHENTICATOR_API.md](./AIT_AUTHENTICATOR_API.md) - API endpoints documentation
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - How to integrate authentication
- [README.md](./README.md) - General overview

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Maintainer**: AIN TECH - AIT-CORE Team
