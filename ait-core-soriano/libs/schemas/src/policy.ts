import { z } from 'zod';
import { validators, moneySchema } from './utils';

/**
 * ============================================
 * POLICY SCHEMAS
 * ============================================
 */

// Enums
export const PolicyTypeSchema = z.enum([
  'AUTO',
  'HOME',
  'LIFE',
  'HEALTH',
  'BUSINESS',
  'TRAVEL',
  'PET',
  'CIVIL_LIABILITY',
  'PROFESSIONAL_LIABILITY',
  'CYBER',
  'MARINE',
  'AVIATION',
  'OTHER',
]);

export const PolicyStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'PENDING_PAYMENT',
  'SUSPENDED',
  'CANCELLED',
  'EXPIRED',
  'RENEWED',
]);

export const PaymentFrequencySchema = z.enum([
  'ANNUAL',
  'SEMI_ANNUAL',
  'QUARTERLY',
  'MONTHLY',
]);

export const CoverageTypeSchema = z.enum([
  'BASIC',
  'EXTENDED',
  'COMPREHENSIVE',
  'CUSTOM',
]);

export type PolicyType = z.infer<typeof PolicyTypeSchema>;
export type PolicyStatus = z.infer<typeof PolicyStatusSchema>;
export type PaymentFrequency = z.infer<typeof PaymentFrequencySchema>;
export type CoverageType = z.infer<typeof CoverageTypeSchema>;

/**
 * Coverage schema
 */
export const CoverageSchema = z.object({
  id: validators.cuid.optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amount: validators.positiveNumber,
  currency: validators.currency.default('EUR'),
  deductible: validators.nonNegativeNumber.optional(),
  type: CoverageTypeSchema.optional(),
});

export type Coverage = z.infer<typeof CoverageSchema>;

/**
 * Policy holder schema
 */
export const PolicyHolderSchema = z.object({
  id: validators.cuid.optional(),
  name: z.string().min(1).max(200),
  documentType: z.enum(['NIF', 'NIE', 'CIF', 'PASSPORT']),
  documentNumber: z.string().min(1).max(50),
  email: validators.email,
  phone: validators.phone,
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postalCode: validators.postalCode,
  country: validators.countryCode.default('ES'),
  birthDate: z.date().optional(),
});

export type PolicyHolder = z.infer<typeof PolicyHolderSchema>;

/**
 * Beneficiary schema
 */
export const BeneficiarySchema = z.object({
  id: validators.cuid.optional(),
  name: z.string().min(1).max(200),
  relationship: z.string().min(1).max(100),
  percentage: validators.percentage,
  documentType: z.enum(['NIF', 'NIE', 'PASSPORT']).optional(),
  documentNumber: z.string().max(50).optional(),
  email: validators.email.optional(),
  phone: validators.phone.optional(),
});

export type Beneficiary = z.infer<typeof BeneficiarySchema>;

/**
 * Premium breakdown schema
 */
export const PremiumBreakdownSchema = z.object({
  netPremium: validators.positiveNumber,
  taxes: validators.nonNegativeNumber,
  fees: validators.nonNegativeNumber,
  surcharges: validators.nonNegativeNumber.optional(),
  discounts: validators.nonNegativeNumber.optional(),
  totalPremium: validators.positiveNumber,
  currency: validators.currency.default('EUR'),
});

export type PremiumBreakdown = z.infer<typeof PremiumBreakdownSchema>;

/**
 * Core Policy schema
 */
