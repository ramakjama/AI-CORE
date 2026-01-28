/**
 * OAuth Service
 *
 * Handles OAuth authentication with Google and Microsoft
 */

import { User } from '@ait-core/shared/types';
import { UserModel } from '../models/user.model';
import { JwtService, AuthTokens } from './jwt.service';
import { logger } from '../utils/logger';
import { db } from '../index';

export interface OAuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: 'google' | 'microsoft';
}

export interface OAuthLoginResult {
  user: User;
  tokens: AuthTokens;
  isNewUser: boolean;
}

export class OAuthService {
  /**
   * Handle Google OAuth login
   * Called after successful Google authentication
   */
  static async googleLogin(
    profile: OAuthProfile,
    accessToken: string,
    refreshToken: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<OAuthLoginResult> {
    return this.handleOAuthLogin(
      'google',
      profile,
      accessToken,
      refreshToken,
      metadata
    );
  }

  /**
   * Handle Microsoft OAuth login
   * Called after successful Microsoft authentication
   */
  static async microsoftLogin(
    profile: OAuthProfile,
    accessToken: string,
    refreshToken: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<OAuthLoginResult> {
    return this.handleOAuthLogin(
      'microsoft',
      profile,
      accessToken,
      refreshToken,
      metadata
    );
  }

  /**
   * Generic OAuth login handler
   */
  private static async handleOAuthLogin(
    provider: 'google' | 'microsoft',
    profile: OAuthProfile,
    accessToken: string,
    refreshToken: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<OAuthLoginResult> {
    try {
      // Check if OAuth identity exists
      const oauthIdentity = await this.findOAuthIdentity(provider, profile.id);

      let user: User;
      let isNewUser = false;

      if (oauthIdentity) {
        // Existing OAuth user
        logger.info('Existing OAuth identity found', {
          provider,
          userId: oauthIdentity.user_id
        });

        // Update OAuth tokens
        await this.updateOAuthTokens(
          oauthIdentity.id,
          accessToken,
          refreshToken,
          profile
        );

        // Get user
        const existingUser = await UserModel.findById(oauthIdentity.user_id);

        if (!existingUser) {
          throw new Error('User not found for OAuth identity');
        }

        user = existingUser;
      } else {
        // Check if user exists by email
        const existingUser = await UserModel.findByEmail(profile.email);

        if (existingUser) {
          // Link OAuth to existing user
          logger.info('Linking OAuth to existing user', {
            provider,
            userId: existingUser.id
          });

          await this.createOAuthIdentity(
            existingUser.id,
            provider,
            profile.id,
            accessToken,
            refreshToken,
            profile
          );

          user = existingUser;
        } else {
          // Create new user
          logger.info('Creating new user from OAuth', { provider, email: profile.email });

          user = await UserModel.create({
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: 'customer',
            emailVerified: true, // OAuth emails are pre-verified
            metadata: {
              oauthProvider: provider,
              profilePicture: profile.picture
            }
          });

          // Create OAuth identity
          await this.createOAuthIdentity(
            user.id,
            provider,
            profile.id,
            accessToken,
            refreshToken,
            profile
          );

          isNewUser = true;
        }
      }

      // Check user status
      if (user.status !== 'active') {
        throw new Error(`Account is ${user.status}. Please contact support.`);
      }

      // Generate JWT tokens
      const tokens = await JwtService.generateTokenPair(user, metadata);

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Log audit event
      await this.logAuditEvent(user.id, `oauth_login_${provider}`, metadata);

      // Remove sensitive data
      const safeUser = this.sanitizeUser(user);

      logger.info('OAuth login successful', {
        provider,
        userId: user.id,
        isNewUser
      });

      return {
        user: safeUser,
        tokens,
        isNewUser
      };
    } catch (error) {
      logger.error('OAuth login error:', error);
      throw error;
    }
  }

  /**
   * Link OAuth account to existing user
   */
  static async linkOAuthAccount(
    userId: string,
    provider: 'google' | 'microsoft',
    profile: OAuthProfile,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      // Check if OAuth identity already exists
      const existing = await this.findOAuthIdentity(provider, profile.id);

      if (existing) {
        if (existing.user_id === userId) {
          // Already linked to this user - just update tokens
          await this.updateOAuthTokens(existing.id, accessToken, refreshToken, profile);
          logger.info('OAuth account tokens updated', { provider, userId });
        } else {
          throw new Error('This OAuth account is already linked to another user');
        }
      } else {
        // Create new OAuth identity
        await this.createOAuthIdentity(
          userId,
          provider,
          profile.id,
          accessToken,
          refreshToken,
          profile
        );

        logger.info('OAuth account linked successfully', { provider, userId });
      }

      await this.logAuditEvent(userId, `oauth_account_linked_${provider}`);
    } catch (error) {
      logger.error('Error linking OAuth account:', error);
      throw error;
    }
  }

  /**
   * Unlink OAuth account from user
   */
  static async unlinkOAuthAccount(
    userId: string,
    provider: 'google' | 'microsoft'
  ): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM oauth_identities WHERE user_id = $1 AND provider = $2',
        [userId, provider]
      );

      if (result.rowCount === 0) {
        throw new Error('OAuth account not found');
      }

      logger.info('OAuth account unlinked', { provider, userId });

      await this.logAuditEvent(userId, `oauth_account_unlinked_${provider}`);
    } catch (error) {
      logger.error('Error unlinking OAuth account:', error);
      throw error;
    }
  }

  /**
   * Get user's OAuth identities
   */
  static async getUserOAuthIdentities(userId: string): Promise<Array<{
    id: string;
    provider: string;
    createdAt: Date;
  }>> {
    try {
      const result = await db.query(
        `SELECT id, provider, created_at as "createdAt"
         FROM oauth_identities
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting OAuth identities:', error);
      throw error;
    }
  }

  /**
   * Find OAuth identity
   */
  private static async findOAuthIdentity(
    provider: string,
    providerUserId: string
  ): Promise<any | null> {
    try {
      const result = await db.query(
        'SELECT * FROM oauth_identities WHERE provider = $1 AND provider_user_id = $2',
        [provider, providerUserId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding OAuth identity:', error);
      throw error;
    }
  }

  /**
   * Create OAuth identity
   */
  private static async createOAuthIdentity(
    userId: string,
    provider: string,
    providerUserId: string,
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO oauth_identities (
          user_id,
          provider,
          provider_user_id,
          access_token,
          refresh_token,
          profile_data
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          provider,
          providerUserId,
          accessToken,
          refreshToken || null,
          JSON.stringify(profile)
        ]
      );

      logger.debug('OAuth identity created', { provider, userId });
    } catch (error) {
      logger.error('Error creating OAuth identity:', error);
      throw error;
    }
  }

  /**
   * Update OAuth tokens
   */
  private static async updateOAuthTokens(
    identityId: string,
    accessToken: string,
    refreshToken: string,
    profile: OAuthProfile
  ): Promise<void> {
    try {
      await db.query(
        `UPDATE oauth_identities
         SET access_token = $2,
             refresh_token = $3,
             profile_data = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [
          identityId,
          accessToken,
          refreshToken || null,
          JSON.stringify(profile)
        ]
      );

      logger.debug('OAuth tokens updated', { identityId });
    } catch (error) {
      logger.error('Error updating OAuth tokens:', error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  private static async logAuditEvent(
    userId: string,
    action: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await db.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, success)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          action,
          'oauth',
          metadata?.ipAddress || null,
          metadata?.userAgent || null,
          true
        ]
      );
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // Don't throw
    }
  }

  /**
   * Remove sensitive data from user object
   */
  private static sanitizeUser(user: User): User {
    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }
}

export default OAuthService;
