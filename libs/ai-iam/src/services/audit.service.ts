// ============================================================================
// AI-IAM Audit Service - Security Audit & Logging
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  AuditEvent,
  AuditEventType,
  AuditFilterOptions,
  SecurityAlert,
  FailedAttempt,
  Anomaly,
  AnomalyDetectionResult,
  PaginatedResult,
  ServiceResult
} from '../types';

// Configuration
interface AuditConfig {
  enabled: boolean;
  retentionDays: number;
  maxEventsPerUser: number;
  anomalyDetection: {
    enabled: boolean;
    maxFailedAttemptsPerHour: number;
    maxLoginAttemptsFromNewLocations: number;
    suspiciousTimeWindow: number; // milliseconds
  };
  alertThresholds: {
    failedLoginAttempts: number;
    passwordResetAttempts: number;
    suspiciousActivity: number;
  };
}

const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  enabled: true,
  retentionDays: 90,
  maxEventsPerUser: 10000,
  anomalyDetection: {
    enabled: true,
    maxFailedAttemptsPerHour: 10,
    maxLoginAttemptsFromNewLocations: 3,
    suspiciousTimeWindow: 60 * 60 * 1000 // 1 hour
  },
  alertThresholds: {
    failedLoginAttempts: 5,
    passwordResetAttempts: 3,
    suspiciousActivity: 3
  }
};

/**
 * Audit Service
 * Handles security event logging, analysis, and anomaly detection
 */
export class AuditService {
  private config: AuditConfig;

