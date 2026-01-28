/**
 * Security Configuration Master File
 * Centralized security settings for the entire application
 *
 * @module config/security
 * @description Production-ready security configuration combining all security aspects
 */

import { getHelmetConfig } from './helmet.config';
import { getCorsConfig } from './cors.config';
import { globalRateLimitConfig } from './rate-limit.config';
import { getCSPConfig } from './csp.config';

/**
 * Environment-based Security Configuration
 */
export interface SecurityConfig {
  environment: 'development' | 'staging' | 'production';
  helmet: any;
  cors: any;
  rateLimit: any;
  csp: any;
  encryption: EncryptionConfig;
  authentication: AuthConfig;
  session: SessionConfig;
  cookies: CookieConfig;
  headers: SecurityHeaders;
  monitoring: MonitoringConfig;
}

/**
 * Encryption Configuration
 */
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  saltRounds: number;
  jwtAlgorithm: string;
  jwtExpiration: string;
  refreshTokenExpiration: string;
  encryptionAtRest: boolean;
  tlsVersion: string;
}

/**
 * Authentication Configuration
 */
export interface AuthConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  passwordExpirationDays: number;
  mfaRequired: boolean;
  mfaMethod: 'totp' | 'sms' | 'email' | 'all';
  sessionTimeout: number; // in minutes
  allowConcurrentSessions: boolean;
  maxConcurrentSessions: number;
}

/**
 * Session Configuration
 */
export interface SessionConfig {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  cookie: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite: 'strict' | 'lax' | 'none';
    domain?: string;
  };
  store: 'memory' | 'redis' | 'database';
}

/**
 * Cookie Configuration
 */
export interface CookieConfig {
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  domain?: string;
  path: string;
  signed: boolean;
}

/**
 * Security Headers Configuration
 */
export interface SecurityHeaders {
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'X-Permitted-Cross-Domain-Policies': string;
}

/**
 * Monitoring and Logging Configuration
 */
export interface MonitoringConfig {
  logSecurityEvents: boolean;
  logFailedLogins: boolean;
  logApiCalls: boolean;
  logDataAccess: boolean;
  alertOnSuspiciousActivity: boolean;
  alertThreshold: number;
  retentionPeriodDays: number;
}

/**
 * Production Security Configuration
 */
export const productionSecurityConfig: SecurityConfig = {
  environment: 'production',
  helmet: getHelmetConfig('production'),
  cors: getCorsConfig('production'),
  rateLimit: globalRateLimitConfig,
  csp: getCSPConfig('balanced'),

  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 256,
    saltRounds: 12,
    jwtAlgorithm: 'RS256',
    jwtExpiration: '15m',
    refreshTokenExpiration: '7d',
    encryptionAtRest: true,
    tlsVersion: 'TLSv1.3',
  },

  authentication: {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 12,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordExpirationDays: 90,
    mfaRequired: true,
    mfaMethod: 'totp',
    sessionTimeout: 30,
    allowConcurrentSessions: false,
    maxConcurrentSessions: 1,
  },

  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 1800000, // 30 minutes
      sameSite: 'strict',
    },
    store: 'redis',
  },

  cookies: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1800000, // 30 minutes
    path: '/',
    signed: true,
  },

  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
  },

  monitoring: {
    logSecurityEvents: true,
    logFailedLogins: true,
    logApiCalls: true,
    logDataAccess: true,
    alertOnSuspiciousActivity: true,
    alertThreshold: 10,
    retentionPeriodDays: 90,
  },
};

/**
 * Development Security Configuration
 */
export const developmentSecurityConfig: SecurityConfig = {
  ...productionSecurityConfig,
  environment: 'development',
  helmet: getHelmetConfig('development'),
  cors: getCorsConfig('development'),
  csp: getCSPConfig('development'),

  encryption: {
    ...productionSecurityConfig.encryption,
    saltRounds: 10, // Faster for development
  },

  authentication: {
    ...productionSecurityConfig.authentication,
    maxLoginAttempts: 10,
    lockoutDuration: 5,
    passwordMinLength: 8,
    mfaRequired: false,
    sessionTimeout: 480, // 8 hours for development
  },

  session: {
    ...productionSecurityConfig.session,
    cookie: {
      ...productionSecurityConfig.session.cookie,
      secure: false, // Allow HTTP in development
      sameSite: 'lax',
      maxAge: 28800000, // 8 hours
    },
  },

  cookies: {
    ...productionSecurityConfig.cookies,
    secure: false,
    sameSite: 'lax',
  },

  monitoring: {
    ...productionSecurityConfig.monitoring,
    logApiCalls: false, // Reduce noise in development
  },
};

/**
 * Staging Security Configuration
 */
export const stagingSecurityConfig: SecurityConfig = {
  ...productionSecurityConfig,
  environment: 'staging',
  cors: getCorsConfig('staging'),

  authentication: {
    ...productionSecurityConfig.authentication,
    mfaRequired: false, // Optional MFA in staging
  },

  monitoring: {
    ...productionSecurityConfig.monitoring,
    retentionPeriodDays: 30, // Shorter retention in staging
  },
};

/**
 * Get Security Configuration based on Environment
 */
export function getSecurityConfig(): SecurityConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return productionSecurityConfig;
    case 'staging':
      return stagingSecurityConfig;
    case 'development':
    case 'test':
      return developmentSecurityConfig;
    default:
      console.warn(`Unknown environment: ${env}, using development config`);
      return developmentSecurityConfig;
  }
}

/**
 * Validate Security Configuration
 */
export function validateSecurityConfig(config: SecurityConfig): boolean {
  const errors: string[] = [];

  // Validate encryption settings
  if (config.encryption.keyLength < 256) {
    errors.push('Encryption key length must be at least 256 bits');
  }

  // Validate authentication settings
  if (config.authentication.passwordMinLength < 8) {
    errors.push('Password minimum length must be at least 8 characters');
  }

  // Validate session settings
  if (config.environment === 'production' && !config.session.cookie.secure) {
    errors.push('Cookies must be secure in production');
  }

  // Validate session secret
  if (config.environment === 'production' && config.session.secret === 'change-this-in-production') {
    errors.push('Session secret must be changed in production');
  }

  if (errors.length > 0) {
    console.error('Security configuration validation failed:', errors);
    return false;
  }

  return true;
}

/**
 * Security Audit Log
 */
export interface SecurityAuditLog {
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: any;
}

/**
 * Create Security Audit Log Entry
 */
export function createAuditLog(
  event: string,
  severity: SecurityAuditLog['severity'],
  details: any,
  request?: any
): SecurityAuditLog {
  return {
    timestamp: new Date(),
    event,
    severity,
    userId: request?.user?.id,
    ipAddress: request?.ip || 'unknown',
    userAgent: request?.headers?.['user-agent'] || 'unknown',
    details,
  };
}
