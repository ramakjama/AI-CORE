// ============================================================================
// AI-IAM Auth Service - Authentication & Authorization
// ============================================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserCredential,
  UserProfile,
  UserSession,
  LoginResult,
  TokenPayload,
  TokenType,
  UserStatus,
  SessionStatus,
  AuthProvider,
  MFAChallenge,
  MFAMethod,
  ServiceResult,
  Token,
  IAMConfig,
  AuditEventType,
  DeviceInfo
} from '../types';

// Default configuration
const DEFAULT_CONFIG: IAMConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    accessTokenExpiration: '15m',
    refreshTokenExpiration: '7d',
    issuer: 'ai-iam',
    audience: 'ai-core'
  },
  bcrypt: {
    saltRounds: 12
  },
  session: {
    maxActiveSessions: 5,
    sessionTimeout: 30 * 60 * 1000 // 30 minutes
  },
  mfa: {
    totpIssuer: 'AI-Core',
    totpWindow: 1,
    codeLength: 6,
    codeExpiration: 5 * 60 * 1000 // 5 minutes
  },
  rateLimit: {
    login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
    mfa: { windowMs: 5 * 60 * 1000, maxRequests: 5 }
  },
  audit: {
    enabled: true,
    retentionDays: 90
  }
};

/**
 * Authentication Service
 * Handles user authentication, token management, and account security
 */
export class AuthService {
  private config: IAMConfig;

  // In-memory stores (replace with database in production)
  private users: Map<string, User> = new Map();
  private credentials: Map<string, UserCredential> = new Map();
  private profiles: Map<string, UserProfile> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private tokens: Map<string, Token> = new Map();
  private mfaChallenges: Map<string, MFAChallenge> = new Map();
  private failedAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private passwordHistory: Map<string, string[]> = new Map();

