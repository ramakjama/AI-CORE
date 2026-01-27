/**
 * @fileoverview Authentication-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/auth
 */

import { TokenPair } from './token.types';
import { UserPublic } from './user.types';

/**
 * Login request payload
 */
export interface LoginRequest {
  /** Email or username */
  identifier: string;
  /** Password */
  password: string;
  /** Tenant ID (required for multi-tenant) */
  tenantId?: string;
  /** MFA code if MFA is enabled */
  mfaCode?: string;
  /** Remember me flag for extended session */
  rememberMe?: boolean;
  /** Device fingerprint for device binding */
  deviceFingerprint?: string;
  /** Client IP address */
  ipAddress?: string;
  /** Client user agent */
  userAgent?: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  /** Whether login was successful */
  success: boolean;
  /** User information (if successful) */
  user?: UserPublic;
  /** Token pair (if successful) */
  tokens?: TokenPair;
  /** Session ID (if successful) */
  sessionId?: string;
  /** Whether MFA is required */
  mfaRequired?: boolean;
  /** MFA challenge ID (if MFA required) */
  mfaChallengeId?: string;
  /** Whether password change is required */
  passwordChangeRequired?: boolean;
  /** Error message (if failed) */
  error?: string;
  /** Error code (if failed) */
  errorCode?: LoginErrorCode;
  /** Remaining login attempts (if failed) */
  remainingAttempts?: number;
  /** Account locked until (if locked) */
  lockedUntil?: Date;
}

/**
 * Login error codes
 */
