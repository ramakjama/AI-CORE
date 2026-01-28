/**
 * JWT Token Management
 */

import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { AuthenticationError } from '@ait-core/shared/errors';
import { createLogger } from '@ait-core/shared/logger';
import type { JWTPayload, JWTTokens } from './types';

const logger = createLogger('@ait-core/auth:jwt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload, options?: SignOptions): string {
  try {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'ait-core',
        audience: 'ait-core-api',
        ...options,
      }
    );
  } catch (error) {
    logger.error('Failed to generate token', { error });
    throw new AuthenticationError('Failed to generate token');
  }
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, options?: SignOptions): string {
  try {
    return jwt.sign(
      { userId, type: 'refresh' },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'ait-core',
        audience: 'ait-core-api',
        ...options,
      }
    );
  } catch (error) {
    logger.error('Failed to generate refresh token', { error });
    throw new AuthenticationError('Failed to generate refresh token');
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: JWTPayload): JWTTokens {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: JWT_EXPIRES_IN,
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, options?: VerifyOptions): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ait-core',
      audience: 'ait-core-api',
      ...options,
    }) as JWTPayload & jwt.JwtPayload;

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    logger.error('Failed to verify token', { error });
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ait-core',
      audience: 'ait-core-api',
    }) as { userId: string; type: string } & jwt.JwtPayload;

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    logger.error('Failed to verify refresh token', { error });
    throw new AuthenticationError('Refresh token verification failed');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    logger.error('Failed to decode token', { error });
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}