  constructor(config: Partial<IAMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string, deviceInfo?: DeviceInfo): Promise<LoginResult> {
    try {
      // Check rate limiting
      const rateLimitResult = this.checkRateLimit(email);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`
          }
        };
      }

      // Find user by email
      const user = this.findUserByEmail(email);
      if (!user) {
        this.recordFailedAttempt(email);
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        };
      }

      // Check account status
      if (user.status === UserStatus.LOCKED) {
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          return {
            success: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              message: 'Account is temporarily locked. Please try again later.'
            }
          };
        }
        // Lockout expired, unlock account
        user.status = UserStatus.ACTIVE;
        user.lockoutUntil = undefined;
        user.failedLoginAttempts = 0;
      }

      if (user.status !== UserStatus.ACTIVE) {
        return {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: `Account is ${user.status.toLowerCase()}`
          }
        };
      }

      // Get credentials
      const credential = this.getCredentialByUserId(user.id, AuthProvider.LOCAL);
      if (!credential || !credential.passwordHash) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, credential.passwordHash);
      if (!isValidPassword) {
        this.recordFailedAttempt(email);
        user.failedLoginAttempts++;

        // Check if account should be locked
        const maxAttempts = 5;
        if (user.failedLoginAttempts >= maxAttempts) {
          user.status = UserStatus.LOCKED;
          user.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

          // Log security event
          this.logAuditEvent(user.id, AuditEventType.ACCOUNT_LOCKED, {
            reason: 'Too many failed login attempts'
          });

          return {
            success: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              message: 'Account locked due to too many failed attempts'
            }
          };
        }

        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        };
      }

      // Reset failed attempts on successful password verification
      user.failedLoginAttempts = 0;
      this.clearFailedAttempts(email);

      // Check if MFA is required
      if (user.mfaEnabled && user.mfaMethods.length > 0) {
        const challenge = this.createMFAChallenge(user.id, user.mfaMethods as MFAMethod[]);
        return {
          success: true,
          requiresMFA: true,
          mfaChallenge: challenge
        };
      }

      // Create session and tokens
      return this.completeLogin(user, deviceInfo);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: error instanceof Error ? error.message : 'Login failed'
        }
      };
    }
  }

  /**
   * Complete login with MFA verification
   */
  async loginWithMFA(
    email: string,
    password: string,
    mfaCode: string,
    challengeId?: string,
    deviceInfo?: DeviceInfo
  ): Promise<LoginResult> {
    // First, validate credentials
    const loginResult = await this.login(email, password, deviceInfo);

    if (!loginResult.success && !loginResult.requiresMFA) {
      return loginResult;
    }

    const user = this.findUserByEmail(email);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    // Get MFA challenge
    const challenge = challengeId
      ? this.mfaChallenges.get(challengeId)
      : loginResult.mfaChallenge;

    if (!challenge) {
      return {
        success: false,
        error: {
          code: 'MFA_CHALLENGE_NOT_FOUND',
          message: 'MFA challenge not found or expired'
        }
      };
    }

    // Verify MFA code (delegate to MFA service in real implementation)
    const mfaValid = await this.verifyMFACode(user.id, mfaCode, challenge.method);
    if (!mfaValid) {
      challenge.attemptsRemaining--;

      if (challenge.attemptsRemaining <= 0) {
        this.mfaChallenges.delete(challenge.challengeId);
        return {
          success: false,
          error: {
            code: 'MFA_ATTEMPTS_EXCEEDED',
            message: 'Too many MFA attempts. Please login again.'
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'INVALID_MFA_CODE',
          message: `Invalid MFA code. ${challenge.attemptsRemaining} attempts remaining.`
        }
      };
    }

    // MFA verified, complete login
    this.mfaChallenges.delete(challenge.challengeId);
    return this.completeLogin(user, deviceInfo, true);
  }

  /**
   * Complete login process after all verifications
   */
  private async completeLogin(
    user: User,
    deviceInfo?: DeviceInfo,
    mfaVerified: boolean = false
  ): Promise<LoginResult> {
    // Check session limit
    const userSessions = this.getUserActiveSessions(user.id);
    if (userSessions.length >= this.config.session.maxActiveSessions) {
      // Terminate oldest session
      const oldestSession = userSessions.sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      if (oldestSession) {
        this.terminateSession(oldestSession.id);
      }
    }

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = this.generateAccessToken(user, sessionId, mfaVerified);
    const refreshToken = this.generateRefreshToken();

    // Create session
    const session: UserSession = {
      id: sessionId,
      userId: user.id,
      status: SessionStatus.ACTIVE,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + this.parseExpiration(this.config.jwt.accessTokenExpiration)),
      refreshExpiresAt: new Date(Date.now() + this.parseExpiration(this.config.jwt.refreshTokenExpiration)),
      deviceInfo,
      mfaVerified,
      lastActivityAt: new Date(),
      createdAt: new Date()
    };

    this.sessions.set(session.id, session);

    // Update user last login
    user.lastLoginAt = new Date();

    // Get user profile
    const profile = this.profiles.get(user.id);

    // Log successful login
    this.logAuditEvent(user.id, AuditEventType.LOGIN_SUCCESS, {
      sessionId,
      mfaVerified,
      deviceInfo
    });

    // Return sanitized user
    const publicUser = this.sanitizeUser(user);

    return {
      success: true,
      user: publicUser,
      profile,
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiration(this.config.jwt.accessTokenExpiration) / 1000
    };
  }

  /**
   * Logout and terminate session
   */
  async logout(sessionId: string): Promise<ServiceResult<void>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      };
    }

    session.status = SessionStatus.REVOKED;
    session.terminatedAt = new Date();

    // Log logout event
    this.logAuditEvent(session.userId, AuditEventType.LOGOUT, { sessionId });

    return { success: true };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResult> {
    // Find session by refresh token
    const session = Array.from(this.sessions.values()).find(
      s => s.refreshToken === refreshToken && s.status === SessionStatus.ACTIVE
    );

    if (!session) {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      };
    }

    // Check if refresh token is expired
    if (session.refreshExpiresAt < new Date()) {
      session.status = SessionStatus.EXPIRED;
      return {
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token has expired'
        }
      };
    }

    // Get user
    const user = this.users.get(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      return {
        success: false,
        error: {
          code: 'USER_INVALID',
          message: 'User not found or inactive'
        }
      };
    }

    // Generate new tokens (token rotation)
    const newAccessToken = this.generateAccessToken(user, session.id, session.mfaVerified);
    const newRefreshToken = this.generateRefreshToken();

    // Update session
    session.accessToken = newAccessToken;
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + this.parseExpiration(this.config.jwt.accessTokenExpiration));
    session.refreshExpiresAt = new Date(Date.now() + this.parseExpiration(this.config.jwt.refreshTokenExpiration));
    session.lastActivityAt = new Date();

    const profile = this.profiles.get(user.id);

    return {
      success: true,
      user: this.sanitizeUser(user),
      profile,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.parseExpiration(this.config.jwt.accessTokenExpiration) / 1000
    };
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<ServiceResult<TokenPayload>> {
    try {
      const payload = jwt.verify(token, this.config.jwt.secret, {
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as TokenPayload;

      // Check if session is still active
      const session = this.sessions.get(payload.sessionId);
      if (!session || session.status !== SessionStatus.ACTIVE) {
        return {
          success: false,
          error: {
            code: 'SESSION_INVALID',
            message: 'Session is no longer active'
          }
        };
      }

      // Update session activity
      session.lastActivityAt = new Date();

      return {
        success: true,
        data: payload
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired'
          }
        };
      }
      return {
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Invalid token'
        }
      };
    }
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    const user = this.users.get(userId);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    const credential = this.getCredentialByUserId(userId, AuthProvider.LOCAL);
    if (!credential || !credential.passwordHash) {
      return {
        success: false,
        error: {
          code: 'CREDENTIAL_NOT_FOUND',
          message: 'Credential not found'
        }
      };
    }

    // Verify old password
    const isValidOldPassword = await bcrypt.compare(oldPassword, credential.passwordHash);
    if (!isValidOldPassword) {
      return {
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        }
      };
    }

    // Validate new password
    const validationResult = this.validatePassword(newPassword);
    if (!validationResult.valid) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: validationResult.message || 'Password does not meet requirements'
        }
      };
    }

    // Check password history
    const history = this.passwordHistory.get(userId) || [];
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        return {
          success: false,
          error: {
            code: 'PASSWORD_REUSED',
            message: 'Cannot reuse recent passwords'
          }
        };
      }
    }

    // Hash and store new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.config.bcrypt.saltRounds);
    credential.passwordHash = newPasswordHash;
    credential.updatedAt = new Date();

    // Update password history
    history.unshift(newPasswordHash);
    if (history.length > 5) history.pop();
    this.passwordHistory.set(userId, history);

    // Update user
    user.passwordChangedAt = new Date();

    // Terminate all other sessions (optional security measure)
    this.terminateAllUserSessions(userId);

    // Log event
    this.logAuditEvent(userId, AuditEventType.PASSWORD_CHANGE, {});

    return { success: true };
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<ServiceResult<{ token: string; expiresAt: Date }>> {
    const user = this.findUserByEmail(email);

    // Always return success to prevent email enumeration
    const response = {
      success: true,
      data: {
        token: '',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    };

    if (!user) {
      // Return fake token to prevent enumeration
      response.data.token = uuidv4();
      return response;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const token: Token = {
      id: uuidv4(),
      type: TokenType.RESET_PASSWORD,
      token: resetToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      createdAt: new Date()
    };

    this.tokens.set(resetToken, token);

    // Log event
    this.logAuditEvent(user.id, AuditEventType.PASSWORD_RESET, { action: 'requested' });

    response.data.token = resetToken;
    response.data.expiresAt = token.expiresAt;

    return response;
  }

  /**
   * Verify reset token and set new password
   */
  async verifyResetToken(
    token: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    const resetToken = this.tokens.get(token);

    if (!resetToken || resetToken.type !== TokenType.RESET_PASSWORD) {
      return {
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token'
        }
      };
    }

    if (resetToken.expiresAt < new Date() || resetToken.usedAt) {
      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token has expired'
        }
      };
    }

    const user = this.users.get(resetToken.userId);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    // Validate new password
    const validationResult = this.validatePassword(newPassword);
    if (!validationResult.valid) {
      return {
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: validationResult.message || 'Password does not meet requirements'
        }
      };
    }

    // Get or create credential
    let credential = this.getCredentialByUserId(user.id, AuthProvider.LOCAL);
    if (!credential) {
      credential = {
        id: uuidv4(),
        userId: user.id,
        provider: AuthProvider.LOCAL,
        totpEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.credentials.set(credential.id, credential);
    }

    // Hash and store new password
    credential.passwordHash = await bcrypt.hash(newPassword, this.config.bcrypt.saltRounds);
    credential.updatedAt = new Date();

    // Mark token as used
    resetToken.usedAt = new Date();

    // Update user
    user.passwordChangedAt = new Date();
    if (user.status === UserStatus.LOCKED) {
      user.status = UserStatus.ACTIVE;
      user.lockoutUntil = undefined;
      user.failedLoginAttempts = 0;
    }

    // Terminate all sessions
    this.terminateAllUserSessions(user.id);

    // Log event
    this.logAuditEvent(user.id, AuditEventType.PASSWORD_RESET, { action: 'completed' });

    return { success: true };
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Lock user account
   */
  async lockAccount(userId: string, reason: string): Promise<ServiceResult<void>> {
    const user = this.users.get(userId);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    user.status = UserStatus.LOCKED;
    user.updatedAt = new Date();

    // Terminate all sessions
    this.terminateAllUserSessions(userId);

    // Log event
    this.logAuditEvent(userId, AuditEventType.ACCOUNT_LOCKED, { reason });

    return { success: true };
  }

  /**
   * Unlock user account
   */
  async unlockAccount(userId: string): Promise<ServiceResult<void>> {
    const user = this.users.get(userId);
    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      };
    }

    user.status = UserStatus.ACTIVE;
    user.lockoutUntil = undefined;
    user.failedLoginAttempts = 0;
    user.updatedAt = new Date();

    // Log event
    this.logAuditEvent(userId, AuditEventType.ACCOUNT_UNLOCKED, {});

    return { success: true };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate access token
   */
  private generateAccessToken(
    user: User,
    sessionId: string,
    mfaVerified: boolean
  ): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles || user.roleIds || [],
      permissions: user.permissions || [],
      organizationId: user.organizationId,
      sessionId,
      mfaVerified,
      tokenType: TokenType.ACCESS
    };

    return jwt.sign(payload as object, this.config.jwt.secret, {
      expiresIn: this.config.jwt.accessTokenExpiration as jwt.SignOptions['expiresIn'],
      issuer: this.config.jwt.issuer,
      audience: this.config.jwt.audience
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(): string {
    return uuidv4() + '-' + uuidv4();
  }

  /**
   * Parse expiration string to milliseconds
   */
  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }

  /**
   * Find user by email
   */
  private findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Get credential by user ID and provider
   */
  private getCredentialByUserId(userId: string, provider: AuthProvider): UserCredential | undefined {
    return Array.from(this.credentials.values()).find(
      c => c.userId === userId && c.provider === provider
    );
  }

  /**
   * Get user active sessions
   */
  private getUserActiveSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.userId === userId && s.status === SessionStatus.ACTIVE
    );
  }

  /**
   * Terminate a specific session
   */
  private terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = SessionStatus.REVOKED;
      session.terminatedAt = new Date();
    }
  }

  /**
   * Terminate all user sessions
   */
  private terminateAllUserSessions(userId: string, exceptSessionId?: string): void {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.id !== exceptSessionId) {
        session.status = SessionStatus.REVOKED;
        session.terminatedAt = new Date();
      }
    }
  }

  /**
   * Sanitize user object (remove sensitive data)
   */
  private sanitizeUser(user: User): Omit<User, 'failedLoginAttempts' | 'lockoutUntil'> {
    const { failedLoginAttempts, lockoutUntil, ...publicUser } = user;
    return publicUser;
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return { allowed: true };

    const windowMs = this.config.rateLimit.login.windowMs;
    const maxRequests = this.config.rateLimit.login.maxRequests;

    if (attempts.count >= maxRequests) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt.getTime();
      if (timeSinceLastAttempt < windowMs) {
        return {
          allowed: false,
          retryAfter: Math.ceil((windowMs - timeSinceLastAttempt) / 1000)
        };
      }
      // Reset after window expires
      this.failedAttempts.delete(identifier);
    }

    return { allowed: true };
  }

  /**
   * Record failed login attempt
   */
  private recordFailedAttempt(identifier: string): void {
    const attempts = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: new Date() };
    attempts.count++;
    attempts.lastAttempt = new Date();
    this.failedAttempts.set(identifier, attempts);
  }

  /**
   * Clear failed attempts
   */
  private clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  /**
   * Create MFA challenge
   */
  private createMFAChallenge(userId: string, methods: MFAMethod[]): MFAChallenge {
    const challenge: MFAChallenge = {
      challengeId: uuidv4(),
      userId,
      method: methods[0] || MFAMethod.TOTP,
      allowedMethods: methods,
      attemptsRemaining: 3,
      expiresAt: new Date(Date.now() + this.config.mfa.codeExpiration),
      createdAt: new Date()
    };

    this.mfaChallenges.set(challenge.challengeId, challenge);
    return challenge;
  }

  /**
   * Verify MFA code (placeholder - delegate to MFA service)
   */
  private async verifyMFACode(_userId: string, code: string, _method: MFAMethod): Promise<boolean> {
    // This should be delegated to MFAService
    // Placeholder implementation
    return code.length === 6 && /^\d+$/.test(code);
  }

  /**
   * Log audit event (placeholder - delegate to Audit service)
   */
  private logAuditEvent(userId: string, type: AuditEventType, details: Record<string, unknown>): void {
    // This should be delegated to AuditService
    console.log(`[AUDIT] ${type} - User: ${userId}`, details);
  }

  // ============================================================================
  // USER/CREDENTIAL MANAGEMENT (for testing/initialization)
  // ============================================================================

  /**
   * Register a new user (for testing purposes)
   */
  async registerUser(
    email: string,
    password: string,
    profile: Partial<UserProfile>
  ): Promise<ServiceResult<User>> {
    if (this.findUserByEmail(email)) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      };
    }

    const userId = uuidv4();
    const user: User = {
      id: userId,
      email,
      username: email.split('@')[0] || email,
      passwordHash: '',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      displayName: profile.displayName,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
      tenantId: 'default',
      roleIds: [],
      roles: [],
      permissions: [],
      mfaEnabled: false,
      mfaMethods: [],
      failedLoginAttempts: 0,
      passwordResetRequired: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const credential: UserCredential = {
      id: uuidv4(),
      userId,
      provider: AuthProvider.LOCAL,
      passwordHash: await bcrypt.hash(password, this.config.bcrypt.saltRounds),
      totpEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const userProfile: UserProfile = {
      id: uuidv4(),
      userId,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      displayName: profile.displayName,
      phoneVerified: false,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    this.credentials.set(credential.id, credential);
    this.profiles.set(userId, userProfile);

    return { success: true, data: user };
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Update user
   */
  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, updates, { updatedAt: new Date() });
    }
    return user;
  }
}

// Export singleton instance
export const authService = new AuthService();
