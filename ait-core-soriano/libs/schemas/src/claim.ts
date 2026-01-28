import { z } from 'zod';
import { validators, coordinateSchema, fileUploadSchema } from './utils';

/**
 * ============================================
 * CLAIM SCHEMAS
 * ============================================
 */

// Enums
export const ClaimTypeSchema = z.enum([
  'ACCIDENT',
  'THEFT',
  'DAMAGE',
  'LIABILITY',
  'MEDICAL',
  'FIRE',
  'WATER_DAMAGE',
  'NATURAL_DISASTER',
  'VANDALISM',
  'INJURY',
  'DEATH',
  'DISABILITY',
  'OTHER',
]);

export const ClaimStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PENDING_INFO',
  'APPROVED',
  'PARTIALLY_APPROVED',
  'REJECTED',
  'PAID',
  'CLOSED',
  'APPEALED',
]);

export const ClaimPrioritySchema = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

export const DocumentTypeSchema = z.enum([
  'PHOTO',
  'VIDEO',
  'INVOICE',
  'RECEIPT',
  'MEDICAL_REPORT',
  'POLICE_REPORT',
  'ESTIMATE',
  'REPAIR_QUOTE',
  'WITNESS_STATEMENT',
  'OTHER',
]);

export type ClaimType = z.infer<typeof ClaimTypeSchema>;
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;
export type ClaimPriority = z.infer<typeof ClaimPrioritySchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

/**
 * Claim document schema
 */
export const ClaimDocumentSchema = z.object({
  id: validators.cuid.optional(),
  type: DocumentTypeSchema,
  url: validators.url,
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().positive(),
  description: z.string().max(500).optional(),
  uploadedAt: z.date().optional(),
  uploadedBy: validators.cuid.optional(),
});

export type ClaimDocument = z.infer<typeof ClaimDocumentSchema>;

/**
 * Incident location schema
 */
export const IncidentLocationSchema = z.object({
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postalCode: validators.postalCode.optional(),
  country: validators.countryCode.default('ES'),
  coordinates: coordinateSchema.optional(),
});

export type IncidentLocation = z.infer<typeof IncidentLocationSchema>;

/**
 * Claim participant schema (witnesses, involved parties)
 */
export const ClaimParticipantSchema = z.object({
  id: validators.cuid.optional(),
  type: z.enum(['WITNESS', 'INVOLVED_PARTY', 'MEDICAL_PROVIDER', 'REPAIR_SHOP', 'OTHER']),
  name: z.string().min(1).max(200),
  contactInfo: z.object({
    phone: validators.phone.optional(),
    email: validators.email.optional(),
    address: z.string().max(500).optional(),
  }),
  statement: z.string().max(2000).optional(),
  documentNumber: z.string().max(50).optional(),
});

export type ClaimParticipant = z.infer<typeof ClaimParticipantSchema>;

/**
 * Claim expense schema
 */
export const ClaimExpenseSchema = z.object({
  id: validators.cuid.optional(),
  description: z.string().min(1).max(500),
  amount: validators.positiveNumber,
  currency: validators.currency.default('EUR'),
  category: z.string().max(100).optional(),
  date: z.date(),
  receiptUrl: validators.url.optional(),
  approved: z.boolean().default(false),
  approvedAmount: validators.nonNegativeNumber.optional(),
});

export type ClaimExpense = z.infer<typeof ClaimExpenseSchema>;

/**
 * Claim timeline event schema
 */
