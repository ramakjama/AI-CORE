/**
 * Event Schemas and Validation
 */

import { z } from 'zod';

/**
 * Base event schema
 */
export const baseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  aggregateId: z.string(),
  aggregateType: z.string(),
  version: z.number().int().positive(),
  data: z.unknown(),
  metadata: z.record(z.any()),
  timestamp: z.date(),
});

export type BaseEvent = z.infer<typeof baseEventSchema>;

/**
 * Policy Events
 */
export const policyCreatedEventSchema = z.object({
  policyId: z.string(),
  policyNumber: z.string(),
  customerId: z.string(),
  type: z.string(),
  premium: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const policyUpdatedEventSchema = z.object({
  policyId: z.string(),
  changes: z.record(z.any()),
});

export const policyCancelledEventSchema = z.object({
  policyId: z.string(),
  reason: z.string(),
  cancelledAt: z.string().datetime(),
});

export const policyRenewedEventSchema = z.object({
  policyId: z.string(),
  newPolicyId: z.string(),
  renewalDate: z.string().datetime(),
});

/**
 * Claim Events
 */
export const claimSubmittedEventSchema = z.object({
  claimId: z.string(),
  claimNumber: z.string(),
  policyId: z.string(),
  type: z.string(),
  amount: z.number(),
  incidentDate: z.string().datetime(),
});

export const claimApprovedEventSchema = z.object({
  claimId: z.string(),
  approvedAmount: z.number(),
  approvedBy: z.string(),
  approvedAt: z.string().datetime(),
});

export const claimRejectedEventSchema = z.object({
  claimId: z.string(),
  reason: z.string(),
  rejectedBy: z.string(),
  rejectedAt: z.string().datetime(),
});

export const claimPaidEventSchema = z.object({
  claimId: z.string(),
  amount: z.number(),
  paymentMethod: z.string(),
  paidAt: z.string().datetime(),
});

/**
 * Payment Events
 */
export const paymentInitiatedEventSchema = z.object({
  paymentId: z.string(),
  policyId: z.string(),
  customerId: z.string(),
  amount: z.number(),
  method: z.string(),
});

export const paymentCompletedEventSchema = z.object({
  paymentId: z.string(),
  transactionId: z.string(),
  completedAt: z.string().datetime(),
});

export const paymentFailedEventSchema = z.object({
  paymentId: z.string(),
  reason: z.string(),
  failedAt: z.string().datetime(),
});

/**
 * Customer Events
 */
export const customerCreatedEventSchema = z.object({
  customerId: z.string(),
  customerNumber: z.string(),
  email: z.string().email(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
});

export const customerUpdatedEventSchema = z.object({
  customerId: z.string(),
  changes: z.record(z.any()),
});

/**
 * Notification Events
 */
export const notificationSendEventSchema = z.object({
  notificationId: z.string(),
  userId: z.string(),
  channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP']),
  title: z.string(),
  message: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export const emailSendEventSchema = z.object({
  emailId: z.string(),
  to: z.array(z.string().email()),
  subject: z.string(),
  template: z.string(),
  data: z.record(z.any()),
});

export const smsSendEventSchema = z.object({
  smsId: z.string(),
  to: z.string(),
  message: z.string(),
});

/**
 * Event validation utility
 */
export function validateEvent<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function validateEventSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
