/**
 * JWT Service
 *
 * Handles generation and verification of JSON Web Tokens
 */

import jwt from 'jsonwebtoken';
import { User } from '@ait-core/shared/types';
import { db, redis } from '../index';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_ISSUER = 'aintech';
const JWT_AUDIENCE = 'aintech-api';

// Token expiration times
const ACCESS_TOKEN_EXPIRATION = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRATION = '7d'; // 7 days

export interface TokenPayload {
  sub: string; // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JwtService {
  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRATION,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    logger.debug('Access token generated', { userId: user.id });
    return token;
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });

    logger.debug('Refresh token generated', { userId: user.id });
    return token;
  }

  /**
   * Generate both access and refresh tokens
   */
  static async generateTokenPair(user: User, metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save refresh token to database
    await this.saveRefreshToken(user.id, refreshToken, metadata);

    // Calculate expiration time in seconds
    const decoded: any = jwt.decode(accessToken);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }) as TokenPayload;

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      }) as TokenPayload;

      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  static decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }

  /**
   * Save refresh token to database
   */
  static async saveRefreshToken(
    userId: string,
    token: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      // Calculate expiration
      const decoded: any = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          token,
          expiresAt,
          metadata?.ipAddress || null,
          metadata?.userAgent || null
        ]
      );

      logger.debug('Refresh token saved to database', { userId });
    } catch (error) {
      logger.error('Error saving refresh token:', error);
      throw error;
    }
  }

  /**
   * Check if refresh token is valid and not revoked
   */
  static async isRefreshTokenValid(token: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT id FROM refresh_tokens
         WHERE token = $1
         AND revoked_at IS NULL
         AND used_at IS NULL
         AND expires_at > NOW()`,
        [token]
      );

      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error checking refresh token validity:', error);
      return false;
    }
  }

  /**
   * Mark refresh token as used
   */
  static async markRefreshTokenAsUsed(token: string): Promise<void> {
    try {
      await db.query(
        'UPDATE refresh_tokens SET used_at = NOW() WHERE token = $1',
        [token]
      );
    } catch (error) {
      logger.error('Error marking refresh token as used:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await db.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
        [token]
      );

      logger.info('Refresh token revoked');
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await db.query(
        'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId]
      );

      logger.info('All user refresh tokens revoked', { userId });
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Cache token in Redis for fast lookups (optional optimization)
   */
  static async cacheToken(userId: string, token: string, expiresIn: number): Promise<void> {
    try {
      const key = `token:${userId}`;
      await redis.setex(key, expiresIn, token);
    } catch (error) {
      // Redis cache is optional, don't throw on error
      logger.warn('Failed to cache token in Redis:', error);
    }
  }

  /**
   * Get cached token from Redis
   */
  static async getCachedToken(userId: string): Promise<string | null> {
    try {
      const key = `token:${userId}`;
      return await redis.get(key);
    } catch (error) {
      logger.warn('Failed to get cached token from Redis:', error);
      return null;
    }
  }

  /**
   * Invalidate cached token
   */
  static async invalidateCachedToken(userId: string): Promise<void> {
    try {
      const key = `token:${userId}`;
      await redis.del(key);
    } catch (error) {
      logger.warn('Failed to invalidate cached token:', error);
    }
  }
}

export default JwtService;
