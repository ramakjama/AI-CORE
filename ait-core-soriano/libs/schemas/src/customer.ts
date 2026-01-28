import { z } from 'zod';
import { validators, addressSchema } from './utils';

/**
 * ============================================
 * CUSTOMER SCHEMAS
 * ============================================
 */

// Enums
export const CustomerTypeSchema = z.enum([
  'INDIVIDUAL',
  'BUSINESS',
  'CORPORATE',
]);

export const CustomerStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PROSPECT',
  'SUSPENDED',
  'DELETED',
]);

export const CustomerSegmentSchema = z.enum([
  'RETAIL',
  'SME',
  'CORPORATE',
  'VIP',
  'STANDARD',
]);

export const ContactPreferenceSchema = z.enum([
  'EMAIL',
  'PHONE',
  'SMS',
  'WHATSAPP',
  'POST',
]);

export const GenderSchema = z.enum([
  'MALE',
  'FEMALE',
  'OTHER',
  'PREFER_NOT_TO_SAY',
]);

export type CustomerType = z.infer<typeof CustomerTypeSchema>;
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;
export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;
export type ContactPreference = z.infer<typeof ContactPreferenceSchema>;
export type Gender = z.infer<typeof GenderSchema>;

/**
 * Contact information schema
 */
export const ContactInfoSchema = z.object({
  email: validators.email,
  emailSecondary: validators.email.optional(),
  phone: validators.phone,
  phoneSecondary: validators.phone.optional(),
  mobile: validators.phone.optional(),
  fax: z.string().max(20).optional(),
  website: validators.url.optional(),
  preferredContact: ContactPreferenceSchema.optional(),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;

/**
 * Individual person details schema
 */
export const IndividualDetailsSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  gender: GenderSchema.optional(),
  birthDate: z.date(),
  birthPlace: z.string().max(200).optional(),
  nationality: validators.countryCode.optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER']).optional(),
  occupation: z.string().max(200).optional(),
  employer: z.string().max(200).optional(),
});

export type IndividualDetails = z.infer<typeof IndividualDetailsSchema>;

/**
 * Business details schema
 */
export const BusinessDetailsSchema = z.object({
  legalName: z.string().min(1).max(200),
  tradeName: z.string().max(200).optional(),
  taxId: validators.cif,
  industry: z.string().max(200),
  sector: z.string().max(200).optional(),
  employeeCount: z.number().int().positive().optional(),
  annualRevenue: validators.positiveNumber.optional(),
  foundedDate: z.date().optional(),
  website: validators.url.optional(),
  description: z.string().max(2000).optional(),
});

export type BusinessDetails = z.infer<typeof BusinessDetailsSchema>;

/**
 * Customer contact person schema (for business customers)
 */
