import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { mfaService } from '../services/mfa.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger.utils';
import { authenticationAttempts } from '../utils/metrics.utils';

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validate password strength
      const passwordValidation = userService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        throw new AppError(400, passwordValidation.errors.join(', '));
      }

      const user = await userService.create({ email, password, name });

      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        user.roles,
        ['read:profile', 'write:profile']
      );

      authenticationAttempts.inc({ method: 'register', status: 'success' });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          ...tokens
        }
      });
    } catch (error) {
      authenticationAttempts.inc({ method: 'register', status: 'failure' });
      next(error);
    }
  }

  /**
   * Login with email and password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await userService.validateCredentials(email, password);
      if (!user) {
        authenticationAttempts.inc({ method: 'login', status: 'failure' });
        throw new AppError(401, 'Invalid credentials');
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // Generate temporary session token
        const sessionToken = await tokenService.generateAccessToken(
          user.id,
          user.email,
          [],
          ['mfa:pending']
        );

        res.json({
          success: true,
          data: {
            mfaRequired: true,
            sessionToken
          }
        });
        return;
      }

      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        user.roles,
        ['read:profile', 'write:profile']
      );

      authenticationAttempts.inc({ method: 'login', status: 'success' });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          ...tokens
        }
      });
    } catch (error) {
      authenticationAttempts.inc({ method: 'login', status: 'failure' });
      next(error);
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionToken, code } = req.body;

      const payload = await tokenService.verifyAccessToken(sessionToken);
      if (!payload.scopes.includes('mfa:pending')) {
        throw new AppError(401, 'Invalid session');
      }

      const user = await userService.findById(payload.sub);
      if (!user || !user.mfaSecret) {
        throw new AppError(401, 'MFA not configured');
      }

      const isValid = mfaService.verifyToken(user.mfaSecret, code);
      if (!isValid) {
        authenticationAttempts.inc({ method: 'mfa', status: 'failure' });
        throw new AppError(401, 'Invalid MFA code');
      }

      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        user.roles,
        ['read:profile', 'write:profile']
      );

      authenticationAttempts.inc({ method: 'mfa', status: 'success' });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          ...tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const payload = await tokenService.verifyRefreshToken(refreshToken);
      const user = await userService.findById(payload.sub);

      if (!user) {
        throw new AppError(401, 'User not found');
      }

      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        user.roles,
        payload.scopes
      );

      // Revoke old refresh token
      await tokenService.revokeRefreshToken(user.id, refreshToken);

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await tokenService.revokeAccessToken(token);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const user = await userService.findById(userId);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          avatar: user.avatar,
          mfaEnabled: user.mfaEnabled
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
