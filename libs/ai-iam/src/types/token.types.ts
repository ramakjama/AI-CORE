/**
 * @fileoverview Token-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/token
 */

/**
 * Token type enumeration
 */
export enum TokenType {
  /** Access token for API authentication */
  ACCESS = 'access',
  /** Refresh token for session renewal */
  REFRESH = 'refresh',
  /** Password reset token */
  PASSWORD_RESET = 'password_reset',
  /** Email verification token */
  EMAIL_VERIFICATION = 'email_verification',
  /** API key token */
  API_KEY = 'api_key',
  /** Service-to-service token */
  SERVICE = 'service',
}

/**
 * JWT payload structure for access tokens
 */
export interface AccessTokenPayload {
  /** Subject - User ID */
  sub: string;
  /** Email */
  email: string;
  /** Username */
  username: string;
  /** Tenant ID */
  tenantId: string;
  /** Role IDs */
  roles: string[];
  /** Permission names (flattened from roles) */
  permissions: string[];
  /** Token type */
  type: TokenType.ACCESS;
  /** Session ID */
  sessionId: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Not before timestamp */
  nbf?: number;
  /** Issuer */
  iss: string;
  /** Audience */
  aud: string | string[];
  /** JWT ID */
  jti: string;
}

/**
 * JWT payload structure for refresh tokens
 */
export interface RefreshTokenPayload {
  /** Subject - User ID */
  sub: string;
  /** Token type */
  type: TokenType.REFRESH;
  /** Session ID */
  sessionId: string;
  /** Tenant ID */
  tenantId: string;
  /** Token family ID for rotation tracking */
  familyId: string;
  /** Generation number in the token family */
  generation: number;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
  /** Issuer */
  iss: string;
  /** JWT ID */
  jti: string;
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
  /** Access token string */
  accessToken: string;
  /** Refresh token string */
  refreshToken: string;
  /** Access token expiration in seconds */
  accessTokenExpiresIn: number;
  /** Refresh token expiration in seconds */
  refreshTokenExpiresIn: number;
  /** Token type (always 'Bearer') */
  tokenType: 'Bearer';
}

/**
 * Token verification result
 */
export interface TokenVerificationResult<T = AccessTokenPayload> {
  /** Whether the token is valid */
  isValid: boolean;
  /** Decoded payload if valid */
  payload?: T;
  /** Error message if invalid */
  error?: string;
  /** Error code if invalid */
  errorCode?: TokenErrorCode;
  /** Whether the token is expired */
  isExpired?: boolean;
  /** Remaining time until expiration (seconds) */
  expiresIn?: number;
}

/**
 * Token error codes
 */
export enum TokenErrorCode {
  /** Token is malformed */
  MALFORMED = 'token_malformed',
  /** Token signature is invalid */
  INVALID_SIGNATURE = 'invalid_signature',
  /** Token has expired */
  EXPIRED = 'token_expired',
  /** Token is not yet valid */
  NOT_BEFORE = 'token_not_before',
  /** Token issuer mismatch */
  INVALID_ISSUER = 'invalid_issuer',
  /** Token audience mismatch */
  INVALID_AUDIENCE = 'invalid_audience',
  /** Token has been revoked */
  REVOKED = 'token_revoked',
  /** Token type mismatch */
  INVALID_TYPE = 'invalid_type',
  /** Unknown error */
  UNKNOWN = 'unknown_error',
}

/**
 * Token generation options
 */
export interface TokenGenerationOptions {
  /** Custom expiration time in seconds */
  expiresIn?: number;
  /** Custom issuer */
  issuer?: string;
  /** Custom audience */
  audience?: string | string[];
  /** Additional claims to include */
  additionalClaims?: Record<string, unknown>;
  /** Custom JWT ID */
  jti?: string;
}

/**
 * Token revocation entry
 */
export interface TokenRevocation {
  /** JWT ID of the revoked token */
  jti: string;
  /** User ID */
  userId: string;
  /** Token type */
  tokenType: TokenType;
  /** When the token was revoked */
  revokedAt: Date;
  /** Reason for revocation */
  reason?: string;
  /** When the token would have expired (for cleanup) */
  originalExpiration: Date;
}

/**
 * API key structure
 */
export interface ApiKey {
  /** Unique identifier */
  id: string;
  /** User ID this key belongs to */
  userId: string;
  /** Tenant ID */
  tenantId: string;
  /** Name/label for the API key */
  name: string;
  /** Description */
  description?: string;
  /** Hashed API key (the actual key is only shown once) */
  keyHash: string;
  /** Key prefix for identification (first 8 chars) */
  keyPrefix: string;
  /** Scopes/permissions granted to this key */
  scopes: string[];
  /** Whether the key is active */
  isActive: boolean;
  /** Optional expiration date */
  expiresAt?: Date;
  /** Last used timestamp */
  lastUsedAt?: Date;
  /** IP whitelist */
  allowedIps?: string[];
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating an API key
 */
export interface CreateApiKeyDTO {
  /** Name for the API key */
  name: string;
  /** Description */
  description?: string;
  /** Scopes to grant */
  scopes?: string[];
  /** Optional expiration date */
  expiresAt?: Date;
  /** IP whitelist */
  allowedIps?: string[];
  /** Rate limit */
  rateLimit?: number;
}

/**
 * Result of creating an API key (includes the actual key)
 */
export interface CreateApiKeyResult {
  /** API key metadata */
  apiKey: ApiKey;
  /** The actual API key string (only shown once!) */
  key: string;
}
