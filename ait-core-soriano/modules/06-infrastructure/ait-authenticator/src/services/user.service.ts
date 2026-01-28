import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '../config/database.config';
import { logger } from '../utils/logger.utils';
import { oauthConfig } from '../config/oauth.config';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  roles: string[];
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  provider?: string;
  providerId?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  roles?: string[];
}

export interface SocialUserDto {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

class UserService {
  /**
   * Create new user
   */
  async create(data: CreateUserDto): Promise<User> {
    const prisma = getPrismaClient();

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        password: hashedPassword,
        name: data.name,
        roles: data.roles || ['user'],
        isActive: true,
        isVerified: false,
        mfaEnabled: false
      }
    });

    logger.info(`User created: ${user.email}`);
    return user as User;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { id } });
    return user as User | null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({ where: { email } });
    return user as User | null;
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user || !user.password) {
      return null;
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateLastLogin(user.id);

    return user;
  }

  /**
   * Find or create social user
   */
  async findOrCreateSocialUser(data: SocialUserDto): Promise<User> {
    const prisma = getPrismaClient();

    // Try to find by provider ID
    let user = await prisma.user.findFirst({
      where: {
        provider: data.provider,
        providerId: data.providerId
      }
    });

    if (user) {
      await this.updateLastLogin(user.id);
      return user as User;
    }

    // Try to find by email
    user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (user) {
      // Link social account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: data.provider,
          providerId: data.providerId,
          avatar: data.avatar || user.avatar
        }
      });

      await this.updateLastLogin(user.id);
      return user as User;
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        provider: data.provider,
        providerId: data.providerId,
        roles: ['user'],
        isActive: true,
        isVerified: true, // Auto-verify social logins
        mfaEnabled: false
      }
    });

    logger.info(`Social user created: ${user.email} (${data.provider})`);
    return user as User;
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const prisma = getPrismaClient();

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return user as User;
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);
    await this.update(userId, { password: hashedPassword });
    logger.info(`Password updated for user: ${userId}`);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.user.delete({ where: { id } });
    logger.info(`User deleted: ${id}`);
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = oauthConfig.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters`);
    }

    if (password.length > policy.maxLength) {
      errors.push(`Password must not exceed ${policy.maxLength} characters`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const userService = new UserService();
