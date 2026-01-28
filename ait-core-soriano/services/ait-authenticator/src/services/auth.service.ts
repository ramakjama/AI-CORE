/**
 * Authentication Service
 *
 * Handles user authentication, registration, and session management
 */

import { User } from '@ait-core/shared/types';
import { UserModel } from '../models/user.model';
import { JwtService, AuthTokens } from './jwt.service';
import { hashPassword, comparePassword } from '../utils/password';
import { logger } from '../utils/logger';
import { db } from '../index';

export interface LoginResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  requires2FA?: boolean;
  tempToken?: string;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'supervisor' | 'agent' | 'customer';
}

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  static async login(
    email: string,
    password: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<LoginResult> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);

      if (!user) {
        logger.warn('Login attempt for non-existent user', { email });
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check if user has a password (OAuth-only users don't)
      if (!user.passwordHash) {
        logger.warn('Login attempt for OAuth-only user', { email });
        return {
          success: false,
          message: 'Please use social login for this account'
        };
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        logger.warn('Invalid password attempt', { userId: user.id, email });

        // Log failed login attempt
        await this.logAuditEvent(user.id, 'login_failed', metadata);

        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check user status
      if (user.status !== 'active') {
        logger.warn('Login attempt for inactive user', { userId: user.id, status: user.status });
        return {
          success: false,
          message: `Account is ${user.status}. Please contact support.`
        };
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = JwtService.generateAccessToken(user);

        logger.info('2FA required for user', { userId: user.id });

        return {
          success: true,
          requires2FA: true,
          tempToken,
          message: 'Two-factor authentication required'
        };
      }

      // Generate tokens
      const tokens = await JwtService.generateTokenPair(user, metadata);

      // Update last login timestamp
      await UserModel.updateLastLogin(user.id);

      // Create session
      await this.createSession(user.id, metadata);

      // Log successful login
      await this.logAuditEvent(user.id, 'login_success', metadata);

      // Remove sensitive data before returning
      const safeUser = this.sanitizeUser(user);

      logger.info('User logged in successfully', { userId: user.id, email });

      return {
        success: true,
        user: safeUser,
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(data.email);

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const user = await UserModel.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || 'customer',
        emailVerified: false
      });

      // TODO: Send verification email
      // await EmailService.sendVerificationEmail(user.email, verificationToken);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      // Log registration
      await this.logAuditEvent(user.id, 'user_registered');

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user (revoke tokens)
   */
  static async logout(refreshToken: string, userId?: string): Promise<void> {
    try {
      // Revoke refresh token
      await JwtService.revokeRefreshToken(refreshToken);

      if (userId) {
        // Invalidate cached tokens
        await JwtService.invalidateCachedToken(userId);

        // Log logout
        await this.logAuditEvent(userId, 'logout');

        logger.info('User logged out', { userId });
      }
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<LoginResult> {
    try {
      // Verify refresh token
      const payload = JwtService.verifyRefreshToken(refreshToken);

      // Check if token is valid in database
      const isValid = await JwtService.isRefreshTokenValid(refreshToken);

      if (!isValid) {
        logger.warn('Invalid or revoked refresh token', { userId: payload.sub });
        return {
          success: false,
          message: 'Invalid or expired refresh token'
        };
      }

      // Get user
      const user = await UserModel.findById(payload.sub);

      if (!user || user.status !== 'active') {
        logger.warn('Refresh token for invalid user', { userId: payload.sub });
        return {
          success: false,
          message: 'User not found or inactive'
        };
      }

      // Mark old refresh token as used
      await JwtService.markRefreshTokenAsUsed(refreshToken);

      // Generate new tokens
      const tokens = await JwtService.generateTokenPair(user, metadata);

      const safeUser = this.sanitizeUser(user);

      logger.info('Access token refreshed', { userId: user.id });

      return {
        success: true,
        user: safeUser,
        tokens
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Failed to refresh token'
      };
    }
  }

  /**
   * Initiate password reset
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists or not (security)
        logger.info('Password reset requested for non-existent email', { email });
        return;
      }

      // Generate reset token
      const resetToken = JwtService.generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token
      await UserModel.setPasswordResetToken(user.id, resetToken, expiresAt);

      // TODO: Send password reset email
      // await EmailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info('Password reset email sent', { userId: user.id });

      await this.logAuditEvent(user.id, 'password_reset_requested');
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find user by reset token
      const user = await UserModel.findByPasswordResetToken(token);

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await UserModel.updatePassword(user.id, passwordHash);

      // Revoke all existing refresh tokens (force re-login)
      await JwtService.revokeAllUserTokens(user.id);

      logger.info('Password reset successfully', { userId: user.id });

      await this.logAuditEvent(user.id, 'password_reset_completed');
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password (when user is authenticated)
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await UserModel.findById(userId);

      if (!user || !user.passwordHash) {
        throw new Error('User not found or invalid operation');
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, user.passwordHash);

      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password
      await UserModel.updatePassword(userId, passwordHash);

      logger.info('Password changed successfully', { userId });

      await this.logAuditEvent(userId, 'password_changed');
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Verify email using verification token
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      // TODO: Implement email verification
      // For now, this is a placeholder

      logger.info('Email verified');
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Create session record
   */
  private static async createSession(
    userId: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.query(
        `INSERT INTO sessions (user_id, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          metadata?.ipAddress || null,
          metadata?.userAgent || null,
          expiresAt
        ]
      );
    } catch (error) {
      logger.error('Error creating session:', error);
      // Don't throw - session creation is not critical
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
          'auth',
          metadata?.ipAddress || null,
          metadata?.userAgent || null,
          true
        ]
      );
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // Don't throw - audit logging is not critical
    }
  }

  /**
   * Remove sensitive data from user object
   */
  private static sanitizeUser(user: User): User {
    const { passwordHash, twoFactorSecret, ...safeUser } = user as any;
    return safeUser;
  }

  /**
   * Get user by ID (for authenticated requests)
   */
  static async getCurrentUser(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error getting current user:', error);
      throw error;
    }
  }
}

export default AuthService;
