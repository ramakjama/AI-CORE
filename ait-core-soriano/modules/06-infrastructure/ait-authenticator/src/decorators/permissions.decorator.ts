import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route
 *
 * @param permissions - Array of permission strings (e.g., ['policies:read', 'policies:create'])
 *
 * @example
 * ```typescript
 * @Get()
 * @Permissions('policies:read')
 * async findAll() {
 *   return this.policiesService.findAll();
 * }
 * ```
 *
 * Permission format: "resource:action:scope"
 * - resource: The resource type (e.g., "policies", "claims", "users")
 * - action: The action (e.g., "read", "create", "update", "delete")
 * - scope: Optional scope (e.g., "own" for user-specific resources)
 *
 * Examples:
 * - "policies:read" - Read all policies
 * - "policies:create" - Create policies
 * - "policies:*" - All policy actions
 * - "policies:read:own" - Read only own policies
 * - "*" - All permissions (super admin)
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
