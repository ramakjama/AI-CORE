import { z } from 'zod';
import { validators } from './utils';

/**
 * ============================================
 * AUTH & USER SCHEMAS
 * ============================================
 */

// Enums
export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'AGENT',
  'ACCOUNTANT',
  'CUSTOMER',
  'AUDITOR',
  'ANALYST',
  'SUPPORT',
]);

export const UserStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DELETED',
]);

export const AuthProviderSchema = z.enum([
  'EMAIL',
  'GOOGLE',
  'MICROSOFT',
  'GITHUB',
]);

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

/**
 * Core User schema
 */
export const UserSchema = z.object({
  id: validators.cuid,
  email: validators.email,
  name: z.string().min(1).max(100),
  phone: validators.phone.optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerified: z.date().nullable(),
  image: validators.url.optional(),

  // Gamification
  coins: z.number().int().nonnegative().default(0),
  xp: z.number().int().nonnegative().default(0),
  level: z.number().int().positive().default(1),

  // Metadata
  lastLoginAt: z.date().nullable(),
  loginCount: z.number().int().nonnegative().default(0),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * User profile (public view)
 */
export const UserProfileSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  level: true,
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Registration schema
 */
export const RegisterSchema = z.object({
  email: validators.email,
  password: validators.password,
  confirmPassword: z.string(),
  name: z.string().min(1).max(100),
  phone: validators.phone.optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy' }),
  }),
  marketingConsent: z.boolean().optional().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: validators.email,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * OAuth callback schema
 */
export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  provider: AuthProviderSchema,
});

export type OAuthCallback = z.infer<typeof OAuthCallbackSchema>;

/**
 * Forgot password schema
 */
export const ForgotPasswordSchema = z.object({
  email: validators.email,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset password schema
 */
export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: validators.password,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Change password schema
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: validators.password,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Update user profile schema
 */
export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: validators.phone.optional(),
  image: validators.url.optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

/**
 * JWT Payload schema
 */
export const JWTPayloadSchema = z.object({
  sub: validators.cuid,
  email: validators.email,
  role: UserRoleSchema,
  permissions: z.array(z.string()),
  type: z.enum(['access', 'refresh']),
  iat: z.number().int(),
  exp: z.number().int(),
  jti: z.string().optional(), // JWT ID for token tracking
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

/**
 * Session schema
 */
export const SessionSchema = z.object({
  id: validators.cuid,
  userId: validators.cuid,
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  lastActivityAt: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * Permission schema
 */
export const PermissionSchema = z.object({
  id: validators.cuid,
  name: z.string(),
  description: z.string().optional(),
  resource: z.string(),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage']),
});

export type Permission = z.infer<typeof PermissionSchema>;

/**
 * Role with permissions schema
 */
export const RoleWithPermissionsSchema = z.object({
  role: UserRoleSchema,
  permissions: z.array(PermissionSchema),
});

export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

/**
 * Email verification schema
 */
export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

/**
 * Two-factor authentication schemas
 */
export const Enable2FASchema = z.object({
  password: z.string().min(1),
});

export type Enable2FAInput = z.infer<typeof Enable2FASchema>;

export const Verify2FASchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type Verify2FAInput = z.infer<typeof Verify2FASchema>;

export const Disable2FASchema = z.object({
  password: z.string().min(1),
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type Disable2FAInput = z.infer<typeof Disable2FASchema>;

/**
 * API Key schema
 */
export const APIKeySchema = z.object({
  id: validators.cuid,
  userId: validators.cuid,
  name: z.string().min(1).max(100),
  key: z.string(),
  permissions: z.array(z.string()),
  expiresAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  createdAt: z.date(),
  revokedAt: z.date().nullable(),
});

export type APIKey = z.infer<typeof APIKeySchema>;

export const CreateAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).min(1),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

export type CreateAPIKeyInput = z.infer<typeof CreateAPIKeySchema>;
