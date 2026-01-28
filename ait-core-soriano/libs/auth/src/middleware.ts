/**
 * Authentication and Authorization Middleware
 */

import { extractTokenFromHeader, verifyToken } from './jwt';
import { validateSession } from './session';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './permissions';
import { AuthenticationError, AuthorizationError } from '@ait-core/shared/errors';
import { createLogger } from '@ait-core/shared/logger';
import type { AuthContext, AuthMiddleware, PermissionMiddleware } from './types';

const logger = createLogger('@ait-core/auth:middleware');

/**
 * Authentication middleware
 * Verifies JWT token and loads user context
 */
export function authenticate(): AuthMiddleware {
  return async (req: any, res: any, next: any) => {
    try {
      // Extract token from header
      const token = extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        throw new AuthenticationError('No authorization token provided');
      }

      // Verify token
      const payload = verifyToken(token);

      // Attach user context to request
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
      } as AuthContext;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        });
      }

      logger.error('Authentication middleware error', { error });
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  };
}

/**
 * Session authentication middleware
 * Verifies session token and loads user context
 */
export function authenticateSession(): AuthMiddleware {
  return async (req: any, res: any, next: any) => {
    try {
      // Extract session token from cookie or header
      const sessionToken =
        req.cookies?.sessionToken ||
        extractTokenFromHeader(req.headers.authorization);

      if (!sessionToken) {
        throw new AuthenticationError('No session token provided');
      }

      // Validate session
      const sessionData = await validateSession(sessionToken);

      if (!sessionData) {
        throw new AuthenticationError('Invalid or expired session');
      }

      // Attach user context to request
      req.user = {
        userId: sessionData.user.id,
        email: sessionData.user.email,
        role: sessionData.user.role,
        permissions: sessionData.user.permissions,
      } as AuthContext;

      req.session = sessionData.session;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        });
      }

      logger.error('Session authentication middleware error', { error });
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  };
}

/**
 * Authorization middleware
 * Requires specific permission
 */
export function requirePermission(permission: string): PermissionMiddleware {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user as AuthContext;

      if (!user) {
        throw new AuthenticationError('User not authenticated');
      }

      const hasAccess = await hasPermission(user.userId, permission);

      if (!hasAccess) {
        throw new AuthorizationError(`Permission required: ${permission}`);
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      logger.error('Authorization middleware error', { error });
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authorization failed',
        },
      });
    }
  };
}

/**
 * Require any of the permissions
 */
export function requireAnyPermission(...permissions: string[]): PermissionMiddleware {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user as AuthContext;

      if (!user) {
        throw new AuthenticationError('User not authenticated');
      }

      const hasAccess = await hasAnyPermission(user.userId, permissions);

      if (!hasAccess) {
        throw new AuthorizationError(
          `One of these permissions required: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: error.message },
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }

      logger.error('Authorization middleware error', { error });
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization failed' },
      });
    }
  };
}

/**
 * Require all permissions
 */
export function requireAllPermissions(...permissions: string[]): PermissionMiddleware {
  return async (req: any, res: any, next: any) => {
    try {
      const user = req.user as AuthContext;

      if (!user) {
        throw new AuthenticationError('User not authenticated');
      }

      const hasAccess = await hasAllPermissions(user.userId, permissions);

      if (!hasAccess) {
        throw new AuthorizationError(
          `All permissions required: ${permissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: error.message },
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }

      logger.error('Authorization middleware error', { error });
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization failed' },
      });
    }
  };
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]): PermissionMiddleware {
  return (req: any, res: any, next: any) => {
    try {
      const user = req.user as AuthContext;

      if (!user) {
        throw new AuthenticationError('User not authenticated');
      }

      if (!roles.includes(user.role)) {
        throw new AuthorizationError(`Role required: ${roles.join(' or ')}`);
      }

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: error.message },
        });
      }

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: error.message },
        });
      }

      logger.error('Role middleware error', { error });
      return res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authorization failed' },
      });
    }
  };
}
