/**
 * Alerting Service
 * Monitors system health and sends alerts based on thresholds
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EngineOrchestratorService } from './engine-orchestrator.service';
import { HealthMonitorService } from './health-monitor.service';
import { FailoverManagerService } from './failover-manager.service';
import { EngineStatus, EngineEventType } from '../types/engine.types';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  type: string;
  message: string;
  details: Record<string, any>;
  engineId?: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  condition: (context: any) => boolean;
  message: (context: any) => string;
  cooldownMs: number;
  lastTriggered?: Date;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private readonly alerts: Alert[] = [];
  private readonly maxAlerts = 1000;
  private readonly alertRules: Map<string, AlertRule> = new Map();
  private readonly alertCallbacks: Array<(alert: Alert) => void> = [];

  constructor(
    private readonly orchestrator: EngineOrchestratorService,
    private readonly healthMonitor: HealthMonitorService,
    private readonly failover: FailoverManagerService,
  ) {
    this.initializeAlertRules();
    this.setupEngineEventListeners();
  }

  /**
   * Initialize default alert rules
   */
  private initializeAlertRules() {
    // Engine unhealthy
    this.addAlertRule({
      id: 'engine-unhealthy',
      name: 'Engine Unhealthy',
      description: 'Alert when an engine becomes unhealthy',
      enabled: true,
      severity: AlertSeverity.ERROR,
      condition: (context) => context.engineStatus === EngineStatus.UNHEALTHY,
      message: (context) =>
        `Engine ${context.engineName} (${context.engineId}) is unhealthy`,
      cooldownMs: 300000, // 5 minutes
    });

    // Circuit breaker opened
    this.addAlertRule({
      id: 'circuit-breaker-open',
      name: 'Circuit Breaker Opened',
      description: 'Alert when circuit breaker opens',
      enabled: true,
      severity: AlertSeverity.WARNING,
      condition: (context) => context.circuitBreakerState === 'open',
      message: (context) =>
        `Circuit breaker opened for engine ${context.engineName} (${context.engineId})`,
      cooldownMs: 300000,
    });

    // High error rate
    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      enabled: true,
      severity: AlertSeverity.WARNING,
      condition: (context) => context.errorRate > 0.1, // 10%
      message: (context) =>
        `High error rate detected for engine ${context.engineName}: ${(context.errorRate * 100).toFixed(2)}%`,
      cooldownMs: 600000, // 10 minutes
    });

    // Slow response time
    this.addAlertRule({
      id: 'slow-response-time',
      name: 'Slow Response Time',
      description: 'Alert when response time exceeds threshold',
      enabled: true,
      severity: AlertSeverity.WARNING,
      condition: (context) => context.averageResponseTime > 10000, // 10 seconds
      message: (context) =>
        `Slow response time for engine ${context.engineName}: ${(context.averageResponseTime / 1000).toFixed(2)}s`,
      cooldownMs: 600000,
    });

    // No healthy instances
    this.addAlertRule({
      id: 'no-healthy-instances',
      name: 'No Healthy Instances',
      description: 'Alert when engine has no healthy instances',
      enabled: true,
      severity: AlertSeverity.CRITICAL,
      condition: (context) => context.healthyInstances === 0 && context.totalInstances > 0,
      message: (context) =>
        `No healthy instances available for engine ${context.engineName} (${context.engineId})`,
      cooldownMs: 180000, // 3 minutes
    });

    // System unhealthy
    this.addAlertRule({
      id: 'system-unhealthy',
      name: 'System Unhealthy',
      description: 'Alert when overall system is unhealthy',
      enabled: true,
      severity: AlertSeverity.CRITICAL,
      condition: (context) => !context.systemHealthy,
      message: () => 'System is unhealthy - no engines available',
      cooldownMs: 300000,
    });

    // Multiple failovers
    this.addAlertRule({
      id: 'multiple-failovers',
      name: 'Multiple Failovers',
      description: 'Alert when multiple failovers occur',
      enabled: true,
      severity: AlertSeverity.WARNING,
      condition: (context) => context.totalFailovers > 10,
      message: (context) =>
        `Multiple failovers detected: ${context.totalFailovers} total failovers`,
      cooldownMs: 600000,
    });

    // Instance count low
    this.addAlertRule({
      id: 'instance-count-low',
      name: 'Instance Count Low',
      description: 'Alert when instance count is below minimum',
      enabled: true,
      severity: AlertSeverity.INFO,
      condition: (context) =>
        context.currentInstances < context.minInstances && context.enabled,
      message: (context) =>
        `Engine ${context.engineName} has ${context.currentInstances} instances (minimum: ${context.minInstances})`,
      cooldownMs: 600000,
    });
  }

  /**
   * Setup engine event listeners
   */
  private setupEngineEventListeners() {
    this.orchestrator.onEvent(EngineEventType.ENGINE_UNHEALTHY, (event) => {
      this.createAlert({
        severity: AlertSeverity.ERROR,
        type: 'engine_unhealthy',
        message: `Engine ${event.engineId} became unhealthy`,
        details: event.data,
        engineId: event.engineId,
      });
    });

    this.orchestrator.onEvent(EngineEventType.ENGINE_RECOVERED, (event) => {
      this.createAlert({
        severity: AlertSeverity.INFO,
        type: 'engine_recovered',
        message: `Engine ${event.engineId} recovered`,
        details: event.data,
        engineId: event.engineId,
      });
    });

    this.orchestrator.onEvent(EngineEventType.ENGINE_ERROR, (event) => {
      this.createAlert({
        severity: AlertSeverity.ERROR,
        type: 'engine_error',
        message: `Engine ${event.engineId} encountered an error`,
        details: event.data,
        engineId: event.engineId,
      });
    });

    this.orchestrator.onEvent(EngineEventType.CIRCUIT_BREAKER_OPENED, (event) => {
      this.createAlert({
        severity: AlertSeverity.WARNING,
        type: 'circuit_breaker_opened',
        message: `Circuit breaker opened for engine ${event.engineId}`,
        details: event.data,
        engineId: event.engineId,
      });
    });

    this.orchestrator.onEvent(EngineEventType.FAILOVER_TRIGGERED, (event) => {
      this.createAlert({
        severity: AlertSeverity.WARNING,
        type: 'failover_triggered',
        message: `Failover triggered for engine ${event.engineId}`,
        details: event.data,
        engineId: event.engineId,
      });
    });
  }

  /**
   * Periodic alert evaluation (every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async evaluateAlertRules() {
    try {
      const engines = this.orchestrator.getAllEngines();
      const systemHealth = await this.healthMonitor.getSystemHealth();
      const failoverStats = this.failover.getFailoverStats();

      // Evaluate system-level rules
      await this.evaluateRule('system-unhealthy', {
        systemHealthy: systemHealth.healthy,
      });

      await this.evaluateRule('multiple-failovers', {
        totalFailovers: failoverStats.totalFailovers,
      });

      // Evaluate engine-level rules
      for (const engine of engines) {
        const instances = this.orchestrator.getEngineInstances(engine.id);
        const healthyInstances = instances.filter((i) => i.healthStatus.healthy);
        const circuitBreaker = this.failover.getCircuitBreakerState(engine.id);

        const context = {
          engineId: engine.id,
          engineName: engine.name,
          engineStatus: instances[0]?.status,
          enabled: engine.enabled,
          totalInstances: instances.length,
          healthyInstances: healthyInstances.length,
          currentInstances: engine.currentInstances,
          minInstances: engine.minInstances,
          circuitBreakerState: circuitBreaker?.state,
          errorRate:
            instances.reduce((sum, i) => sum + i.healthStatus.errorRate, 0) /
              instances.length || 0,
          averageResponseTime:
            instances.reduce((sum, i) => sum + i.healthStatus.responseTime, 0) /
              instances.length || 0,
        };

        await this.evaluateRule('engine-unhealthy', context);
        await this.evaluateRule('circuit-breaker-open', context);
        await this.evaluateRule('high-error-rate', context);
        await this.evaluateRule('slow-response-time', context);
        await this.evaluateRule('no-healthy-instances', context);
        await this.evaluateRule('instance-count-low', context);
      }
    } catch (error) {
      this.logger.error(`Error evaluating alert rules: ${error.message}`);
    }
  }

  /**
   * Evaluate a specific alert rule
   */
  private async evaluateRule(ruleId: string, context: any): Promise<void> {
    const rule = this.alertRules.get(ruleId);
    if (!rule || !rule.enabled) return;

    // Check cooldown
    if (rule.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < rule.cooldownMs) {
        return;
      }
    }

    // Evaluate condition
    try {
      if (rule.condition(context)) {
        const message = rule.message(context);

        this.createAlert({
          severity: rule.severity,
          type: ruleId,
          message,
          details: context,
          engineId: context.engineId,
        });

        rule.lastTriggered = new Date();
      }
    } catch (error) {
      this.logger.error(`Error evaluating rule ${ruleId}: ${error.message}`);
    }
  }

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
    const newAlert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      ...alert,
    };

    this.alerts.unshift(newAlert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.length = this.maxAlerts;
    }

    this.logger.log(
      `[${newAlert.severity.toUpperCase()}] ${newAlert.message}`,
    );

    // Trigger callbacks
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(newAlert);
      } catch (error) {
        this.logger.error(`Error in alert callback: ${error.message}`);
      }
    });

    return newAlert;
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.logger.log(`Removed alert rule: ${ruleId}`);
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.alertRules.set(ruleId, rule);
      this.logger.log(`Updated alert rule: ${ruleId}`);
    }
  }

  /**
   * Get all alert rules
   */
  getAllAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get alert rule by ID
   */
  getAlertRule(ruleId: string): AlertRule | undefined {
    return this.alertRules.get(ruleId);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(filters?: {
    severity?: AlertSeverity;
    acknowledged?: boolean;
    engineId?: string;
    limit?: number;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (filters?.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }

    if (filters?.acknowledged !== undefined) {
      filtered = filtered.filter((a) => a.acknowledged === filters.acknowledged);
    }

    if (filters?.engineId) {
      filtered = filtered.filter((a) => a.engineId === filters.engineId);
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.find((a) => a.id === alertId);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.getAlert(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.logger.log(`Alert ${alertId} acknowledged by ${acknowledgedBy || 'system'}`);
    return true;
  }

  /**
   * Acknowledge multiple alerts
   */
  acknowledgeMultipleAlerts(
    alertIds: string[],
    acknowledgedBy?: string,
  ): number {
    let count = 0;
    alertIds.forEach((id) => {
      if (this.acknowledgeAlert(id, acknowledgedBy)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanMs: number = 86400000): number {
    const cutoffTime = Date.now() - olderThanMs;
    const initialLength = this.alerts.length;

    this.alerts.splice(
      0,
      this.alerts.length,
      ...this.alerts.filter((a) => a.timestamp.getTime() > cutoffTime),
    );

    const removed = initialLength - this.alerts.length;
    if (removed > 0) {
      this.logger.log(`Cleared ${removed} old alerts`);
    }

    return removed;
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: Alert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<string, number>;
    acknowledged: number;
    unacknowledged: number;
    last24Hours: number;
  } {
    const bySeverity: Record<AlertSeverity, number> = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.ERROR]: 0,
      [AlertSeverity.CRITICAL]: 0,
    };

    const byType: Record<string, number> = {};
    let acknowledged = 0;
    let last24Hours = 0;

    const cutoff24h = Date.now() - 86400000;

    this.alerts.forEach((alert) => {
      bySeverity[alert.severity]++;

      byType[alert.type] = (byType[alert.type] || 0) + 1;

      if (alert.acknowledged) {
        acknowledged++;
      }

      if (alert.timestamp.getTime() > cutoff24h) {
        last24Hours++;
      }
    });

    return {
      total: this.alerts.length,
      bySeverity,
      byType,
      acknowledged,
      unacknowledged: this.alerts.length - acknowledged,
      last24Hours,
    };
  }
}
