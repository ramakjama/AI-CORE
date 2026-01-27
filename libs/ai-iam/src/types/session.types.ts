/**
 * @fileoverview Session-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/session
 */

/**
 * Session status enumeration
 */
export enum SessionStatus {
  /** Session is active and valid */
  ACTIVE = 'active',
  /** Session has expired */
  EXPIRED = 'expired',
  /** Session was explicitly revoked */
  REVOKED = 'revoked',
  /** Session is invalid */
  INVALID = 'invalid',
}

/**
 * Represents a user session
 */
export interface Session {
  /** Unique session identifier */
  id: string;
  /** User ID this session belongs to */
  userId: string;
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  /** Current status of the session */
  status: SessionStatus;
  /** IP address of the client */
  ipAddress: string;
  /** User agent string of the client */
  userAgent: string;
  /** Device fingerprint for device binding */
  deviceFingerprint?: string;
  /** Device type (desktop, mobile, tablet) */
  deviceType?: string;
  /** Geographic location (if available) */
  location?: SessionLocation;
  /** Access token associated with this session */
  accessToken: string;
  /** Refresh token for this session */
  refreshToken: string;
  /** When the access token expires */
  accessTokenExpiresAt: Date;
  /** When the refresh token expires */
  refreshTokenExpiresAt: Date;
  /** When the session was created */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** When the session was revoked (if applicable) */
  revokedAt?: Date;
  /** Reason for revocation (if applicable) */
  revocationReason?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Geographic location information
 */
export interface SessionLocation {
  /** Country code (ISO 3166-1 alpha-2) */
  country?: string;
  /** Region/state */
  region?: string;
  /** City */
  city?: string;
  /** Timezone */
  timezone?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
}

/**
 * DTO for creating a new session
 */
export interface CreateSessionDTO {
  /** User ID */
  userId: string;
  /** Tenant ID */
  tenantId: string;
  /** Client IP address */
  ipAddress: string;
  /** Client user agent */
  userAgent: string;
  /** Optional device fingerprint */
  deviceFingerprint?: string;
  /** Optional device type */
  deviceType?: string;
  /** Optional location data */
  location?: SessionLocation;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  /** Whether the session is valid */
  isValid: boolean;
  /** The session if valid */
  session?: Session;
  /** User information if session is valid */
  user?: SessionUser;
  /** Reason if session is invalid */
  reason?: string;
  /** Whether the session needs refresh */
  needsRefresh?: boolean;
}

/**
 * Minimal user info attached to session
 */
export interface SessionUser {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** User username */
  username: string;
  /** User display name */
  displayName?: string;
  /** User role IDs */
  roleIds: string[];
  /** Tenant ID */
  tenantId: string;
}

/**
 * Session refresh request
 */
export interface SessionRefreshRequest {
  /** Refresh token */
  refreshToken: string;
  /** Optional device fingerprint for validation */
  deviceFingerprint?: string;
}

/**
 * Session refresh result
 */
export interface SessionRefreshResult {
  /** Whether refresh was successful */
  success: boolean;
  /** New access token (if successful) */
  accessToken?: string;
  /** New refresh token (if rotated) */
  refreshToken?: string;
  /** When the new access token expires */
  accessTokenExpiresAt?: Date;
  /** Error message if refresh failed */
  error?: string;
}

/**
 * Options for session revocation
 */
export interface RevokeSessionOptions {
  /** Session ID to revoke */
  sessionId?: string;
  /** Revoke all sessions for a user */
  userId?: string;
  /** Revoke all sessions except the current one */
  exceptSessionId?: string;
  /** Reason for revocation */
  reason?: string;
}

/**
 * Session listing options
 */
export interface ListSessionsOptions {
  /** Filter by user ID */
  userId?: string;
  /** Filter by tenant ID */
  tenantId?: string;
  /** Filter by status */
  status?: SessionStatus;
  /** Filter by active sessions only */
  activeOnly?: boolean;
  /** Include expired sessions */
  includeExpired?: boolean;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Session statistics
 */
export interface SessionStats {
  /** Total number of sessions */
  total: number;
  /** Number of active sessions */
  active: number;
  /** Number of expired sessions */
  expired: number;
  /** Number of revoked sessions */
  revoked: number;
  /** Sessions by device type */
  byDeviceType: Record<string, number>;
  /** Sessions by country */
  byCountry: Record<string, number>;
}
