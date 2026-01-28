import { UserRole, ModuleStatus, AgentStatus, HealthStatus, AlertSeverity } from '@/types';

// Application constants
export const APP_NAME = 'AIT-CORE Admin';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Production-Ready Enterprise Management Platform';

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Status colors
export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  default: '#6b7280',
};

// User role labels and colors
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.OPERATOR]: 'Operator',
  [UserRole.VIEWER]: 'Viewer',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '#ef4444',
  [UserRole.ADMIN]: '#f59e0b',
  [UserRole.MANAGER]: '#3b82f6',
  [UserRole.OPERATOR]: '#10b981',
  [UserRole.VIEWER]: '#6b7280',
};

// Module status labels and colors
export const MODULE_STATUS_LABELS: Record<ModuleStatus, string> = {
  [ModuleStatus.ACTIVE]: 'Active',
  [ModuleStatus.INACTIVE]: 'Inactive',
  [ModuleStatus.MAINTENANCE]: 'Maintenance',
  [ModuleStatus.ERROR]: 'Error',
  [ModuleStatus.PENDING]: 'Pending',
};

export const MODULE_STATUS_COLORS: Record<ModuleStatus, string> = {
  [ModuleStatus.ACTIVE]: '#10b981',
  [ModuleStatus.INACTIVE]: '#6b7280',
  [ModuleStatus.MAINTENANCE]: '#f59e0b',
  [ModuleStatus.ERROR]: '#ef4444',
  [ModuleStatus.PENDING]: '#3b82f6',
};

// Agent status labels and colors
export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  [AgentStatus.ONLINE]: 'Online',
  [AgentStatus.OFFLINE]: 'Offline',
  [AgentStatus.BUSY]: 'Busy',
  [AgentStatus.IDLE]: 'Idle',
  [AgentStatus.ERROR]: 'Error',
  [AgentStatus.MAINTENANCE]: 'Maintenance',
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, string> = {
  [AgentStatus.ONLINE]: '#10b981',
  [AgentStatus.OFFLINE]: '#6b7280',
  [AgentStatus.BUSY]: '#f59e0b',
  [AgentStatus.IDLE]: '#3b82f6',
  [AgentStatus.ERROR]: '#ef4444',
  [AgentStatus.MAINTENANCE]: '#f59e0b',
};

// Health status labels and colors
export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  [HealthStatus.HEALTHY]: 'Healthy',
  [HealthStatus.DEGRADED]: 'Degraded',
  [HealthStatus.UNHEALTHY]: 'Unhealthy',
  [HealthStatus.CRITICAL]: 'Critical',
};

export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  [HealthStatus.HEALTHY]: '#10b981',
  [HealthStatus.DEGRADED]: '#f59e0b',
  [HealthStatus.UNHEALTHY]: '#ef4444',
  [HealthStatus.CRITICAL]: '#7f1d1d',
};

// Alert severity labels and colors
export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  [AlertSeverity.INFO]: 'Info',
  [AlertSeverity.WARNING]: 'Warning',
  [AlertSeverity.ERROR]: 'Error',
  [AlertSeverity.CRITICAL]: 'Critical',
};

export const ALERT_SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.INFO]: '#3b82f6',
  [AlertSeverity.WARNING]: '#f59e0b',
  [AlertSeverity.ERROR]: '#ef4444',
  [AlertSeverity.CRITICAL]: '#7f1d1d',
};

// Chart colors
export const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

// Time ranges for filters
export const TIME_RANGES = [
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 6 Hours', value: '6h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Custom', value: 'custom' },
];

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  REAL_TIME: 5000, // 5 seconds
  FAST: 15000, // 15 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 60000, // 1 minute
};

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd',
  MEDIUM: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  FULL: 'EEEE, MMMM dd, yyyy',
  TIME: 'HH:mm:ss',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ait_core_auth_token',
  USER_PREFERENCES: 'ait_core_user_preferences',
  THEME: 'ait_core_theme',
  SIDEBAR_STATE: 'ait_core_sidebar_state',
  DASHBOARD_LAYOUT: 'ait_core_dashboard_layout',
};

// Navigation routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  MODULES: '/modules',
  AGENTS: '/agents',
  SYSTEM: '/system',
  USERS: '/users',
  SETTINGS: '/settings',
  LOGIN: '/login',
  PROFILE: '/profile',
};

// Permissions
export const PERMISSIONS = {
  MODULES_READ: 'modules:read',
  MODULES_WRITE: 'modules:write',
  MODULES_DELETE: 'modules:delete',
  AGENTS_READ: 'agents:read',
  AGENTS_WRITE: 'agents:write',
  AGENTS_EXECUTE: 'agents:execute',
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  SYSTEM_READ: 'system:read',
  SYSTEM_WRITE: 'system:write',
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',
};

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    SAVE: 'Changes saved successfully',
    CREATE: 'Created successfully',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',
  },
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
