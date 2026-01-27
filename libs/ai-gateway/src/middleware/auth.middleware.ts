/**
 * Authentication Middleware
 * JWT verification, user extraction, and permission checking
 */

import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import {
  User,
  Role,
  TokenPayload,
  RefreshTokenPayload,
  GraphQLContext,
  AuthenticatedContext,
  AuthenticationError,
  AuthorizationError,
  GatewayError,
  JwtConfig,
} from '../types';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_JWT_CONFIG: JwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  algorithm: 'HS256',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
  issuer: 'ai-gateway',
  audience: 'ai-core',
};

let jwtConfig: JwtConfig = DEFAULT_JWT_CONFIG;

/**
 * Initialize authentication middleware with configuration
 */
export function initializeAuth(config: Partial<JwtConfig>): void {
  jwtConfig = { ...DEFAULT_JWT_CONFIG, ...config };
}

// ============================================================================
// Token Operations
// ============================================================================

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const verifyOptions: VerifyOptions = {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    };

    const decoded = jwt.verify(
      token,
      jwtConfig.publicKey || jwtConfig.secret,
      verifyOptions
    ) as JwtPayload;

    // Validate required claims
    if (!decoded.sub || !decoded.email || !decoded.role) {
      throw new AuthenticationError('Invalid token payload');
    }

    return {
      sub: decoded.sub,
      email: decoded.email as string,
      role: decoded.role as Role,
      permissions: (decoded.permissions as string[]) || [],
      partyId: decoded.partyId as string | undefined,
      organizationId: decoded.organizationId as string | undefined,
      iat: decoded.iat!,
      exp: decoded.exp!,
      iss: decoded.iss!,
      aud: decoded.aud as string,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Generate a new access token
 */
export function generateAccessToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    partyId: user.partyId,
    organizationId: user.organizationId,
  };

  const signOptions: SignOptions = {
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  };

  return jwt.sign(payload, jwtConfig.secret, signOptions);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(userId: string, tokenVersion: number = 0): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    tokenVersion,
  };

  const signOptions: SignOptions = {
    algorithm: jwtConfig.algorithm,
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
  };

  return jwt.sign(payload, jwtConfig.secret, signOptions);
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
    }) as JwtPayload;

    if (!decoded.sub) {
      throw new AuthenticationError('Invalid refresh token');
    }

    return {
      sub: decoded.sub,
      tokenVersion: (decoded.tokenVersion as number) || 0,
      iat: decoded.iat!,
      exp: decoded.exp!,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired');
    }
    throw new AuthenticationError('Invalid refresh token');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(
  refreshTokenStr: string,
  getUserById: (id: string) => Promise<User | null>,
  getTokenVersion?: (userId: string) => Promise<number>
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(refreshTokenStr);

  // Check token version if provided (for token invalidation)
  if (getTokenVersion) {
    const currentVersion = await getTokenVersion(payload.sub);
    if (payload.tokenVersion !== currentVersion) {
      throw new AuthenticationError('Token has been revoked');
    }
  }

  // Get user
  const user = await getUserById(payload.sub);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(
    user.id,
    payload.tokenVersion
  );

  return { accessToken, refreshToken: newRefreshToken };
}

// ============================================================================
// User Extraction
// ============================================================================

/**
 * Extract user from context
 */
export async function extractUser(context: GraphQLContext): Promise<User | null> {
  const authHeader = context.req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
      partyId: payload.partyId,
      organizationId: payload.organizationId,
    };
  } catch (error) {
    // Log error but don't throw - let the resolver decide if auth is required
    context.logger.debug('Token verification failed', { error });
    return null;
  }
}

/**
 * Require authenticated user from context
 */
export async function requireAuth(context: GraphQLContext): Promise<AuthenticatedContext> {
  const user = await extractUser(context);

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  const authHeader = context.req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader || '';

  return {
    ...context,
    user,
    token,
  };
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SYSTEM]: 100,
  [Role.ADMIN]: 80,
  [Role.MANAGER]: 60,
  [Role.AGENT]: 40,
  [Role.USER]: 20,
};

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, permission: string): boolean {
  // Admin and System have all permissions
  if (user.role === Role.ADMIN || user.role === Role.SYSTEM) {
    return true;
  }

  // Check explicit permissions
  return user.permissions.includes(permission);
}

/**
 * Check permission and throw if not authorized
 */
