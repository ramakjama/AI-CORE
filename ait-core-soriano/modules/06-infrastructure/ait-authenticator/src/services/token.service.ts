import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { oauthConfig } from '../config/oauth.config';
import { cacheService } from '../config/redis.config';
import { logger } from '../utils/logger.utils';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  scopes: string[];
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtOptions: jwt.SignOptions;

  constructor() {
    this.jwtSecret = oauthConfig.jwt.secret;
    this.jwtOptions = {
      issuer: oauthConfig.jwt.issuer,
      audience: oauthConfig.jwt.audience,
      algorithm: oauthConfig.jwt.algorithm as jwt.Algorithm
    };
  }

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    userId: string,
    email: string,
    roles: string[],
    scopes: string[]
  ): Promise<TokenPair> {
    const accessToken = await this.generateAccessToken(userId, email, roles, scopes);
    const refreshToken = await this.generateRefreshToken(userId, email, roles, scopes);

    const expiresIn = this.parseExpiry(oauthConfig.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate access token (short-lived)
   */
  async generateAccessToken(
    userId: string,
    email: string,
    roles: string[],
    scopes: string[]
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      roles,
      scopes,
      type: 'access'
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      ...this.jwtOptions,
      expiresIn: oauthConfig.accessTokenExpiry,
      jwtid: uuidv4()
    });

    return token;
  }

  /**
   * Generate refresh token (long-lived)
   */
  async generateRefreshToken(
    userId: string,
    email: string,
    roles: string[],
    scopes: string[]
  ): Promise<string> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      roles,
      scopes,
      type: 'refresh'
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      ...this.jwtOptions,
      expiresIn: oauthConfig.refreshTokenExpiry,
      jwtid: uuidv4()
    });

    // Store refresh token in Redis
    const expirySeconds = this.parseExpiry(oauthConfig.refreshTokenExpiry);
    await cacheService.set(`refresh_token:${userId}:${token}`, true, expirySeconds);

    return token;
  }

  /**
   * Generate authorization code for OAuth2 flow
   */
  async generateAuthorizationCode(
    userId: string,
    clientId: string,
    redirectUri: string,
    scopes: string[]
  ): Promise<string> {
    const code = crypto.randomBytes(32).toString('base64url');

    const codeData = {
      userId,
      clientId,
      redirectUri,
      scopes,
      createdAt: Date.now()
    };

    await cacheService.set(
      `auth_code:${code}`,
      codeData,
      oauthConfig.authorizationCodeExpiry
    );

    return code;
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, this.jwtOptions) as TokenPayload;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await cacheService.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify and decode refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, this.jwtOptions) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in Redis
      const exists = await cacheService.exists(`refresh_token:${decoded.sub}:${token}`);
      if (!exists) {
        throw new Error('Refresh token not found or expired');
      }

      return decoded;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw error;
    }
  }

  /**
   * Revoke access token
   */
  async revokeAccessToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as jwt.JwtPayload;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cacheService.set(`blacklist:${token}`, true, ttl);
        }
      }
    } catch (error) {
      logger.error('Failed to revoke access token:', error);
      throw error;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await cacheService.del(`refresh_token:${userId}:${token}`);
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    // Note: In production, implement proper pattern-based deletion
    logger.info(`Revoking all tokens for user: ${userId}`);
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    return value * units[unit];
  }
}

export const tokenService = new TokenService();
