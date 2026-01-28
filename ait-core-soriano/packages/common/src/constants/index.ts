/**
 * Constants for AI-Suite
 */

// API Endpoints
export const API_ENDPOINTS = {
  // Gateway
  GATEWAY: '/api',

  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/auth/me',
  },

  // Documents
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
    VERSIONS: (id: string) => `/documents/${id}/versions`,
    SHARE: (id: string) => `/documents/${id}/share`,
    COMMENTS: (id: string) => `/documents/${id}/comments`,
    AI_ANALYZE: (id: string) => `/documents/${id}/ai/analyze`,
    AI_SUMMARIZE: (id: string) => `/documents/${id}/ai/summarize`,
  },

  // Spreadsheets
  SPREADSHEETS: {
    BASE: '/spreadsheets',
    BY_ID: (id: string) => `/spreadsheets/${id}`,
  },

  // Presentations
  PRESENTATIONS: {
    BASE: '/presentations',
    BY_ID: (id: string) => `/presentations/${id}`,
  },

  // Mail
  MAIL: {
    BASE: '/mail',
    THREADS: '/mail/threads',
    SEND: '/mail/send',
    DRAFT: '/mail/draft',
    LABELS: '/mail/labels',
    SEARCH: '/mail/search',
    AI_COMPOSE: '/mail/ai/compose',
    AI_SUMMARIZE: '/mail/ai/summarize',
  },

  // Calendar
  CALENDAR: {
    BASE: '/calendar',
    EVENTS: '/calendar/events',
    BY_ID: (id: string) => `/calendar/events/${id}`,
    FREE_BUSY: '/calendar/free-busy',
    AI_SCHEDULE: '/calendar/ai/schedule',
  },

  // Tasks
  TASKS: {
    BASE: '/tasks',
    BOARDS: '/tasks/boards',
    BY_ID: (id: string) => `/tasks/${id}`,
    AI_SUGGEST: '/tasks/ai/suggest',
  },

  // Notes
  NOTES: {
    BASE: '/notes',
    BY_ID: (id: string) => `/notes/${id}`,
  },

  // Storage
  STORAGE: {
    BASE: '/storage',
    UPLOAD: '/storage/upload',
    DOWNLOAD: (id: string) => `/storage/download/${id}`,
    SHARE: (id: string) => `/storage/${id}/share`,
  },

  // Forms
  FORMS: {
    BASE: '/forms',
    BY_ID: (id: string) => `/forms/${id}`,
    RESPONSES: (id: string) => `/forms/${id}/responses`,
  },

  // Workflow
  WORKFLOWS: {
    BASE: '/workflows',
    BY_ID: (id: string) => `/workflows/${id}`,
    RUN: (id: string) => `/workflows/${id}/run`,
    RUNS: (id: string) => `/workflows/${id}/runs`,
  },

  // Analytics
  ANALYTICS: {
    BASE: '/analytics',
    DASHBOARDS: '/analytics/dashboards',
    REPORTS: '/analytics/reports',
    KPI: '/analytics/kpi',
  },

  // CRM
  CRM: {
    CONTACTS: '/crm/contacts',
    DEALS: '/crm/deals',
    PIPELINE: '/crm/pipeline',
    AI_SCORE: '/crm/ai/score',
  },

  // HR
  HR: {
    EMPLOYEES: '/hr/employees',
    JOBS: '/hr/jobs',
    LEAVE: '/hr/leave',
    PERFORMANCE: '/hr/performance',
  },

  // Bookings
  BOOKINGS: {
    BASE: '/bookings',
    RESOURCES: '/bookings/resources',
    AVAILABILITY: '/bookings/availability',
  },

  // Whiteboard
  WHITEBOARDS: {
    BASE: '/whiteboards',
    BY_ID: (id: string) => `/whiteboards/${id}`,
  },

  // Translator
  TRANSLATOR: {
    TRANSLATE: '/translator/translate',
    DETECT: '/translator/detect',
    LANGUAGES: '/translator/languages',
  },

  // Assistant
  ASSISTANT: {
    CHAT: '/assistant/chat',
    STREAM: '/assistant/stream',
    CONTEXT: '/assistant/context',
  },

  // Search
  SEARCH: {
    BASE: '/search',
    GLOBAL: '/search/global',
  },
} as const;

// Service Ports
export const SERVICE_PORTS = {
  GATEWAY: 8002,
  DOCUMENTS: 8001,
  SPREADSHEETS: 8003,
  AUTH: 8004,
  MAIL: 8005,
  CALENDAR: 8006,
  NOTES: 8007,
  STORAGE: 8008,
  COLLABORATION: 8009,
  TASKS: 8010,
  FORMS: 8011,
  WORKFLOW: 8012,
  PRESENTATIONS: 8013,
  ASSISTANT: 8014,
  ANALYTICS: 8015,
  CRM: 8016,
  HR: 8017,
  BOOKINGS: 8018,
  WHITEBOARD: 8019,
  TRANSLATOR: 8020,
  SEARCH: 8021,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
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
} as const;

// Error Codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_DELETED: 'RESOURCE_DELETED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
} as const;

// Supported languages
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
] as const;

// Timezones
export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Paris', label: 'Paris (France)' },
  { value: 'Europe/Berlin', label: 'Berlin (Germany)' },
  { value: 'Europe/Madrid', label: 'Madrid (Spain)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (China)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
] as const;

// WebSocket Events
export const WS_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Collaboration
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',

  // Document collaboration
  DOC_CHANGE: 'doc_change',
  DOC_CURSOR: 'doc_cursor',
  DOC_SELECTION: 'doc_selection',

  // Chat
  MESSAGE: 'message',
  TYPING: 'typing',

  // Notifications
  NOTIFICATION: 'notification',
} as const;

// AI Models
export const AI_MODELS = {
  DEFAULT: 'gpt-4-turbo',
  FAST: 'gpt-3.5-turbo',
  EMBEDDING: 'text-embedding-3-large',
  VISION: 'gpt-4-vision-preview',
} as const;

// Feature Flags
export const FEATURES = {
  AI_COPILOT: true,
  REAL_TIME_COLLABORATION: true,
  DARK_MODE: true,
  OFFLINE_MODE: false,
  ADVANCED_ANALYTICS: true,
  CUSTOM_WORKFLOWS: true,
} as const;
