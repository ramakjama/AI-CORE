// ============================================================================
// AI-IAM Session Service - User Session Management
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  UserSession,
  SessionStatus,
  DeviceInfo,
  SessionLocation,
  SessionFilterOptions,
  PaginatedResult,
  ServiceResult,
  AuditEventType
} from '../types';

// Configuration
interface SessionConfig {
  maxActiveSessions: number;
  sessionTimeout: number; // milliseconds
  refreshTokenExpiration: number; // milliseconds
  enableSessionTracking: boolean;
  enableLocationTracking: boolean;
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxActiveSessions: 5,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  refreshTokenExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
  enableSessionTracking: true,
  enableLocationTracking: true
};

/**
 * Session statistics
 */
interface SessionStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  byDeviceType: Record<string, number>;
  byCountry: Record<string, number>;
}

/**
 * Session Service
 * Manages user sessions including creation, validation, and termination
 */
export class SessionService {
  private config: SessionConfig;

  // In-memory stores (replace with database in production)
  private sessions: Map<string, UserSession> = new Map();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  // ============================================================================
  // SESSION LIFECYCLE
  // ============================================================================

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    deviceInfo?: DeviceInfo,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ServiceResult<UserSession>> {
    try {
      // Check session limit
      const userSessions = this.getActiveSessionsByUserId(userId);
      if (userSessions.length >= this.config.maxActiveSessions) {
        // Terminate oldest session
        const oldestSession = userSessions.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )[0];
        if (oldestSession) {
          await this.terminateSession(oldestSession.id);
        }
      }

      // Parse location from IP (in production, use a GeoIP service)
      const location = this.config.enableLocationTracking
        ? await this.resolveLocation(ipAddress)
        : undefined;

      // Create session
      const now = new Date();
      const session: UserSession = {
        id: uuidv4(),
        userId,
        status: SessionStatus.ACTIVE,
        accessToken: '',  // Will be set by AuthService
        refreshToken: '', // Will be set by AuthService
        expiresAt: new Date(now.getTime() + this.config.sessionTimeout),
        refreshExpiresAt: new Date(now.getTime() + this.config.refreshTokenExpiration),
        deviceInfo,
        ipAddress,
        userAgent,
        location,
        mfaVerified: false,
        lastActivityAt: now,
        createdAt: now
      };

      this.sessions.set(session.id, session);

      // Log session creation
      this.logAuditEvent(userId, AuditEventType.SESSION_CREATED, {
        sessionId: session.id,
        deviceInfo,
        ipAddress,
        location
      });

      return {
        success: true,
        data: session
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SESSION_CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create session'
        }
      };
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ServiceResult<UserSession>> {
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

    return {
      success: true,
      data: session
    };
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<ServiceResult<UserSession[]>> {
    const sessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId
    );

    return {
      success: true,
      data: sessions
    };
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(sessionId: string): Promise<ServiceResult<void>> {
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

    // Log session termination
    this.logAuditEvent(session.userId, AuditEventType.SESSION_TERMINATED, {
      sessionId: session.id,
      reason: 'User requested'
    });

    return { success: true };
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateAllSessions(
    userId: string,
    exceptCurrentSessionId?: string
  ): Promise<ServiceResult<number>> {
    let terminatedCount = 0;

    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.id !== exceptCurrentSessionId) {
        if (session.status === SessionStatus.ACTIVE) {
          session.status = SessionStatus.REVOKED;
          session.terminatedAt = new Date();
          terminatedCount++;
        }
      }
    }

    if (terminatedCount > 0) {
      this.logAuditEvent(userId, AuditEventType.SESSION_TERMINATED, {
        count: terminatedCount,
        reason: 'User terminated all sessions'
      });
    }

    return {
      success: true,
      data: terminatedCount
    };
  }

  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<ServiceResult<void>> {
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

    if (session.status !== SessionStatus.ACTIVE) {
      return {
        success: false,
        error: {
          code: 'SESSION_INACTIVE',
          message: 'Session is not active'
        }
      };
    }

    // Check if session has timed out
    const idleTime = Date.now() - session.lastActivityAt.getTime();
    if (idleTime > this.config.sessionTimeout) {
      session.status = SessionStatus.EXPIRED;
      return {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired due to inactivity'
        }
      };
    }

    // Update activity
    session.lastActivityAt = new Date();
    session.expiresAt = new Date(Date.now() + this.config.sessionTimeout);

