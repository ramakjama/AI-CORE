import { Request, Response, NextFunction } from 'express';
import { createError } from './error-handler';
import { logger } from '../lib/logger';

export type Role = 'admin' | 'manager' | 'operator' | 'viewer';

export type Permission = 'read' | 'write' | 'execute' | 'delete';

/**
 * Role-based permissions matrix
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: ['read', 'write', 'execute', 'delete'],
  manager: ['read', 'write', 'execute'],
  operator: ['read', 'execute'],
  viewer: ['read'],
};

/**
 * Check if role has permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Require specific role(s)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'NO_AUTH'));
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      return next(
        createError(
          'Insufficient permissions',
          403,
          'FORBIDDEN',
          {
            userRole,
            requiredRoles: allowedRoles,
          }
        )
      );
    }

    next();
  };
}

/**
 * Require specific permission(s)
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401, 'NO_AUTH'));
    }

    const userRole = req.user.role as Role;
    const userPermissions = ROLE_PERMISSIONS[userRole];

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.userId,
        userRole,
        userPermissions,
        requiredPermissions,
        path: req.path,
      });

      return next(
        createError(
          'Insufficient permissions',
          403,
          'FORBIDDEN',
          {
            userRole,
            userPermissions,
            requiredPermissions,
          }
        )
      );
    }

    next();
  };
}

/**
 * Check if current user is admin
 */
export function isAdmin(req: Request): boolean {
  return req.user?.role === 'admin';
}

/**
 * Check if current user can perform action
 */
export function canPerformAction(req: Request, permission: Permission): boolean {
  if (!req.user) return false;

  const userRole = req.user.role as Role;
  return hasPermission(userRole, permission);
}
