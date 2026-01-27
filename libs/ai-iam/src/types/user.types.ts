/**
 * @fileoverview User-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/user
 */

/**
 * User status enumeration
 */
export enum UserStatus {
  /** User is active and can access the system */
  ACTIVE = 'active',
  /** User is inactive and cannot access the system */
  INACTIVE = 'inactive',
  /** User account is pending verification */
  PENDING = 'pending',
  /** User account is suspended */
  SUSPENDED = 'suspended',
  /** User account is locked due to security reasons */
  LOCKED = 'locked',
}

/**
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address (must be unique) */
  email: string;
  /** User's username (must be unique) */
  username: string;
  /** Hashed password (never expose in responses) */
  passwordHash: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's display name */
  displayName?: string;
  /** URL to user's avatar image */
  avatarUrl?: string;
  /** User's phone number */
  phoneNumber?: string;
  /** Current status of the user */
  status: UserStatus;
  /** Whether email has been verified */
  emailVerified: boolean;
  /** Whether phone number has been verified */
  phoneVerified: boolean;
  /** Whether MFA is enabled for this user */
  mfaEnabled: boolean;
  /** MFA secret key (encrypted) */
  mfaSecret?: string;
  /** Array of role IDs assigned to the user */
  roleIds: string[];
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  /** Organization ID */
  organizationId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp of last login */
  lastLoginAt?: Date;
  /** Number of failed login attempts */
  failedLoginAttempts: number;
  /** Timestamp when account was locked (alias: lockedUntil) */
  lockedUntil?: Date;
  /** Timestamp when account lockout expires (alias: lockedUntil) */
  lockoutUntil?: Date;
  /** Timestamp of password last change */
  passwordChangedAt?: Date;
  /** MFA methods enabled for this user */
  mfaMethods: string[];
  /** Computed roles (from roleIds) */
  roles?: string[];
  /** Computed permissions (from roles) */
  permissions?: string[];
  /** Whether password reset is required on next login */
  passwordResetRequired: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Deletion timestamp (soft delete) */
  deletedAt?: Date;
}

/**
 * User data safe to expose in API responses (excludes sensitive fields)
 */
export interface UserPublic {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  status: UserStatus;
  emailVerified: boolean;
  mfaEnabled: boolean;
  roleIds: string[];
  tenantId: string;
  metadata?: Record<string, unknown>;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDTO {
  /** User's email address */
  email: string;
  /** User's username */
  username: string;
  /** Plain text password (will be hashed) */
  password: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Optional display name */
  displayName?: string;
  /** Optional phone number */
  phoneNumber?: string;
  /** Optional avatar URL */
  avatarUrl?: string;
  /** Optional role IDs to assign */
  roleIds?: string[];
  /** Tenant ID (required for multi-tenant) */
  tenantId: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserDTO {
  /** Updated email address */
  email?: string;
  /** Updated username */
  username?: string;
  /** Updated first name */
  firstName?: string;
  /** Updated last name */
  lastName?: string;
  /** Updated display name */
  displayName?: string;
  /** Updated phone number */
  phoneNumber?: string;
  /** Updated avatar URL */
  avatarUrl?: string;
  /** Updated status */
  status?: UserStatus;
  /** Updated role IDs */
  roleIds?: string[];
  /** Updated metadata */
  metadata?: Record<string, unknown>;
}

/**
 * DTO for changing user password
 */
export interface ChangePasswordDTO {
  /** Current password for verification */
  currentPassword: string;
  /** New password to set */
  newPassword: string;
}

/**
 * DTO for resetting user password (admin action)
 */
export interface ResetPasswordDTO {
  /** New password to set */
  newPassword: string;
  /** Whether to force password change on next login */
  forceChangeOnLogin?: boolean;
}

/**
 * Converts a User to UserPublic by removing sensitive fields
 * @param user - The full user object
 * @returns User data safe for public exposure
 */
export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    roleIds: user.roleIds,
    tenantId: user.tenantId,
    metadata: user.metadata,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
