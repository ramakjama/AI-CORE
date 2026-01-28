import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, AuthProvider } from '../entities/user.entity';
import { RegisterDto, UpdateProfileDto } from '../dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(registerDto.password);

    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
      authProvider: AuthProvider.LOCAL,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { deletedAt: null },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, deletedAt: null },
    });
  }

  async findByProviderId(providerId: string, provider: AuthProvider): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { providerId, authProvider: provider, deletedAt: null },
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    return this.update(id, updateProfileDto);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.usersRepository.update(id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: Partial<User> = { failedLoginAttempts: failedAttempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (failedAttempts >= 5) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      updateData.lockedUntil = new Date(Date.now() + lockDuration);
    }

    await this.usersRepository.update(id, updateData);
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  async updateLastLogin(id: string, ipAddress: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });
  }

  async enableMfa(id: string, secret: string, backupCodes: string[]): Promise<void> {
    await this.usersRepository.update(id, {
      mfaEnabled: true,
      mfaSecret: secret,
      backupCodes,
    });
  }

  async disableMfa(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      mfaEnabled: false,
      mfaSecret: null,
      backupCodes: null,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      deletedAt: new Date(),
      status: UserStatus.INACTIVE,
    });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    return bcrypt.hash(password, rounds);
  }
}
