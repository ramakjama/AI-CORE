import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Password policy configuration
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
}

/**
 * Default password policy
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
};

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

/**
 * User info for password validation
 */
interface UserInfo {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export async function hashPassword(password: string, rounds: number = SALT_ROUNDS): Promise<string> {
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain special character');

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a password against the policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: UserInfo
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];

  // Length checks
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }
  if (password.length > policy.maxLength) {
    errors.push(`Password must be at most ${policy.maxLength} characters`);
  }

  // Character requirements
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  }
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  }
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Add a special character (!@#$%^&*...)');
  }

  // User info check
  if (policy.preventUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    if (userInfo.username && lowerPassword.includes(userInfo.username.toLowerCase())) {
      errors.push('Password cannot contain your username');
    }
    if (userInfo.email) {
      const emailParts = userInfo.email.split('@');
      const emailPrefix = emailParts[0];
      if (emailPrefix && lowerPassword.includes(emailPrefix.toLowerCase())) {
        errors.push('Password cannot contain your email');
      }
    }
    if (userInfo.firstName && userInfo.firstName.length > 2 && lowerPassword.includes(userInfo.firstName.toLowerCase())) {
      errors.push('Password cannot contain your first name');
    }
    if (userInfo.lastName && userInfo.lastName.length > 2 && lowerPassword.includes(userInfo.lastName.toLowerCase())) {
      errors.push('Password cannot contain your last name');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
  };
}
