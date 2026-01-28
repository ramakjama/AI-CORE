/**
 * Engine Orchestrator Service
 * Manages engine lifecycle, coordination, and state management
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  EngineConfig,
  EngineInstance,
  EngineStatus,
  HealthStatus,
  ScalingRequest,
  ScalingResponse,
  EngineEvent,
  EngineEventType,
} from '../types/engine.types';
import { ENGINES_CONFIG } from '../config/engines.config';

@Injectable()
export class EngineOrchestratorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EngineOrchestratorService.name);
  private readonly engines: Map<string, EngineConfig> = new Map();
  private readonly instances: Map<string, EngineInstance[]> = new Map();
  private readonly httpClients: Map<string, AxiosInstance> = new Map();
  private readonly eventHandlers: Map<EngineEventType, Function[]> = new Map();

  async onModuleInit() {
    this.logger.log('Initializing Engine Orchestrator...');
    await this.initializeEngines();
    await this.startEnabledEngines();
    this.logger.log('Engine Orchestrator initialized successfully');
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Engine Orchestrator...');
    await this.stopAllEngines();
    this.logger.log('Engine Orchestrator shut down successfully');
  }

  /**
   * Initialize engine configurations
   */
  private async initializeEngines() {
    for (const config of ENGINES_CONFIG) {
      this.engines.set(config.id, config);
      this.instances.set(config.id, []);

      // Create HTTP client for each engine
      const client = axios.create({
        baseURL: config.url,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.httpClients.set(config.id, client);
    }
    this.logger.log(`Initialized ${this.engines.size} engine configurations`);
  }

  /**
   * Start all enabled engines
   */
  private async startEnabledEngines() {
    const enabledEngines = Array.from(this.engines.values()).filter(e => e.enabled);
    this.logger.log(`Starting ${enabledEngines.length} enabled engines...`);

    const startPromises = enabledEngines.map(engine =>
      this.startEngine(engine.id, engine.minInstances)
    );

    await Promise.allSettled(startPromises);
  }

  /**
   * Start an engine with specified number of instances
   */
  async startEngine(engineId: string, instances: number = 1): Promise<void> {
    const config = this.engines.get(engineId);
    if (!config) {
      throw new Error(`Engine ${engineId} not found`);
    }

    if (!config.enabled) {
      throw new Error(`Engine ${engineId} is disabled`);
    }

    this.logger.log(`Starting engine ${engineId} with ${instances} instances...`);

    const currentInstances = this.instances.get(engineId) || [];
    const instancesToStart = Math.min(instances, config.maxInstances - currentInstances.length);

    for (let i = 0; i < instancesToStart; i++) {
      const instance: EngineInstance = {
        id: `${engineId}-${Date.now()}-${i}`,
        engineId,
        url: `${config.url}`,
        status: EngineStatus.STARTING,
        startedAt: new Date(),
        lastHealthCheck: new Date(),
        healthStatus: {
          healthy: false,
          status: EngineStatus.STARTING,
          uptime: 0,
          lastCheck: new Date(),
          responseTime: 0,
          errorRate: 0,
          details: {},
        },
        metrics: {
          requestsTotal: 0,
          requestsSuccess: 0,
          requestsFailed: 0,
          requestsInProgress: 0,
          averageResponseTime: 0,
          p50ResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          errorRate: 0,
          throughput: 0,
          lastUpdated: new Date(),
        },
        activeConnections: 0,
        totalRequests: 0,
        failedRequests: 0,
      };

      currentInstances.push(instance);

      // Simulate engine startup (in real implementation, would call Python service)
      setTimeout(() => {
        instance.status = EngineStatus.RUNNING;
        instance.healthStatus.healthy = true;
        instance.healthStatus.status = EngineStatus.RUNNING;
        this.emitEvent(EngineEventType.ENGINE_STARTED, engineId, { instanceId: instance.id });
      }, 2000);
    }

    this.instances.set(engineId, currentInstances);
    config.currentInstances = currentInstances.length;
    this.logger.log(`Started ${instancesToStart} instances of ${engineId}`);
  }

  /**
   * Stop an engine
   */
  async stopEngine(engineId: string): Promise<void> {
    const config = this.engines.get(engineId);
    if (!config) {
      throw new Error(`Engine ${engineId} not found`);
    }

    this.logger.log(`Stopping engine ${engineId}...`);

    const instances = this.instances.get(engineId) || [];

    for (const instance of instances) {
      instance.status = EngineStatus.STOPPING;

      // Simulate engine shutdown
      setTimeout(() => {
        instance.status = EngineStatus.STOPPED;
        this.emitEvent(EngineEventType.ENGINE_STOPPED, engineId, { instanceId: instance.id });
      }, 1000);
    }

    // Clear instances after shutdown
    setTimeout(() => {
      this.instances.set(engineId, []);
      config.currentInstances = 0;
      this.logger.log(`Stopped all instances of ${engineId}`);
    }, 2000);
  }

  /**
   * Restart an engine
   */
  async restartEngine(engineId: string): Promise<void> {
    this.logger.log(`Restarting engine ${engineId}...`);

    const config = this.engines.get(engineId);
    if (!config) {
      throw new Error(`Engine ${engineId} not found`);
    }

    const currentInstanceCount = config.currentInstances;

    await this.stopEngine(engineId);

    // Wait for shutdown to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    await this.startEngine(engineId, Math.max(currentInstanceCount, config.minInstances));
  }

  /**
   * Scale an engine to target number of instances
   */
  async scaleEngine(request: ScalingRequest): Promise<ScalingResponse> {
    const { engineId, targetInstances, reason } = request;

    const config = this.engines.get(engineId);
    if (!config) {
      throw new Error(`Engine ${engineId} not found`);
    }

    if (targetInstances < config.minInstances || targetInstances > config.maxInstances) {
      throw new Error(
        `Target instances ${targetInstances} out of range [${config.minInstances}, ${config.maxInstances}]`
      );
    }

    const currentInstances = this.instances.get(engineId)?.length || 0;
    const previousInstances = currentInstances;

    this.logger.log(
      `Scaling engine ${engineId} from ${currentInstances} to ${targetInstances} instances. Reason: ${reason || 'manual'}`
    );

    if (targetInstances > currentInstances) {
      // Scale up
      const instancesToAdd = targetInstances - currentInstances;
      await this.startEngine(engineId, instancesToAdd);
    } else if (targetInstances < currentInstances) {
      // Scale down
      const instancesToRemove = currentInstances - targetInstances;
      const instances = this.instances.get(engineId) || [];

      // Remove excess instances
      for (let i = 0; i < instancesToRemove; i++) {
        const instance = instances.pop();
        if (instance) {
          instance.status = EngineStatus.STOPPING;
          setTimeout(() => {
            instance.status = EngineStatus.STOPPED;
          }, 1000);
        }
      }

      this.instances.set(engineId, instances);
      config.currentInstances = instances.length;
    }

    this.emitEvent(EngineEventType.SCALING_TRIGGERED, engineId, {
      previousInstances,
      targetInstances,
      reason,
    });

    return {
      engineId,
      previousInstances,
      currentInstances: this.instances.get(engineId)?.length || 0,
      targetInstances,
      status: 'success',
    };
  }

  /**
   * Get all engines
   */
  getAllEngines(): EngineConfig[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine by ID
   */
  getEngine(engineId: string): EngineConfig | undefined {
    return this.engines.get(engineId);
  }

  /**
   * Get all instances of an engine
   */
  getEngineInstances(engineId: string): EngineInstance[] {
    return this.instances.get(engineId) || [];
  }

  /**
   * Get a healthy instance of an engine
   */
  getHealthyInstance(engineId: string): EngineInstance | undefined {
    const instances = this.instances.get(engineId) || [];
    return instances.find(
      instance => instance.status === EngineStatus.RUNNING && instance.healthStatus.healthy
    );
  }

  /**
   * Get all healthy instances of an engine
   */
  getAllHealthyInstances(engineId: string): EngineInstance[] {
    const instances = this.instances.get(engineId) || [];
    return instances.filter(
      instance => instance.status === EngineStatus.RUNNING && instance.healthStatus.healthy
    );
  }

  /**
   * Update engine configuration
   */
  updateEngineConfig(engineId: string, updates: Partial<EngineConfig>): void {
    const config = this.engines.get(engineId);
    if (!config) {
      throw new Error(`Engine ${engineId} not found`);
    }

    Object.assign(config, updates);
    this.engines.set(engineId, config);
    this.logger.log(`Updated configuration for engine ${engineId}`);
  }

  /**
   * Get HTTP client for an engine
   */
  getHttpClient(engineId: string): AxiosInstance | undefined {
    return this.httpClients.get(engineId);
  }

  /**
   * Stop all engines
   */
  private async stopAllEngines(): Promise<void> {
    const stopPromises = Array.from(this.engines.keys()).map(engineId =>
      this.stopEngine(engineId).catch(error =>
        this.logger.error(`Error stopping engine ${engineId}:`, error)
      )
    );

    await Promise.allSettled(stopPromises);
  }

  /**
   * Register event handler
   */
  onEvent(eventType: EngineEventType, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Emit event
   */
  private emitEvent(type: EngineEventType, engineId: string, data: Record<string, any>): void {
    const event: EngineEvent = {
      type,
      engineId,
      timestamp: new Date(),
      data,
    };

    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.logger.error(`Error in event handler for ${type}:`, error);
      }
    });

    this.logger.debug(`Event emitted: ${type} for engine ${engineId}`);
  }
}
