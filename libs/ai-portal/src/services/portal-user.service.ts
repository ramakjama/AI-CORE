/**
 * Portal User Service
 * Manages user authentication, registration, and session management
 * for e-cliente and web premium portals
 */

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import {
  PortalUser,
  UserPreferences,
  UserSession,
  UserStatus,
  DeviceInfo,
  AuthTokenPayload,
  LoginResult,
  ServiceResult,
  DashboardLayout,
} from '../types';

// Configuration constants
const JWT_SECRET = process.env.PORTAL_JWT_SECRET || 'portal-secret-key';
const JWT_EXPIRY = process.env.PORTAL_JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY = process.env.PORTAL_REFRESH_EXPIRY || '7d';
const PASSWORD_SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

// In-memory storage (replace with database in production)
const users: Map<string, PortalUser> = new Map();
const usersByEmail: Map<string, string> = new Map();
const preferences: Map<string, UserPreferences> = new Map();
const sessions: Map<string, UserSession> = new Map();

/**
 * Portal User Service
 */
export class PortalUserService {
  /**
   * Register a new portal user
   */
  async register(
    email: string,
    password: string,
    partyId: string
  ): Promise<ServiceResult<{ user: Omit<PortalUser, 'passwordHash'>; verificationToken: string }>> {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'El formato del email no es válido',
          },
        };
      }

      // Check if email already exists
      const normalizedEmail = email.toLowerCase().trim();
      if (usersByEmail.has(normalizedEmail)) {
        return {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Ya existe una cuenta con este email',
          },
        };
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: passwordValidation.message || 'La contraseña no cumple los requisitos de seguridad',
          },
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

      // Generate verification token
      const verificationToken = this.generateSecureToken();
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

      // Create user
      const userId = uuidv4();
      const now = new Date();

      const user: PortalUser = {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        partyId,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
        status: 'pending_verification',
        failedLoginAttempts: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Store user
      users.set(userId, user);
      usersByEmail.set(normalizedEmail, userId);

      // Create default preferences
      await this.createDefaultPreferences(userId);

      // Return user without sensitive data
      const { passwordHash: _, emailVerificationToken: __, ...safeUser } = user;

      return {
        success: true,
        data: {
          user: safeUser,
          verificationToken,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Error al registrar el usuario',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Login user with email and password
   */
  async login(
    email: string,
    password: string,
    deviceInfo?: Partial<DeviceInfo>,
    ipAddress?: string
  ): Promise<LoginResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const userId = usersByEmail.get(normalizedEmail);

      if (!userId) {
        return {
          success: false,
          error: 'Credenciales inválidas',
        };
      }

      const user = users.get(userId);
      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas',
        };
      }

      // Check if account is locked
      if (user.status === 'locked' && user.lockedUntil) {
        if (new Date() < user.lockedUntil) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
          );
          return {
            success: false,
            error: `Cuenta bloqueada. Intente de nuevo en ${remainingMinutes} minutos`,
          };
        } else {
          // Unlock account
          user.status = 'active';
          user.lockedUntil = undefined;
          user.failedLoginAttempts = 0;
        }
      }

      // Check if account is active
      if (user.status === 'suspended') {
        return {
          success: false,
          error: 'Esta cuenta ha sido suspendida. Contacte con soporte',
        };
      }

      if (user.status === 'pending_verification') {
        return {
          success: false,
          error: 'Por favor, verifique su email antes de iniciar sesión',
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        // Increment failed attempts
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.status = 'locked';
          user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
          users.set(userId, user);

          return {
            success: false,
            error: `Demasiados intentos fallidos. Cuenta bloqueada por ${LOCK_DURATION_MINUTES} minutos`,
          };
        }

        users.set(userId, user);
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;

        return {
          success: false,
          error: `Credenciales inválidas. ${remainingAttempts} intentos restantes`,
        };
      }

      // Check two-factor authentication
      const userPrefs = preferences.get(userId);
      if (userPrefs?.twoFactorEnabled) {
        // Return flag indicating 2FA is required
        return {
          success: false,
          requiresTwoFactor: true,
          error: 'Se requiere autenticación de dos factores',
        };
      }

      // Successful login - reset failed attempts
      user.failedLoginAttempts = 0;
      user.lastLogin = new Date();
      users.set(userId, user);

      // Create session
      const session = await this.createSession(userId, deviceInfo, ipAddress);

      // Generate tokens
      const token = this.generateAccessToken(user, session.id);
      const refreshToken = session.refreshToken;

      // Return safe user data
      const { passwordHash: _, ...safeUser } = user;

      return {
        success: true,
        user: safeUser,
        session,
        token,
        refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ServiceResult<{ user: Omit<PortalUser, 'passwordHash'> }>> {
    try {
      // Find user with this verification token
      let targetUser: PortalUser | undefined;

      for (const user of users.values()) {
        if (user.emailVerificationToken === token) {
          targetUser = user;
          break;
        }
      }

      if (!targetUser) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token de verificación inválido o expirado',
          },
        };
      }

      // Check token expiry
      if (targetUser.emailVerificationExpiry && new Date() > targetUser.emailVerificationExpiry) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'El token de verificación ha expirado',
          },
        };
      }

      // Verify email
      targetUser.emailVerified = true;
      targetUser.emailVerificationToken = undefined;
      targetUser.emailVerificationExpiry = undefined;
      targetUser.status = 'active';
      targetUser.updatedAt = new Date();

      users.set(targetUser.id, targetUser);

      const { passwordHash: _, ...safeUser } = targetUser;

      return {
        success: true,
        data: { user: safeUser },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Error al verificar el email',
        },
      };
    }
  }

  /**
   * Request password reset
   */
  async resetPassword(email: string): Promise<ServiceResult<{ resetToken: string }>> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const userId = usersByEmail.get(normalizedEmail);

      if (!userId) {
        // Return success even if email doesn't exist (security)
        return {
          success: true,
          data: { resetToken: '' },
        };
      }

      const user = users.get(userId);
      if (!user) {
        return {
          success: true,
          data: { resetToken: '' },
        };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

      user.passwordResetToken = resetToken;
      user.passwordResetExpiry = resetExpiry;
      user.updatedAt = new Date();

      users.set(userId, user);

      return {
        success: true,
        data: { resetToken },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: 'Error al solicitar el restablecimiento de contraseña',
        },
      };
    }
  }

  /**
   * Complete password reset with token
   */
  async completePasswordReset(
    token: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    try {
      // Find user with this reset token
      let targetUser: PortalUser | undefined;

      for (const user of users.values()) {
        if (user.passwordResetToken === token) {
          targetUser = user;
          break;
        }
      }

      if (!targetUser) {
        return {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token de restablecimiento inválido o expirado',
          },
        };
      }

      // Check token expiry
      if (targetUser.passwordResetExpiry && new Date() > targetUser.passwordResetExpiry) {
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'El token de restablecimiento ha expirado',
          },
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: passwordValidation.message || 'La contraseña no cumple los requisitos',
          },
        };
      }

      // Update password
      targetUser.passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
      targetUser.passwordResetToken = undefined;
      targetUser.passwordResetExpiry = undefined;
      targetUser.updatedAt = new Date();

      // Invalidate all sessions
      await this.invalidateAllSessions(targetUser.id);

      users.set(targetUser.id, targetUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESET_ERROR',
          message: 'Error al restablecer la contraseña',
        },
      };
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<ServiceResult<UserPreferences>> {
    try {
      const user = users.get(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
          },
        };
      }

      let userPrefs = preferences.get(userId);
      if (!userPrefs) {
        userPrefs = await this.createDefaultPreferences(userId);
      }

      // Update preferences
      const updatedPrefs: UserPreferences = {
        ...userPrefs,
        ...updates,
        id: userPrefs.id,
        userId: userPrefs.userId,
        updatedAt: new Date(),
      };

      preferences.set(userId, updatedPrefs);

      return {
        success: true,
        data: updatedPrefs,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al actualizar las preferencias',
        },
      };
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<ServiceResult<UserPreferences>> {
    try {
      const user = users.get(userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
          },
        };
      }

      let userPrefs = preferences.get(userId);
      if (!userPrefs) {
        userPrefs = await this.createDefaultPreferences(userId);
      }

      return {
        success: true,
        data: userPrefs,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las preferencias',
        },
      };
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ServiceResult<UserSession>> {
    try {
      const session = sessions.get(sessionId);

      if (!session) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Sesión no encontrada',
          },
        };
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        sessions.delete(sessionId);
        return {
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'La sesión ha expirado',
          },
        };
      }

      // Check if session is active
      if (!session.isActive) {
        return {
          success: false,
          error: {
            code: 'SESSION_INACTIVE',
            message: 'La sesión no está activa',
          },
        };
      }

      // Update last activity
      session.lastActivityAt = new Date();
      sessions.set(sessionId, session);

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_ERROR',
          message: 'Error al obtener la sesión',
        },
      };
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(sessionId: string): Promise<ServiceResult<void>> {
    try {
      const session = sessions.get(sessionId);

      if (session) {
        session.isActive = false;
        sessions.set(sessionId, session);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Error al cerrar sesión',
        },
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResult<{ token: string; refreshToken: string }>> {
    try {
      // Find session with this refresh token
      let targetSession: UserSession | undefined;

      for (const session of sessions.values()) {
        if (session.refreshToken === refreshToken && session.isActive) {
          targetSession = session;
          break;
        }
      }

      if (!targetSession) {
        return {
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Token de refresco inválido',
          },
        };
      }

      // Check refresh token expiry
      if (new Date() > targetSession.refreshExpiresAt) {
        sessions.delete(targetSession.id);
        return {
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'El token de refresco ha expirado',
          },
        };
      }

      const user = users.get(targetSession.userId);
      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
          },
        };
      }

      // Generate new tokens
      const newToken = this.generateAccessToken(user, targetSession.id);
      const newRefreshToken = this.generateSecureToken();

      // Update session
      targetSession.token = newToken;
      targetSession.refreshToken = newRefreshToken;
      targetSession.expiresAt = this.calculateExpiry(JWT_EXPIRY);
      targetSession.refreshExpiresAt = this.calculateExpiry(REFRESH_TOKEN_EXPIRY);
      targetSession.lastActivityAt = new Date();

      sessions.set(targetSession.id, targetSession);

      return {
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFRESH_ERROR',
          message: 'Error al refrescar el token',
        },
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<ServiceResult<Omit<PortalUser, 'passwordHash'>>> {
    try {
      const user = users.get(userId);

      if (!user) {
        return {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Usuario no encontrado',
          },
        };
      }

      const { passwordHash: _, ...safeUser } = user;

      return {
        success: true,
        data: safeUser,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el usuario',
        },
      };
    }
  }

  /**
   * Get active sessions for user
   */
  async getUserSessions(userId: string): Promise<ServiceResult<UserSession[]>> {
    try {
      const userSessions: UserSession[] = [];

      for (const session of sessions.values()) {
        if (session.userId === userId && session.isActive && new Date() < session.expiresAt) {
          userSessions.push(session);
        }
      }

      return {
        success: true,
        data: userSessions,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las sesiones',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createSession(
    userId: string,
    deviceInfo?: Partial<DeviceInfo>,
    ipAddress?: string
  ): Promise<UserSession> {
    const sessionId = uuidv4();
    const now = new Date();

    const session: UserSession = {
      id: sessionId,
      userId,
      token: '', // Will be set by caller
      refreshToken: this.generateSecureToken(),
      deviceInfo: {
        userAgent: deviceInfo?.userAgent || 'Unknown',
        browser: deviceInfo?.browser,
        os: deviceInfo?.os,
        device: deviceInfo?.device,
        isMobile: deviceInfo?.isMobile || false,
      },
      ipAddress: ipAddress || 'Unknown',
      expiresAt: this.calculateExpiry(JWT_EXPIRY),
      refreshExpiresAt: this.calculateExpiry(REFRESH_TOKEN_EXPIRY),
      isActive: true,
      createdAt: now,
      lastActivityAt: now,
    };

    sessions.set(sessionId, session);

    return session;
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultLayout: DashboardLayout = {
      widgets: [
        { id: '1', type: 'policies', position: { row: 0, col: 0 }, size: { width: 2, height: 1 }, visible: true },
        { id: '2', type: 'claims', position: { row: 0, col: 2 }, size: { width: 1, height: 1 }, visible: true },
        { id: '3', type: 'payments', position: { row: 1, col: 0 }, size: { width: 1, height: 1 }, visible: true },
        { id: '4', type: 'notifications', position: { row: 1, col: 1 }, size: { width: 1, height: 1 }, visible: true },
        { id: '5', type: 'gamification', position: { row: 1, col: 2 }, size: { width: 1, height: 1 }, visible: true },
      ],
      columns: 3,
    };

    const prefs: UserPreferences = {
      id: uuidv4(),
      userId,
      language: 'es',
      timezone: 'Europe/Madrid',
      dateFormat: 'DD/MM/YYYY',
      currency: 'EUR',
      theme: 'system',
      dashboardLayout: defaultLayout,
      emailDigest: 'weekly',
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    preferences.set(userId, prefs);

    return prefs;
  }

  private generateAccessToken(user: PortalUser, sessionId: string): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      partyId: user.partyId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(this.calculateExpiry(JWT_EXPIRY).getTime() / 1000),
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 1 hour
      now.setHours(now.getHours() + 1);
      return now;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos una minúscula' };
    }

    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos un número' };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'La contraseña debe contener al menos un carácter especial' };
    }

    return { valid: true };
  }

  private async invalidateAllSessions(userId: string): Promise<void> {
    for (const [sessionId, session] of sessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
        sessions.set(sessionId, session);
      }
    }
  }
}

// Export singleton instance
export const portalUserService = new PortalUserService();
