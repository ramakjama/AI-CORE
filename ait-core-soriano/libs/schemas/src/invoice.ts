import { z } from 'zod';
import { validators, addressSchema } from './utils';

/**
 * ============================================
 * INVOICE SCHEMAS
 * ============================================
 */

// Enums
export const InvoiceStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'VIEWED',
  'PAID',
  'PARTIALLY_PAID',
  'OVERDUE',
  'CANCELLED',
  'REFUNDED',
]);

export const InvoiceTypeSchema = z.enum([
  'STANDARD',
  'PROFORMA',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'RECURRING',
]);

export const PaymentMethodSchema = z.enum([
  'BANK_TRANSFER',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CHECK',
  'CASH',
  'PAYPAL',
  'STRIPE',
  'BIZUM',
  'OTHER',
]);

export const TaxTypeSchema = z.enum([
  'IVA',
  'IRPF',
  'VAT',
  'GST',
  'OTHER',
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type TaxType = z.infer<typeof TaxTypeSchema>;

/**
 * Tax detail schema
 */
export const TaxDetailSchema = z.object({
  type: TaxTypeSchema,
  name: z.string().max(100),
  rate: validators.percentage,
  amount: validators.nonNegativeNumber,
});

export type TaxDetail = z.infer<typeof TaxDetailSchema>;

/**
 * Invoice item schema
 */
export const InvoiceItemSchema = z.object({
  id: validators.cuid.optional(),
  description: z.string().min(1).max(500),
  quantity: validators.positiveNumber,
  unitPrice: validators.positiveNumber,
  discount: validators.percentage.optional().default(0),
  taxRate: validators.percentage.optional().default(0),
  subtotal: validators.nonNegativeNumber,
  total: validators.positiveNumber,
  notes: z.string().max(500).optional(),
}).refine(data => {
  const subtotal = data.quantity * data.unitPrice;
  const discountAmount = subtotal * (data.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  return Math.abs(data.subtotal - afterDiscount) < 0.01;
}, {
  message: 'Subtotal calculation does not match',
  path: ['subtotal'],
}).refine(data => {
  const taxAmount = data.subtotal * (data.taxRate / 100);
  const total = data.subtotal + taxAmount;
  return Math.abs(data.total - total) < 0.01;
}, {
  message: 'Total calculation does not match',
  path: ['total'],
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

/**
 * Payment record schema
 */
export const PaymentRecordSchema = z.object({
  id: validators.cuid,
  invoiceId: validators.cuid,
  amount: validators.positiveNumber,
  method: PaymentMethodSchema,
  reference: z.string().max(200).optional(),
  paidAt: z.date(),
  processedBy: validators.cuid.optional(),
  notes: z.string().max(500).optional(),
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

/**
 * Invoice party schema (issuer/recipient)
 */
export const InvoicePartySchema = z.object({
  name: z.string().min(1).max(200),
  taxId: z.string().max(50), // NIF/CIF/VAT number
  email: validators.email,
  phone: validators.phone.optional(),
  address: addressSchema,
});

export type InvoiceParty = z.infer<typeof InvoicePartySchema>;

/**
 * Core Invoice schema
 */
export const InvoiceSchema = z.object({
  id: validators.cuid,
  invoiceNumber: z.string().regex(/^(INV|FAC)-\d{4}-\d{6}$/, 'Invalid invoice number format'),
  type: InvoiceTypeSchema,
  status: InvoiceStatusSchema,

  // Relationships
  customerId: validators.cuid,
  policyId: validators.cuid.optional(),

  // Parties
  issuer: InvoicePartySchema,
  recipient: InvoicePartySchema,

  // Items
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),

  // Amounts
  subtotal: validators.nonNegativeNumber,
  discountTotal: validators.nonNegativeNumber.optional().default(0),
  taxTotal: validators.nonNegativeNumber,
  taxes: z.array(TaxDetailSchema).optional(),
  total: validators.positiveNumber,
  currency: validators.currency.default('EUR'),

  // Payments
  paidAmount: validators.nonNegativeNumber.default(0),
  remainingAmount: validators.nonNegativeNumber,
  payments: z.array(PaymentRecordSchema).optional(),

  // Dates
  date: z.date(),
  dueDate: z.date(),
  paidAt: z.date().nullable(),

  // Additional info
  notes: z.string().max(1000).optional(),
  terms: z.string().max(2000).optional(),
  footer: z.string().max(500).optional(),

  // Documents
  pdfUrl: validators.url.optional(),
  attachments: z.array(validators.url).optional(),

  // Metadata
  sentAt: z.date().nullable(),
  viewedAt: z.date().nullable(),

  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
}).refine(data => data.dueDate >= data.date, {
  message: 'Due date must be on or after invoice date',
  path: ['dueDate'],
}).refine(data => {
  const calculatedSubtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
  return Math.abs(data.subtotal - calculatedSubtotal) < 0.01;
}, {
  message: 'Subtotal must match sum of item subtotals',
  path: ['subtotal'],
}).refine(data => {
  const calculatedTaxTotal = data.items.reduce((sum, item) => {
    const taxAmount = item.subtotal * (item.taxRate / 100);
    return sum + taxAmount;
  }, 0);
  return Math.abs(data.taxTotal - calculatedTaxTotal) < 0.01;
}, {
  message: 'Tax total must match sum of item taxes',
  path: ['taxTotal'],
}).refine(data => {
  const calculatedTotal = data.subtotal - data.discountTotal + data.taxTotal;
  return Math.abs(data.total - calculatedTotal) < 0.01;
}, {
  message: 'Total must equal subtotal - discount + tax',
  path: ['total'],
}).refine(data => {
  return Math.abs(data.remainingAmount - (data.total - data.paidAmount)) < 0.01;
}, {
  message: 'Remaining amount must equal total - paid amount',
  path: ['remainingAmount'],
});

export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * Create invoice input schema
 */
export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  invoiceNumber: true,
  status: true,
  paidAmount: true,
  remainingAmount: true,
  payments: true,
  paidAt: true,
  pdfUrl: true,
  sentAt: true,
  viewedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

/**
 * Update invoice input schema
 */
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  status: InvoiceStatusSchema.optional(),
});

export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

/**
 * Send invoice schema
 */
export const SendInvoiceSchema = z.object({
  recipientEmail: validators.email,
  ccEmails: z.array(validators.email).optional(),
  subject: z.string().min(1).max(200).optional(),
  message: z.string().max(2000).optional(),
  attachPdf: z.boolean().default(true),
});

export type SendInvoiceInput = z.infer<typeof SendInvoiceSchema>;

/**
 * Record payment schema
 */
export const RecordPaymentSchema = z.object({
  amount: validators.positiveNumber,
  method: PaymentMethodSchema,
  reference: z.string().max(200).optional(),
  paidAt: z.date().optional(),
  notes: z.string().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

/**
 * Filter invoices schema
 */
export const FilterInvoicesSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  type: InvoiceTypeSchema.optional(),
  customerId: validators.cuid.optional(),
  policyId: validators.cuid.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  overdue: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type FilterInvoicesInput = z.infer<typeof FilterInvoicesSchema>;

/**
 * Cancel invoice schema
 */
export const CancelInvoiceSchema = z.object({
  reason: z.string().min(10).max(1000),
  createCreditNote: z.boolean().default(false),
});

export type CancelInvoiceInput = z.infer<typeof CancelInvoiceSchema>;

/**
 * Credit note schema
 */
export const CreateCreditNoteSchema = z.object({
  originalInvoiceId: validators.cuid,
  reason: z.string().min(10).max(1000),
  items: z.array(InvoiceItemSchema).min(1),
  partialRefund: z.boolean().default(false),
});

export type CreateCreditNoteInput = z.infer<typeof CreateCreditNoteSchema>;

/**
 * Recurring invoice configuration schema
 */
export const RecurringInvoiceConfigSchema = z.object({
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.date(),
  endDate: z.date().optional(),
  maxOccurrences: z.number().int().positive().optional(),
  autoSend: z.boolean().default(false),
  template: CreateInvoiceSchema,
}).refine(data => {
  if (data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type RecurringInvoiceConfig = z.infer<typeof RecurringInvoiceConfigSchema>;

/**
 * Invoice statistics schema
 */
export const InvoiceStatisticsSchema = z.object({
  totalInvoices: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  unpaidAmount: z.number().nonnegative(),
  overdueAmount: z.number().nonnegative(),
  averageAmount: z.number().nonnegative(),
  averagePaymentDays: z.number().nonnegative(),
  byStatus: z.record(InvoiceStatusSchema, z.number().int().nonnegative()),
  byMonth: z.array(z.object({
    month: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number().nonnegative(),
  })),
});

export type InvoiceStatistics = z.infer<typeof InvoiceStatisticsSchema>;

/**
 * Invoice reminder schema
 */
export const InvoiceReminderSchema = z.object({
  daysBeforeDue: z.number().int().positive(),
  daysAfterDue: z.number().int().positive(),
  maxReminders: z.number().int().positive().max(10),
  emailTemplate: z.string().optional(),
});

export type InvoiceReminder = z.infer<typeof InvoiceReminderSchema>;
