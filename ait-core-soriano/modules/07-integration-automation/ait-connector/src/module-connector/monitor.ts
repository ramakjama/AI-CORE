/**
 * AIT-CONNECTOR - Module Monitor
 * Monitors module health, performance, and issues
 */

import { Module, ModuleHealthStatus, ModuleStatus, HealthMetrics, HealthIssue, Logger } from '../types';
import { ModuleRegistry } from './registry';
import { EventEmitter } from 'events';

export interface MonitorConfig {
  checkIntervalMs?: number;
  metricsRetentionMs?: number;
  alertThresholds?: AlertThresholds;
  enableDetailedMetrics?: boolean;
}

export interface AlertThresholds {
  memoryUsageMB?: number;
  cpuUsagePercent?: number;
  errorRate?: number;
  responseTimeMs?: number;
}

interface ModuleMetrics {
  startTime: Date;
  requestCount: number;
  errorCount: number;
  responseTimes: number[];
  lastError?: Error;
  lastErrorTime?: Date;
}

export class ModuleMonitor extends EventEmitter {
  private registry: ModuleRegistry;
  private logger: Logger;
  private config: MonitorConfig;
  private checkInterval?: NodeJS.Timeout;
  private metricsData: Map<string, ModuleMetrics> = new Map();
  private isMonitoring: boolean = false;

  constructor(registry: ModuleRegistry, config: MonitorConfig, logger?: Logger) {
    super();
    this.registry = registry;
    this.config = {
      checkIntervalMs: 30000, // 30 seconds
      metricsRetentionMs: 3600000, // 1 hour
      enableDetailedMetrics: true,
      alertThresholds: {
        memoryUsageMB: 500,
        cpuUsagePercent: 80,
        errorRate: 0.1, // 10%
        responseTimeMs: 5000
      },
      ...config
    };
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      this.logger.warn('Monitor is already running');
      return;
    }

    this.isMonitoring = true;
    this.logger.info('Starting module monitor...');

    // Initialize metrics for all registered modules
    this.initializeMetrics();

