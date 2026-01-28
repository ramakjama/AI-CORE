import { z } from 'zod';

// User Role enum
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// User Status enum
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// Zod schema for validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  role: z.enum(['admin', 'manager', 'user', 'guest']),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']),
  organizationId: z.string().uuid().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).default('system'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
    }).default({}),
    aiEnabled: z.boolean().default(true),
  }).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Create User DTO
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
}).extend({
  password: z.string().min(8).max(100),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// Update User DTO
export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// User Profile (public view)
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  jobTitle?: string;
}

// Auth Response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Token Payload
export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  iat: number;
  exp: number;
}
