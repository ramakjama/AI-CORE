import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as ApiSwaggerResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiSwaggerResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: LoginResponseDto,
  })
  @ApiSwaggerResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists',
  })
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiSwaggerResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
    type: LoginResponseDto,
  })
  @ApiSwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(
    @Body() loginDto: LoginDto,
    @CurrentUser() user: any,
  ): Promise<LoginResponseDto> {
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiSwaggerResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  @ApiSwaggerResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiSwaggerResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out',
  })
  async logout(@CurrentUser('sub') userId: string): Promise<{ message: string }> {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSwaggerResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
