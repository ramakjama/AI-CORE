// ============================================================================
// AI-IAM Auth Middleware - Express Authentication & Authorization Middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  TokenPayload,
  RateLimitConfig,
  SessionStatus
} from '../types';

// Configuration
interface AuthMiddlewareConfig {
  jwt: {
    secret: string;
    issuer?: string;
    audience?: string;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    message?: string;
    skipFailedRequests?: boolean;
    keyGenerator?: (req: Request) => string;
  };
  mfa: {
    required: boolean;
    exemptPaths?: string[];
  };
}

const DEFAULT_CONFIG: AuthMiddlewareConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    issuer: 'ai-iam',
    audience: 'ai-core'
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later',
    skipFailedRequests: false
  },
  mfa: {
    required: false,
    exemptPaths: ['/auth/login', '/auth/refresh', '/auth/mfa/verify']
  }
};

// In-memory stores (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();
const sessionStore = new Map<string, { status: SessionStatus; lastActivity: Date }>();

/**
 * Extend Express Request to include auth info
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      sessionId?: string;
      permissions?: string[];
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Create authentication middleware
 */
export function authenticate(config: Partial<AuthMiddlewareConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'No authorization token provided'
          }
        });
        return;
      }

      // Parse Bearer token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Invalid authorization header format. Use: Bearer <token>'
          }
        });
        return;
      }

      const token = parts[1];

      // Verify token
      let payload: TokenPayload;
      try {
        payload = jwt.verify(token, mergedConfig.jwt.secret || '', {
          issuer: mergedConfig.jwt.issuer,
          audience: mergedConfig.jwt.audience
        }) as unknown as TokenPayload;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          res.status(401).json({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Access token has expired'
            }
          });
          return;
        }
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token'
          }
        });
        return;
      }

      // Check session status (if tracking is enabled)
      const sessionInfo = sessionStore.get(payload.sessionId);
      if (sessionInfo && sessionInfo.status !== SessionStatus.ACTIVE) {
        res.status(401).json({
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: 'Session is no longer active'
          }
        });
        return;
      }

      // Update session activity
      if (sessionInfo) {
        sessionInfo.lastActivity = new Date();
      }

      // Attach user info to request
      req.user = payload;
      req.sessionId = payload.sessionId;
      req.permissions = payload.permissions;

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error'
        }
      });
    }
  };
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Create authorization middleware that checks for required permissions
 */
export function authorize(permissions: string | string[]) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

  return (req: Request, res: Response, next: NextFunction): void => {
    // User must be authenticated first
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const userPermissions = req.permissions || req.user.permissions || [];

    // Check if user has required permissions
    const hasAllPermissions = requiredPermissions.every(required => {
      // Check exact match
      if (userPermissions.includes(required)) return true;

      // Check for wildcard permissions
      const [resource, action] = required.split(':');

      // Check resource:* permission
      if (userPermissions.includes(`${resource}:*`)) return true;

      // Check *:action permission
      if (userPermissions.includes(`*:${action}`)) return true;

      // Check full wildcard
      if (userPermissions.includes('*:*') || userPermissions.includes('*')) return true;

      // Check manage permission (covers all actions on resource)
      if (userPermissions.includes(`${resource}:manage`)) return true;

      return false;
    });

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action',
          details: {
            required: requiredPermissions,
            available: userPermissions
          }
        }
      });
      return;
    }

    next();
  };
}

/**
 * Create authorization middleware that checks for any of the specified permissions
 */
export function authorizeAny(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const userPermissions = req.permissions || req.user.permissions || [];

    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some(required => {
      if (userPermissions.includes(required)) return true;

      const [resource, action] = required.split(':');
      if (userPermissions.includes(`${resource}:*`)) return true;
      if (userPermissions.includes(`*:${action}`)) return true;
      if (userPermissions.includes('*:*') || userPermissions.includes('*')) return true;
      if (userPermissions.includes(`${resource}:manage`)) return true;

      return false;
    });

    if (!hasAnyPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Create authorization middleware that checks for role membership
 */
export function authorizeRoles(roles: string | string[]) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const userRoles = req.user.roles || [];

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some(role =>
      userRoles.includes(role) ||
      userRoles.includes('superadmin') ||
      userRoles.includes('admin')
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: 'You do not have the required role to perform this action'
        }
      });
      return;
    }

    next();
  };
}

// ============================================================================
// MFA MIDDLEWARE
// ============================================================================

/**
 * Create middleware that requires MFA verification
 */
export function requireMFA(config: Partial<AuthMiddlewareConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip for exempt paths
    if (mergedConfig.mfa.exemptPaths?.includes(req.path)) {
      next();
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Check if MFA was verified for this session
    if (!req.user.mfaVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MFA_REQUIRED',
          message: 'Multi-factor authentication required'
        }
      });
      return;
    }

    next();
  };
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

/**
 * Create rate limiting middleware
 */
