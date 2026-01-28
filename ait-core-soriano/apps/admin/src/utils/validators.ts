import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['super_admin', 'admin', 'manager', 'operator', 'viewer']),
  phone: z.string().optional(),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Module validation schemas
export const moduleSchema = z.object({
  name: z.string().min(3, 'Module name must be at least 3 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  type: z.enum(['core', 'agent', 'service', 'integration', 'utility']),
  category: z.string().min(1, 'Category is required'),
  author: z.string().min(1, 'Author is required'),
});

export const moduleConfigSchema = z.object({
  enabled: z.boolean(),
  autoStart: z.boolean(),
  priority: z.number().min(0).max(100),
  timeout: z.number().min(1000),
  retryAttempts: z.number().min(0).max(10),
});

// Agent validation schemas
export const agentSchema = z.object({
  name: z.string().min(3, 'Agent name must be at least 3 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  type: z.enum(['ai_assistant', 'data_processor', 'automation', 'monitor', 'integration']),
  capabilities: z.array(z.string()).min(1, 'At least one capability is required'),
});

export const agentConfigSchema = z.object({
  maxConcurrentTasks: z.number().min(1).max(100),
  timeout: z.number().min(1000),
  retryAttempts: z.number().min(0).max(5),
  enableLogging: z.boolean(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});

// Task validation schemas
export const taskSchema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  type: z.string().min(1, 'Task type is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  estimatedDuration: z.number().min(0).optional(),
});

// Validation helper functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateIPAddress(ip: string): boolean {
  const ipRegex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}

export function validateVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+$/;
  return versionRegex.test(version);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
