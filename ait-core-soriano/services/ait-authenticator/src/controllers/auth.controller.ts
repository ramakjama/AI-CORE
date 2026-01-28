/**
 * Authentication Controller
 *
 * Handles all authentication-related HTTP requests
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { OAuthService } from '../services/oauth.service';
import { TwoFactorService } from '../services/twoFactor.service';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorTokenSchema,
  changePasswordSchema,
  validate
} from '../utils/validation';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  /**
   * POST /auth/login
   * Email/password login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const { email, password } = validate(loginSchema, req.body);

    // Get metadata
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    // Attempt login
    const result = await AuthService.login(email, password, metadata);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: result.message || 'Login failed'
        }
      });
      return;
    }

    // Check if 2FA is required
    if (result.requires2FA) {
      res.json({
        success: true,
        requires2FA: true,
        tempToken: result.tempToken,
        message: 'Please provide two-factor authentication code'
      });
      return;
    }

    // Successful login
    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens!.accessToken,
        refreshToken: result.tokens!.refreshToken,
        expiresIn: result.tokens!.expiresIn
      }
    });
  });

  /**
   * POST /auth/register
   * Register new user
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const data = validate(registerSchema, req.body);

    // Register user
    const user = await AuthService.register(data);

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Registration successful. Please check your email to verify your account.'
      }
    });
  });

  /**
   * POST /auth/logout
   * Logout user (revoke tokens)
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = validate(refreshTokenSchema, req.body);
    const userId = req.user?.id;

    await AuthService.logout(refreshToken, userId);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = validate(refreshTokenSchema, req.body);

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    const result = await AuthService.refreshAccessToken(refreshToken, metadata);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: result.message || 'Failed to refresh token'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens!.accessToken,
        refreshToken: result.tokens!.refreshToken,
        expiresIn: result.tokens!.expiresIn
      }
    });
  });

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  static me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    // Get fresh user data
    const user = await AuthService.getCurrentUser(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  });

  /**
   * POST /auth/forgot-password
   * Request password reset
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = validate(forgotPasswordSchema, req.body);

    await AuthService.forgotPassword(email);

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions.'
    });
  });

  /**
   * POST /auth/reset-password
   * Reset password with token
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = validate(resetPasswordSchema, req.body);

    await AuthService.resetPassword(token, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  });

  /**
   * POST /auth/change-password
   * Change password (authenticated)
   */
  static changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    const { currentPassword, newPassword } = validate(changePasswordSchema, req.body);

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  /**
   * POST /auth/2fa/enable
   * Enable 2FA for user
   */
  static enable2FA = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    const { token } = validate(twoFactorTokenSchema, req.body);

    const result = await TwoFactorService.enable2FA(
      req.user.id,
      req.user.email,
      token
    );

    res.json({
      success: true,
      data: {
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
        message: 'Two-factor authentication enabled successfully. Please save your backup codes in a safe place.'
      }
    });
  });

  /**
   * POST /auth/2fa/verify
   * Verify 2FA token
   */
  static verify2FA = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    const { token } = validate(twoFactorTokenSchema, req.body);

    const isValid = await TwoFactorService.verify2FAToken(req.user.id, token);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_2FA_TOKEN',
          message: 'Invalid two-factor authentication code'
        }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Two-factor authentication code verified'
    });
  });

  /**
   * POST /auth/2fa/disable
   * Disable 2FA for user
   */
  static disable2FA = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
      return;
    }

    const { token } = validate(twoFactorTokenSchema, req.body);

    await TwoFactorService.disable2FA(req.user.id, token);

    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  });

  /**
   * GET /auth/google
   * Redirect to Google OAuth
   */
  static googleAuth = (req: Request, res: Response, next: NextFunction) => {
    // Handled by Passport middleware
    // This is just a placeholder
  };

  /**
   * GET /auth/google/callback
   * Google OAuth callback
   */
  static googleCallback = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'OAUTH_FAILED',
          message: 'Google authentication failed'
        }
      });
      return;
    }

    // Generate tokens for the OAuth user
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    const tokens = await AuthService.login(
      req.user.email,
      '', // No password for OAuth
      metadata
    );

    // Redirect to frontend with tokens
    // In production, this should redirect to your frontend with tokens in URL/cookie
    res.json({
      success: true,
      data: {
        user: req.user,
        tokens
      }
    });
  });

  /**
   * GET /auth/microsoft
   * Redirect to Microsoft OAuth
   */
  static microsoftAuth = (req: Request, res: Response, next: NextFunction) => {
    // Handled by Passport middleware
  };

  /**
   * GET /auth/microsoft/callback
   * Microsoft OAuth callback
   */
  static microsoftCallback = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'OAUTH_FAILED',
          message: 'Microsoft authentication failed'
        }
      });
      return;
    }

    // Generate tokens for the OAuth user
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    const tokens = await AuthService.login(
      req.user.email,
      '',
      metadata
    );

    res.json({
      success: true,
      data: {
        user: req.user,
        tokens
      }
    });
  });
}

export default AuthController;
