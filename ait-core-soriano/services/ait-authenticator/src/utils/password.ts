/**
 * Password Utilities
 *
 * Provides secure password hashing and comparison using bcrypt
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 * @throws Error if password is too short
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);

  return hash;
}

/**
 * Compare a plain text password with a hashed password
 *
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
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

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
