/**
 * @fileoverview User service for AI-IAM module
 * @module @ai-core/ai-iam/services/user
 */

import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserPublic,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  ChangePasswordDTO,
  ResetPasswordDTO,
  toUserPublic,
} from '../types';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  PasswordPolicy,
  DEFAULT_PASSWORD_POLICY,
} from '../utils/password';

/**
 * Storage interface for UserService
 */
export interface UserStorage {
  /** Create a new user */
  create(user: User): Promise<User>;
  /** Find user by ID */
  findById(id: string): Promise<User | null>;
  /** Find user by email */
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  /** Find user by username */
  findByUsername(username: string, tenantId: string): Promise<User | null>;
  /** Update user */
  update(id: string, updates: Partial<User>): Promise<User>;
  /** Delete user (soft delete) */
  delete(id: string): Promise<void>;
  /** List users with pagination */
  list(options: UserListOptions): Promise<UserListResult>;
  /** Find users by role ID */
  findByRoleId(roleId: string, tenantId: string): Promise<User[]>;
  /** Check if email exists */
  emailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean>;
  /** Check if username exists */
  usernameExists(username: string, tenantId: string, excludeUserId?: string): Promise<boolean>;
}

/**
 * User list options
 */
export interface UserListOptions {
  /** Filter by tenant ID */
  tenantId?: string;
  /** Filter by status */
  status?: UserStatus;
  /** Filter by role ID */
  roleId?: string;
  /** Search query (email, username, name) */
  search?: string;
  /** Include deleted users */
  includeDeleted?: boolean;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: keyof User;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list result
 */
export interface UserListResult {
  /** List of users */
  users: UserPublic[];
  /** Total count */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total pages */
  totalPages: number;
}

/**
 * In-memory storage implementation for testing/development
 */
export class InMemoryUserStorage implements UserStorage {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (
        user.email.toLowerCase() === email.toLowerCase() &&
        user.tenantId === tenantId &&
        !user.deletedAt
      ) {
        return user;
      }
    }
    return null;
  }

  async findByUsername(username: string, tenantId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (
        user.username.toLowerCase() === username.toLowerCase() &&
        user.tenantId === tenantId &&
        !user.deletedAt
      ) {
        return user;
      }
    }
    return null;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, deletedAt: new Date(), status: UserStatus.INACTIVE });
    }
  }

  async list(options: UserListOptions): Promise<UserListResult> {
    let users = Array.from(this.users.values());

    // Apply filters
    if (options.tenantId) {
      users = users.filter((u) => u.tenantId === options.tenantId);
    }

    if (options.status) {
      users = users.filter((u) => u.status === options.status);
    }

    if (options.roleId) {
      users = users.filter((u) => u.roleIds.includes(options.roleId!));
    }

    if (!options.includeDeleted) {
      users = users.filter((u) => !u.deletedAt);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search)
      );
    }

    // Sort
    const sortBy = options.sortBy ?? 'createdAt';
    const sortOrder = options.sortOrder ?? 'desc';
    users.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = users.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    users = users.slice(start, end);

    return {
      users: users.map(toUserPublic),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByRoleId(roleId: string, tenantId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (u) => u.tenantId === tenantId && u.roleIds.includes(roleId) && !u.deletedAt
    );
  }

  async emailExists(email: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    for (const user of this.users.values()) {
      if (
        user.email.toLowerCase() === email.toLowerCase() &&
        user.tenantId === tenantId &&
        user.id !== excludeUserId &&
        !user.deletedAt
      ) {
        return true;
      }
    }
    return false;
  }

  async usernameExists(username: string, tenantId: string, excludeUserId?: string): Promise<boolean> {
    for (const user of this.users.values()) {
      if (
        user.username.toLowerCase() === username.toLowerCase() &&
        user.tenantId === tenantId &&
        user.id !== excludeUserId &&
        !user.deletedAt
      ) {
        return true;
      }
    }
    return false;
  }

  // Helper methods for testing
  clear(): void {
    this.users.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

/**
 * User service error
 */
export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

/**
 * User service for CRUD operations
 */
export class UserService {
  private readonly storage: UserStorage;
  private readonly passwordPolicy: PasswordPolicy;
  private readonly bcryptRounds: number;

  /**
   * Creates a new UserService instance
   * @param storage - Storage implementation
   * @param options - Service options
   */
  constructor(
    storage: UserStorage,
    options: {
      passwordPolicy?: Partial<PasswordPolicy>;
      bcryptRounds?: number;
    } = {}
  ) {
    this.storage = storage;
    this.passwordPolicy = { ...DEFAULT_PASSWORD_POLICY, ...options.passwordPolicy };
    this.bcryptRounds = options.bcryptRounds ?? 12;
  }

  /**
   * Creates a new user
   * @param dto - User creation data
   * @returns Created user (public data)
   */
  async create(dto: CreateUserDTO): Promise<UserPublic> {
    // Validate email uniqueness
    const emailExists = await this.storage.emailExists(dto.email, dto.tenantId);
    if (emailExists) {
      throw new UserServiceError('Email already exists', 'EMAIL_EXISTS');
    }

    // Validate username uniqueness
    const usernameExists = await this.storage.usernameExists(dto.username, dto.tenantId);
    if (usernameExists) {
      throw new UserServiceError('Username already exists', 'USERNAME_EXISTS');
    }

    // Validate password
    const passwordValidation = validatePassword(dto.password, this.passwordPolicy, {
      username: dto.username,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    if (!passwordValidation.isValid) {
      throw new UserServiceError('Invalid password', 'INVALID_PASSWORD', {
        errors: passwordValidation.errors,
        suggestions: passwordValidation.suggestions,
      });
    }

    // Hash password
    const passwordHash = await hashPassword(dto.password, this.bcryptRounds);

    // Create user
    const now = new Date();
    const user: User = {
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      username: dto.username.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName ?? `${dto.firstName} ${dto.lastName}`,
      phoneNumber: dto.phoneNumber,
      avatarUrl: dto.avatarUrl,
      status: UserStatus.PENDING,
      emailVerified: false,
      phoneVerified: false,
      mfaEnabled: false,
      mfaMethods: [],
      roleIds: dto.roleIds ?? [],
      tenantId: dto.tenantId,
      metadata: dto.metadata,
      failedLoginAttempts: 0,
      passwordResetRequired: false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.storage.create(user);
    return toUserPublic(created);
  }

  /**
   * Gets a user by ID
   * @param id - User ID
   * @returns User public data or null
   */
  async getById(id: string): Promise<UserPublic | null> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      return null;
    }
    return toUserPublic(user);
  }

  /**
   * Gets a user by email
   * @param email - User email
   * @param tenantId - Tenant ID
   * @returns User public data or null
   */
  async getByEmail(email: string, tenantId: string): Promise<UserPublic | null> {
    const user = await this.storage.findByEmail(email, tenantId);
    if (!user) {
      return null;
    }
    return toUserPublic(user);
  }

  /**
   * Gets a user by username
   * @param username - Username
   * @param tenantId - Tenant ID
   * @returns User public data or null
   */
  async getByUsername(username: string, tenantId: string): Promise<UserPublic | null> {
    const user = await this.storage.findByUsername(username, tenantId);
    if (!user) {
      return null;
    }
    return toUserPublic(user);
  }

  /**
   * Updates a user
   * @param id - User ID
   * @param dto - Update data
   * @returns Updated user public data
   */
  async update(id: string, dto: UpdateUserDTO): Promise<UserPublic> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    // Validate email uniqueness if changed
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const emailExists = await this.storage.emailExists(dto.email, user.tenantId, id);
      if (emailExists) {
        throw new UserServiceError('Email already exists', 'EMAIL_EXISTS');
      }
    }

    // Validate username uniqueness if changed
    if (dto.username && dto.username.toLowerCase() !== user.username) {
      const usernameExists = await this.storage.usernameExists(dto.username, user.tenantId, id);
      if (usernameExists) {
        throw new UserServiceError('Username already exists', 'USERNAME_EXISTS');
      }
    }

    const updates: Partial<User> = {};

    if (dto.email !== undefined) {
      updates.email = dto.email.toLowerCase();
    }
    if (dto.username !== undefined) {
      updates.username = dto.username.toLowerCase();
    }
    if (dto.firstName !== undefined) {
      updates.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updates.lastName = dto.lastName;
    }
    if (dto.displayName !== undefined) {
      updates.displayName = dto.displayName;
    }
    if (dto.phoneNumber !== undefined) {
      updates.phoneNumber = dto.phoneNumber;
    }
    if (dto.avatarUrl !== undefined) {
      updates.avatarUrl = dto.avatarUrl;
    }
    if (dto.status !== undefined) {
      updates.status = dto.status;
    }
    if (dto.roleIds !== undefined) {
      updates.roleIds = dto.roleIds;
    }
    if (dto.metadata !== undefined) {
      updates.metadata = { ...user.metadata, ...dto.metadata };
    }

    const updated = await this.storage.update(id, updates);
    return toUserPublic(updated);
  }

  /**
   * Deletes a user (soft delete)
   * @param id - User ID
   */
  async delete(id: string): Promise<void> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    await this.storage.delete(id);
  }

  /**
   * Lists users with pagination and filtering
   * @param options - List options
   * @returns List result
   */
  async list(options: UserListOptions = {}): Promise<UserListResult> {
    return this.storage.list(options);
  }

  /**
   * Changes a user's password
   * @param id - User ID
   * @param dto - Password change data
   */
  async changePassword(id: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UserServiceError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Validate new password
    const validation = validatePassword(dto.newPassword, this.passwordPolicy, {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!validation.isValid) {
      throw new UserServiceError('Invalid new password', 'INVALID_PASSWORD', {
        errors: validation.errors,
        suggestions: validation.suggestions,
      });
    }

    // Check that new password is different from current
    const isSame = await verifyPassword(dto.newPassword, user.passwordHash);
    if (isSame) {
      throw new UserServiceError('New password must be different from current password', 'SAME_PASSWORD');
    }

    // Hash and update
    const passwordHash = await hashPassword(dto.newPassword, this.bcryptRounds);
    await this.storage.update(id, {
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetRequired: false,
    });
  }

  /**
   * Resets a user's password (admin action)
   * @param id - User ID
   * @param dto - Password reset data
   */
  async resetPassword(id: string, dto: ResetPasswordDTO): Promise<void> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    // Validate new password
    const validation = validatePassword(dto.newPassword, this.passwordPolicy, {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    if (!validation.isValid) {
      throw new UserServiceError('Invalid password', 'INVALID_PASSWORD', {
        errors: validation.errors,
        suggestions: validation.suggestions,
      });
    }

    // Hash and update
    const passwordHash = await hashPassword(dto.newPassword, this.bcryptRounds);
    await this.storage.update(id, {
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetRequired: dto.forceChangeOnLogin ?? true,
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      status: user.status === UserStatus.LOCKED ? UserStatus.ACTIVE : user.status,
    });
  }

  /**
   * Activates a user
   * @param id - User ID
   */
  async activate(id: string): Promise<UserPublic> {
    return this.update(id, { status: UserStatus.ACTIVE });
  }

  /**
   * Deactivates a user
   * @param id - User ID
   */
  async deactivate(id: string): Promise<UserPublic> {
    return this.update(id, { status: UserStatus.INACTIVE });
  }

  /**
   * Suspends a user
   * @param id - User ID
   */
  async suspend(id: string): Promise<UserPublic> {
    return this.update(id, { status: UserStatus.SUSPENDED });
  }

  /**
   * Unlocks a locked user
   * @param id - User ID
   */
  async unlock(id: string): Promise<UserPublic> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    const updated = await this.storage.update(id, {
      status: UserStatus.ACTIVE,
      lockedUntil: undefined,
      failedLoginAttempts: 0,
    });

    return toUserPublic(updated);
  }

  /**
   * Verifies a user's email
   * @param id - User ID
   */
  async verifyEmail(id: string): Promise<UserPublic> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    const updates: Partial<User> = { emailVerified: true };
    if (user.status === UserStatus.PENDING) {
      updates.status = UserStatus.ACTIVE;
    }

    const updated = await this.storage.update(id, updates);
    return toUserPublic(updated);
  }

  /**
   * Assigns roles to a user
   * @param id - User ID
   * @param roleIds - Role IDs to assign
   */
  async assignRoles(id: string, roleIds: string[]): Promise<UserPublic> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    const newRoleIds = [...new Set([...user.roleIds, ...roleIds])];
    const updated = await this.storage.update(id, { roleIds: newRoleIds });
    return toUserPublic(updated);
  }

  /**
   * Removes roles from a user
   * @param id - User ID
   * @param roleIds - Role IDs to remove
   */
  async removeRoles(id: string, roleIds: string[]): Promise<UserPublic> {
    const user = await this.storage.findById(id);
    if (!user || user.deletedAt) {
      throw new UserServiceError('User not found', 'USER_NOT_FOUND');
    }

    const newRoleIds = user.roleIds.filter((rid) => !roleIds.includes(rid));
    const updated = await this.storage.update(id, { roleIds: newRoleIds });
    return toUserPublic(updated);
  }
}

/**
 * Creates a new UserService instance
 * @param storage - Storage implementation
 * @param options - Service options
 * @returns UserService instance
 */
export function createUserService(
  storage: UserStorage,
  options: {
    passwordPolicy?: Partial<PasswordPolicy>;
    bcryptRounds?: number;
  } = {}
): UserService {
  return new UserService(storage, options);
}
