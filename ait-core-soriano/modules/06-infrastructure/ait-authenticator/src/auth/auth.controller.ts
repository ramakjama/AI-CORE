import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  EnableMfaDto,
  VerifyMfaDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../dto/auth.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() registerDto: RegisterDto): Promise<User> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const authResponse = await this.authService.generateAuthResponse(
      req.user as User,
      req.ip,
      req.headers['user-agent'],
    );

    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${authResponse.accessToken}`;
    res.redirect(redirectUrl);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@CurrentUser() user: User, @Req() req: Request): Promise<void> {
    const sessionToken = req.headers['x-session-token'] as string;
    await this.authService.logout(user.id, sessionToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<User> {
    return user;
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const isValidPassword = await this.usersService.validatePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    await this.usersService.updatePassword(user.id, changePasswordDto.newPassword);
  }

  @Get('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA' })
  async setupMfa(@CurrentUser() user: User) {
    return this.authService.setupMfa(user.id);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enable MFA' })
  async enableMfa(
    @CurrentUser() user: User,
    @Body() enableMfaDto: EnableMfaDto,
  ): Promise<void> {
    // Secret should be stored temporarily during setup
    const secret = user.metadata?.mfaSetupSecret;
    await this.authService.enableMfa(user.id, enableMfaDto.code, secret);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable MFA' })
  async disableMfa(
    @CurrentUser() user: User,
    @Body() verifyMfaDto: VerifyMfaDto,
  ): Promise<void> {
    await this.authService.disableMfa(user.id, verifyMfaDto.code);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions' })
  async getSessions(@CurrentUser() user: User) {
    return this.authService.getSessions(user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a session' })
  async revokeSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    await this.authService.revokeSession(sessionId, user.id);
  }
}