export enum LoginErrorCode {
  /** Invalid credentials */
  INVALID_CREDENTIALS = 'invalid_credentials',
  /** User not found */
  USER_NOT_FOUND = 'user_not_found',
  /** Account is inactive */
  ACCOUNT_INACTIVE = 'account_inactive',
  /** Account is suspended */
  ACCOUNT_SUSPENDED = 'account_suspended',
  /** Account is locked */
  ACCOUNT_LOCKED = 'account_locked',
  /** Email not verified */
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  /** Invalid MFA code */
  INVALID_MFA_CODE = 'invalid_mfa_code',
  /** MFA required but not provided */
  MFA_REQUIRED = 'mfa_required',
  /** Tenant not found */
  TENANT_NOT_FOUND = 'tenant_not_found',
  /** Tenant inactive */
  TENANT_INACTIVE = 'tenant_inactive',
  /** Too many failed attempts */
  TOO_MANY_ATTEMPTS = 'too_many_attempts',
  /** Session limit reached */
  SESSION_LIMIT_REACHED = 'session_limit_reached',
  /** Unknown error */
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Logout request payload
 */
export interface LogoutRequest {
  /** Access token to invalidate */
  accessToken?: string;
  /** Refresh token to invalidate */
  refreshToken?: string;
  /** Session ID to terminate */
  sessionId?: string;
  /** Whether to logout from all sessions */
  allSessions?: boolean;
}

/**
 * Logout response payload
 */
export interface LogoutResponse {
  /** Whether logout was successful */
  success: boolean;
  /** Number of sessions terminated */
  terminatedSessions: number;
  /** Error message (if any) */
  error?: string;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  /** Refresh token */
  refreshToken: string;
  /** Device fingerprint for validation */
  deviceFingerprint?: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  /** Whether refresh was successful */
  success: boolean;
  /** New token pair (if successful) */
  tokens?: TokenPair;
  /** Error message (if failed) */
  error?: string;
  /** Error code (if failed) */
  errorCode?: RefreshErrorCode;
}

/**
 * Refresh error codes
 */
export enum RefreshErrorCode {
  /** Refresh token is invalid */
  INVALID_TOKEN = 'invalid_token',
  /** Refresh token has expired */
  TOKEN_EXPIRED = 'token_expired',
  /** Refresh token has been revoked */
  TOKEN_REVOKED = 'token_revoked',
  /** Session not found */
  SESSION_NOT_FOUND = 'session_not_found',
  /** Session has been revoked */
  SESSION_REVOKED = 'session_revoked',
  /** User not found */
  USER_NOT_FOUND = 'user_not_found',
  /** User account issues */
  ACCOUNT_ISSUES = 'account_issues',
  /** Device fingerprint mismatch */
  DEVICE_MISMATCH = 'device_mismatch',
  /** Token reuse detected (possible theft) */
  TOKEN_REUSE_DETECTED = 'token_reuse_detected',
  /** Unknown error */
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Password reset request (initiate)
 */
export interface PasswordResetInitRequest {
  /** Email address */
  email: string;
  /** Tenant ID */
  tenantId?: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmRequest {
  /** Reset token */
  token: string;
  /** New password */
  newPassword: string;
}

/**
 * MFA setup request
 */
export interface MfaSetupRequest {
  /** MFA method (totp, sms, email) */
  method: 'totp' | 'sms' | 'email';
  /** Phone number (for SMS) */
  phoneNumber?: string;
}

/**
 * MFA setup response
 */
export interface MfaSetupResponse {
  /** Whether setup was initiated successfully */
  success: boolean;
  /** TOTP secret (for TOTP method) */
  secret?: string;
  /** QR code URL (for TOTP method) */
  qrCodeUrl?: string;
  /** Backup codes */
  backupCodes?: string[];
  /** Error message (if failed) */
  error?: string;
}

/**
 * MFA verification request
 */
export interface MfaVerifyRequest {
  /** MFA challenge ID */
  challengeId: string;
  /** MFA code */
  code: string;
  /** Whether this is a backup code */
  isBackupCode?: boolean;
}

/**
 * Authenticated user context (available in request)
 */
export interface AuthContext {
  /** User ID */
  userId: string;
  /** Email */
  email: string;
  /** Username */
  username: string;
  /** Tenant ID */
  tenantId: string;
  /** Role IDs */
  roles: string[];
  /** Permission names */
  permissions: string[];
  /** Session ID */
  sessionId: string;
  /** Token expiration time */
  tokenExp: Date;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** JWT secret key */
  jwtSecret: string;
  /** JWT issuer */
  jwtIssuer: string;
  /** JWT audience */
  jwtAudience: string | string[];
  /** Access token TTL in seconds */
  accessTokenTtl: number;
  /** Refresh token TTL in seconds */
  refreshTokenTtl: number;
  /** Maximum failed login attempts before lockout */
  maxFailedAttempts: number;
  /** Lockout duration in minutes */
  lockoutDuration: number;
  /** Password minimum length */
  passwordMinLength: number;
  /** Require uppercase in password */
  passwordRequireUppercase: boolean;
  /** Require lowercase in password */
  passwordRequireLowercase: boolean;
  /** Require number in password */
  passwordRequireNumber: boolean;
  /** Require special character in password */
  passwordRequireSpecial: boolean;
  /** Enable MFA */
  mfaEnabled: boolean;
  /** Maximum concurrent sessions per user */
  maxConcurrentSessions: number;
  /** Enable refresh token rotation */
  rotateRefreshTokens: boolean;
  /** Session idle timeout in minutes */
  sessionIdleTimeout: number;
  /** Bcrypt salt rounds */
  bcryptSaltRounds: number;
}

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  jwtSecret: '',
  jwtIssuer: 'ai-iam',
  jwtAudience: 'ai-core',
  accessTokenTtl: 900, // 15 minutes
  refreshTokenTtl: 604800, // 7 days
  maxFailedAttempts: 5,
  lockoutDuration: 30, // 30 minutes
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: true,
  mfaEnabled: true,
  maxConcurrentSessions: 5,
  rotateRefreshTokens: true,
  sessionIdleTimeout: 60, // 60 minutes
  bcryptSaltRounds: 12,
};
