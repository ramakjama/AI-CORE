/**
 * Health Monitor Service
 * Monitors engine health, performance, and availability
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EngineOrchestratorService } from './engine-orchestrator.service';
import {
  HealthStatus,
  EngineStatus,
  EngineEventType,
  EngineInstance,
} from '../types/engine.types';

@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);
  private readonly healthCheckHistory: Map<string, HealthStatus[]> = new Map();
  private readonly maxHistorySize = 100;

  constructor(private readonly orchestrator: EngineOrchestratorService) {
    // Subscribe to engine events
    this.orchestrator.onEvent(EngineEventType.ENGINE_STARTED, this.handleEngineStarted.bind(this));
    this.orchestrator.onEvent(EngineEventType.ENGINE_STOPPED, this.handleEngineStopped.bind(this));
  }

  /**
   * Periodic health check (every 30 seconds)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async performHealthChecks() {
    const engines = this.orchestrator.getAllEngines();

    for (const engine of engines) {
      if (!engine.enabled) continue;

      const instances = this.orchestrator.getEngineInstances(engine.id);

      for (const instance of instances) {
        await this.checkInstanceHealth(instance);
      }
    }
  }

  /**
   * Check health of a specific engine instance
   */
  async checkInstanceHealth(instance: EngineInstance): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const client = this.orchestrator.getHttpClient(instance.engineId);
      if (!client) {
        throw new Error('HTTP client not found');
      }

      // Perform health check request
      const response = await client.get('/health', { timeout: 5000 });

      const responseTime = Date.now() - startTime;
      const uptime = Date.now() - instance.startedAt.getTime();

      const healthStatus: HealthStatus = {
        healthy: response.status === 200,
        status: EngineStatus.RUNNING,
        uptime,
        lastCheck: new Date(),
        responseTime,
        errorRate: this.calculateErrorRate(instance),
        cpuUsage: response.data?.cpu_usage,
        memoryUsage: response.data?.memory_usage,
        details: response.data || {},
      };

      instance.healthStatus = healthStatus;
      instance.lastHealthCheck = new Date();

      // Store in history
      this.addToHistory(instance.id, healthStatus);

      // Check if engine became healthy
      if (healthStatus.healthy && instance.status === EngineStatus.UNHEALTHY) {
        instance.status = EngineStatus.RUNNING;
        this.orchestrator.onEvent(
          EngineEventType.ENGINE_RECOVERED,
          () => {}
        );
        this.logger.log(`Engine instance ${instance.id} recovered`);
      }

      return healthStatus;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const healthStatus: HealthStatus = {
        healthy: false,
        status: EngineStatus.UNHEALTHY,
        uptime: Date.now() - instance.startedAt.getTime(),
        lastCheck: new Date(),
        responseTime,
        errorRate: 1.0,
        details: {
          error: error.message,
        },
      };

      instance.healthStatus = healthStatus;
      instance.lastHealthCheck = new Date();
      instance.status = EngineStatus.UNHEALTHY;

      this.addToHistory(instance.id, healthStatus);

      this.logger.warn(
        `Health check failed for engine instance ${instance.id}: ${error.message}`
      );

      return healthStatus;
    }
  }

  /**
   * Get health status for an engine
   */
  async getEngineHealth(engineId: string): Promise<{
    engineId: string;
    overallHealth: boolean;
    instances: Array<{
      instanceId: string;
      health: HealthStatus;
    }>;
  }> {
    const instances = this.orchestrator.getEngineInstances(engineId);

    const instancesHealth = instances.map(instance => ({
      instanceId: instance.id,
      health: instance.healthStatus,
    }));

    const overallHealth = instances.some(
      instance => instance.healthStatus.healthy
    );

    return {
      engineId,
      overallHealth,
      instances: instancesHealth,
    };
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{
    healthy: boolean;
    totalEngines: number;
    healthyEngines: number;
    unhealthyEngines: number;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    engines: Array<{
      engineId: string;
      healthy: boolean;
      instanceCount: number;
    }>;
  }> {
    const engines = this.orchestrator.getAllEngines();

    let totalInstances = 0;
    let healthyInstances = 0;
    let unhealthyInstances = 0;

    const engineHealth = engines.map(engine => {
      const instances = this.orchestrator.getEngineInstances(engine.id);
      const healthy = instances.some(instance => instance.healthStatus.healthy);

      totalInstances += instances.length;
      healthyInstances += instances.filter(i => i.healthStatus.healthy).length;
      unhealthyInstances += instances.filter(i => !i.healthStatus.healthy).length;

      return {
        engineId: engine.id,
        healthy,
        instanceCount: instances.length,
      };
    });

    const healthyEngines = engineHealth.filter(e => e.healthy).length;
    const unhealthyEngines = engineHealth.filter(e => !e.healthy).length;

    return {
      healthy: healthyEngines > 0,
      totalEngines: engines.length,
      healthyEngines,
      unhealthyEngines,
      totalInstances,
      healthyInstances,
      unhealthyInstances,
      engines: engineHealth,
    };
  }

  /**
   * Get health history for an instance
   */
  getHealthHistory(instanceId: string): HealthStatus[] {
    return this.healthCheckHistory.get(instanceId) || [];
  }

  /**
   * Calculate error rate for an instance
   */
  private calculateErrorRate(instance: EngineInstance): number {
    if (instance.totalRequests === 0) return 0;
    return instance.failedRequests / instance.totalRequests;
  }

  /**
   * Add health status to history
   */
  private addToHistory(instanceId: string, health: HealthStatus): void {
    if (!this.healthCheckHistory.has(instanceId)) {
      this.healthCheckHistory.set(instanceId, []);
    }

    const history = this.healthCheckHistory.get(instanceId)!;
    history.push(health);

    // Keep only recent history
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Handle engine started event
   */
  private handleEngineStarted(event: any): void {
    this.logger.log(`Engine started: ${event.engineId}, instance: ${event.data.instanceId}`);
  }

  /**
   * Handle engine stopped event
   */
  private handleEngineStopped(event: any): void {
    this.logger.log(`Engine stopped: ${event.engineId}, instance: ${event.data.instanceId}`);

    // Clean up health history for stopped instance
    if (event.data.instanceId) {
      this.healthCheckHistory.delete(event.data.instanceId);
    }
  }

  /**
   * Get health metrics summary
   */
  getHealthMetrics(): {
    averageResponseTime: number;
    averageErrorRate: number;
    averageUptime: number;
    instancesByStatus: Record<EngineStatus, number>;
  } {
    const engines = this.orchestrator.getAllEngines();
    let totalResponseTime = 0;
    let totalErrorRate = 0;
    let totalUptime = 0;
    let totalInstances = 0;

    const instancesByStatus: Record<EngineStatus, number> = {
      [EngineStatus.STARTING]: 0,
      [EngineStatus.RUNNING]: 0,
      [EngineStatus.STOPPING]: 0,
      [EngineStatus.STOPPED]: 0,
      [EngineStatus.ERROR]: 0,
      [EngineStatus.UNHEALTHY]: 0,
      [EngineStatus.MAINTENANCE]: 0,
    };

    for (const engine of engines) {
      const instances = this.orchestrator.getEngineInstances(engine.id);

      for (const instance of instances) {
        totalInstances++;
        totalResponseTime += instance.healthStatus.responseTime;
        totalErrorRate += instance.healthStatus.errorRate;
        totalUptime += instance.healthStatus.uptime;
        instancesByStatus[instance.status]++;
      }
    }

    return {
      averageResponseTime: totalInstances > 0 ? totalResponseTime / totalInstances : 0,
      averageErrorRate: totalInstances > 0 ? totalErrorRate / totalInstances : 0,
      averageUptime: totalInstances > 0 ? totalUptime / totalInstances : 0,
      instancesByStatus,
    };
  }
}
