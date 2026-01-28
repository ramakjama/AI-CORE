/**
 * Authentication and Authorization Types
 */

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * JWT Tokens
 */
export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

/**
 * Session
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Session Data (includes user info)
 */
export interface SessionData {
  session: Session;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Auth Context (attached to request)
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration Data
 */
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * Password Reset Request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password Reset
 */
export interface PasswordReset {
  token: string;
  newPassword: string;
}

/**
 * Password Change
 */
export interface PasswordChange {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Permission
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

/**
 * User Permission
 */
export interface UserPermission {
  userId: string;
  permissionId: string;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Middleware types
 */
export type AuthMiddleware = (req: any, res: any, next: any) => Promise<void> | void;
export type PermissionMiddleware = (req: any, res: any, next: any) => Promise<void> | void;
