// ============================================================================
// AI-IAM: Identity & Access Management Module
// Integrated with sm_global database
// ============================================================================

/**
 * @module @ai-core/ai-iam
 * @description Identity & Access Management module for AI-Core platform
 *
 * Features:
 * - Microsoft Azure AD SSO (Enterprise)
 * - WebAuthn/FIDO2 Biometric Authentication (Fingerprint, Face ID, Windows Hello)
 * - Domain Restriction (@sorianomediadores.es only)
 * - Local authentication with bcrypt password hashing
 * - JWT access tokens with refresh token rotation
 * - Multi-Factor Authentication (TOTP, SMS, Email)
 * - Single Sign-On (SAML 2.0, OpenID Connect)
 * - Role-Based Access Control with role hierarchy
 * - Session management with device tracking
 * - Security audit logging with anomaly detection
 * - Brute force protection with rate limiting
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// WebAuthn / Biometric types
export * from './types/webauthn.types';

// Azure AD / Microsoft Enterprise SSO types
export * from './types/azure-ad.types';

// Re-export specific types for convenience
export type {
  // Enums
  AuthProvider,
  MFAMethod,
  SessionStatus,
  TokenType,
  UserStatus,
  PermissionAction,
  AuditEventType,

  // User types
  User,
  UserCredential,
  UserProfile,
  PublicUser,

  // Role & Permission types
  Role,
  Permission,
  RolePermission,
  RoleHierarchy,
  EffectivePermission,
  PermissionCondition,

  // Session & Token types
  UserSession,
  Token,
  RefreshToken,
  TokenPayload,
  DeviceInfo,
  SessionLocation,

  // Auth types
  LoginRequest,
  LoginResult,
  MFAChallenge,
  MFAVerifyRequest,
  AuthError,

  // SSO types
  SAMLConfig,
  OIDCConfig,
  SAMLAttributeMapping,
  OIDCAttributeMapping,
  ExternalIdentity,

  // Organization types
  Organization,
  OrganizationSettings,
  Department,
  Team,

  // Policy types
  PasswordPolicy,
  SessionPolicy,
  RateLimitConfig,

  // Audit types
  AuditEvent,
  SecurityAlert,
  FailedAttempt,
  Anomaly,
  AnomalyDetectionResult,

  // DTO types
  CreateUserDTO,
  UpdateUserDTO,
  CreateRoleDTO,
  CreatePermissionDTO,

  // Utility types
  ServiceResult,
  PaginatedResult,
  SessionFilterOptions,
  AuditFilterOptions,
  IAMConfig
} from './types';

// ============================================================================
// SERVICES
// ============================================================================

// Auth Service
export { AuthService, authService } from './services/auth.service';

// MFA Service
export { MFAService, mfaService } from './services/mfa.service';

// RBAC Service
export { RBACService, rbacService } from './services/rbac.service';

// SSO Service
export { SSOService, ssoService } from './services/sso.service';

// Session Service
export { SessionService, sessionService } from './services/session.service';

// Audit Service
export { AuditService, auditService } from './services/audit.service';

// Enterprise Auth Service (Azure AD + WebAuthn + Domain Restriction)
export { EnterpriseAuthService, enterpriseAuthService } from './services/enterprise-auth.service';

// ============================================================================
// MIDDLEWARE
// ============================================================================

export {
  // Core middleware
  authenticate,
  authorize,
  authorizeAny,
  authorizeRoles,
  requireMFA,
  rateLimit,

  // Specialized rate limiters
  loginRateLimit,
  passwordResetRateLimit,

  // Optional/helper middleware
  optionalAuth,
  requireOrganization,
  requireOwnership,

  // Composite middleware
  authenticateAndAuthorize,
  fullProtection,
  adminOnly,

  // Session management
  registerSession,
  updateSessionStatus,
  terminateSession,
  clearRateLimit,

  // Default export
  default as authMiddleware
} from './middleware/auth.middleware';

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// Re-export from existing files if they exist
export * from './services/auth.service';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

import { AuthService } from './services/auth.service';
import { MFAService } from './services/mfa.service';
import { RBACService } from './services/rbac.service';
import { SSOService } from './services/sso.service';
import { SessionService } from './services/session.service';
import { AuditService } from './services/audit.service';
import { IAMConfig } from './types';

/**
 * Create a complete IAM instance with all services configured
 */
export function createIAM(config: Partial<IAMConfig> = {}) {
  return {
    auth: new AuthService(config),
    mfa: new MFAService({
      totp: {
        issuer: config.mfa?.totpIssuer || 'AI-Core',
        window: config.mfa?.totpWindow || 1,
        step: 30,
        digits: config.mfa?.codeLength || 6
      },
      codes: {
        length: config.mfa?.codeLength || 6,
        expiration: config.mfa?.codeExpiration || 5 * 60 * 1000,
        maxAttempts: 3
      },
      recovery: {
        count: 10,
        length: 8
      },
      encryption: {
        secret: process.env.MFA_ENCRYPTION_SECRET || 'mfa-secret'
      }
    }),
    rbac: new RBACService(),
    sso: new SSOService({
      baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
      callbackPath: '/auth/sso/callback'
    }),
    session: new SessionService({
      maxActiveSessions: config.session?.maxActiveSessions || 5,
      sessionTimeout: config.session?.sessionTimeout || 30 * 60 * 1000,
      refreshTokenExpiration: 7 * 24 * 60 * 60 * 1000,
      enableSessionTracking: true,
      enableLocationTracking: true
    }),
    audit: new AuditService({
      enabled: config.audit?.enabled ?? true,
      retentionDays: config.audit?.retentionDays || 90,
      maxEventsPerUser: 10000,
      anomalyDetection: {
        enabled: true,
        maxFailedAttemptsPerHour: 10,
        maxLoginAttemptsFromNewLocations: 3,
        suspiciousTimeWindow: 60 * 60 * 1000
      },
      alertThresholds: {
        failedLoginAttempts: 5,
        passwordResetAttempts: 3,
        suspiciousActivity: 3
      }
    })
  };
}

/**
 * Default IAM instance
 */
export const iam = createIAM();

// ============================================================================
// VERSION & INFO
// ============================================================================

export const version = '1.0.0';
export const name = '@ai-core/ai-iam';
