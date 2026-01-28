/**
 * Input Validation Schemas using Zod
 *
 * Provides validation schemas for all authentication-related inputs
 */

import { z } from 'zod';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

// Phone number validation (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorToken: z.string().length(6, 'Two-factor token must be 6 digits').optional()
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register Schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format (use international format: +1234567890)')
    .optional(),
  role: z.enum(['admin', 'supervisor', 'agent', 'customer']).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Refresh Token Schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Forgot Password Schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset Password Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Two-Factor Authentication Schema
 */
export const twoFactorTokenSchema = z.object({
  token: z
    .string()
    .length(6, 'Two-factor token must be 6 digits')
    .regex(/^\d{6}$/, 'Two-factor token must contain only digits')
});

export type TwoFactorTokenInput = z.infer<typeof twoFactorTokenSchema>;

/**
 * Update Profile Schema
 */
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(phoneRegex).optional(),
  metadata: z.record(z.any()).optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Validate input against schema and throw on error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate input against schema and return result with errors
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}
