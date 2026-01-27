// ============================================================================
// AI-IAM Types - Identity & Access Management
// ============================================================================

// Re-export user types (includes User, UserPublic, UserStatus, DTOs, toUserPublic)
export {
  User,
  UserPublic,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  ChangePasswordDTO,
  ResetPasswordDTO,
  toUserPublic,
} from './user.types';

// Alias for backward compatibility
import { UserPublic } from './user.types';
export type PublicUser = UserPublic;

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Authentication provider types
 */
export enum AuthProvider {
  LOCAL = 'LOCAL',
  SAML = 'SAML',
  OIDC = 'OIDC',
  AZURE_AD = 'AZURE_AD',
  GOOGLE = 'GOOGLE',
  LDAP = 'LDAP',
  OAUTH2 = 'OAUTH2'
}

/**
 * Multi-Factor Authentication methods
 */
export enum MFAMethod {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  HARDWARE_KEY = 'HARDWARE_KEY',
  BACKUP_CODES = 'BACKUP_CODES'
}

/**
 * Session status
 */
export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  LOCKED = 'LOCKED'
}

/**
 * Token types
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  RESET_PASSWORD = 'RESET_PASSWORD',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  MFA = 'MFA',
  API_KEY = 'API_KEY'
}

// UserStatus is exported from './user.types'

/**
 * Permission actions
 */
export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXECUTE = 'EXECUTE',
  MANAGE = 'MANAGE',
  ADMIN = 'ADMIN',
  ALL = '*'
}

/**
 * Audit event types
 */
export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_CHALLENGE = 'MFA_CHALLENGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  SSO_LOGIN = 'SSO_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

// ============================================================================
// USER INTERFACES
// ============================================================================

// User, UserPublic, and related DTOs are exported from './user.types'

/**
 * User credentials
 */
