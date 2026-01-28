import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { oauthConfig } from '../config/oauth.config';

class MFAService {
  /**
   * Generate MFA secret
   */
  generateSecret(userEmail: string): { secret: string; otpauthUrl: string } {
    const secret = speakeasy.generateSecret({
      name: `${oauthConfig.mfa.issuer} (${userEmail})`,
      issuer: oauthConfig.mfa.issuer,
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || ''
    };
  }

  /**
   * Generate QR code for MFA setup
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verify MFA token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: oauthConfig.mfa.window
    });
  }

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

export const mfaService = new MFAService();
