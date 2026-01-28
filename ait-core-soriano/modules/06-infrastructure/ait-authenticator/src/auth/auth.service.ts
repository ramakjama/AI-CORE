import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthProvider, UserStatus } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  MfaSetupResponseDto,
} from '../dto/auth.dto';

interface OAuthUserData {
  providerId: string;
  provider: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked) {
      throw new UnauthorizedException('Account is locked. Please try again later.');
    }

    if (user.mfaEnabled && !loginDto.mfaCode) {
      throw new BadRequestException('MFA code required');
    }

    if (user.mfaEnabled && loginDto.mfaCode) {
      const isValidMfa = this.verifyMfaCode(user.mfaSecret, loginDto.mfaCode);
      if (!isValidMfa) {
        await this.usersService.incrementFailedLoginAttempts(user.id);
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    await this.usersService.resetFailedLoginAttempts(user.id);
    await this.usersService.updateLastLogin(user.id, ipAddress);

    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await this.usersService.validatePassword(password, user.password);

    if (!isValidPassword) {
      if (user) {
        await this.usersService.incrementFailedLoginAttempts(user.id);
      }
      return null;
    }

    return user;
  }

  async validateOAuthUser(userData: OAuthUserData): Promise<User> {
    let user = await this.usersService.findByProviderId(
      userData.providerId,
      userData.provider as AuthProvider,
    );

    if (!user) {
      user = await this.usersService.findByEmail(userData.email);

      if (user) {
        // Link OAuth account to existing user
        await this.usersService.update(user.id, {
          providerId: userData.providerId,
          authProvider: userData.provider as AuthProvider,
        });
      } else {
        // Create new user
        const newUser = await this.usersService.create({
          email: userData.email,
          password: uuidv4(), // Random password for OAuth users
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        await this.usersService.update(newUser.id, {
          providerId: userData.providerId,
          authProvider: userData.provider as AuthProvider,
          avatar: userData.avatar,
          emailVerified: true,
          status: UserStatus.ACTIVE,
        });

        user = await this.usersService.findById(newUser.id);
      }
    }

    return user;
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!token || !token.isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.revokeRefreshToken(token.id, 'Token refreshed');

    // Generate new tokens
    return this.generateAuthResponse(token.user, token.ipAddress, token.userAgent);
  }

  async logout(userId: string, sessionToken?: string): Promise<void> {
    if (sessionToken) {
      await this.sessionRepository.update({ sessionToken }, { isActive: false });
    } else {
      await this.sessionRepository.update({ userId, isActive: true }, { isActive: false });
    }
  }

  async setupMfa(userId: string): Promise<MfaSetupResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `${this.configService.get('MFA_ISSUER')} (${user.email})`,
      issuer: this.configService.get('MFA_ISSUER'),
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  async enableMfa(userId: string, code: string, secret: string): Promise<void> {
    const isValid = this.verifyMfaCode(secret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    const backupCodes = this.generateBackupCodes();
    await this.usersService.enableMfa(userId, secret, backupCodes);
  }

  async disableMfa(userId: string, code: string): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    const isValid = this.verifyMfaCode(user.mfaSecret, code);

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.usersService.disableMfa(userId);
  }

  async getSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId, userId },
      { isActive: false },
    );
  }

  private async generateAuthResponse(
    user: User,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = await this.createRefreshToken(user.id, ipAddress, userAgent);
    await this.createSession(user.id, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  private async createRefreshToken(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<RefreshToken> {
    const token = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Session> {
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
      lastActivityAt: new Date(),
    });

    return this.sessionRepository.save(session);
  }

  private async revokeRefreshToken(tokenId: string, reason: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    });
  }

  private verifyMfaCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: this.configService.get<number>('MFA_WINDOW', 1),
    });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase());
    }
    return codes;
  }
}
