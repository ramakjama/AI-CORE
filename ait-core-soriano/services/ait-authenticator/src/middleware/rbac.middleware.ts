/**
 * RBAC Middleware (Role-Based Access Control)
 *
 * Checks user roles and permissions
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../index';
import { logger } from '../utils/logger';

/**
 * Require specific role(s)
 * User must have at least one of the specified roles
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          details: {
            required: roles,
            current: userRole
          }
        }
      });
      return;
    }

    next();
  };
}

/**
 * Require specific permission(s)
 * User must have at least one of the specified permissions
 */
export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const userRole = req.user.role;

      // Get user's permissions based on role
      const result = await db.query(
        `SELECT p.name
         FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role = $1`,
        [userRole]
      );

      const userPermissions = result.rows.map(row => row.name);

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.id,
          userRole,
          userPermissions,
          requiredPermissions: permissions
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action',
            details: {
              required: permissions
            }
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check permissions'
        }
      });
    }
  };
}

/**
 * Require user to be admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Require user to be admin or supervisor
 */
export const requireAdminOrSupervisor = requireRole('admin', 'supervisor');

/**
 * Require user to be staff (admin, supervisor, or agent)
 */
export const requireStaff = requireRole('admin', 'supervisor', 'agent');

/**
 * Check if user owns the resource
 * Useful for ensuring users can only access their own data
 */
export function requireOwnership(getUserIdFromRequest: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const resourceOwnerId = getUserIdFromRequest(req);

    // Admins can access everything
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check ownership
    if (req.user.id !== resourceOwnerId) {
      logger.warn('Access denied - not resource owner', {
        userId: req.user.id,
        resourceOwnerId
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own resources'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Require ownership or staff role
 * Users can access their own data, staff can access any data
 */
export function requireOwnershipOrStaff(getUserIdFromRequest: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const resourceOwnerId = getUserIdFromRequest(req);

    // Staff can access everything
    if (['admin', 'supervisor', 'agent'].includes(req.user.role)) {
      next();
      return;
    }

    // Check ownership
    if (req.user.id !== resourceOwnerId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        }
      });
      return;
    }

    next();
  };
}

export default {
  requireRole,
  requirePermission,
  requireAdmin,
  requireAdminOrSupervisor,
  requireStaff,
  requireOwnership,
  requireOwnershipOrStaff
};
