// Validation schemas using Zod
import { z } from 'zod';

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'agent', 'client', 'viewer']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Client Schemas
export const clientSchema = z.object({
  type: z.enum(['individual', 'business']),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  alternatePhone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  dateOfBirth: z.date().optional(),
  taxId: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedAgentId: z.string().min(1, 'Agent is required'),
});

// Policy Schemas
export const policySchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  type: z.enum(['auto', 'home', 'life', 'health', 'business', 'travel', 'other']),
  status: z.enum(['active', 'expired', 'cancelled', 'pending', 'suspended']),
  clientId: z.string().min(1, 'Client is required'),
  insuranceCompany: z.string().min(1, 'Insurance company is required'),
  startDate: z.date(),
  endDate: z.date(),
  renewalDate: z.date().optional(),
  premium: z.number().positive('Premium must be positive'),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'semi-annual', 'annual']),
  coverage: z.array(z.object({
    type: z.string(),
    description: z.string(),
    amount: z.number().positive(),
    deductible: z.number().optional(),
  })).min(1, 'At least one coverage is required'),
  beneficiaries: z.array(z.object({
    name: z.string(),
    relationship: z.string(),
    percentage: z.number().min(0).max(100),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  })).optional(),
  notes: z.string().optional(),
  agentId: z.string().min(1, 'Agent is required'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Claim Schemas
export const claimSchema = z.object({
  claimNumber: z.string().min(1, 'Claim number is required'),
  policyId: z.string().min(1, 'Policy is required'),
  clientId: z.string().min(1, 'Client is required'),
  type: z.enum(['accident', 'theft', 'damage', 'medical', 'liability', 'other']),
  status: z.enum(['submitted', 'under-review', 'approved', 'denied', 'paid', 'closed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  incidentDate: z.date(),
  reportDate: z.date(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  estimatedAmount: z.number().positive('Estimated amount must be positive'),
  approvedAmount: z.number().optional(),
  paidAmount: z.number().optional(),
  assignedAdjusterId: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.reportDate >= data.incidentDate, {
  message: 'Report date must be on or after incident date',
  path: ['reportDate'],
});

// Document Schemas
export const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['policy', 'claim', 'identification', 'medical', 'financial', 'other']),
  status: z.enum(['pending', 'verified', 'rejected']),
  description: z.string().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.enum(['policy', 'claim', 'client']).optional(),
  tags: z.array(z.string()).optional(),
});

// User Profile Schemas
export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  avatar: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

// Settings Schemas
export const companySettingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  website: z.string().url().optional().or(z.literal('')),
  taxId: z.string().min(1, 'Tax ID is required'),
  license: z.string().optional(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  autoRenewalReminder: z.boolean(),
  reminderDaysBefore: z.number().min(1).max(365),
});

// Report Schemas
export const reportParametersSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  groupBy: z.string().optional(),
  filters: z.record(z.any()).optional(),
  includeCharts: z.boolean().optional(),
  includeDetails: z.boolean().optional(),
}).refine((data) => data.dateTo >= data.dateFrom, {
  message: 'End date must be on or after start date',
  path: ['dateTo'],
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in']),
    value: z.any(),
  })).optional(),
  pagination: z.object({
    page: z.number().min(1),
    pageSize: z.number().min(1).max(100),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

// Export type inference helpers
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type PolicyInput = z.infer<typeof policySchema>;
export type ClaimInput = z.infer<typeof claimSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type ReportParametersInput = z.infer<typeof reportParametersSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
