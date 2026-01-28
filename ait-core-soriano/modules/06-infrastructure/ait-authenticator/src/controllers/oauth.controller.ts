import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { JwtTokenService } from '../services/jwt.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { setSSOCookie, clearSSOCookie } from '../middleware/sso.middleware';

/**
 * OAuth2 Authentication Controller
 *
 * Handles OAuth2 flows for Google and Microsoft authentication
 * Supports SSO cross-platform authentication
 */
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtTokenService,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================================
  // GOOGLE OAUTH2
  // ============================================================================

  /**
   * Initiate Google OAuth2 login
   * GET /auth/google
   */
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirects to Google OAuth consent screen
  }

  /**
   * Google OAuth2 callback
   * GET /auth/google/callback
   */
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedException('Google authentication failed');
      }

      // Generate JWT tokens
      const tokens = await this.jwtService.generateTokenPair(
        user.id,
        user.email,
        user.role,
      );

      // Set SSO cookie for cross-platform authentication
      setSSOCookie(res, tokens.accessToken);

      this.logger.log(`Google OAuth successful for user ${user.email}`);

      // Redirect to frontend with tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/error?message=google_auth_failed`);
    }
  }

  // ============================================================================
  // MICROSOFT OAUTH2
  // ============================================================================

  /**
   * Initiate Microsoft OAuth2 login
   * GET /auth/microsoft
   */
  @Get('microsoft')
  @Public()
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Redirects to Microsoft OAuth consent screen
  }

  /**
   * Microsoft OAuth2 callback
   * GET /auth/microsoft/callback
   */
  @Get('microsoft/callback')
  @Public()
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedException('Microsoft authentication failed');
      }

      // Generate JWT tokens
      const tokens = await this.jwtService.generateTokenPair(
        user.id,
        user.email,
        user.role,
      );

      // Set SSO cookie for cross-platform authentication
      setSSOCookie(res, tokens.accessToken);

      this.logger.log(`Microsoft OAuth successful for user ${user.email}`);

      // Redirect to frontend with tokens
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/auth/callback?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Microsoft OAuth callback error:', error);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/error?message=microsoft_auth_failed`);
    }
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Refresh access token using refresh token
   * POST /auth/refresh
   */
  @Post('refresh')
  @Public()
  async refresh(@Body('refreshToken') refreshToken: string, @Res() res: Response) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const newTokens = await this.jwtService.refreshAccessToken(refreshToken);

      // Update SSO cookie
      setSSOCookie(res, newTokens.accessToken);

      this.logger.log('Access token refreshed successfully');

      return res.status(HttpStatus.OK).json({
        success: true,
        data: newTokens,
      });
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout (revoke refresh token)
   * POST /auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user, @Res() res: Response) {
    try {
      // Revoke refresh token
      await this.jwtService.revokeRefreshToken(user.sub);

      // Clear SSO cookie
      clearSSOCookie(res);

      this.logger.log(`User ${user.email} logged out successfully`);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      this.logger.error('Logout error:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  /**
   * Logout from all devices (revoke all tokens)
   * POST /auth/logout-all
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user, @Res() res: Response) {
    try {
      // Revoke all tokens for user
      await this.jwtService.revokeAllUserTokens(user.sub);

      // Clear SSO cookie
      clearSSOCookie(res);

      this.logger.log(`User ${user.email} logged out from all devices`);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    } catch (error) {
      this.logger.error('Logout all error:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  // ============================================================================
  // USER INFO
  // ============================================================================

  /**
   * Get current authenticated user
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user) {
    return {
      success: true,
      data: {
        id: user.sub,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }

  /**
   * Validate token
   * POST /auth/validate
   */
  @Post('validate')
  @Public()
  async validateToken(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      const payload = await this.jwtService.validateAccessToken(token);

      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        success: true,
        data: {
          valid: true,
          payload: {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          valid: false,
          error: error.message,
        },
      };
    }
  }

  /**
   * Health check endpoint
   * GET /auth/health
   */
  @Get('health')
  @Public()
  async healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        service: 'ait-authenticator',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
