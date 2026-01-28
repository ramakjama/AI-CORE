/**
 * User Model
 *
 * Provides database access methods for user operations
 */

import { User } from '@ait-core/shared/types';
import { db } from '../index';
import { logger } from '../utils/logger';

export interface CreateUserData {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'admin' | 'supervisor' | 'agent' | 'customer';
  emailVerified?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  metadata?: Record<string, any>;
}

export class UserModel {
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const result = await db.query(
        `SELECT
          id,
          email,
          password_hash as "passwordHash",
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          two_factor_enabled as "twoFactorEnabled",
          two_factor_secret as "twoFactorSecret",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_login_at as "lastLoginAt",
          metadata
        FROM users
        WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.query(
        `SELECT
          id,
          email,
          password_hash as "passwordHash",
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          two_factor_enabled as "twoFactorEnabled",
          two_factor_secret as "twoFactorSecret",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_login_at as "lastLoginAt",
          metadata
        FROM users
        WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
        [email]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(data: CreateUserData): Promise<User> {
    try {
      const result = await db.query(
        `INSERT INTO users (
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          role,
          email_verified,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          email,
          password_hash as "passwordHash",
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          two_factor_enabled as "twoFactorEnabled",
          created_at as "createdAt",
          updated_at as "updatedAt",
          metadata`,
        [
          data.email,
          data.passwordHash || null,
          data.firstName,
          data.lastName,
          data.phone || null,
          data.role || 'customer',
          data.emailVerified || false,
          JSON.stringify(data.metadata || {})
        ]
      );

      const user = result.rows[0];
      logger.info('User created', { userId: user.id, email: user.email });

      return user;
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique violation
        throw new Error('User with this email already exists');
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id: string, data: UpdateUserData): Promise<User> {
    try {
      // Build dynamic update query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(data.firstName);
      }
      if (data.lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(data.lastName);
      }
      if (data.phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(data.phone);
      }
      if (data.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }
      if (data.emailVerified !== undefined) {
        updates.push(`email_verified = $${paramIndex++}`);
        values.push(data.emailVerified);
      }
      if (data.twoFactorEnabled !== undefined) {
        updates.push(`two_factor_enabled = $${paramIndex++}`);
        values.push(data.twoFactorEnabled);
      }
      if (data.twoFactorSecret !== undefined) {
        updates.push(`two_factor_secret = $${paramIndex++}`);
        values.push(data.twoFactorSecret);
      }
      if (data.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(data.metadata));
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);

      const result = await db.query(
        `UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING
          id,
          email,
          password_hash as "passwordHash",
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          two_factor_enabled as "twoFactorEnabled",
          two_factor_secret as "twoFactorSecret",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_login_at as "lastLoginAt",
          metadata`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      logger.info('User updated', { userId: id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async delete(id: string): Promise<void> {
    try {
      const result = await db.query(
        `UPDATE users
        SET deleted_at = NOW(), status = 'deleted'
        WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('User not found');
      }

      logger.info('User deleted', { userId: id });
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    try {
      await db.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [id]
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enable2FA(id: string, secret: string): Promise<void> {
    try {
      await db.query(
        `UPDATE users
        SET two_factor_enabled = true, two_factor_secret = $2
        WHERE id = $1`,
        [id, secret]
      );

      logger.info('2FA enabled for user', { userId: id });
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disable2FA(id: string): Promise<void> {
    try {
      await db.query(
        `UPDATE users
        SET two_factor_enabled = false, two_factor_secret = NULL
        WHERE id = $1`,
        [id]
      );

      logger.info('2FA disabled for user', { userId: id });
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Update password hash
   */
  static async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      await db.query(
        `UPDATE users
        SET password_hash = $2, password_reset_token = NULL, password_reset_expires_at = NULL
        WHERE id = $1`,
        [id, passwordHash]
      );

      logger.info('Password updated for user', { userId: id });
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Set password reset token
   */
  static async setPasswordResetToken(
    id: string,
    token: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      await db.query(
        `UPDATE users
        SET password_reset_token = $2, password_reset_expires_at = $3
        WHERE id = $1`,
        [id, token, expiresAt]
      );
    } catch (error) {
      logger.error('Error setting password reset token:', error);
      throw error;
    }
  }

  /**
   * Find user by password reset token
   */
  static async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      const result = await db.query(
        `SELECT
          id,
          email,
          password_hash as "passwordHash",
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          created_at as "createdAt",
          updated_at as "updatedAt",
          metadata
        FROM users
        WHERE password_reset_token = $1
        AND password_reset_expires_at > NOW()
        AND deleted_at IS NULL`,
        [token]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by reset token:', error);
      throw error;
    }
  }

  /**
   * Get user count by role
   */
  static async countByRole(): Promise<Record<string, number>> {
    try {
      const result = await db.query(
        `SELECT role, COUNT(*)::int as count
        FROM users
        WHERE deleted_at IS NULL AND status = 'active'
        GROUP BY role`
      );

      const counts: Record<string, number> = {};
      for (const row of result.rows) {
        counts[row.role] = row.count;
      }

      return counts;
    } catch (error) {
      logger.error('Error counting users by role:', error);
      throw error;
    }
  }
}

export default UserModel;