  // In-memory stores (replace with database/SIEM in production)
  private auditEvents: Map<string, AuditEvent> = new Map();
  private securityAlerts: Map<string, SecurityAlert> = new Map();
  private failedAttempts: Map<string, FailedAttempt[]> = new Map();
  private userLocations: Map<string, Set<string>> = new Map(); // userId -> Set<ipAddress>
  private userAgents: Map<string, Set<string>> = new Map(); // userId -> Set<userAgent>

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };

    // Start retention cleanup
    this.startRetentionCleanup();
  }

  // ============================================================================
  // EVENT LOGGING
  // ============================================================================

  /**
   * Log an authentication event
   */
  async logAuthEvent(
    userId: string | undefined,
    event: AuditEventType,
    details: {
      targetUserId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      resource?: string;
      action?: string;
      status?: 'success' | 'failure';
      risk?: 'low' | 'medium' | 'high' | 'critical';
      metadata?: Record<string, unknown>;
    }
  ): Promise<ServiceResult<AuditEvent>> {
    if (!this.config.enabled) {
      return {
        success: true,
        data: {} as AuditEvent
      };
    }

    try {
      const auditEvent: AuditEvent = {
        id: uuidv4(),
        type: event,
        userId,
        targetUserId: details.targetUserId,
        sessionId: details.sessionId,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        resource: details.resource,
        action: details.action,
        status: details.status || 'success',
        details: details.metadata,
        risk: details.risk || this.calculateRisk(event, details.status || 'success'),
        createdAt: new Date()
      };

      this.auditEvents.set(auditEvent.id, auditEvent);

      // Track user locations for anomaly detection
      if (userId && details.ipAddress) {
        this.trackUserLocation(userId, details.ipAddress);
      }

      // Track user agents for anomaly detection
      if (userId && details.userAgent) {
        this.trackUserAgent(userId, details.userAgent);
      }

      // Check for anomalies
      if (this.config.anomalyDetection.enabled && userId) {
        await this.checkForAnomalies(userId, auditEvent);
      }

      // Create alerts for high-risk events
      if (auditEvent.risk === 'high' || auditEvent.risk === 'critical') {
        await this.createSecurityAlert(auditEvent);
      }

      return {
        success: true,
        data: auditEvent
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUDIT_LOG_ERROR',
          message: error instanceof Error ? error.message : 'Failed to log audit event'
        }
      };
    }
  }

  /**
   * Get authentication history for a user
   */
  async getAuthHistory(
    userId: string,
    period: { startDate?: Date; endDate?: Date } = {}
  ): Promise<ServiceResult<AuditEvent[]>> {
    let events = Array.from(this.auditEvents.values()).filter(
      e => e.userId === userId
    );

    if (period.startDate) {
      events = events.filter(e => e.createdAt >= period.startDate!);
    }

    if (period.endDate) {
      events = events.filter(e => e.createdAt <= period.endDate!);
    }

    // Sort by creation date (most recent first)
    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      success: true,
      data: events
    };
  }

  /**
   * Get failed login attempts for an identifier
   */
  async getFailedAttempts(
    identifier: string,
    timeWindow?: number
  ): Promise<ServiceResult<FailedAttempt[]>> {
    const attempts = this.failedAttempts.get(identifier) || [];

    let filteredAttempts = attempts;
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredAttempts = attempts.filter(
        a => a.attemptedAt.getTime() > cutoff
      );
    }

    return {
      success: true,
      data: filteredAttempts
    };
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  /**
   * Detect anomalies for a user
   */
  async detectAnomalies(userId: string): Promise<ServiceResult<AnomalyDetectionResult>> {
    const anomalies: Anomaly[] = [];
    let riskScore = 0;
    const recommendedActions: string[] = [];

    // Get recent events for this user
    const recentEvents = await this.getRecentEvents(
      userId,
      this.config.anomalyDetection.suspiciousTimeWindow
    );

    // Check for multiple failed login attempts
    const failedLogins = recentEvents.filter(
      e => e.type === AuditEventType.LOGIN_FAILURE
    );
    if (failedLogins.length >= this.config.alertThresholds.failedLoginAttempts) {
      anomalies.push({
        type: 'MULTIPLE_FAILED_LOGINS',
        description: `${failedLogins.length} failed login attempts in the last hour`,
        severity: failedLogins.length >= 10 ? 'critical' : 'high',
        evidence: {
          count: failedLogins.length,
          firstAttempt: failedLogins[0]?.createdAt,
          lastAttempt: failedLogins[failedLogins.length - 1]?.createdAt
        },
        detectedAt: new Date()
      });
      riskScore += 30;
      recommendedActions.push('Review recent login attempts');
      recommendedActions.push('Consider temporary account lockout');
    }

    // Check for login from new location
    const userLocations = this.userLocations.get(userId) || new Set();
    const newLocationLogins = recentEvents.filter(e =>
      e.type === AuditEventType.LOGIN_SUCCESS &&
      e.ipAddress &&
      !userLocations.has(e.ipAddress)
    );
    if (newLocationLogins.length > 0) {
      anomalies.push({
        type: 'LOGIN_FROM_NEW_LOCATION',
        description: 'Login detected from new IP address',
        severity: 'medium',
        evidence: {
          newLocations: newLocationLogins.map(e => e.ipAddress),
          knownLocations: Array.from(userLocations)
        },
        detectedAt: new Date()
      });
      riskScore += 20;
      recommendedActions.push('Verify if login was legitimate');
    }

    // Check for rapid successive logins from different locations
    const successfulLogins = recentEvents.filter(
      e => e.type === AuditEventType.LOGIN_SUCCESS
    );
    const uniqueIPs = new Set(successfulLogins.map(e => e.ipAddress));
    if (uniqueIPs.size >= 3 && successfulLogins.length >= 3) {
      const timeDiff = (successfulLogins[0]?.createdAt?.getTime() || 0) -
                      (successfulLogins[successfulLogins.length - 1]?.createdAt?.getTime() || 0);
      if (timeDiff < 30 * 60 * 1000) { // 30 minutes
        anomalies.push({
          type: 'IMPOSSIBLE_TRAVEL',
          description: 'Logins from multiple locations in a short time period',
          severity: 'critical',
          evidence: {
            locations: Array.from(uniqueIPs),
            timeSpan: timeDiff,
            loginCount: successfulLogins.length
          },
          detectedAt: new Date()
        });
        riskScore += 50;
        recommendedActions.push('Immediately terminate all active sessions');
        recommendedActions.push('Force password reset');
      }
    }

    // Check for password reset attempts
    const passwordResets = recentEvents.filter(
      e => e.type === AuditEventType.PASSWORD_RESET
    );
    if (passwordResets.length >= this.config.alertThresholds.passwordResetAttempts) {
      anomalies.push({
        type: 'MULTIPLE_PASSWORD_RESETS',
        description: `${passwordResets.length} password reset attempts`,
        severity: 'medium',
        evidence: {
          count: passwordResets.length
        },
        detectedAt: new Date()
      });
      riskScore += 15;
    }

    // Check for MFA challenges
    const mfaChallenges = recentEvents.filter(
      e => e.type === AuditEventType.MFA_CHALLENGE && e.status === 'failure'
    );
    if (mfaChallenges.length >= 3) {
      anomalies.push({
        type: 'MFA_BRUTE_FORCE',
        description: 'Multiple failed MFA attempts',
        severity: 'high',
        evidence: {
          count: mfaChallenges.length
        },
        detectedAt: new Date()
      });
      riskScore += 25;
      recommendedActions.push('Review MFA configuration');
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    const result: AnomalyDetectionResult = {
      userId,
      anomalies,
      riskScore,
      recommendedActions,
      analyzedAt: new Date()
    };

    return {
      success: true,
      data: result
    };
  }

  // ============================================================================
  // SECURITY ALERTS
  // ============================================================================

  /**
   * Get security alerts
   */
  async getSecurityAlerts(
    filters: {
      userId?: string;
      severity?: 'info' | 'warning' | 'error' | 'critical';
      acknowledged?: boolean;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ServiceResult<PaginatedResult<SecurityAlert>>> {
    let alerts = Array.from(this.securityAlerts.values());

    // Apply filters
    if (filters.userId) {
      alerts = alerts.filter(a => a.userId === filters.userId);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }

    if (filters.startDate) {
      alerts = alerts.filter(a => a.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      alerts = alerts.filter(a => a.createdAt <= filters.endDate!);
    }

    // Sort by creation date (most recent first)
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = alerts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const items = alerts.slice(offset, offset + limit);

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

  /**
   * Acknowledge a security alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string
  ): Promise<ServiceResult<void>> {
    const alert = this.securityAlerts.get(alertId);
    if (!alert) {
      return {
        success: false,
        error: {
          code: 'ALERT_NOT_FOUND',
          message: 'Security alert not found'
        }
      };
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    return { success: true };
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Search audit events
   */
  async searchEvents(
    filters: AuditFilterOptions
  ): Promise<ServiceResult<PaginatedResult<AuditEvent>>> {
    let events = Array.from(this.auditEvents.values());

    // Apply filters
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }

    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters.startDate) {
      events = events.filter(e => e.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      events = events.filter(e => e.createdAt <= filters.endDate!);
    }

    // Sort by creation date (most recent first)
    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const items = events.slice(offset, offset + limit);

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

  /**
   * Get event counts by type
   */
  async getEventCounts(
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceResult<Record<AuditEventType, number>>> {
    let events = Array.from(this.auditEvents.values());

    if (userId) {
      events = events.filter(e => e.userId === userId);
    }

    if (startDate) {
      events = events.filter(e => e.createdAt >= startDate);
    }

    if (endDate) {
      events = events.filter(e => e.createdAt <= endDate);
    }

    const counts: Partial<Record<AuditEventType, number>> = {};
    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }

    return {
      success: true,
      data: counts as Record<AuditEventType, number>
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate risk level for an event
   */
  private calculateRisk(
    eventType: AuditEventType,
    status: 'success' | 'failure'
  ): 'low' | 'medium' | 'high' | 'critical' {
    // High-risk events
    const criticalEvents = [
      AuditEventType.ACCOUNT_LOCKED,
      AuditEventType.SUSPICIOUS_ACTIVITY
    ];

    const highRiskEvents = [
      AuditEventType.PASSWORD_CHANGE,
      AuditEventType.PASSWORD_RESET,
      AuditEventType.MFA_DISABLED
    ];

    const mediumRiskEvents = [
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.SESSION_TERMINATED
    ];

    if (criticalEvents.includes(eventType)) {
      return 'critical';
    }

    if (highRiskEvents.includes(eventType)) {
      return status === 'failure' ? 'high' : 'medium';
    }

    if (mediumRiskEvents.includes(eventType)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Track user location
   */
  private trackUserLocation(userId: string, ipAddress: string): void {
    let locations = this.userLocations.get(userId);
    if (!locations) {
      locations = new Set();
      this.userLocations.set(userId, locations);
    }
    locations.add(ipAddress);
  }

  /**
   * Track user agent
   */
  private trackUserAgent(userId: string, userAgent: string): void {
    let agents = this.userAgents.get(userId);
    if (!agents) {
      agents = new Set();
      this.userAgents.set(userId, agents);
    }
    agents.add(userAgent);
  }

  /**
   * Get recent events for a user
   */
  private async getRecentEvents(
    userId: string,
    timeWindow: number
  ): Promise<AuditEvent[]> {
    const cutoff = Date.now() - timeWindow;
    return Array.from(this.auditEvents.values())
      .filter(e =>
        e.userId === userId &&
        e.createdAt.getTime() > cutoff
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Check for anomalies after logging an event
   */
  private async checkForAnomalies(
    userId: string,
    event: AuditEvent
  ): Promise<void> {
    // Quick anomaly checks
    if (event.type === AuditEventType.LOGIN_FAILURE) {
      await this.recordFailedAttempt(userId, event);
    }

    // Check if we need to create an alert
    const recentFailures = await this.getRecentEvents(
      userId,
      this.config.anomalyDetection.suspiciousTimeWindow
    );

    const failedLogins = recentFailures.filter(
      e => e.type === AuditEventType.LOGIN_FAILURE
    );

    if (failedLogins.length >= this.config.alertThresholds.failedLoginAttempts) {
      await this.createSecurityAlert({
        ...event,
        type: AuditEventType.SUSPICIOUS_ACTIVITY,
        risk: 'high',
        details: {
          ...event.details,
          failedLoginCount: failedLogins.length,
          alertType: 'BRUTE_FORCE_ATTEMPT'
        }
      });
    }
  }

  /**
   * Record a failed login attempt
   */
  private async recordFailedAttempt(
    identifier: string,
    event: AuditEvent
  ): Promise<void> {
    const attempt: FailedAttempt = {
      id: uuidv4(),
      identifier,
      ipAddress: event.ipAddress || '',
      userAgent: event.userAgent,
      reason: 'Authentication failed',
      attemptedAt: new Date()
    };

    let attempts = this.failedAttempts.get(identifier);
    if (!attempts) {
      attempts = [];
      this.failedAttempts.set(identifier, attempts);
    }
    attempts.push(attempt);

    // Keep only recent attempts
    const cutoff = Date.now() - this.config.anomalyDetection.suspiciousTimeWindow;
    this.failedAttempts.set(
      identifier,
      attempts.filter(a => a.attemptedAt.getTime() > cutoff)
    );
  }

  /**
   * Create a security alert
   */
  private async createSecurityAlert(event: AuditEvent): Promise<void> {
    const alert: SecurityAlert = {
      id: uuidv4(),
      type: event.type,
      severity: this.mapRiskToSeverity(event.risk),
      userId: event.userId,
      message: this.generateAlertMessage(event),
      details: event.details,
      acknowledged: false,
      createdAt: new Date()
    };

    this.securityAlerts.set(alert.id, alert);

    // In production, send notifications (email, Slack, PagerDuty, etc.)
    console.log(`[SECURITY ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
  }

  /**
   * Map risk level to severity
   */
  private mapRiskToSeverity(
    risk?: 'low' | 'medium' | 'high' | 'critical'
  ): 'info' | 'warning' | 'error' | 'critical' {
    switch (risk) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(event: AuditEvent): string {
    const messages: Record<AuditEventType, string> = {
      [AuditEventType.LOGIN_SUCCESS]: 'Successful login',
      [AuditEventType.LOGIN_FAILURE]: 'Failed login attempt',
      [AuditEventType.LOGOUT]: 'User logged out',
      [AuditEventType.PASSWORD_CHANGE]: 'Password was changed',
      [AuditEventType.PASSWORD_RESET]: 'Password reset requested',
      [AuditEventType.MFA_ENABLED]: 'MFA was enabled',
      [AuditEventType.MFA_DISABLED]: 'MFA was disabled',
      [AuditEventType.MFA_CHALLENGE]: 'MFA challenge issued',
      [AuditEventType.ACCOUNT_LOCKED]: 'Account was locked',
      [AuditEventType.ACCOUNT_UNLOCKED]: 'Account was unlocked',
      [AuditEventType.SESSION_CREATED]: 'New session created',
      [AuditEventType.SESSION_TERMINATED]: 'Session terminated',
      [AuditEventType.ROLE_ASSIGNED]: 'Role assigned to user',
      [AuditEventType.ROLE_REMOVED]: 'Role removed from user',
      [AuditEventType.PERMISSION_GRANTED]: 'Permission granted',
      [AuditEventType.PERMISSION_REVOKED]: 'Permission revoked',
      [AuditEventType.SSO_LOGIN]: 'SSO login detected',
      [AuditEventType.SUSPICIOUS_ACTIVITY]: 'Suspicious activity detected'
    };

    return messages[event.type] || `Security event: ${event.type}`;
  }

  /**
   * Start retention cleanup interval
   */
  private startRetentionCleanup(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupOldRecords();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up old records based on retention policy
   */
  private cleanupOldRecords(): void {
    const cutoff = new Date(
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000
    );

    let cleanedEvents = 0;
    let cleanedAlerts = 0;

    // Clean old audit events
    for (const [id, event] of this.auditEvents.entries()) {
      if (event.createdAt < cutoff) {
        this.auditEvents.delete(id);
        cleanedEvents++;
      }
    }

    // Clean old security alerts
    for (const [id, alert] of this.securityAlerts.entries()) {
      if (alert.createdAt < cutoff && alert.acknowledged) {
        this.securityAlerts.delete(id);
        cleanedAlerts++;
      }
    }

    if (cleanedEvents > 0 || cleanedAlerts > 0) {
      console.log(
        `[AUDIT] Retention cleanup: ${cleanedEvents} events, ${cleanedAlerts} alerts`
      );
    }
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  /**
   * Export audit events to JSON
   */
  async exportEvents(
    filters: AuditFilterOptions = {}
  ): Promise<ServiceResult<AuditEvent[]>> {
    const result = await this.searchEvents({
      ...filters,
      limit: 10000 // Export limit
    });

    return {
      success: true,
      data: result.data?.items || []
    };
  }

  /**
   * Get audit summary
   */
  async getAuditSummary(
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResult<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    eventsByRisk: Record<string, number>;
    uniqueUsers: number;
    totalAlerts: number;
    unacknowledgedAlerts: number;
  }>> {
    let events = Array.from(this.auditEvents.values()).filter(
      e => e.createdAt >= startDate && e.createdAt <= endDate
    );

    const alerts = Array.from(this.securityAlerts.values()).filter(
      a => a.createdAt >= startDate && a.createdAt <= endDate
    );

    const eventsByType: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    const eventsByRisk: Record<string, number> = {};
    const uniqueUserIds = new Set<string>();

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByStatus[event.status] = (eventsByStatus[event.status] || 0) + 1;
      if (event.risk) {
        eventsByRisk[event.risk] = (eventsByRisk[event.risk] || 0) + 1;
      }
      if (event.userId) {
        uniqueUserIds.add(event.userId);
      }
    }

    return {
      success: true,
      data: {
        totalEvents: events.length,
        eventsByType,
        eventsByStatus,
        eventsByRisk,
        uniqueUsers: uniqueUserIds.size,
        totalAlerts: alerts.length,
        unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length
      }
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();
