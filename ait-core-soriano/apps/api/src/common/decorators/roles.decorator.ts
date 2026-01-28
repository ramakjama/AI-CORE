import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 *
 * Marks a route with required roles for access.
 * Works in conjunction with RolesGuard to enforce role-based access control.
 *
 * @example
 * ```typescript
 * @Roles('ADMIN', 'SUPER_ADMIN')
 * @Get('admin-only')
 * adminOnlyRoute() {
 *   return 'This endpoint requires admin access';
 * }
 * ```
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
