/**
 * Two-Factor Authentication Service
 *
 * Implements TOTP (Time-based One-Time Password) authentication
 * Uses Google Authenticator compatible tokens
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { UserModel } from '../models/user.model';
import { logger } from '../utils/logger';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorService {
  private static readonly APP_NAME = 'AINTECH';
  private static readonly TOKEN_WINDOW = 1; // Allow 1 step before/after for clock skew

  /**
   * Generate 2FA secret and QR code for user
   * User scans QR code with Google Authenticator app
   */
  static async generateSecret(userId: string, userEmail: string): Promise<TwoFactorSecret> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.APP_NAME} (${userEmail})`,
        issuer: this.APP_NAME,
        length: 32
      });

      if (!secret.otpauth_url) {
        throw new Error('Failed to generate OTP auth URL');
      }

      // Generate QR code as data URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes (10 codes)
      const backupCodes = this.generateBackupCodes(10);

      logger.info('2FA secret generated', { userId });

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logger.error('Error generating 2FA secret:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA for user
   * User must verify token before 2FA is activated
   */
  static async enable2FA(
    userId: string,
    userEmail: string,
    token: string
  ): Promise<TwoFactorSecret> {
    try {
      // Generate new secret
      const { secret, qrCodeUrl, backupCodes } = await this.generateSecret(userId, userEmail);

      // Verify the token immediately to ensure it works
      const isValid = this.verifyToken(secret, token);

      if (!isValid) {
        throw new Error('Invalid verification token. Please check the code and try again.');
      }

      // Save secret to user
      await UserModel.enable2FA(userId, secret);

      // TODO: Save backup codes securely (hashed)
      // For now, we return them to the user to save

      logger.info('2FA enabled successfully', { userId });

      return {
        secret,
        qrCodeUrl,
        backupCodes
      };
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   * Requires current valid token
   */
  static async disable2FA(userId: string, token: string): Promise<void> {
    try {
      // Get user to verify current secret
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new Error('2FA is not enabled for this user');
      }

      // Verify token before disabling
      const isValid = this.verifyToken(user.twoFactorSecret, token);

      if (!isValid) {
        throw new Error('Invalid verification token');
      }

      // Disable 2FA
      await UserModel.disable2FA(userId);

      logger.info('2FA disabled successfully', { userId });
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.TOKEN_WINDOW
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Verify 2FA token for user login
   */
  static async verify2FAToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        logger.warn('2FA verification attempt for non-existent user', { userId });
        return false;
      }

      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        logger.warn('2FA verification attempt but 2FA not enabled', { userId });
        return false;
      }

      const isValid = this.verifyToken(user.twoFactorSecret, token);

      if (isValid) {
        logger.info('2FA token verified successfully', { userId });
      } else {
        logger.warn('Invalid 2FA token', { userId });
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying 2FA token for user:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   * These can be used if user loses access to their authenticator app
   */
  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = this.generateRandomCode(8);
      codes.push(code);
    }

    return codes;
  }

  /**
   * Generate random alphanumeric code
   */
  private static generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Format as XXXX-XXXX for readability
    if (length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }

    return code;
  }

  /**
   * Verify backup code
   * Note: Backup codes should be single-use
   */
  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // TODO: Implement backup code verification
      // This would check against stored hashed backup codes
      // and mark the code as used

      logger.warn('Backup code verification not yet implemented', { userId });
      return false;
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Get current TOTP token (for testing/debugging only)
   * DO NOT expose this in production API
   */
  static getCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32'
    });
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      return user?.twoFactorEnabled || false;
    } catch (error) {
      logger.error('Error checking 2FA status:', error);
      return false;
    }
  }
}

export default TwoFactorService;
