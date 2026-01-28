/**
 * @fileoverview Message Type Definitions
 * @module @ait-core/communications/types
 * @description Type definitions for messages and communication
 */

/**
 * Communication channels
 */
export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP';

/**
 * Delivery status
 */
export type DeliveryStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED'
  | 'REJECTED'
  | 'OPENED'
  | 'CLICKED'
  | 'UNSUBSCRIBED';

/**
 * Message priority
 */
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/**
 * Template category
 */
export type TemplateCategory =
  | 'TRANSACTIONAL'
  | 'MARKETING'
  | 'NOTIFICATION'
  | 'ALERT'
  | 'REMINDER';

/**
 * Template type by use case
 */
export enum TemplateType {
  // Authentication
  WELCOME = 'WELCOME',
  OTP_CODE = 'OTP_CODE',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Policy
  POLICY_ISSUED = 'POLICY_ISSUED',
  POLICY_RENEWAL = 'POLICY_RENEWAL',
  POLICY_CANCELLED = 'POLICY_CANCELLED',
  POLICY_EXPIRING = 'POLICY_EXPIRING',

  // Claim
  CLAIM_RECEIVED = 'CLAIM_RECEIVED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  CLAIM_PAYMENT = 'CLAIM_PAYMENT',
  CLAIM_UPDATE = 'CLAIM_UPDATE',

  // Payment
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',

  // Marketing
  NEWSLETTER = 'NEWSLETTER',
  PROMOTION = 'PROMOTION',
  PRODUCT_ANNOUNCEMENT = 'PRODUCT_ANNOUNCEMENT',

  // Customer Service
  SUPPORT_TICKET = 'SUPPORT_TICKET',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',

  // Reports
  MONTHLY_REPORT = 'MONTHLY_REPORT',
  ANNUAL_SUMMARY = 'ANNUAL_SUMMARY'
}

/**
 * Event types for tracking
 */
export enum CommunicationEvent {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  REJECTED = 'REJECTED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  COMPLAINED = 'COMPLAINED'
}

/**
 * Provider types
 */
export enum ProviderType {
  RESEND = 'RESEND',
  TWILIO = 'TWILIO',
  SENDGRID = 'SENDGRID',
  MAILGUN = 'MAILGUN',
  AWS_SES = 'AWS_SES'
}

/**
 * Campaign status
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Consent types
 */
export enum ConsentType {
  MARKETING = 'MARKETING',
  TRANSACTIONAL = 'TRANSACTIONAL',
  PROMOTIONAL = 'PROMOTIONAL',
  NEWSLETTER = 'NEWSLETTER'
}

/**
 * Unsubscribe reason
 */
export enum UnsubscribeReason {
  TOO_FREQUENT = 'TOO_FREQUENT',
  NOT_RELEVANT = 'NOT_RELEVANT',
  NO_LONGER_INTERESTED = 'NO_LONGER_INTERESTED',
  SPAM = 'SPAM',
  OTHER = 'OTHER'
}
