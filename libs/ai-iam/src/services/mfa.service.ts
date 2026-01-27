// ============================================================================
// AI-IAM MFA Service - Multi-Factor Authentication
// ============================================================================

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import {
  MFAMethod,
  ServiceResult,
  UserCredential,
  AuthProvider,
  AuditEventType
} from '../types';

// Configuration
interface MFAConfig {
  totp: {
    issuer: string;
    window: number;
    step: number;
    digits: number;
  };
  codes: {
    length: number;
    expiration: number; // milliseconds
    maxAttempts: number;
  };
  recovery: {
    count: number;
    length: number;
  };
  encryption: {
    secret: string;
  };
}

const DEFAULT_MFA_CONFIG: MFAConfig = {
  totp: {
    issuer: 'AI-Core',
    window: 1,
    step: 30,
    digits: 6
  },
  codes: {
    length: 6,
    expiration: 5 * 60 * 1000, // 5 minutes
    maxAttempts: 3
  },
  recovery: {
    count: 10,
    length: 8
  },
  encryption: {
    secret: process.env.MFA_ENCRYPTION_SECRET || 'mfa-encryption-secret-change-in-production'
  }
};

// Interfaces
interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

interface VerificationCode {
  userId: string;
  code: string;
  method: MFAMethod;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

/**
 * MFA Service
 * Handles multi-factor authentication including TOTP, SMS, Email, and recovery codes
 */
export class MFAService {
  private config: MFAConfig;

  // In-memory stores (replace with database in production)
  private credentials: Map<string, UserCredential> = new Map();
  private pendingCodes: Map<string, VerificationCode> = new Map();
  private usedRecoveryCodes: Set<string> = new Set();

  constructor(config: Partial<MFAConfig> = {}) {
    this.config = { ...DEFAULT_MFA_CONFIG, ...config };
  }