export const PolicySchema = z.object({
  id: validators.cuid,
  policyNumber: z.string().regex(/^POL-\d{4}-\d{6}$/, 'Invalid policy number format'),
  type: PolicyTypeSchema,
  status: PolicyStatusSchema,

  // Relationships
  customerId: validators.cuid,
  insurerId: validators.cuid,
  agentId: validators.cuid.optional(),

  // Policy details
  holder: PolicyHolderSchema,
  coverages: z.array(CoverageSchema).min(1, 'At least one coverage is required'),
  beneficiaries: z.array(BeneficiarySchema).optional(),

  // Premium
  premium: validators.positiveNumber,
  premiumBreakdown: PremiumBreakdownSchema.optional(),
  currency: validators.currency.default('EUR'),
  paymentFrequency: PaymentFrequencySchema,

  // Dates
  startDate: z.date(),
  endDate: z.date(),
  renewalDate: z.date().nullable(),
  cancelledAt: z.date().nullable(),

  // Auto-renewal
  autoRenewal: z.boolean().default(true),
  renewalNotificationDays: z.number().int().positive().default(30),

  // Documents
  documentUrls: z.array(validators.url).optional(),

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(data => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine(data => {
  if (data.premiumBreakdown) {
    const calculated = data.premiumBreakdown.netPremium
      + data.premiumBreakdown.taxes
      + data.premiumBreakdown.fees
      + (data.premiumBreakdown.surcharges || 0)
      - (data.premiumBreakdown.discounts || 0);
    return Math.abs(calculated - data.premiumBreakdown.totalPremium) < 0.01;
  }
  return true;
}, {
  message: 'Premium breakdown total does not match',
  path: ['premiumBreakdown', 'totalPremium'],
});

export type Policy = z.infer<typeof PolicySchema>;

/**
 * Create policy input schema
 */
export const CreatePolicySchema = PolicySchema.omit({
  id: true,
  policyNumber: true,
  status: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;

/**
 * Update policy input schema
 */
export const UpdatePolicySchema = CreatePolicySchema.partial().extend({
  status: PolicyStatusSchema.optional(),
});

export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;

/**
 * Filter policies schema
 */
export const FilterPoliciesSchema = z.object({
  type: PolicyTypeSchema.optional(),
  status: PolicyStatusSchema.optional(),
  customerId: validators.cuid.optional(),
  insurerId: validators.cuid.optional(),
  agentId: validators.cuid.optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  endDateFrom: z.coerce.date().optional(),
  endDateTo: z.coerce.date().optional(),
  autoRenewal: z.coerce.boolean().optional(),
  search: z.string().optional(),
  minPremium: z.coerce.number().optional(),
  maxPremium: z.coerce.number().optional(),
});

export type FilterPoliciesInput = z.infer<typeof FilterPoliciesSchema>;

/**
 * Cancel policy schema
 */
export const CancelPolicySchema = z.object({
  reason: z.string().min(10).max(1000),
  effectiveDate: z.date(),
  refundAmount: validators.nonNegativeNumber.optional(),
});

export type CancelPolicyInput = z.infer<typeof CancelPolicySchema>;

/**
 * Renew policy schema
 */
export const RenewPolicySchema = z.object({
  newStartDate: z.date(),
  newEndDate: z.date(),
  newPremium: validators.positiveNumber.optional(),
  adjustedCoverages: z.array(CoverageSchema).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => data.newEndDate > data.newStartDate, {
  message: 'New end date must be after new start date',
  path: ['newEndDate'],
});

export type RenewPolicyInput = z.infer<typeof RenewPolicySchema>;

/**
 * Policy quote schema
 */
export const PolicyQuoteSchema = z.object({
  type: PolicyTypeSchema,
  coverages: z.array(CoverageSchema).min(1),
  holder: PolicyHolderSchema,
  startDate: z.date(),
  duration: z.number().int().positive().max(365), // days
  paymentFrequency: PaymentFrequencySchema,
  additionalInfo: z.record(z.unknown()).optional(),
});

export type PolicyQuoteInput = z.infer<typeof PolicyQuoteSchema>;

export const PolicyQuoteResultSchema = z.object({
  quoteId: validators.cuid,
  validUntil: z.date(),
  premium: validators.positiveNumber,
  premiumBreakdown: PremiumBreakdownSchema,
  coverages: z.array(CoverageSchema),
  terms: z.string().optional(),
  recommendedCoverages: z.array(CoverageSchema).optional(),
});

export type PolicyQuoteResult = z.infer<typeof PolicyQuoteResultSchema>;

/**
 * Policy document schema
 */
export const PolicyDocumentSchema = z.object({
  id: validators.cuid,
  policyId: validators.cuid,
  type: z.enum([
    'POLICY_DOCUMENT',
    'CERTIFICATE',
    'AMENDMENT',
    'CANCELLATION',
    'RENEWAL',
    'RECEIPT',
    'OTHER',
  ]),
  filename: z.string().min(1).max(255),
  url: validators.url,
  uploadedAt: z.date(),
  uploadedBy: validators.cuid,
});

export type PolicyDocument = z.infer<typeof PolicyDocumentSchema>;

/**
 * Policy amendment schema
 */
export const PolicyAmendmentSchema = z.object({
  id: validators.cuid,
  policyId: validators.cuid,
  type: z.enum([
    'COVERAGE_CHANGE',
    'PREMIUM_ADJUSTMENT',
    'HOLDER_CHANGE',
    'BENEFICIARY_CHANGE',
    'EXTENSION',
    'OTHER',
  ]),
  description: z.string().min(1).max(1000),
  effectiveDate: z.date(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
  createdBy: validators.cuid,
  createdAt: z.date(),
});

export type PolicyAmendment = z.infer<typeof PolicyAmendmentSchema>;