export const ContactPersonSchema = z.object({
  id: validators.cuid.optional(),
  name: z.string().min(1).max(200),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  email: validators.email,
  phone: validators.phone,
  isPrimary: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type ContactPerson = z.infer<typeof ContactPersonSchema>;

/**
 * Customer note schema
 */
export const CustomerNoteSchema = z.object({
  id: validators.cuid,
  customerId: validators.cuid,
  content: z.string().min(1).max(2000),
  isImportant: z.boolean().default(false),
  createdBy: validators.cuid,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomerNote = z.infer<typeof CustomerNoteSchema>;

/**
 * Customer document schema
 */
export const CustomerDocumentSchema = z.object({
  id: validators.cuid,
  customerId: validators.cuid,
  type: z.enum([
    'ID_CARD',
    'PASSPORT',
    'DRIVER_LICENSE',
    'TAX_CERTIFICATE',
    'PROOF_OF_ADDRESS',
    'BANK_STATEMENT',
    'CONTRACT',
    'OTHER',
  ]),
  filename: z.string().min(1).max(255),
  url: validators.url,
  expiryDate: z.date().optional(),
  uploadedAt: z.date(),
  uploadedBy: validators.cuid,
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  verifiedBy: validators.cuid.optional(),
});

export type CustomerDocument = z.infer<typeof CustomerDocumentSchema>;

/**
 * Core Customer schema
 */
export const CustomerSchema = z.object({
  id: validators.cuid,
  type: CustomerTypeSchema,
  status: CustomerStatusSchema,
  segment: CustomerSegmentSchema.default('STANDARD'),

  // Identification
  documentType: z.enum(['NIF', 'NIE', 'CIF', 'PASSPORT', 'OTHER']),
  documentNumber: z.string().min(1).max(50),

  // Type-specific details
  individualDetails: IndividualDetailsSchema.optional(),
  businessDetails: BusinessDetailsSchema.optional(),

  // Contact
  contactInfo: ContactInfoSchema,
  address: addressSchema,
  billingAddress: addressSchema.optional(), // If different from main address

  // Business customers
  contactPersons: z.array(ContactPersonSchema).optional(),

  // Preferences
  language: z.string().length(2).default('es'),
  timezone: z.string().default('Europe/Madrid'),
  communicationPreferences: z.object({
    marketing: z.boolean().default(false),
    newsletter: z.boolean().default(false),
    productUpdates: z.boolean().default(true),
    policyReminders: z.boolean().default(true),
  }).optional(),

  // Metadata
  source: z.enum(['WEBSITE', 'REFERRAL', 'AGENT', 'PHONE', 'EMAIL', 'EVENT', 'OTHER']).optional(),
  referredBy: validators.cuid.optional(),
  assignedAgent: validators.cuid.optional(),

  // Stats
  totalPolicies: z.number().int().nonnegative().default(0),
  activePolicies: z.number().int().nonnegative().default(0),
  totalPremium: z.number().nonnegative().default(0),
  totalClaims: z.number().int().nonnegative().default(0),
  lifetimeValue: z.number().nonnegative().default(0),

  // Risk assessment
  riskScore: z.number().min(0).max(100).optional(),
  creditScore: z.number().min(0).max(1000).optional(),

  // Notes and tags
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),

  // Timestamps
  firstInteractionAt: z.date().optional(),
  lastInteractionAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(data => {
  if (data.type === 'INDIVIDUAL') {
    return data.individualDetails !== undefined;
  }
  return true;
}, {
  message: 'Individual details are required for individual customers',
  path: ['individualDetails'],
}).refine(data => {
  if (data.type === 'BUSINESS' || data.type === 'CORPORATE') {
    return data.businessDetails !== undefined;
  }
  return true;
}, {
  message: 'Business details are required for business/corporate customers',
  path: ['businessDetails'],
});

export type Customer = z.infer<typeof CustomerSchema>;

/**
 * Create customer input schema
 */
export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  totalPolicies: true,
  activePolicies: true,
  totalPremium: true,
  totalClaims: true,
  lifetimeValue: true,
  firstInteractionAt: true,
  lastInteractionAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

/**
 * Update customer input schema
 */
export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  status: CustomerStatusSchema.optional(),
});

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

/**
 * Filter customers schema
 */
export const FilterCustomersSchema = z.object({
  type: CustomerTypeSchema.optional(),
  status: CustomerStatusSchema.optional(),
  segment: CustomerSegmentSchema.optional(),
  assignedAgent: validators.cuid.optional(),
  source: z.string().optional(),
  hasActivePolicies: z.coerce.boolean().optional(),
  minPolicies: z.coerce.number().int().nonnegative().optional(),
  maxPolicies: z.coerce.number().int().nonnegative().optional(),
  minLifetimeValue: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type FilterCustomersInput = z.infer<typeof FilterCustomersSchema>;

/**
 * Customer interaction schema
 */
export const CustomerInteractionSchema = z.object({
  id: validators.cuid,
  customerId: validators.cuid,
  type: z.enum([
    'CALL',
    'EMAIL',
    'MEETING',
    'CHAT',
    'NOTE',
    'QUOTE',
    'POLICY_CREATED',
    'CLAIM_FILED',
    'PAYMENT',
    'COMPLAINT',
    'OTHER',
  ]),
  subject: z.string().max(200).optional(),
  description: z.string().max(2000),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  outcome: z.string().max(500).optional(),
  duration: z.number().int().positive().optional(), // in minutes
  createdBy: validators.cuid,
  createdAt: z.date(),
  scheduledFor: z.date().optional(),
});

export type CustomerInteraction = z.infer<typeof CustomerInteractionSchema>;

export const CreateCustomerInteractionSchema = CustomerInteractionSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateCustomerInteractionInput = z.infer<typeof CreateCustomerInteractionSchema>;

/**
 * Customer statistics schema
 */
export const CustomerStatisticsSchema = z.object({
  totalCustomers: z.number().int().nonnegative(),
  activeCustomers: z.number().int().nonnegative(),
  newThisMonth: z.number().int().nonnegative(),
  byType: z.record(CustomerTypeSchema, z.number().int().nonnegative()),
  bySegment: z.record(CustomerSegmentSchema, z.number().int().nonnegative()),
  averageLifetimeValue: z.number().nonnegative(),
  totalLifetimeValue: z.number().nonnegative(),
  retentionRate: validators.percentage,
  churnRate: validators.percentage,
});

export type CustomerStatistics = z.infer<typeof CustomerStatisticsSchema>;

/**
 * Customer merge schema (for deduplication)
 */
export const MergeCustomersSchema = z.object({
  primaryCustomerId: validators.cuid,
  duplicateCustomerIds: z.array(validators.cuid).min(1),
  mergeStrategy: z.enum(['KEEP_PRIMARY', 'KEEP_MOST_RECENT', 'MERGE_ALL']).default('KEEP_PRIMARY'),
  notes: z.string().max(1000).optional(),
});

export type MergeCustomersInput = z.infer<typeof MergeCustomersSchema>;

/**
 * Customer import schema
 */
export const ImportCustomerSchema = z.object({
  email: validators.email,
  name: z.string().min(1).max(200),
  phone: validators.phone.optional(),
  documentNumber: z.string().max(50).optional(),
  type: CustomerTypeSchema.optional().default('INDIVIDUAL'),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.string().optional(), // comma-separated
});

export type ImportCustomerInput = z.infer<typeof ImportCustomerSchema>;
