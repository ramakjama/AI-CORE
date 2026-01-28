/**
 * Request Router Service
 * Routes requests to appropriate engines based on load, health, and strategy
 */

import { Injectable, Logger } from '@nestjs/common';
import { EngineOrchestratorService } from './engine-orchestrator.service';
import {
  ExecutionRequest,
  ExecutionResponse,
  EngineInstance,
  LoadBalancingStrategy,
  EngineType,
} from '../types/engine.types';
import { DEFAULT_LOAD_BALANCING_CONFIG } from '../config/engines.config';

@Injectable()
export class RequestRouterService {
  private readonly logger = new Logger(RequestRouterService.name);
  private readonly roundRobinCounters: Map<string, number> = new Map();
  private readonly responseTimes: Map<string, number[]> = new Map();

  constructor(private readonly orchestrator: EngineOrchestratorService) {}

  /**
   * Route request to appropriate engine
   */
  async routeRequest(request: ExecutionRequest): Promise<ExecutionResponse> {
    const startTime = Date.now();

    try {
      // Determine target engine
      const engineId = request.engineId || this.findEngineByType(request.engineType!);
      if (!engineId) {
        throw new Error('No suitable engine found for request');
      }

      // Select instance based on load balancing strategy
      const instance = await this.selectInstance(engineId);
      if (!instance) {
        throw new Error(`No healthy instances available for engine ${engineId}`);
      }

      // Execute request
      const result = await this.executeOnInstance(instance, request);

      const executionTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(instance, executionTime, true);

      return {
        requestId: this.generateRequestId(),
        engineId,
        engineInstance: instance.id,
        status: 'success',
        result,
        executionTime,
        timestamp: new Date(),
        metadata: request.metadata,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Request routing failed: ${error.message}`);

      return {
        requestId: this.generateRequestId(),
        engineId: request.engineId || 'unknown',
        engineInstance: 'unknown',
        status: 'error',
        error: error.message,
        executionTime,
        timestamp: new Date(),
        metadata: request.metadata,
      };
    }
  }

  /**
   * Select instance based on load balancing strategy
   */
  private async selectInstance(engineId: string): Promise<EngineInstance | undefined> {
    const instances = this.orchestrator.getAllHealthyInstances(engineId);

    if (instances.length === 0) {
      return undefined;
    }

    const strategy = DEFAULT_LOAD_BALANCING_CONFIG.strategy;

    switch (strategy) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin(engineId, instances);

      case LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(engineId, instances);

      case LoadBalancingStrategy.LEAST_CONNECTIONS:
        return this.selectLeastConnections(instances);

      case LoadBalancingStrategy.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(instances);

      case LoadBalancingStrategy.RANDOM:
        return this.selectRandom(instances);

      default:
        return instances[0];
    }
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(engineId: string, instances: EngineInstance[]): EngineInstance {
    const counter = this.roundRobinCounters.get(engineId) || 0;
    const selected = instances[counter % instances.length];
    this.roundRobinCounters.set(engineId, counter + 1);
    return selected;
  }

  /**
   * Weighted round robin selection
   */
  private selectWeightedRoundRobin(
    engineId: string,
    instances: EngineInstance[]
  ): EngineInstance {
    const engine = this.orchestrator.getEngine(engineId);
    if (!engine) return instances[0];

    const weight = engine.weight || 1.0;
    const weightedInstances = instances.flatMap(instance =>
      Array(Math.ceil(weight)).fill(instance)
    );

    return this.selectRoundRobin(engineId, weightedInstances);
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(instances: EngineInstance[]): EngineInstance {
    return instances.reduce((min, instance) =>
      instance.activeConnections < min.activeConnections ? instance : min
    );
  }

  /**
   * Least response time selection
   */
  private selectLeastResponseTime(instances: EngineInstance[]): EngineInstance {
    return instances.reduce((min, instance) =>
      instance.healthStatus.responseTime < min.healthStatus.responseTime ? instance : min
    );
  }

  /**
   * Random selection
   */
  private selectRandom(instances: EngineInstance[]): EngineInstance {
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  /**
   * Find engine by type
   */
  private findEngineByType(type: EngineType): string | undefined {
    const engines = this.orchestrator.getAllEngines();
    const engine = engines.find(e => e.type === type && e.enabled);
    return engine?.id;
  }

  /**
   * Execute request on instance
   */
  private async executeOnInstance(
    instance: EngineInstance,
    request: ExecutionRequest
  ): Promise<any> {
    const client = this.orchestrator.getHttpClient(instance.engineId);
    if (!client) {
      throw new Error('HTTP client not found');
    }

    instance.activeConnections++;
    instance.totalRequests++;

    try {
      const response = await client.post('/execute', {
        operation: request.operation,
        parameters: request.parameters,
      }, {
        timeout: request.timeout,
      });

      instance.activeConnections--;
      return response.data;
    } catch (error) {
      instance.activeConnections--;
      instance.failedRequests++;
      throw error;
    }
  }

  /**
   * Update instance metrics
   */
  private updateMetrics(instance: EngineInstance, executionTime: number, success: boolean): void {
    // Update response times
    if (!this.responseTimes.has(instance.id)) {
      this.responseTimes.set(instance.id, []);
    }

    const times = this.responseTimes.get(instance.id)!;
    times.push(executionTime);

    // Keep only recent times (last 100)
    if (times.length > 100) {
      times.shift();
    }

    // Update metrics
    instance.metrics.requestsTotal++;
    if (success) {
      instance.metrics.requestsSuccess++;
    } else {
      instance.metrics.requestsFailed++;
    }

    instance.metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    instance.metrics.errorRate = instance.metrics.requestsFailed / instance.metrics.requestsTotal;
    instance.metrics.lastUpdated = new Date();

    // Calculate percentiles
    const sortedTimes = [...times].sort((a, b) => a - b);
    instance.metrics.p50ResponseTime = this.percentile(sortedTimes, 50);
    instance.metrics.p95ResponseTime = this.percentile(sortedTimes, 95);
    instance.metrics.p99ResponseTime = this.percentile(sortedTimes, 99);
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByEngine: Record<string, number>;
  } {
    const engines = this.orchestrator.getAllEngines();
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalResponseTime = 0;
    const requestsByEngine: Record<string, number> = {};

    for (const engine of engines) {
      const instances = this.orchestrator.getEngineInstances(engine.id);
      let engineRequests = 0;

      for (const instance of instances) {
        totalRequests += instance.metrics.requestsTotal;
        successfulRequests += instance.metrics.requestsSuccess;
        failedRequests += instance.metrics.requestsFailed;
        totalResponseTime += instance.metrics.averageResponseTime * instance.metrics.requestsTotal;
        engineRequests += instance.metrics.requestsTotal;
      }

      requestsByEngine[engine.id] = engineRequests;
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      requestsByEngine,
    };
  }
}
