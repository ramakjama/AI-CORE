/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  NAME: 'AIT-CORE Soriano Mediadores',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export const INSURANCE_TYPES = {
  AUTO: 'AUTO',
  HOME: 'HOME',
  HEALTH: 'HEALTH',
  LIFE: 'LIFE',
  BUSINESS: 'BUSINESS',
  TRAVEL: 'TRAVEL',
  PET: 'PET',
  CYBER: 'CYBER',
  LIABILITY: 'LIABILITY',
  MARINE: 'MARINE',
  AGRICULTURAL: 'AGRICULTURAL',
  CONSTRUCTION: 'CONSTRUCTION',
} as const;

export const POLICY_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  RENEWED: 'RENEWED',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIAL: 'PARTIAL',
} as const;

export const CLAIM_STATUS = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAID: 'PAID',
  CLOSED: 'CLOSED',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  AGENT: 'AGENT',
  CUSTOMER: 'CUSTOMER',
  UNDERWRITER: 'UNDERWRITER',
  CLAIMS_ADJUSTER: 'CLAIMS_ADJUSTER',
  ACCOUNTANT: 'ACCOUNTANT',
  AUDITOR: 'AUDITOR',
} as const;

export const PERMISSION_SCOPES = {
  // Policies
  POLICY_READ: 'policy:read',
  POLICY_CREATE: 'policy:create',
  POLICY_UPDATE: 'policy:update',
  POLICY_DELETE: 'policy:delete',

  // Claims
  CLAIM_READ: 'claim:read',
  CLAIM_CREATE: 'claim:create',
  CLAIM_UPDATE: 'claim:update',
  CLAIM_DELETE: 'claim:delete',
  CLAIM_APPROVE: 'claim:approve',

  // Customers
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Finance
  FINANCE_READ: 'finance:read',
  FINANCE_MANAGE: 'finance:manage',

  // Reports
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',

  // System
  SYSTEM_MANAGE: 'system:manage',
  AUDIT_READ: 'audit:read',
} as const;

export const KAFKA_TOPICS = {
  // Policy Events
  POLICY_CREATED: 'policy.created',
  POLICY_UPDATED: 'policy.updated',
  POLICY_CANCELLED: 'policy.cancelled',
  POLICY_RENEWED: 'policy.renewed',

  // Claim Events
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_APPROVED: 'claim.approved',
  CLAIM_REJECTED: 'claim.rejected',
  CLAIM_PAID: 'claim.paid',

  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',

  // Customer Events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Notification Events
  NOTIFICATION_SEND: 'notification.send',
  EMAIL_SEND: 'email.send',
  SMS_SEND: 'sms.send',

  // Analytics Events
  ANALYTICS_EVENT: 'analytics.event',
  AUDIT_LOG: 'audit.log',
} as const;

export const NOTIFICATION_CHANNELS = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP',
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const LANGUAGE_CODES = {
  ES: 'es',
  EN: 'en',
  CA: 'ca',
  EU: 'eu',
  GL: 'gl',
} as const;

export const CURRENCY_CODES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP',
} as const;

export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
  TIME: 'HH:mm:ss',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
} as const;

export const RATE_LIMITS = {
  GLOBAL_PER_MINUTE: 60,
  GLOBAL_PER_HOUR: 1000,
  API_PER_MINUTE: 30,
  API_PER_HOUR: 500,
  AUTH_PER_MINUTE: 5,
  AUTH_PER_HOUR: 20,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_ES: /^(\+34|0034|34)?[6789]\d{8}$/,
  NIF: /^[0-9]{8}[A-Z]$/,
  NIE: /^[XYZ][0-9]{7}[A-Z]$/,
  CIF: /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/,
  IBAN: /^ES\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  POSTAL_CODE_ES: /^[0-5]\d{4}$/,
  LICENSE_PLATE_ES: /^[0-9]{4}[A-Z]{3}$/,
} as const;

export const ERROR_CODES = {
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Business Logic
  POLICY_NOT_FOUND: 'POLICY_NOT_FOUND',
  POLICY_ALREADY_EXISTS: 'POLICY_ALREADY_EXISTS',
  POLICY_CANNOT_BE_MODIFIED: 'POLICY_CANNOT_BE_MODIFIED',
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  KAFKA_ERROR: 'KAFKA_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;