export const ClaimTimelineEventSchema = z.object({
  id: validators.cuid,
  claimId: validators.cuid,
  type: z.enum([
    'SUBMITTED',
    'ASSIGNED',
    'DOCUMENT_UPLOADED',
    'STATUS_CHANGED',
    'COMMENT_ADDED',
    'PAYMENT_MADE',
    'CLOSED',
  ]),
  description: z.string().min(1).max(1000),
  performedBy: validators.cuid,
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type ClaimTimelineEvent = z.infer<typeof ClaimTimelineEventSchema>;

/**
 * Core Claim schema
 */
export const ClaimSchema = z.object({
  id: validators.cuid,
  claimNumber: z.string().regex(/^CLM-\d{4}-\d{6}$/, 'Invalid claim number format'),

  // Relationships
  policyId: validators.cuid,
  customerId: validators.cuid,
  assignedTo: validators.cuid.optional(),

  // Claim details
  type: ClaimTypeSchema,
  status: ClaimStatusSchema,
  priority: ClaimPrioritySchema.default('NORMAL'),

  // Incident information
  incidentDate: z.date(),
  reportedDate: z.date(),
  location: IncidentLocationSchema,
  description: z.string().min(10).max(2000),

  // Amounts
  estimatedAmount: validators.positiveNumber,
  approvedAmount: validators.positiveNumber.nullable(),
  paidAmount: validators.nonNegativeNumber.default(0),
  currency: validators.currency.default('EUR'),

  // Related data
  documents: z.array(ClaimDocumentSchema).optional(),
  participants: z.array(ClaimParticipantSchema).optional(),
  expenses: z.array(ClaimExpenseSchema).optional(),

  // Resolution
  resolutionNotes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(1000).optional(),
  resolvedAt: z.date().nullable(),
  resolvedBy: validators.cuid.optional(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(data => data.reportedDate >= data.incidentDate, {
  message: 'Reported date cannot be before incident date',
  path: ['reportedDate'],
}).refine(data => {
  if (data.approvedAmount !== null) {
    return data.approvedAmount <= data.estimatedAmount * 1.5; // Allow 50% over estimate
  }
  return true;
}, {
  message: 'Approved amount significantly exceeds estimated amount',
  path: ['approvedAmount'],
}).refine(data => {
  if (data.approvedAmount !== null) {
    return data.paidAmount <= data.approvedAmount;
  }
  return true;
}, {
  message: 'Paid amount cannot exceed approved amount',
  path: ['paidAmount'],
});

export type Claim = z.infer<typeof ClaimSchema>;

/**
 * Create claim input schema
 */
export const CreateClaimSchema = ClaimSchema.omit({
  id: true,
  claimNumber: true,
  status: true,
  priority: true,
  approvedAmount: true,
  paidAmount: true,
  resolutionNotes: true,
  rejectionReason: true,
  resolvedAt: true,
  resolvedBy: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
}).extend({
  documents: z.array(ClaimDocumentSchema).optional(),
});

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;

/**
 * Update claim input schema
 */
export const UpdateClaimSchema = z.object({
  type: ClaimTypeSchema.optional(),
  priority: ClaimPrioritySchema.optional(),
  description: z.string().min(10).max(2000).optional(),
  location: IncidentLocationSchema.optional(),
  estimatedAmount: validators.positiveNumber.optional(),
  assignedTo: validators.cuid.nullable().optional(),
  documents: z.array(ClaimDocumentSchema).optional(),
  participants: z.array(ClaimParticipantSchema).optional(),
  expenses: z.array(ClaimExpenseSchema).optional(),
});

export type UpdateClaimInput = z.infer<typeof UpdateClaimSchema>;

/**
 * Change claim status schema
 */
export const ChangeClaimStatusSchema = z.object({
  status: ClaimStatusSchema,
  notes: z.string().min(1).max(1000).optional(),
  notifyCustomer: z.boolean().default(true),
});

export type ChangeClaimStatusInput = z.infer<typeof ChangeClaimStatusSchema>;

/**
 * Approve claim schema
 */
export const ApproveClaimSchema = z.object({
  approvedAmount: validators.positiveNumber,
  notes: z.string().max(1000).optional(),
  approvedExpenses: z.array(z.object({
    expenseId: validators.cuid,
    approvedAmount: validators.positiveNumber,
  })).optional(),
});

export type ApproveClaimInput = z.infer<typeof ApproveClaimSchema>;

/**
 * Reject claim schema
 */
export const RejectClaimSchema = z.object({
  reason: z.string().min(10).max(1000),
  notifyCustomer: z.boolean().default(true),
});

export type RejectClaimInput = z.infer<typeof RejectClaimSchema>;

/**
 * Process payment schema
 */
export const ProcessClaimPaymentSchema = z.object({
  amount: validators.positiveNumber,
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHECK', 'CARD', 'CASH']),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type ProcessClaimPaymentInput = z.infer<typeof ProcessClaimPaymentSchema>;

/**
 * Filter claims schema
 */
export const FilterClaimsSchema = z.object({
  type: ClaimTypeSchema.optional(),
  status: ClaimStatusSchema.optional(),
  priority: ClaimPrioritySchema.optional(),
  policyId: validators.cuid.optional(),
  customerId: validators.cuid.optional(),
  assignedTo: validators.cuid.optional(),
  incidentDateFrom: z.coerce.date().optional(),
  incidentDateTo: z.coerce.date().optional(),
  reportedDateFrom: z.coerce.date().optional(),
  reportedDateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  search: z.string().optional(),
});

export type FilterClaimsInput = z.infer<typeof FilterClaimsSchema>;

/**
 * Claim comment schema
 */
export const ClaimCommentSchema = z.object({
  id: validators.cuid,
  claimId: validators.cuid,
  userId: validators.cuid,
  content: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClaimComment = z.infer<typeof ClaimCommentSchema>;

export const CreateClaimCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  isInternal: z.boolean().default(false),
});

export type CreateClaimCommentInput = z.infer<typeof CreateClaimCommentSchema>;

/**
 * Claim statistics schema
 */
export const ClaimStatisticsSchema = z.object({
  totalClaims: z.number().int().nonnegative(),
  openClaims: z.number().int().nonnegative(),
  closedClaims: z.number().int().nonnegative(),
  averageProcessingDays: z.number().nonnegative(),
  totalPaid: z.number().nonnegative(),
  averageClaimAmount: z.number().nonnegative(),
  approvalRate: validators.percentage,
  byType: z.record(ClaimTypeSchema, z.number().int().nonnegative()),
  byStatus: z.record(ClaimStatusSchema, z.number().int().nonnegative()),
});

export type ClaimStatistics = z.infer<typeof ClaimStatisticsSchema>;