export function checkPermission(
  user: User | null | undefined,
  permission: string | Role
): void {
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  // If permission is a Role, check role hierarchy
  if (Object.values(Role).includes(permission as Role)) {
    if (!hasRole(user, permission as Role)) {
      throw new AuthorizationError(
        `Role '${permission}' required. Current role: '${user.role}'`
      );
    }
    return;
  }

  // Check permission string
  if (!hasPermission(user, permission)) {
    throw new AuthorizationError(`Permission '${permission}' required`);
  }
}

/**
 * Check multiple permissions (AND logic)
 */
export function checkAllPermissions(
  user: User | null | undefined,
  permissions: string[]
): void {
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  for (const permission of permissions) {
    if (!hasPermission(user, permission)) {
      throw new AuthorizationError(
        `All permissions required: ${permissions.join(', ')}`
      );
    }
  }
}

/**
 * Check any permission (OR logic)
 */
export function checkAnyPermission(
  user: User | null | undefined,
  permissions: string[]
): void {
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  const hasAny = permissions.some(p => hasPermission(user, p));
  if (!hasAny) {
    throw new AuthorizationError(
      `One of these permissions required: ${permissions.join(', ')}`
    );
  }
}

// ============================================================================
// Resource-Based Authorization
// ============================================================================

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  user: User,
  resource: { ownerId?: string; organizationId?: string },
  action: 'read' | 'write' | 'delete'
): boolean {
  // Admin and System can access all resources
  if (user.role === Role.ADMIN || user.role === Role.SYSTEM) {
    return true;
  }

  // Check if user owns the resource
  if (resource.ownerId && resource.ownerId === user.id) {
    return true;
  }

  // Check if user belongs to the same organization
  if (
    resource.organizationId &&
    user.organizationId &&
    resource.organizationId === user.organizationId
  ) {
    // Managers can do all actions within their organization
    if (user.role === Role.MANAGER) {
      return true;
    }
    // Agents can read and write
    if (user.role === Role.AGENT && action !== 'delete') {
      return true;
    }
    // Users can only read
    if (user.role === Role.USER && action === 'read') {
      return true;
    }
  }

  return false;
}

/**
 * Assert user can access resource
 */
export function assertCanAccessResource(
  user: User | null | undefined,
  resource: { ownerId?: string; organizationId?: string },
  action: 'read' | 'write' | 'delete'
): void {
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  if (!canAccessResource(user, resource, action)) {
    throw new AuthorizationError(
      `You don't have permission to ${action} this resource`
    );
  }
}

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * Auth directive implementation for schema directives
 */
export function createAuthDirective() {
  return {
    async auth(
      resolve: Function,
      source: unknown,
      args: unknown,
      context: GraphQLContext,
      info: unknown,
      { requires }: { requires?: Role }
    ) {
      const authContext = await requireAuth(context);

      if (requires && !hasRole(authContext.user, requires)) {
        throw new AuthorizationError(
          `Role '${requires}' required. Current role: '${authContext.user.role}'`
        );
      }

      return resolve(source, args, authContext, info);
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded) return null;

    return {
      sub: decoded.sub!,
      email: decoded.email as string,
      role: decoded.role as Role,
      permissions: (decoded.permissions as string[]) || [],
      partyId: decoded.partyId as string | undefined,
      organizationId: decoded.organizationId as string | undefined,
      iat: decoded.iat!,
      exp: decoded.exp!,
      iss: decoded.iss!,
      aud: decoded.aud as string,
    };
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Get token expiration time in seconds
 */
export function getTokenExpiresIn(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - now);
}

/**
 * Create API key token (long-lived, limited permissions)
 */
export function createApiKeyToken(
  serviceId: string,
  permissions: string[],
  expiresIn: string = '365d'
): string {
  const payload = {
    sub: serviceId,
    email: `${serviceId}@api.internal`,
    role: Role.SYSTEM,
    permissions,
    isApiKey: true,
  };

  return jwt.sign(payload, jwtConfig.secret, {
    algorithm: jwtConfig.algorithm,
    expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
}

export default {
  initializeAuth,
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  extractUser,
  requireAuth,
  hasRole,
  hasPermission,
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  canAccessResource,
  assertCanAccessResource,
  createAuthDirective,
  decodeToken,
  isTokenExpired,
  getTokenExpiresIn,
  createApiKeyToken,
};
