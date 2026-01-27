// AI-CORE Constants - Shared Constants and Configuration

// API Constants
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// HTTP Status Codes
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
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // AI errors
  AI_MODEL_NOT_AVAILABLE: 'AI_MODEL_NOT_AVAILABLE',
  AI_RATE_LIMIT_EXCEEDED: 'AI_RATE_LIMIT_EXCEEDED',
  AI_CONTEXT_TOO_LONG: 'AI_CONTEXT_TOO_LONG',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
  GUEST: 'guest',
} as const;

// AI Models
export const AI_MODELS = {
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
} as const;

// Default AI Configuration
export const DEFAULT_AI_CONFIG = {
  model: AI_MODELS.GPT_4_TURBO,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 60 * 1000, // 1 minute
  DEFAULT_MAX_REQUESTS: 100,
  AI_MAX_REQUESTS: 20,
  AUTH_MAX_REQUESTS: 10,
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  DATE_ONLY: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
} as const;

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
} as const;

// Environment
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging',
} as const;

// Application Ports
export const PORTS = {
  WEB: 3000,
  PORTAL_CUSTOMER: 3001,
  PORTAL_EMPLOYEE: 3002,
  API: 4000,
  DESKTOP: 4100,
} as const;
