/**
 * Performance Metrics Service
 * Collects and exposes performance metrics for monitoring
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EngineOrchestratorService } from './engine-orchestrator.service';
import { HealthMonitorService } from './health-monitor.service';
import { RequestRouterService } from './request-router.service';
import { FailoverManagerService } from './failover-manager.service';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PerformanceMetricsService {
  private readonly logger = new Logger(PerformanceMetricsService.name);
  private readonly registry: Registry;

  // Prometheus metrics
  private readonly requestsTotal: Counter;
  private readonly requestDuration: Histogram;
  private readonly engineHealth: Gauge;
  private readonly engineErrorRate: Gauge;
  private readonly engineQueueSize: Gauge;
  private readonly circuitBreakerState: Gauge;

  // Internal metrics storage
  private readonly metricsHistory: Array<{
    timestamp: Date;
    metrics: any;
  }> = [];
  private readonly maxHistorySize = 1000;

  constructor(
    private readonly orchestrator: EngineOrchestratorService,
    private readonly healthMonitor: HealthMonitorService,
    private readonly router: RequestRouterService,
    private readonly failover: FailoverManagerService
  ) {
    // Initialize Prometheus registry
    this.registry = new Registry();

    // Define metrics
    this.requestsTotal = new Counter({
      name: 'nerve_engine_requests_total',
      help: 'Total number of requests per engine',
      labelNames: ['engine_id', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'nerve_engine_request_duration_seconds',
      help: 'Request duration in seconds',
      labelNames: ['engine_id'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
      registers: [this.registry],
    });

    this.engineHealth = new Gauge({
      name: 'nerve_engine_health_status',
      help: 'Engine health status (1 = healthy, 0 = unhealthy)',
      labelNames: ['engine_id', 'instance_id'],
      registers: [this.registry],
    });

    this.engineErrorRate = new Gauge({
      name: 'nerve_engine_error_rate',
      help: 'Engine error rate',
      labelNames: ['engine_id'],
      registers: [this.registry],
    });

    this.engineQueueSize = new Gauge({
      name: 'nerve_engine_queue_size',
      help: 'Number of requests in queue',
      labelNames: ['engine_id'],
      registers: [this.registry],
    });

    this.circuitBreakerState = new Gauge({
      name: 'nerve_circuit_breaker_state',
      help: 'Circuit breaker state (0 = closed, 1 = half-open, 2 = open)',
      labelNames: ['engine_id'],
      registers: [this.registry],
    });
  }

  /**
   * Collect metrics periodically (every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics() {
    try {
      const metrics = await this.gatherMetrics();
      this.updatePrometheusMetrics(metrics);
      this.storeMetricsHistory(metrics);
    } catch (error) {
      this.logger.error(`Error collecting metrics: ${error.message}`);
    }
  }

  /**
   * Gather all metrics
   */
  private async gatherMetrics(): Promise<any> {
    const engines = this.orchestrator.getAllEngines();
    const systemHealth = await this.healthMonitor.getSystemHealth();
    const routingStats = this.router.getRoutingStats();
    const failoverStats = this.failover.getFailoverStats();
    const healthMetrics = this.healthMonitor.getHealthMetrics();

    const engineMetrics = engines.map(engine => {
      const instances = this.orchestrator.getEngineInstances(engine.id);
      const healthyInstances = instances.filter(i => i.healthStatus.healthy);

      return {
        engineId: engine.id,
        engineName: engine.name,
        engineType: engine.type,
        enabled: engine.enabled,
        totalInstances: instances.length,
        healthyInstances: healthyInstances.length,
        unhealthyInstances: instances.length - healthyInstances.length,
        instances: instances.map(instance => ({
          instanceId: instance.id,
          status: instance.status,
          healthy: instance.healthStatus.healthy,
          uptime: instance.healthStatus.uptime,
          responseTime: instance.healthStatus.responseTime,
          errorRate: instance.healthStatus.errorRate,
          totalRequests: instance.metrics.requestsTotal,
          successfulRequests: instance.metrics.requestsSuccess,
          failedRequests: instance.metrics.requestsFailed,
          averageResponseTime: instance.metrics.averageResponseTime,
          p95ResponseTime: instance.metrics.p95ResponseTime,
          p99ResponseTime: instance.metrics.p99ResponseTime,
          activeConnections: instance.activeConnections,
        })),
      };
    });

    const circuitBreakers = this.failover.getAllCircuitBreakerStates().map(cb => ({
      engineId: cb.engineId,
      state: cb.state,
      failureCount: cb.failureCount,
      successCount: cb.successCount,
      lastFailure: cb.lastFailure,
    }));

    return {
      timestamp: new Date(),
      system: {
        healthy: systemHealth.healthy,
        totalEngines: systemHealth.totalEngines,
        healthyEngines: systemHealth.healthyEngines,
        unhealthyEngines: systemHealth.unhealthyEngines,
        totalInstances: systemHealth.totalInstances,
        healthyInstances: systemHealth.healthyInstances,
        unhealthyInstances: systemHealth.unhealthyInstances,
      },
      routing: {
        totalRequests: routingStats.totalRequests,
        successfulRequests: routingStats.successfulRequests,
        failedRequests: routingStats.failedRequests,
        averageResponseTime: routingStats.averageResponseTime,
        requestsByEngine: routingStats.requestsByEngine,
      },
      failover: {
        totalFailovers: failoverStats.totalFailovers,
        circuitBreakersOpen: failoverStats.circuitBreakersOpen,
        circuitBreakersClosed: failoverStats.circuitBreakersClosed,
        circuitBreakersHalfOpen: failoverStats.circuitBreakersHalfOpen,
        engineFailures: failoverStats.engineFailures,
      },
      health: {
        averageResponseTime: healthMetrics.averageResponseTime,
        averageErrorRate: healthMetrics.averageErrorRate,
        averageUptime: healthMetrics.averageUptime,
        instancesByStatus: healthMetrics.instancesByStatus,
      },
      engines: engineMetrics,
      circuitBreakers,
    };
  }

  /**
   * Update Prometheus metrics
   */
  private updatePrometheusMetrics(metrics: any): void {
    // Update engine health metrics
    for (const engine of metrics.engines) {
      for (const instance of engine.instances) {
        this.engineHealth.set(
          { engine_id: engine.engineId, instance_id: instance.instanceId },
          instance.healthy ? 1 : 0
        );

        this.requestsTotal.inc(
          { engine_id: engine.engineId, status: 'success' },
          instance.successfulRequests
        );

        this.requestsTotal.inc(
          { engine_id: engine.engineId, status: 'error' },
          instance.failedRequests
        );

        if (instance.averageResponseTime > 0) {
          this.requestDuration.observe(
            { engine_id: engine.engineId },
            instance.averageResponseTime / 1000
          );
        }
      }

      this.engineErrorRate.set(
        { engine_id: engine.engineId },
        engine.instances.reduce((sum: number, i: any) => sum + i.errorRate, 0) / engine.instances.length || 0
      );

      this.engineQueueSize.set(
        { engine_id: engine.engineId },
        engine.instances.reduce((sum: number, i: any) => sum + i.activeConnections, 0)
      );
    }

    // Update circuit breaker metrics
    for (const cb of metrics.circuitBreakers) {
      const stateValue = cb.state === 'closed' ? 0 : cb.state === 'half-open' ? 1 : 2;
      this.circuitBreakerState.set({ engine_id: cb.engineId }, stateValue);
    }
  }

  /**
   * Store metrics in history
   */
  private storeMetricsHistory(metrics: any): void {
    this.metricsHistory.push({
      timestamp: new Date(),
      metrics,
    });

    // Keep only recent history
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get current metrics
   */
  async getCurrentMetrics(): Promise<any> {
    return this.gatherMetrics();
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): Array<{ timestamp: Date; metrics: any }> {
    const history = [...this.metricsHistory];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * Get metrics for specific engine
   */
  async getEngineMetrics(engineId: string): Promise<any> {
    const metrics = await this.gatherMetrics();
    const engineMetrics = metrics.engines.find((e: any) => e.engineId === engineId);

    if (!engineMetrics) {
      throw new Error(`Engine ${engineId} not found`);
    }

    return engineMetrics;
  }

  /**
   * Get Prometheus metrics
   */
  async getPrometheusMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(): Promise<{
    uptime: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    healthyEngines: number;
    totalEngines: number;
    activeInstances: number;
    circuitBreakersOpen: number;
  }> {
    const metrics = await this.gatherMetrics();

    const successRate =
      metrics.routing.totalRequests > 0
        ? (metrics.routing.successfulRequests / metrics.routing.totalRequests) * 100
        : 0;

    return {
      uptime: metrics.health.averageUptime,
      totalRequests: metrics.routing.totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(metrics.routing.averageResponseTime),
      healthyEngines: metrics.system.healthyEngines,
      totalEngines: metrics.system.totalEngines,
      activeInstances: metrics.system.healthyInstances,
      circuitBreakersOpen: metrics.failover.circuitBreakersOpen,
    };
  }

  /**
   * Record custom metric
   */
  recordMetric(engineId: string, metricName: string, value: number): void {
    this.logger.debug(`Recording metric ${metricName} for engine ${engineId}: ${value}`);
    // Custom metrics can be recorded here
  }
}