export interface UserCredential {
  id: string;
  userId: string;
  provider: AuthProvider;
  passwordHash?: string;
  externalId?: string;
  totpSecret?: string;
  totpEnabled: boolean;
  backupCodes?: string[];
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// PublicUser / UserPublic is exported from './user.types'

// ============================================================================
// ROLE & PERMISSION INTERFACES
// ============================================================================

/**
 * Role entity
 */
export interface Role {
  id: string;
  name: string;
  code: string;
  displayName?: string;
  description?: string;
  permissions: Permission[];
  permissionIds?: string[];
  parentRoleId?: string;
  isSystem: boolean;
  isActive: boolean;
  tenantId?: string;
  organizationId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission entity
 */
export interface Permission {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  description?: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
  isSystem: boolean;
  isActive: boolean;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role-Permission mapping
 */
export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Role hierarchy for inheritance
 */
export interface RoleHierarchy {
  roleId: string;
  parentRoleId: string;
  depth: number;
}

/**
 * Permission condition for fine-grained access control
 */
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: unknown;
}

/**
 * Effective permission with inheritance info
 */
export interface EffectivePermission extends Permission {
  inheritedFrom?: string;
  directlyAssigned: boolean;
}

// ============================================================================
// SESSION & TOKEN INTERFACES
// ============================================================================

/**
 * User session
 */
export interface UserSession {
  id: string;
  userId: string;
  status: SessionStatus;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
  location?: SessionLocation;
  mfaVerified: boolean;
  lastActivityAt: Date;
  createdAt: Date;
  terminatedAt?: Date;
}

/**
 * Device information
 */
export interface DeviceInfo {
  deviceId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  isTrusted?: boolean;
}

/**
 * Session location information
 */
export interface SessionLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

/**
 * Token entity
 */
export interface Token {
  id: string;
  type: TokenType;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt?: Date;
  revokedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Refresh token
 */
export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

/**
 * JWT payload
 */
export interface TokenPayload {
  sub: string;
  email: string;
  username?: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
  sessionId: string;
  mfaVerified: boolean;
  tokenType: TokenType;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

// ============================================================================
// AUTHENTICATION INTERFACES
// ============================================================================

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
  deviceInfo?: DeviceInfo;
  rememberMe?: boolean;
}

/**
 * Login result
 */
export interface LoginResult {
  success: boolean;
  user?: PublicUser;
  profile?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  requiresMFA?: boolean;
  mfaChallenge?: MFAChallenge;
  error?: AuthError;
}

/**
 * MFA challenge
 */
export interface MFAChallenge {
  challengeId: string;
  userId: string;
  method: MFAMethod;
  expiresAt: Date;
  allowedMethods: MFAMethod[];
  attemptsRemaining: number;
  createdAt: Date;
}

/**
 * MFA verification request
 */
export interface MFAVerifyRequest {
  challengeId: string;
  code: string;
  method: MFAMethod;
}

/**
 * Authentication error
 */
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
  organizationId?: string;
}

/**
 * Password change request
 */
export interface PasswordChangeRequest {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

// ============================================================================
// SSO CONFIGURATION INTERFACES
// ============================================================================

/**
 * SAML configuration
 */
export interface SAMLConfig {
  id: string;
  name: string;
  entityId: string;
  ssoUrl: string;
  sloUrl?: string;
  certificate: string;
  privateKey?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  digestAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  attributeMapping: SAMLAttributeMapping;
  organizationId?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SAML attribute mapping
 */
export interface SAMLAttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string;
  customAttributes?: Record<string, string>;
}

/**
 * OIDC configuration
 */
export interface OIDCConfig {
  id: string;
  name: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  jwksUrl?: string;
  scopes: string[];
  responseType: string;
  grantType: string;
  attributeMapping: OIDCAttributeMapping;
  organizationId?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OIDC attribute mapping
 */
export interface OIDCAttributeMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  picture?: string;
  groups?: string;
  customClaims?: Record<string, string>;
}

/**
 * External identity link
 */
export interface ExternalIdentity {
  id: string;
  userId: string;
  provider: AuthProvider;
  externalId: string;
  email?: string;
  displayName?: string;
  metadata?: Record<string, unknown>;
  linkedAt: Date;
  lastUsedAt?: Date;
}

// ============================================================================
// ORGANIZATION INTERFACES
// ============================================================================

/**
 * Organization entity
 */
export interface Organization {
  id: string;
  name: string;
  code: string;
  domain?: string;
  settings?: OrganizationSettings;
  parentId?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization settings
 */
export interface OrganizationSettings {
  mfaRequired: boolean;
  allowedAuthProviders: AuthProvider[];
  passwordPolicy: PasswordPolicy;
  sessionPolicy: SessionPolicy;
  ssoConfig?: {
    samlConfigs?: string[];
    oidcConfigs?: string[];
  };
}

/**
 * Department entity
 */
export interface Department {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  parentId?: string;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team entity
 */
export interface Team {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  leaderId?: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// POLICY INTERFACES
// ============================================================================

/**
 * Password policy
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expirationDays: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
}

/**
 * Session policy
 */
export interface SessionPolicy {
  maxActiveSessions: number;
  sessionTimeoutMinutes: number;
  refreshTokenExpirationDays: number;
  requireReauthForSensitive: boolean;
  allowConcurrentSessions: boolean;
  terminateOnPasswordChange: boolean;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: unknown) => string;
  handler?: (req: unknown, res: unknown) => void;
}

// ============================================================================
// AUDIT INTERFACES
// ============================================================================

/**
 * Audit event
 */
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  userId?: string;
  targetUserId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
}

/**
 * Security alert
 */
export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  message: string;
  details?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

/**
 * Failed login attempt
 */
export interface FailedAttempt {
  id: string;
  identifier: string;
  ipAddress: string;
  userAgent?: string;
  reason: string;
  attemptedAt: Date;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  userId: string;
  anomalies: Anomaly[];
  riskScore: number;
  recommendedActions: string[];
  analyzedAt: Date;
}

/**
 * Detected anomaly
 */
export interface Anomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: Record<string, unknown>;
  detectedAt: Date;
}

// ============================================================================
// DTO INTERFACES
// ============================================================================

// CreateUserDTO, UpdateUserDTO, ChangePasswordDTO, ResetPasswordDTO are exported from './user.types'

/**
 * Create role DTO
 */
export interface CreateRoleDTO {
  name: string;
  code: string;
  displayName?: string;
  description?: string;
  permissionIds: string[];
  parentRoleId?: string;
  organizationId?: string;
  tenantId?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Update role DTO
 */
export interface UpdateRoleDTO {
  name?: string;
  code?: string;
  displayName?: string;
  description?: string;
  permissionIds?: string[];
  parentRoleId?: string;
  priority?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Assign role to user DTO
 */
export interface AssignRoleDTO {
  userId: string;
  roleId: string;
  tenantId?: string;
  expiresAt?: Date;
}

/**
 * Revoke role from user DTO
 */
export interface RevokeRoleDTO {
  userId: string;
  roleId: string;
  tenantId?: string;
}

/**
 * Role with permissions
 */
export interface RoleWithPermissions extends Role {
  effectivePermissions: Permission[];
  inheritedPermissions?: Permission[];
}

/**
 * Role assignment
 */
export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
  tenantId?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

/**
 * Create permission DTO
 */
export interface CreatePermissionDTO {
  code: string;
  name: string;
  displayName?: string;
  description?: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update permission DTO
 */
export interface UpdatePermissionDTO {
  code?: string;
  name?: string;
  displayName?: string;
  description?: string;
  resource?: string;
  action?: PermissionAction;
  conditions?: PermissionCondition[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  userId: string;
  permission: string;
  resource?: string;
  action?: string;
  tenantId?: string;
  context?: Record<string, unknown>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  permission?: string;
  reason?: string;
  matchedPermission?: Permission;
  grantingPermissions?: string[];
  missingPermissions?: string[];
  request?: PermissionCheckRequest;
  checkedAt?: Date;
}

/**
 * Permission grant DTO
 */
export interface PermissionGrantDTO {
  userId: string;
  permissionId: string;
  roleId?: string;
  tenantId?: string;
  expiresAt?: Date;
  grantedBy: string;
}

/**
 * Permission revoke DTO
 */
export interface PermissionRevokeDTO {
  userId: string;
  permissionId: string;
  roleId?: string;
  tenantId?: string;
  revokedBy: string;
}

/**
 * Create permission name from resource and action
 */
export function createPermissionName(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * Check if permission matches pattern (supports wildcards)
 */
export function matchesPermissionPattern(permission: string, pattern: string): boolean {
  if (pattern === '*' || pattern === '*:*') return true;

  const [permResource, permAction] = permission.split(':');
  const [patResource, patAction] = pattern.split(':');

  const resourceMatch = patResource === '*' || patResource === permResource;
  const actionMatch = patAction === '*' || patAction === permAction;

  return resourceMatch && actionMatch;
}

// ============================================================================
// SERVICE RESULT INTERFACES
// ============================================================================

/**
 * Generic service result
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Session filter options
 */
export interface SessionFilterOptions {
  userId?: string;
  status?: SessionStatus;
  deviceType?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Audit filter options
 */
export interface AuditFilterOptions {
  userId?: string;
  type?: AuditEventType;
  status?: 'success' | 'failure';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================================================
// EXPRESS EXTENSIONS
// ============================================================================

/**
 * Authenticated request
 */
export interface AuthenticatedRequest {
  user?: TokenPayload;
  session?: UserSession;
  permissions?: string[];
}

/**
 * Extended Express Request
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      session?: UserSession;
      permissions?: string[];
    }
  }
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

/**
 * IAM module configuration
 */
export interface IAMConfig {
  jwt: {
    secret: string;
    accessTokenExpiration: string;
    refreshTokenExpiration: string;
    issuer?: string;
    audience?: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  session: {
    maxActiveSessions: number;
    sessionTimeout: number;
  };
  mfa: {
    totpIssuer: string;
    totpWindow: number;
    codeLength: number;
    codeExpiration: number;
  };
  rateLimit: {
    login: RateLimitConfig;
    passwordReset: RateLimitConfig;
    mfa: RateLimitConfig;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
  };
}
