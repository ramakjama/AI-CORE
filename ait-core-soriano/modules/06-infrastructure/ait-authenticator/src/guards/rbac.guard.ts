import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../services/jwt.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user in request, deny access
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user permissions from JWT payload
    const userPermissions: string[] = user.permissions || [];

    // Check if user has required permissions
    const hasPermission = this.matchPermissions(requiredPermissions, userPermissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }

  /**
   * Match required permissions against user permissions
   * Supports:
   * - Exact match: "policies:read" === "policies:read"
   * - Wildcard: "*" grants all permissions
   * - Resource wildcard: "policies:*" matches "policies:read", "policies:create", etc.
   * - Scope matching: "policies:read:own" for user-specific resources
   */
  private matchPermissions(required: string[], userPermissions: string[]): boolean {
    // Super admin with wildcard has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check if user has at least one required permission
    return required.some(requiredPerm => {
      return this.hasPermission(userPermissions, requiredPerm);
    });
  }

  /**
   * Check if user has a specific permission
   */
  private hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Check for exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for wildcard match
    const [reqResource, reqAction, reqScope] = requiredPermission.split(':');

    for (const userPerm of userPermissions) {
      const [resource, action, scope] = userPerm.split(':');

      // Resource must match
      if (resource !== reqResource) continue;

      // Check action wildcard (e.g., "policies:*" matches "policies:read")
      if (action === '*') return true;

      // Action must match
      if (action !== reqAction) continue;

      // If no scope specified in requirement, grant access
      if (!reqScope) return true;

      // Check scope match (e.g., "policies:read:own" requires "policies:read:own" or "policies:read:*")
      if (scope === '*' || scope === reqScope) return true;
    }

    return false;
  }
}
