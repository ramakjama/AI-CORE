import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';

export interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Users Service
 *
 * Handles all business logic related to user management.
 *
 * Features:
 * - User CRUD operations
 * - Password hashing and validation
 * - Email validation and uniqueness
 * - User search with filters and pagination
 * - User activation/deactivation
 * - Profile picture management
 * - User preferences
 * - Last login tracking
 * - Account verification
 *
 * Security:
 * - Passwords are hashed using bcrypt (10 rounds)
 * - Sensitive data is excluded from responses
 * - Email uniqueness enforced at database level
 *
 * @service UsersService
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly BCRYPT_ROUNDS = 10;

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   *
   * @param createUserDto - User creation data
   * @returns Created user (without password)
   * @throws ConflictException if email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    try {
      // Check if user with email already exists
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          emailVerified: false,
          isActive: true,
        },
      });

      this.logger.log(`User created: ${user.id} (${user.email})`);

      // Return user without password
      return this.excludePassword(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  /**
   * Find all users with pagination and filters
   *
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of users
   */
  async findAll(query: UserQueryDto): Promise<PaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      emailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(emailVerified !== undefined && { emailVerified }),
    };

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.excludePassword(user)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find user by ID
   *
   * @param id - User ID
   * @returns User (without password)
   * @throws NotFoundException if user not found
   */
  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.excludePassword(user);
  }

  /**
   * Find user by email
   *
   * @param email - User email
   * @returns User (without password) or null if not found
   */
  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return this.excludePassword(user);
  }

  /**
   * Find user by email with password (for authentication)
   *
   * @param email - User email
   * @returns User with password or null if not found
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Update user
   *
   * @param id - User ID
   * @param updateUserDto - User update data
   * @returns Updated user (without password)
   * @throws NotFoundException if user not found
   * @throws ConflictException if email already exists
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // Check if user exists
    await this.findOne(id);

    // If email is being updated, check for conflicts
    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`User updated: ${user.id} (${user.email})`);

    return this.excludePassword(user);
  }

  /**
   * Delete user (soft delete by deactivating)
   *
   * @param id - User ID
   * @throws NotFoundException if user not found
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`User deactivated: ${id}`);
  }

  /**
   * Permanently delete user (hard delete)
   *
   * @param id - User ID
   * @throws NotFoundException if user not found
   */
  async permanentlyDelete(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.log(`User permanently deleted: ${id}`);
  }

  /**
   * Change user password
   *
   * @param id - User ID
   * @param changePasswordDto - Password change data
   * @throws NotFoundException if user not found
   * @throws BadRequestException if current password is incorrect
   */
  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(changePasswordDto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${id}`);
  }

  /**
   * Reset user password (admin function)
   *
   * @param id - User ID
   * @param newPassword - New password
   * @throws NotFoundException if user not found
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await this.findOne(id);

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password reset for user: ${id}`);
  }

  /**
   * Activate user account
   *
   * @param id - User ID
   * @throws NotFoundException if user not found
   */
  async activate(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log(`User activated: ${id}`);
  }

  /**
   * Deactivate user account
   *
   * @param id - User ID
   * @throws NotFoundException if user not found
   */
  async deactivate(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`User deactivated: ${id}`);
  }

  /**
   * Verify user email
   *
   * @param id - User ID
   * @throws NotFoundException if user not found
   */
  async verifyEmail(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    this.logger.log(`Email verified for user: ${id}`);
  }

  /**
   * Update last login timestamp
   *
   * @param id - User ID
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.debug(`Last login updated for user: ${id}`);
  }

  /**
   * Get user statistics
   *
   * @returns User statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, inactive, verified, unverified, users] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.user.count({ where: { emailVerified: true } }),
        this.prisma.user.count({ where: { emailVerified: false } }),
        this.prisma.user.findMany({ select: { role: true } }),
      ]);

    // Count users by role
    const byRole: Record<string, number> = {};
    users.forEach((user) => {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      verified,
      unverified,
      byRole,
    };
  }

  /**
   * Search users by multiple criteria
   *
   * @param criteria - Search criteria
   * @returns Array of users
   */
  async search(criteria: {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(criteria.email && {
          email: { contains: criteria.email, mode: 'insensitive' },
        }),
        ...(criteria.firstName && {
          firstName: { contains: criteria.firstName, mode: 'insensitive' },
        }),
        ...(criteria.lastName && {
          lastName: { contains: criteria.lastName, mode: 'insensitive' },
        }),
        ...(criteria.role && { role: criteria.role }),
      },
    });

    return users.map((user) => this.excludePassword(user));
  }

  /**
   * Bulk create users
   *
   * @param users - Array of user creation data
   * @returns Array of created users
   */
  async bulkCreate(users: CreateUserDto[]): Promise<Omit<User, 'password'>[]> {
    const createdUsers: Omit<User, 'password'>[] = [];

    for (const userData of users) {
      try {
        const user = await this.create(userData);
        createdUsers.push(user);
      } catch (error) {
        this.logger.error(`Failed to create user ${userData.email}:`, error);
      }
    }

    this.logger.log(`Bulk created ${createdUsers.length} users`);

    return createdUsers;
  }

  /**
   * Bulk update users
   *
   * @param updates - Array of user updates with IDs
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: UpdateUserDto }>,
  ): Promise<void> {
    for (const { id, data } of updates) {
      try {
        await this.update(id, data);
      } catch (error) {
        this.logger.error(`Failed to update user ${id}:`, error);
      }
    }

    this.logger.log(`Bulk updated ${updates.length} users`);
  }

  /**
   * Bulk delete users
   *
   * @param ids - Array of user IDs
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { isActive: false },
    });

    this.logger.log(`Bulk deactivated ${ids.length} users`);
  }

  /**
   * Hash password using bcrypt
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare password with hash
   *
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches hash
   */
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Exclude password from user object
   *
   * @param user - User object
   * @returns User object without password
   */
  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validate password strength
   *
   * @param password - Password to validate
   * @returns Validation result
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
