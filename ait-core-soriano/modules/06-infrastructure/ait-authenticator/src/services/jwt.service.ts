import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  permissions: string[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);

  // Token expiration times
  private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Generate access and refresh token pair
   */
  async generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<TokenPair> {
    const permissions = await this.getRolePermissions(role);

    const basePayload = {
      sub: userId,
      email,
      role,
      permissions,
    };

    // Generate access token
    const accessToken = this.nestJwtService.sign(
      { ...basePayload, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      },
    );

    // Generate refresh token
    const refreshToken = this.nestJwtService.sign(
      { ...basePayload, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      },
    );

    // Store refresh token in Redis with 7 days TTL
    const redisKey = this.getRefreshTokenKey(userId);
    await this.redis.set(redisKey, refreshToken, 'EX', this.REFRESH_TOKEN_TTL);

    this.logger.log(`Token pair generated for user ${userId}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.nestJwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (payload.type !== 'access') {
        this.logger.warn(`Invalid token type: ${payload.type}`);
        return null;
      }

      // Check if user token has been revoked globally
      const isRevoked = await this.isTokenRevoked(payload.sub);
      if (isRevoked) {
        this.logger.warn(`Access token revoked for user ${payload.sub}`);
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error('Access token validation failed:', error.message);
      return null;
    }
  }

  /**
   * Validate refresh token
   */
  async validateRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.nestJwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        this.logger.warn(`Invalid token type: ${payload.type}`);
        return null;
      }

      // Check if token exists in Redis (not revoked)
      const redisKey = this.getRefreshTokenKey(payload.sub);
      const storedToken = await this.redis.get(redisKey);

      if (storedToken !== token) {
        this.logger.warn(`Refresh token not found or mismatch for user ${payload.sub}`);
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.error('Refresh token validation failed:', error.message);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.validateRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new token pair
    return this.generateTokenPair(payload.sub, payload.email, payload.role);
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    const redisKey = this.getRefreshTokenKey(userId);
    await this.redis.del(redisKey);
    this.logger.log(`Refresh token revoked for user ${userId}`);
  }

  /**
   * Revoke all tokens for a user (force logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // Delete refresh token
    await this.revokeRefreshToken(userId);

    // Mark user tokens as revoked (for access token validation)
    const revokeKey = this.getTokenRevokeKey(userId);
    await this.redis.set(revokeKey, '1', 'EX', 900); // 15 minutes (access token expiry)

    this.logger.log(`All tokens revoked for user ${userId}`);
  }

  /**
   * Check if user's tokens are revoked
   */
  private async isTokenRevoked(userId: string): Promise<boolean> {
    const revokeKey = this.getTokenRevokeKey(userId);
    return await this.redis.exists(revokeKey);
  }

  /**
   * Get role-based permissions
   */
  async getRolePermissions(role: UserRole): Promise<string[]> {
    const PERMISSIONS_MATRIX: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: ['*'], // Full access
      [UserRole.ADMIN]: [
        'policies:*',
        'claims:*',
        'customers:*',
        'users:read',
        'users:update',
        'invoices:*',
        'reports:*',
      ],
      [UserRole.MANAGER]: [
        'policies:read',
        'policies:create',
        'policies:update',
        'claims:read',
        'claims:create',
        'claims:update',
        'customers:read',
        'customers:create',
        'customers:update',
        'invoices:read',
        'reports:read',
      ],
      [UserRole.USER]: [
        'policies:read:own',
        'policies:create:own',
        'claims:read:own',
        'claims:create:own',
        'invoices:read:own',
        'profile:read',
        'profile:update',
      ],
      [UserRole.GUEST]: [
        'policies:read:own',
        'profile:read',
      ],
    };

    return PERMISSIONS_MATRIX[role] || [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Check for wildcard (full access)
    if (userPermissions.includes('*')) {
      return true;
    }

    // Check for exact match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Check for resource wildcard (e.g., "policies:*" matches "policies:read")
    const [reqResource, reqAction] = requiredPermission.split(':');

    for (const perm of userPermissions) {
      const [resource, action] = perm.split(':');

      if (resource === reqResource && action === '*') {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(perm => this.hasPermission(userPermissions, perm));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(perm => this.hasPermission(userPermissions, perm));
  }

  /**
   * Decode token without validation (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.nestJwtService.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get remaining TTL for refresh token
   */
  async getRefreshTokenTTL(userId: string): Promise<number> {
    const redisKey = this.getRefreshTokenKey(userId);
    return await this.redis.ttl(redisKey);
  }

  /**
   * Helper: Get Redis key for refresh token
   */
  private getRefreshTokenKey(userId: string): string {
    return `auth:refresh_token:${userId}`;
  }

  /**
   * Helper: Get Redis key for token revocation
   */
  private getTokenRevokeKey(userId: string): string {
    return `auth:revoked:${userId}`;
  }
}
