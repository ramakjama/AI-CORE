/**
 * Password Hashing and Validation
 */

import bcrypt from 'bcryptjs';
import { createLogger } from '@ait-core/shared/logger';
import { ValidationError } from '@ait-core/shared/errors';

const logger = createLogger('@ait-core/auth:password');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    validatePasswordStrength(password);
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw error;
  }
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Failed to verify password', { error });
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): void {
  const minLength = 8;
  const maxLength = 128;

  if (!password) {
    throw new ValidationError('Password is required');
  }

  if (password.length < minLength) {
    throw new ValidationError(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    throw new ValidationError(`Password must be no more than ${maxLength} characters long`);
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    throw new ValidationError('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    throw new ValidationError('Password must contain at least one lowercase letter');
  }

  // Check for at least one digit
  if (!/\d/.test(password)) {
    throw new ValidationError('Password must contain at least one digit');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new ValidationError('Password must contain at least one special character');
  }

  // Check for common patterns
  if (/^(.)\1+$/.test(password)) {
    throw new ValidationError('Password cannot contain only repeated characters');
  }

  if (/^(012|123|234|345|456|567|678|789|890)+$/.test(password)) {
    throw new ValidationError('Password cannot contain sequential numbers');
  }

  if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) {
    throw new ValidationError('Password cannot contain sequential letters');
  }
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  else suggestions.push('Use at least 12 characters');

  // Uppercase
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add uppercase letters');
  }

  // Lowercase
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add lowercase letters');
  }

  // Digits
  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add numbers');
  }

  // Special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Add special characters');
  }

  // No repeating characters
  if (!/(.)\1{2,}/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Avoid repeating characters');
  }

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  if (score <= 2) strength = 'weak';
  else if (score <= 4) strength = 'fair';
  else if (score <= 6) strength = 'good';
  else if (score <= 7) strength = 'strong';
  else strength = 'very-strong';

  return { score, strength, suggestions };
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*(),.?":{}|<>';
  const all = uppercase + lowercase + digits + special;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password needs rehashing (bcrypt rounds changed)
 */
export async function needsRehash(hash: string): Promise<boolean> {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds !== SALT_ROUNDS;
  } catch {
    return true;
  }
}