    return { success: true };
  }

  /**
   * Get active sessions with filters
   */
  async getActiveSessions(
    filters: SessionFilterOptions
  ): Promise<ServiceResult<PaginatedResult<UserSession>>> {
    let sessions = Array.from(this.sessions.values());

    // Apply filters
    if (filters.userId) {
      sessions = sessions.filter(s => s.userId === filters.userId);
    }

    if (filters.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    } else {
      // Default to active sessions
      sessions = sessions.filter(s => s.status === SessionStatus.ACTIVE);
    }

    if (filters.deviceType) {
      sessions = sessions.filter(s => s.deviceInfo?.deviceType === filters.deviceType);
    }

    if (filters.ipAddress) {
      sessions = sessions.filter(s => s.ipAddress === filters.ipAddress);
    }

    if (filters.startDate) {
      sessions = sessions.filter(s => s.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      sessions = sessions.filter(s => s.createdAt <= filters.endDate!);
    }

    // Sort by last activity (most recent first)
    sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = sessions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const items = sessions.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  // ============================================================================
  // SESSION VALIDATION
  // ============================================================================

  /**
   * Validate if a session is active and not expired
   */
  async validateSession(sessionId: string): Promise<ServiceResult<boolean>> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: true,
        data: false
      };
    }

    if (session.status !== SessionStatus.ACTIVE) {
      return {
        success: true,
        data: false
      };
    }

    // Check idle timeout
    const idleTime = Date.now() - session.lastActivityAt.getTime();
    if (idleTime > this.config.sessionTimeout) {
      session.status = SessionStatus.EXPIRED;
      return {
        success: true,
        data: false
      };
    }

    // Check refresh token expiration
    if (session.refreshExpiresAt < new Date()) {
      session.status = SessionStatus.EXPIRED;
      return {
        success: true,
        data: false
      };
    }

    return {
      success: true,
      data: true
    };
  }

  /**
   * Check if session needs token refresh
   */
  needsRefresh(session: UserSession): boolean {
    // Refresh if access token expires within 5 minutes
    const refreshThreshold = 5 * 60 * 1000;
    return session.expiresAt.getTime() - Date.now() < refreshThreshold;
  }

  // ============================================================================
  // SESSION STATISTICS
  // ============================================================================

  /**
   * Get session statistics
   */
  async getSessionStats(userId?: string): Promise<ServiceResult<SessionStats>> {
    let sessions = Array.from(this.sessions.values());

    if (userId) {
      sessions = sessions.filter(s => s.userId === userId);
    }

    const stats: SessionStats = {
      total: sessions.length,
      active: 0,
      expired: 0,
      revoked: 0,
      byDeviceType: {},
      byCountry: {}
    };

    for (const session of sessions) {
      // Count by status
      switch (session.status) {
        case SessionStatus.ACTIVE:
          stats.active++;
          break;
        case SessionStatus.EXPIRED:
          stats.expired++;
          break;
        case SessionStatus.REVOKED:
          stats.revoked++;
          break;
      }

      // Count by device type
      const deviceType = session.deviceInfo?.deviceType || 'unknown';
      stats.byDeviceType[deviceType] = (stats.byDeviceType[deviceType] || 0) + 1;

      // Count by country
      const country = session.location?.country || 'unknown';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
    }

    return {
      success: true,
      data: stats
    };
  }

  // ============================================================================
  // SESSION UPDATE
  // ============================================================================

  /**
   * Update session tokens
   */
  updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    refreshExpiresAt: Date
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.accessToken = accessToken;
      session.refreshToken = refreshToken;
      session.expiresAt = expiresAt;
      session.refreshExpiresAt = refreshExpiresAt;
      session.lastActivityAt = new Date();
    }
  }

  /**
   * Update MFA verification status
   */
  updateMFAVerification(sessionId: string, verified: boolean): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.mfaVerified = verified;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get active sessions by user ID
   */
  private getActiveSessionsByUserId(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.userId === userId && s.status === SessionStatus.ACTIVE
    );
  }

  /**
   * Resolve location from IP address
   */
  private async resolveLocation(ipAddress?: string): Promise<SessionLocation | undefined> {
    if (!ipAddress) return undefined;

    // In production, integrate with a GeoIP service (MaxMind, IP2Location, etc.)
    // This is a placeholder implementation
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }

  /**
   * Start session cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const session of this.sessions.values()) {
      if (session.status === SessionStatus.ACTIVE) {
        // Check idle timeout
        const idleTime = now.getTime() - session.lastActivityAt.getTime();
        if (idleTime > this.config.sessionTimeout) {
          session.status = SessionStatus.EXPIRED;
          cleanedCount++;
        }

        // Check refresh token expiration
        if (session.refreshExpiresAt < now) {
          session.status = SessionStatus.EXPIRED;
          cleanedCount++;
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SESSION] Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    userId: string,
    type: AuditEventType,
    details: Record<string, unknown>
  ): void {
    console.log(`[SESSION AUDIT] ${type} - User: ${userId}`, details);
  }

  // ============================================================================
  // SESSION LOOKUP
  // ============================================================================

  /**
   * Find session by access token
   */
  findSessionByAccessToken(accessToken: string): UserSession | undefined {
    return Array.from(this.sessions.values()).find(
      s => s.accessToken === accessToken && s.status === SessionStatus.ACTIVE
    );
  }

  /**
   * Find session by refresh token
   */
  findSessionByRefreshToken(refreshToken: string): UserSession | undefined {
    return Array.from(this.sessions.values()).find(
      s => s.refreshToken === refreshToken && s.status === SessionStatus.ACTIVE
    );
  }

  /**
   * Get session directly (for internal use)
   */
  getSessionDirect(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  // ============================================================================
  // DEVICE MANAGEMENT
  // ============================================================================

  /**
   * Mark device as trusted
   */
  async markDeviceTrusted(sessionId: string): Promise<ServiceResult<void>> {
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

    if (session.deviceInfo) {
      session.deviceInfo.isTrusted = true;
    }

    return { success: true };
  }

  /**
   * Get trusted devices for user
   */
  async getTrustedDevices(userId: string): Promise<ServiceResult<DeviceInfo[]>> {
    const sessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId && s.deviceInfo?.isTrusted
    );

    const devices = sessions
      .map(s => s.deviceInfo!)
      .filter((d, i, arr) =>
        arr.findIndex(x => x.deviceId === d.deviceId) === i
      );

    return {
      success: true,
      data: devices
    };
  }

  /**
   * Revoke trusted device
   */
  async revokeTrustedDevice(
    userId: string,
    deviceId: string
  ): Promise<ServiceResult<number>> {
    let revokedCount = 0;

    for (const session of this.sessions.values()) {
      if (session.userId === userId &&
          session.deviceInfo?.deviceId === deviceId &&
          session.status === SessionStatus.ACTIVE) {
        session.status = SessionStatus.REVOKED;
        session.terminatedAt = new Date();
        if (session.deviceInfo) {
          session.deviceInfo.isTrusted = false;
        }
        revokedCount++;
      }
    }

    return {
      success: true,
      data: revokedCount
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