    // Start periodic health checks
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.checkIntervalMs);

    this.logger.info(`Monitor started with ${this.config.checkIntervalMs}ms interval`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.logger.info('Monitor stopped');
  }

  /**
   * Get health status for a module
   */
  async getHealthStatus(moduleId: string): Promise<ModuleHealthStatus> {
    const module = this.registry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    const metrics = this.metricsData.get(moduleId);
    const issues: HealthIssue[] = [];

    // Check module status
    const isHealthy = this.checkModuleHealth(module, metrics, issues);

    // Calculate metrics
    const healthMetrics = metrics ? this.calculateHealthMetrics(moduleId, metrics) : undefined;

    // Check against thresholds
    if (healthMetrics) {
      this.checkThresholds(moduleId, healthMetrics, issues);
    }

    const uptime = metrics ? Date.now() - metrics.startTime.getTime() : 0;

    const healthStatus: ModuleHealthStatus = {
      moduleId,
      healthy: isHealthy,
      status: module.status,
      uptime,
      lastCheck: new Date(),
      metrics: healthMetrics,
      issues: issues.length > 0 ? issues : undefined
    };

    // Update module's last health check time
    module.lastHealthCheck = new Date();

    return healthStatus;
  }

  /**
   * Get health status for all modules
   */
  async getAllHealthStatuses(): Promise<ModuleHealthStatus[]> {
    const modules = this.registry.getAll();
    const statuses: ModuleHealthStatus[] = [];

    for (const module of modules) {
      const status = await this.getHealthStatus(module.id);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Record a request for a module
   */
  recordRequest(moduleId: string, responseTimeMs: number, error?: Error): void {
    let metrics = this.metricsData.get(moduleId);

    if (!metrics) {
      metrics = this.initializeModuleMetrics(moduleId);
    }

    metrics.requestCount++;

    if (error) {
      metrics.errorCount++;
      metrics.lastError = error;
      metrics.lastErrorTime = new Date();
    }

    if (this.config.enableDetailedMetrics) {
      metrics.responseTimes.push(responseTimeMs);

      // Limit response times array size
      if (metrics.responseTimes.length > 1000) {
        metrics.responseTimes.shift();
      }
    }
  }

  /**
   * Get metrics for a module
   */
  getMetrics(moduleId: string): ModuleMetrics | undefined {
    return this.metricsData.get(moduleId);
  }

  /**
   * Reset metrics for a module
   */
  resetMetrics(moduleId: string): void {
    this.metricsData.delete(moduleId);
    this.initializeModuleMetrics(moduleId);
    this.logger.info(`Metrics reset for module: ${moduleId}`);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const modules = Array.from(this.metricsData.keys());
    const totalRequests = Array.from(this.metricsData.values()).reduce(
      (sum, m) => sum + m.requestCount,
      0
    );
    const totalErrors = Array.from(this.metricsData.values()).reduce(
      (sum, m) => sum + m.errorCount,
      0
    );

    return {
      isMonitoring: this.isMonitoring,
      monitoredModules: modules.length,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0
    };
  }

  /**
   * Initialize metrics for all modules
   */
  private initializeMetrics(): void {
    const modules = this.registry.getAll();

    for (const module of modules) {
      if (!this.metricsData.has(module.id)) {
        this.initializeModuleMetrics(module.id);
      }
    }
  }

  /**
   * Initialize metrics for a single module
   */
  private initializeModuleMetrics(moduleId: string): ModuleMetrics {
    const metrics: ModuleMetrics = {
      startTime: new Date(),
      requestCount: 0,
      errorCount: 0,
      responseTimes: []
    };

    this.metricsData.set(moduleId, metrics);
    return metrics;
  }

  /**
   * Perform health checks on all modules
   */
  private async performHealthChecks(): Promise<void> {
    const modules = this.registry.getAll();

    for (const module of modules) {
      try {
        const status = await this.getHealthStatus(module.id);

        // Emit health check event
        this.emit('health-check', status);

        // Emit alerts for unhealthy modules
        if (!status.healthy) {
          this.emit('health-alert', {
            moduleId: module.id,
            status,
            timestamp: new Date()
          });

          this.logger.warn(`Health check failed for module: ${module.name}`, {
            issues: status.issues
          });
        }
      } catch (error) {
        this.logger.error(`Health check error for module ${module.id}:`, error);
      }
    }
  }

  /**
   * Check module health
   */
  private checkModuleHealth(
    module: Module,
    metrics: ModuleMetrics | undefined,
    issues: HealthIssue[]
  ): boolean {
    let healthy = true;

    // Check module status
    if (module.status === ModuleStatus.ERROR) {
      healthy = false;
      issues.push({
        severity: 'critical',
        message: 'Module is in error state',
        timestamp: new Date(),
        code: 'MODULE_ERROR'
      });
    }

    if (module.status === ModuleStatus.UNLOADED) {
      healthy = false;
      issues.push({
        severity: 'high',
        message: 'Module is unloaded',
        timestamp: new Date(),
        code: 'MODULE_UNLOADED'
      });
    }

    // Check for recent errors
    if (metrics?.lastError && metrics.lastErrorTime) {
      const timeSinceError = Date.now() - metrics.lastErrorTime.getTime();
      if (timeSinceError < 60000) {
        // Error in last minute
        issues.push({
          severity: 'medium',
          message: `Recent error: ${metrics.lastError.message}`,
          timestamp: metrics.lastErrorTime,
          code: 'RECENT_ERROR'
        });
      }
    }

    return healthy;
  }

  /**
   * Calculate health metrics
   */
  private calculateHealthMetrics(moduleId: string, metrics: ModuleMetrics): HealthMetrics {
    const avgResponseTime =
      metrics.responseTimes.length > 0
        ? metrics.responseTimes.reduce((sum, t) => sum + t, 0) / metrics.responseTimes.length
        : 0;

    // Get process memory usage (simplified)
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    return {
      memoryUsage,
      cpuUsage: 0, // Would require additional libraries for accurate CPU measurement
      requestCount: metrics.requestCount,
      errorCount: metrics.errorCount,
      averageResponseTime: avgResponseTime
    };
  }

  /**
   * Check metrics against thresholds
   */
  private checkThresholds(
    moduleId: string,
    metrics: HealthMetrics,
    issues: HealthIssue[]
  ): void {
    const thresholds = this.config.alertThresholds!;

    // Memory threshold
    if (thresholds.memoryUsageMB && metrics.memoryUsage > thresholds.memoryUsageMB) {
      issues.push({
        severity: 'high',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(2)}MB (threshold: ${thresholds.memoryUsageMB}MB)`,
        timestamp: new Date(),
        code: 'HIGH_MEMORY'
      });
    }

    // CPU threshold
    if (thresholds.cpuUsagePercent && metrics.cpuUsage > thresholds.cpuUsagePercent) {
      issues.push({
        severity: 'high',
        message: `High CPU usage: ${metrics.cpuUsage.toFixed(2)}% (threshold: ${thresholds.cpuUsagePercent}%)`,
        timestamp: new Date(),
        code: 'HIGH_CPU'
      });
    }

    // Error rate threshold
    if (thresholds.errorRate && metrics.requestCount > 0) {
      const errorRate = metrics.errorCount / metrics.requestCount;
      if (errorRate > thresholds.errorRate) {
        issues.push({
          severity: 'high',
          message: `High error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ${thresholds.errorRate * 100}%)`,
          timestamp: new Date(),
          code: 'HIGH_ERROR_RATE'
        });
      }
    }

    // Response time threshold
    if (
      thresholds.responseTimeMs &&
      metrics.averageResponseTime > thresholds.responseTimeMs
    ) {
      issues.push({
        severity: 'medium',
        message: `Slow response time: ${metrics.averageResponseTime.toFixed(2)}ms (threshold: ${thresholds.responseTimeMs}ms)`,
        timestamp: new Date(),
        code: 'SLOW_RESPONSE'
      });
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, ...meta: any[]) => console.debug(message, ...meta),
      info: (message: string, ...meta: any[]) => console.info(message, ...meta),
      warn: (message: string, ...meta: any[]) => console.warn(message, ...meta),
      error: (message: string, ...meta: any[]) => console.error(message, ...meta)
    };
  }
}

export default ModuleMonitor;
