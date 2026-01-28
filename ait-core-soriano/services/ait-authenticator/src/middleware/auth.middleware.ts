/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../services/jwt.service';
import { UserModel } from '../models/user.model';
import { User } from '@ait-core/shared/types';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided'
        }
      });
      return;
    }

    // Check Bearer format
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>'
        }
      });
      return;
    }

    const token = parts[1];

    // Verify token
    let payload;
    try {
      payload = JwtService.verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: error.message || 'Invalid or expired token'
        }
      });
      return;
    }

    // Get user from database
    const user = await UserModel.findById(payload.sub);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Check user status
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: `User account is ${user.status}`
        }
      });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't fail if not
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
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

    const token = parts[1];

    try {
      const payload = JwtService.verifyAccessToken(token);
      const user = await UserModel.findById(payload.sub);

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user.id;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional authentication failed:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
}

export default authenticate;