export function rateLimit(config: Partial<RateLimitConfig> = {}) {
  const defaultConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Generate key for rate limiting
    const key = mergedConfig.keyGenerator
      ? mergedConfig.keyGenerator(req as unknown)
      : getClientIdentifier(req);

    const now = new Date();
    let entry = rateLimitStore.get(key);

    // Create new entry if none exists or window has passed
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: new Date(now.getTime() + mergedConfig.windowMs)
      };
      rateLimitStore.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', mergedConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, mergedConfig.maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', entry.resetAt.getTime());

    // Check if limit exceeded
    if (entry.count > mergedConfig.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000);
      res.setHeader('Retry-After', retryAfter);

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter
          }
        }
      });
      return;
    }

    next();
  };
}

/**
 * Create login-specific rate limiting
 */
export function loginRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: unknown) => {
      const request = req as Request;
      const email = request.body?.email || '';
      const ip = getClientIdentifier(request);
      return `login:${email}:${ip}`;
    }
  });
}

/**
 * Create password reset rate limiting
 */
export function passwordResetRateLimit() {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (req: unknown) => {
      const request = req as Request;
      const email = request.body?.email || '';
      return `password-reset:${email}`;
    }
  });
}

// ============================================================================
// HELPER MIDDLEWARE
// ============================================================================

/**
 * Optional authentication - attaches user if token present but doesn't require it
 */
export function optionalAuth(config: Partial<AuthMiddlewareConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    try {
      const payload = jwt.verify(parts[1] || '', mergedConfig.jwt.secret || '', {
        issuer: mergedConfig.jwt.issuer,
        audience: mergedConfig.jwt.audience
      }) as unknown as TokenPayload;

      req.user = payload;
      req.sessionId = payload.sessionId;
      req.permissions = payload.permissions;
    } catch {
      // Ignore invalid token for optional auth
    }

    next();
  };
}

/**
 * Require specific organization membership
 */
export function requireOrganization(organizationId?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const targetOrgId = organizationId || req.params.organizationId;

    if (targetOrgId && req.user.organizationId !== targetOrgId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'ORGANIZATION_MISMATCH',
          message: 'You do not have access to this organization'
        }
      });
      return;
    }

    next();
  };
}

/**
 * Resource ownership check
 */
export function requireOwnership(userIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
      return;
    }

    const resourceUserId = req.params[userIdField] || req.body?.[userIdField];

    // Allow if user owns the resource or is admin
    const isOwner = resourceUserId === req.user.sub;
    const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('superadmin');

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_RESOURCE_OWNER',
          message: 'You do not have access to this resource'
        }
      });
      return;
    }

    next();
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Try various headers for client IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips?.trim() || 'unknown';
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const ip = Array.isArray(realIp) ? realIp[0] : realIp;
    return ip || 'unknown';
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Register session for tracking
 */
export function registerSession(sessionId: string, status: SessionStatus = SessionStatus.ACTIVE): void {
  sessionStore.set(sessionId, {
    status,
    lastActivity: new Date()
  });
}

/**
 * Update session status
 */
export function updateSessionStatus(sessionId: string, status: SessionStatus): void {
  const session = sessionStore.get(sessionId);
  if (session) {
    session.status = status;
  }
}

/**
 * Terminate session
 */
export function terminateSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Clear rate limit for identifier
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

// ============================================================================
// COMPOSITE MIDDLEWARE FACTORIES
// ============================================================================

/**
 * Create authenticated and authorized middleware chain
 */
export function authenticateAndAuthorize(
  permissions: string | string[],
  config: Partial<AuthMiddlewareConfig> = {}
) {
  return [
    authenticate(config),
    authorize(permissions)
  ];
}

/**
 * Create full protection middleware chain (auth + MFA + rate limit)
 */
export function fullProtection(
  permissions: string | string[],
  config: Partial<AuthMiddlewareConfig> = {}
) {
  const rateLimitConfig: Partial<RateLimitConfig> = config.rateLimit ? {
    windowMs: config.rateLimit.windowMs,
    maxRequests: config.rateLimit.maxRequests,
    skipFailedRequests: config.rateLimit.skipFailedRequests
  } : {};

  return [
    rateLimit(rateLimitConfig),
    authenticate(config),
    requireMFA(config),
    authorize(permissions)
  ];
}

/**
 * Create admin-only middleware chain
 */
export function adminOnly(config: Partial<AuthMiddlewareConfig> = {}) {
  return [
    authenticate(config),
    authorizeRoles(['admin', 'superadmin'])
  ];
}

// Export all middleware functions
export default {
  authenticate,
  authorize,
  authorizeAny,
  authorizeRoles,
  requireMFA,
  rateLimit,
  loginRateLimit,
  passwordResetRateLimit,
  optionalAuth,
  requireOrganization,
  requireOwnership,
  authenticateAndAuthorize,
  fullProtection,
  adminOnly,
  registerSession,
  updateSessionStatus,
  terminateSession,
  clearRateLimit
};
