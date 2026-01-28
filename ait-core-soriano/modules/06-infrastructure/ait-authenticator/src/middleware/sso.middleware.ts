import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../services/jwt.service';

/**
 * SSO Middleware for Cross-Platform Authentication
 *
 * This middleware enables Single Sign-On (SSO) across multiple applications
 * by validating JWT tokens from cookies or Authorization headers.
 *
 * Features:
 * - Validates access tokens from cookies or headers
 * - Automatically attaches user to request object
 * - Supports shared cookie domain for cross-platform SSO
 * - Clears invalid tokens automatically
 * - Does not block requests (authentication is optional at middleware level)
 */
@Injectable()
export class SSOMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SSOMiddleware.name);

  constructor(private jwtService: JwtTokenService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get token from multiple sources (priority order)
      const token = this.extractToken(req);

      if (!token) {
        // No token found, continue without authentication
        return next();
      }

      // Validate token
      const payload = await this.jwtService.validateAccessToken(token);

      if (!payload) {
        // Invalid token, clear cookie and continue
        this.clearAuthCookie(res);
        this.logger.debug('Invalid token detected, cookie cleared');
        return next();
      }

      // Attach user to request
      req['user'] = payload;

      this.logger.debug(`SSO: User ${payload.email} authenticated`);
    } catch (error) {
      this.logger.error('SSO middleware error:', error);
      this.clearAuthCookie(res);
    }

    next();
  }

  /**
   * Extract token from request (cookies or Authorization header)
   */
  private extractToken(req: Request): string | null {
    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Check access_token cookie
    const cookieToken = req.cookies?.access_token;
    if (cookieToken) {
      return cookieToken;
    }

    // 3. Check query parameter (for OAuth callbacks)
    const queryToken = req.query?.access_token as string;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }

  /**
   * Clear authentication cookie
   */
  private clearAuthCookie(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
  }
}

/**
 * Helper function to set SSO cookie
 * Use this when issuing tokens to enable cross-platform SSO
 */
export function setSSOCookie(res: Response, accessToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN; // e.g., '.sorianomediadores.es'

  res.cookie('access_token', accessToken, {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    domain: cookieDomain, // Shared domain for SSO
    maxAge: 15 * 60 * 1000, // 15 minutes (matches access token expiry)
    path: '/', // Available across all paths
  });
}

/**
 * Helper function to clear SSO cookie
 */
export function clearSSOCookie(res: Response): void {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  });
}
