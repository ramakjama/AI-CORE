/**
 * Event Publisher
 * Publishes sync events for cross-database event coordination
 */

import { SyncEvent, DatabaseName } from '../types';

// ============================================
// EVENT PUBLISHER TYPES
// ============================================

export interface EventPublisherConfig {
  bufferSize: number;
  flushIntervalMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  onPublishError?: (error: Error, events: SyncEvent[]) => void;
}

export type EventHandler = (event: SyncEvent) => Promise<void> | void;

export interface EventSubscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  createdAt: Date;
}

// ============================================
// EVENT PUBLISHER CLASS
// ============================================

export class EventPublisher {
  private config: EventPublisherConfig;
  private buffer: SyncEvent[] = [];
  private subscriptions: Map<string, EventSubscription> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<EventPublisherConfig> = {}) {
    this.config = {
      bufferSize: 100,
      flushIntervalMs: 5000,
      retryAttempts: 3,
      retryDelayMs: 1000,
      ...config,
    };
  }

  /**
   * Start the event publisher
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushIntervalMs);

    console.info('[EventPublisher] Started');
  }

  /**
   * Stop the event publisher
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush remaining events
    await this.flush();
    this.isRunning = false;
    console.info('[EventPublisher] Stopped');
  }

  /**
   * Publish a sync event
   */
  async publish(event: SyncEvent): Promise<void> {
    this.buffer.push(event);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }

    // Notify subscribers immediately
    await this.notifySubscribers(event);
  }

  /**
   * Publish multiple events
   */
  async publishMany(events: SyncEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Flush buffered events
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      // In a real implementation, this would publish to Kafka, RabbitMQ, etc.
      // For now, we just log and notify subscribers
      console.debug(`[EventPublisher] Flushed ${events.length} events`);
    } catch (error) {
      if (this.config.onPublishError) {
        this.config.onPublishError(error as Error, events);
      } else {
        console.error('[EventPublisher] Error flushing events:', error);
        // Re-add failed events to buffer
        this.buffer.unshift(...events);
      }
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(
    pattern: string,
    handler: EventHandler
  ): string {
    const id = crypto.randomUUID();
    this.subscriptions.set(id, {
      id,
      pattern,
      handler,
      createdAt: new Date(),
    });
    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  /**
   * Notify subscribers of an event
   */
  private async notifySubscribers(event: SyncEvent): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      if (this.matchesPattern(event, subscription.pattern)) {
        try {
          await subscription.handler(event);
        } catch (error) {
          console.error(
            `[EventPublisher] Subscriber ${subscription.id} error:`,
            error
          );
        }
      }
    }
  }

  /**
   * Check if event matches subscription pattern
   */
  private matchesPattern(event: SyncEvent, pattern: string): boolean {
    // Pattern format: "entityType:operation" or "*" for all
    if (pattern === '*') return true;

    const [entityPattern, operationPattern] = pattern.split(':');

    if (entityPattern !== '*' && entityPattern !== event.entityType) {
      return false;
    }

    if (operationPattern && operationPattern !== '*' && operationPattern !== event.operation) {
      return false;
    }

    return true;
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * Check if running
   */
  isPublisherRunning(): boolean {
    return this.isRunning;
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

let eventPublisherInstance: EventPublisher | null = null;

export function getEventPublisher(
  config?: Partial<EventPublisherConfig>
): EventPublisher {
  if (!eventPublisherInstance) {
    eventPublisherInstance = new EventPublisher(config);
  }
  return eventPublisherInstance;
}