  // ============================================================================
  // MFA SETUP & MANAGEMENT
  // ============================================================================

  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string, method: MFAMethod): Promise<ServiceResult<TOTPSetupResult | null>> {
    try {
      const credential = this.getOrCreateCredential(userId);

      switch (method) {
        case MFAMethod.TOTP:
          return this.setupTOTP(userId, credential);

        case MFAMethod.SMS:
        case MFAMethod.EMAIL:
          // For SMS/Email, we just mark it as enabled
          // Actual setup requires phone/email verification
          return {
            success: true,
            data: null
          };

        case MFAMethod.BACKUP_CODES:
          const codes = this.generateRecoveryCodes(userId);
          return {
            success: true,
            data: {
              secret: '',
              qrCodeUrl: '',
              manualEntryKey: '',
              backupCodes: codes
            }
          };

        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_MFA_METHOD',
              message: `MFA method ${method} is not supported`
            }
          };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MFA_SETUP_ERROR',
          message: error instanceof Error ? error.message : 'Failed to setup MFA'
        }
      };
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<ServiceResult<void>> {
    const credential = this.credentials.get(userId);
    if (!credential) {
      return {
        success: false,
        error: {
          code: 'CREDENTIAL_NOT_FOUND',
          message: 'User credentials not found'
        }
      };
    }

    // Clear MFA settings
    credential.totpSecret = undefined;
    credential.totpEnabled = false;
    credential.backupCodes = undefined;
    credential.updatedAt = new Date();

    // Log audit event
    this.logAuditEvent(userId, AuditEventType.MFA_DISABLED, {});

    return { success: true };
  }

  // ============================================================================
  // TOTP (Time-based One-Time Password)
  // ============================================================================

  /**
   * Generate TOTP secret for a user
   */
  async generateTOTPSecret(userId: string): Promise<ServiceResult<TOTPSetupResult>> {
    const credential = this.getOrCreateCredential(userId);
    return this.setupTOTP(userId, credential);
  }

  /**
   * Setup TOTP for a user
   */
  private async setupTOTP(
    userId: string,
    credential: UserCredential
  ): Promise<ServiceResult<TOTPSetupResult>> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.config.totp.issuer}:${userId}`,
        issuer: this.config.totp.issuer,
        length: 32
      });

      // Encrypt and store secret (not enabled until verified)
      const encryptedSecret = this.encryptSecret(secret.base32);
      credential.totpSecret = encryptedSecret;
      credential.totpEnabled = false;
      credential.updatedAt = new Date();

      // Generate QR code
      const otpauthUrl = secret.otpauth_url ||
        `otpauth://totp/${this.config.totp.issuer}:${userId}?secret=${secret.base32}&issuer=${this.config.totp.issuer}`;
      const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

      // Generate backup codes
      const backupCodes = this.generateRecoveryCodes(userId);

      return {
        success: true,
        data: {
          secret: secret.base32,
          qrCodeUrl,
          manualEntryKey: secret.base32,
          backupCodes
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TOTP_SETUP_ERROR',
          message: error instanceof Error ? error.message : 'Failed to setup TOTP'
        }
      };
    }
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTPCode(userId: string, code: string): Promise<ServiceResult<boolean>> {
    const credential = this.credentials.get(userId);
    if (!credential || !credential.totpSecret) {
      return {
        success: false,
        error: {
          code: 'TOTP_NOT_CONFIGURED',
          message: 'TOTP is not configured for this user'
        }
      };
    }

    try {
      // Decrypt secret
      const decryptedSecret = this.decryptSecret(credential.totpSecret);

      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: decryptedSecret,
        encoding: 'base32',
        token: code,
        window: this.config.totp.window,
        step: this.config.totp.step
      });

      if (isValid) {
        // If TOTP wasn't enabled yet, enable it now (first successful verification)
        if (!credential.totpEnabled) {
          credential.totpEnabled = true;
          credential.updatedAt = new Date();

          this.logAuditEvent(userId, AuditEventType.MFA_ENABLED, {
            method: MFAMethod.TOTP
          });
        }

        this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
          method: MFAMethod.TOTP,
          success: true
        });
      } else {
        this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
          method: MFAMethod.TOTP,
          success: false
        });
      }

      return {
        success: true,
        data: isValid
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TOTP_VERIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify TOTP code'
        }
      };
    }
  }

  // ============================================================================
  // SMS VERIFICATION
  // ============================================================================

  /**
   * Send SMS verification code
   */
  async sendSMSCode(userId: string, _phoneNumber?: string): Promise<ServiceResult<{ expiresAt: Date }>> {
    try {
      // Generate code
      const code = this.generateNumericCode(this.config.codes.length);

      // Store pending code
      const verification: VerificationCode = {
        userId,
        code,
        method: MFAMethod.SMS,
        expiresAt: new Date(Date.now() + this.config.codes.expiration),
        attempts: 0,
        createdAt: new Date()
      };

      this.pendingCodes.set(`${userId}:sms`, verification);

      // In production, integrate with SMS provider (Twilio, AWS SNS, etc.)
      // For now, log the code (REMOVE IN PRODUCTION!)
      console.log(`[MFA] SMS Code for ${userId}: ${code}`);

      return {
        success: true,
        data: {
          expiresAt: verification.expiresAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SMS_SEND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send SMS code'
        }
      };
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(userId: string, code: string): Promise<ServiceResult<boolean>> {
    return this.verifyCode(userId, code, MFAMethod.SMS, 'sms');
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  /**
   * Send email verification code
   */
  async sendEmailCode(userId: string, _email?: string): Promise<ServiceResult<{ expiresAt: Date }>> {
    try {
      // Generate code
      const code = this.generateNumericCode(this.config.codes.length);

      // Store pending code
      const verification: VerificationCode = {
        userId,
        code,
        method: MFAMethod.EMAIL,
        expiresAt: new Date(Date.now() + this.config.codes.expiration),
        attempts: 0,
        createdAt: new Date()
      };

      this.pendingCodes.set(`${userId}:email`, verification);

      // In production, integrate with email provider (SendGrid, AWS SES, etc.)
      // For now, log the code (REMOVE IN PRODUCTION!)
      console.log(`[MFA] Email Code for ${userId}: ${code}`);

      return {
        success: true,
        data: {
          expiresAt: verification.expiresAt
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EMAIL_SEND_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send email code'
        }
      };
    }
  }

  /**
   * Verify email code
   */
  async verifyEmailCode(userId: string, code: string): Promise<ServiceResult<boolean>> {
    return this.verifyCode(userId, code, MFAMethod.EMAIL, 'email');
  }

  // ============================================================================
  // RECOVERY CODES
  // ============================================================================

  /**
   * Get recovery codes for a user
   */
  async getRecoveryCodes(userId: string): Promise<ServiceResult<string[]>> {
    const credential = this.credentials.get(userId);
    if (!credential || !credential.backupCodes) {
      // Generate new codes if none exist
      const codes = this.generateRecoveryCodes(userId);
      return {
        success: true,
        data: codes
      };
    }

    // Decrypt and return existing codes
    const decryptedCodes = credential.backupCodes.map(code =>
      this.decryptSecret(code)
    );

    return {
      success: true,
      data: decryptedCodes
    };
  }

  /**
   * Use a recovery code
   */
  async useRecoveryCode(userId: string, code: string): Promise<ServiceResult<boolean>> {
    const credential = this.credentials.get(userId);
    if (!credential || !credential.backupCodes || credential.backupCodes.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_RECOVERY_CODES',
          message: 'No recovery codes available'
        }
      };
    }

    // Check if code was already used
    const codeHash = this.hashCode(`${userId}:${code}`);
    if (this.usedRecoveryCodes.has(codeHash)) {
      return {
        success: false,
        error: {
          code: 'CODE_ALREADY_USED',
          message: 'This recovery code has already been used'
        }
      };
    }

    // Find and validate the code
    const normalizedCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
    let codeFound = false;
    let codeIndex = -1;

    for (let i = 0; i < credential.backupCodes.length; i++) {
      const backupCode = credential.backupCodes[i];
      if (!backupCode) continue;
      const decryptedCode = this.decryptSecret(backupCode);
      const normalizedDecrypted = decryptedCode.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normalizedDecrypted === normalizedCode) {
        codeFound = true;
        codeIndex = i;
        break;
      }
    }

    if (!codeFound) {
      this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
        method: MFAMethod.BACKUP_CODES,
        success: false
      });

      return {
        success: true,
        data: false
      };
    }

    // Mark code as used
    this.usedRecoveryCodes.add(codeHash);

    // Remove code from available codes
    credential.backupCodes.splice(codeIndex, 1);
    credential.updatedAt = new Date();

    this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
      method: MFAMethod.BACKUP_CODES,
      success: true,
      remainingCodes: credential.backupCodes.length
    });

    return {
      success: true,
      data: true
    };
  }

  /**
   * Regenerate recovery codes
   */
  async regenerateRecoveryCodes(userId: string): Promise<ServiceResult<string[]>> {
    // Clear used codes for this user
    for (const hash of this.usedRecoveryCodes) {
      if (hash.startsWith(userId)) {
        this.usedRecoveryCodes.delete(hash);
      }
    }

    const codes = this.generateRecoveryCodes(userId);
    return {
      success: true,
      data: codes
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Verify a generic verification code
   */
  private async verifyCode(
    userId: string,
    code: string,
    method: MFAMethod,
    key: string
  ): Promise<ServiceResult<boolean>> {
    const verificationKey = `${userId}:${key}`;
    const verification = this.pendingCodes.get(verificationKey);

    if (!verification) {
      return {
        success: false,
        error: {
          code: 'NO_PENDING_CODE',
          message: 'No verification code pending'
        }
      };
    }

    // Check expiration
    if (verification.expiresAt < new Date()) {
      this.pendingCodes.delete(verificationKey);
      return {
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Verification code has expired'
        }
      };
    }

    // Check attempts
    if (verification.attempts >= this.config.codes.maxAttempts) {
      this.pendingCodes.delete(verificationKey);
      return {
        success: false,
        error: {
          code: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded'
        }
      };
    }

    // Verify code
    const isValid = verification.code === code;

    if (isValid) {
      this.pendingCodes.delete(verificationKey);
      this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
        method,
        success: true
      });
    } else {
      verification.attempts++;
      this.logAuditEvent(userId, AuditEventType.MFA_CHALLENGE, {
        method,
        success: false,
        attemptsRemaining: this.config.codes.maxAttempts - verification.attempts
      });
    }

    return {
      success: true,
      data: isValid
    };
  }

  /**
   * Generate recovery codes
   */
  private generateRecoveryCodes(userId: string): string[] {
    const credential = this.getOrCreateCredential(userId);
    const codes: string[] = [];
    const encryptedCodes: string[] = [];

    for (let i = 0; i < this.config.recovery.count; i++) {
      const code = this.generateAlphanumericCode(this.config.recovery.length);
      codes.push(code);
      encryptedCodes.push(this.encryptSecret(code));
    }

    credential.backupCodes = encryptedCodes;
    credential.updatedAt = new Date();

    return codes;
  }

  /**
   * Generate numeric code
   */
  private generateNumericCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Generate alphanumeric code
   */
  private generateAlphanumericCode(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
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
   * Encrypt secret
   */
  private encryptSecret(secret: string): string {
    return CryptoJS.AES.encrypt(secret, this.config.encryption.secret).toString();
  }

  /**
   * Decrypt secret
   */
  private decryptSecret(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, this.config.encryption.secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Hash code for tracking used codes
   */
  private hashCode(code: string): string {
    return CryptoJS.SHA256(code).toString();
  }

  /**
   * Get or create credential for user
   */
  private getOrCreateCredential(userId: string): UserCredential {
    let credential = this.credentials.get(userId);
    if (!credential) {
      credential = {
        id: uuidv4(),
        userId,
        provider: AuthProvider.LOCAL,
        totpEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.credentials.set(userId, credential);
    }
    return credential;
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    userId: string,
    type: AuditEventType,
    details: Record<string, unknown>
  ): void {
    console.log(`[MFA AUDIT] ${type} - User: ${userId}`, details);
  }

  // ============================================================================
  // PUBLIC UTILITY METHODS
  // ============================================================================

  /**
   * Check if user has MFA enabled
   */
  isMFAEnabled(userId: string): boolean {
    const credential = this.credentials.get(userId);
    return credential?.totpEnabled ?? false;
  }

  /**
   * Get available MFA methods for user
   */
  getAvailableMethods(userId: string): MFAMethod[] {
    const credential = this.credentials.get(userId);
    const methods: MFAMethod[] = [];

    if (credential?.totpEnabled) {
      methods.push(MFAMethod.TOTP);
    }

    if (credential?.backupCodes && credential.backupCodes.length > 0) {
      methods.push(MFAMethod.BACKUP_CODES);
    }

    // SMS and Email would be checked against user profile
    // For now, we return them as always available options
    methods.push(MFAMethod.SMS, MFAMethod.EMAIL);

    return methods;
  }

  /**
   * Verify any MFA method
   */
  async verifyMFA(userId: string, code: string, method: MFAMethod): Promise<ServiceResult<boolean>> {
    switch (method) {
      case MFAMethod.TOTP:
        return this.verifyTOTPCode(userId, code);

      case MFAMethod.SMS:
        return this.verifySMSCode(userId, code);

      case MFAMethod.EMAIL:
        return this.verifyEmailCode(userId, code);

      case MFAMethod.BACKUP_CODES:
        return this.useRecoveryCode(userId, code);

      default:
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_METHOD',
            message: `MFA method ${method} is not supported`
          }
        };
    }
  }
}

// Export singleton instance
export const mfaService = new MFAService();
