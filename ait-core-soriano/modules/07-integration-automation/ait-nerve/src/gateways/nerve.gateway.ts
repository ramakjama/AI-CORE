/**
 * AIT-NERVE WebSocket Gateway
 * Real-time monitoring and event streaming
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EngineOrchestratorService } from '../services/engine-orchestrator.service';
import { HealthMonitorService } from '../services/health-monitor.service';
import { PerformanceMetricsService } from '../services/performance-metrics.service';
import { FailoverManagerService } from '../services/failover-manager.service';
import { EngineEventType } from '../types/engine.types';

interface ClientSubscription {
  engines: Set<string>;
  events: Set<EngineEventType>;
  metrics: boolean;
  health: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/nerve',
})
export class NerveGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NerveGateway.name);
  private readonly clientSubscriptions = new Map<string, ClientSubscription>();
  private metricsInterval: NodeJS.Timeout;
  private healthInterval: NodeJS.Timeout;

  constructor(
    private readonly orchestrator: EngineOrchestratorService,
    private readonly healthMonitor: HealthMonitorService,
    private readonly metrics: PerformanceMetricsService,
    private readonly failover: FailoverManagerService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Setup event listeners
    this.setupEngineEventListeners();

    // Start periodic broadcasts
    this.startPeriodicBroadcasts();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Initialize client subscription
    this.clientSubscriptions.set(client.id, {
      engines: new Set(),
      events: new Set(),
      metrics: false,
      health: false,
    });

    // Send initial state
    this.sendInitialState(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  /**
   * Setup engine event listeners
   */
  private setupEngineEventListeners() {
    // Listen to all engine events
    Object.values(EngineEventType).forEach((eventType) => {
      this.orchestrator.onEvent(eventType, (event) => {
        this.broadcastEngineEvent(event);
      });
    });
  }

  /**
   * Start periodic broadcasts for metrics and health
   */
  private startPeriodicBroadcasts() {
    // Broadcast metrics every 5 seconds
    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.metrics.getCurrentMetrics();
        this.broadcastToSubscribers('metrics', metrics, (sub) => sub.metrics);
      } catch (error) {
        this.logger.error(`Error broadcasting metrics: ${error.message}`);
      }
    }, 5000);

    // Broadcast health every 10 seconds
    this.healthInterval = setInterval(async () => {
      try {
        const health = await this.healthMonitor.getSystemHealth();
        this.broadcastToSubscribers('health', health, (sub) => sub.health);
      } catch (error) {
        this.logger.error(`Error broadcasting health: ${error.message}`);
      }
    }, 10000);
  }

  /**
   * Send initial state to newly connected client
   */
  private async sendInitialState(client: Socket) {
    try {
      const engines = this.orchestrator.getAllEngines();
      const health = await this.healthMonitor.getSystemHealth();
      const metrics = await this.metrics.getMetricsSummary();

      client.emit('initial-state', {
        engines: engines.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          enabled: e.enabled,
          currentInstances: e.currentInstances,
        })),
        health,
        metrics,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error sending initial state: ${error.message}`);
    }
  }

  /**
   * Broadcast engine event to subscribers
   */
  private broadcastEngineEvent(event: any) {
    this.server.emit('engine-event', event);
  }

  /**
   * Broadcast to specific subscribers
   */
  private broadcastToSubscribers(
    eventName: string,
    data: any,
    filter: (sub: ClientSubscription) => boolean,
  ) {
    this.clientSubscriptions.forEach((subscription, clientId) => {
      if (filter(subscription)) {
        this.server.to(clientId).emit(eventName, data);
      }
    });
  }

  // ==================== Message Handlers ====================

  @SubscribeMessage('subscribe-metrics')
  handleSubscribeMetrics(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { enable: boolean },
  ) {
    const subscription = this.clientSubscriptions.get(client.id);
    if (subscription) {
      subscription.metrics = data.enable;
      this.logger.log(
        `Client ${client.id} ${data.enable ? 'subscribed to' : 'unsubscribed from'} metrics`,
      );
    }
    return { success: true, subscribed: data.enable };
  }

  @SubscribeMessage('subscribe-health')
  handleSubscribeHealth(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { enable: boolean },
  ) {
    const subscription = this.clientSubscriptions.get(client.id);
    if (subscription) {
      subscription.health = data.enable;
      this.logger.log(
        `Client ${client.id} ${data.enable ? 'subscribed to' : 'unsubscribed from'} health`,
      );
    }
    return { success: true, subscribed: data.enable };
  }

  @SubscribeMessage('subscribe-engine')
  handleSubscribeEngine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string; enable: boolean },
  ) {
    const subscription = this.clientSubscriptions.get(client.id);
    if (subscription) {
      if (data.enable) {
        subscription.engines.add(data.engineId);
      } else {
        subscription.engines.delete(data.engineId);
      }
      this.logger.log(
        `Client ${client.id} ${data.enable ? 'subscribed to' : 'unsubscribed from'} engine ${data.engineId}`,
      );
    }
    return { success: true, engineId: data.engineId, subscribed: data.enable };
  }

  @SubscribeMessage('subscribe-events')
  handleSubscribeEvents(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventTypes: EngineEventType[]; enable: boolean },
  ) {
    const subscription = this.clientSubscriptions.get(client.id);
    if (subscription) {
      data.eventTypes.forEach((eventType) => {
        if (data.enable) {
          subscription.events.add(eventType);
        } else {
          subscription.events.delete(eventType);
        }
      });
      this.logger.log(
        `Client ${client.id} ${data.enable ? 'subscribed to' : 'unsubscribed from'} events: ${data.eventTypes.join(', ')}`,
      );
    }
    return { success: true, eventTypes: data.eventTypes, subscribed: data.enable };
  }

  @SubscribeMessage('get-engine-status')
  async handleGetEngineStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string },
  ) {
    try {
      const engine = this.orchestrator.getEngine(data.engineId);
      if (!engine) {
        return { success: false, error: 'Engine not found' };
      }

      const instances = this.orchestrator.getEngineInstances(data.engineId);
      const health = await this.healthMonitor.getEngineHealth(data.engineId);
      const circuitBreaker = this.failover.getCircuitBreakerState(data.engineId);

      return {
        success: true,
        engine: {
          ...engine,
          instances: instances.map((i) => ({
            id: i.id,
            status: i.status,
            healthy: i.healthStatus.healthy,
            metrics: i.metrics,
          })),
        },
        health,
        circuitBreaker,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('get-system-metrics')
  async handleGetSystemMetrics(@ConnectedSocket() client: Socket) {
    try {
      const metrics = await this.metrics.getCurrentMetrics();
      return { success: true, metrics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('get-circuit-breakers')
  async handleGetCircuitBreakers(@ConnectedSocket() client: Socket) {
    try {
      const circuitBreakers = this.failover.getAllCircuitBreakerStates();
      return { success: true, circuitBreakers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('start-engine')
  async handleStartEngine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string; instances?: number },
  ) {
    try {
      await this.orchestrator.startEngine(data.engineId, data.instances);
      return { success: true, message: `Engine ${data.engineId} started` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('stop-engine')
  async handleStopEngine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string },
  ) {
    try {
      await this.orchestrator.stopEngine(data.engineId);
      return { success: true, message: `Engine ${data.engineId} stopped` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('restart-engine')
  async handleRestartEngine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string },
  ) {
    try {
      await this.orchestrator.restartEngine(data.engineId);
      return { success: true, message: `Engine ${data.engineId} restarted` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('scale-engine')
  async handleScaleEngine(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string; targetInstances: number; reason?: string },
  ) {
    try {
      const response = await this.orchestrator.scaleEngine(data);
      return { success: true, ...response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('reset-circuit-breaker')
  async handleResetCircuitBreaker(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { engineId: string },
  ) {
    try {
      this.failover.resetCircuitBreaker(data.engineId);
      return { success: true, message: `Circuit breaker for ${data.engineId} reset` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
  }
}
