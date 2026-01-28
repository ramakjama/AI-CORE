/**
 * Event Bus - High-level abstraction over Kafka
 */

import { randomUUID } from 'crypto';
import { KafkaProducer, getProducer } from './producer';
import { KafkaConsumer, createConsumer } from './consumer';
import { createLogger } from '@ait-core/shared/logger';
import type { DomainEvent, EventHandler, EventBusConfig } from './types';

const logger = createLogger('@ait-core/kafka:event-bus');

export class EventBus {
  private producer: KafkaProducer;
  private consumers: Map<string, KafkaConsumer> = new Map();
  private handlers: Map<string, Set<EventHandler>> = new Map();

  constructor(private config?: EventBusConfig) {
    this.producer = getProducer();
  }

  /**
   * Initialize event bus
   */
  async initialize(): Promise<void> {
    await this.producer.connect();
    logger.info('Event bus initialized');
  }

  /**
   * Shutdown event bus
   */
  async shutdown(): Promise<void> {
    await this.producer.disconnect();

    for (const [name, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      logger.info(`Consumer ${name} disconnected`);
    }

    this.consumers.clear();
    this.handlers.clear();

    logger.info('Event bus shut down');
  }

  /**
   * Publish an event
   */
  async publish<T = any>(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    data: T,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: DomainEvent<T> = {
      id: randomUUID(),
      type: eventType,
      aggregateId,
      aggregateType,
      version: 1,
      data,
      metadata: {
        ...metadata,
        publishedAt: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    await this.producer.sendEvent(event);

    logger.debug('Event published', {
      eventType,
      eventId: event.id,
      aggregateId,
    });
  }

  /**
   * Publish multiple events
   */
  async publishBatch<T = any>(events: DomainEvent<T>[]): Promise<void> {
    await this.producer.sendEvents(events);

    logger.debug('Events published', {
      count: events.length,
    });
  }

  /**
   * Subscribe to events
   */
  async subscribe(
    consumerGroupId: string,
    eventTypes: string[],
    handler: EventHandler
  ): Promise<void> {
    // Register handlers
    for (const eventType of eventTypes) {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(handler);
    }

    // Check if consumer already exists
    if (this.consumers.has(consumerGroupId)) {
      logger.debug('Consumer already exists', { consumerGroupId });
      return;
    }

    // Create and start consumer
    const consumer = createConsumer({
      groupId: consumerGroupId,
      topics: eventTypes,
      fromBeginning: this.config?.fromBeginning ?? false,
    });

    await consumer.connect();
    await consumer.subscribe();

    // Register message handlers
    for (const eventType of eventTypes) {
      consumer.on(eventType, async (message, context) => {
        const event = consumer.parseDomainEvent(message);
        await this.handleEvent(event, context);
      });
    }

    await consumer.run();

    this.consumers.set(consumerGroupId, consumer);

    logger.info('Subscribed to events', {
      consumerGroupId,
      eventTypes,
    });
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(consumerGroupId: string): Promise<void> {
    const consumer = this.consumers.get(consumerGroupId);

    if (!consumer) {
      return;
    }

    await consumer.disconnect();
    this.consumers.delete(consumerGroupId);

    logger.info('Unsubscribed', { consumerGroupId });
  }

  /**
   * Handle event with registered handlers
   */
  private async handleEvent<T = any>(
    event: DomainEvent<T>,
    context: { topic: string; partition: number }
  ): Promise<void> {
    const handlers = this.handlers.get(event.type);

    if (!handlers || handlers.size === 0) {
      logger.warn('No handlers registered for event type', {
        eventType: event.type,
      });
      return;
    }

    // Execute all handlers in parallel
    await Promise.all(
      Array.from(handlers).map(async (handler) => {
        try {
          await handler(event, context);
        } catch (error) {
          logger.error('Handler failed', {
            eventType: event.type,
            eventId: event.id,
            error,
          });
          throw error;
        }
      })
    );

    logger.debug('Event handled', {
      eventType: event.type,
      eventId: event.id,
      handlersCount: handlers.size,
    });
  }

  /**
   * Create event with defaults
   */
  createEvent<T = any>(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    data: T,
    metadata?: Record<string, any>
  ): DomainEvent<T> {
    return {
      id: randomUUID(),
      type: eventType,
      aggregateId,
      aggregateType,
      version: 1,
      data,
      metadata: metadata || {},
      timestamp: new Date(),
    };
  }
}

/**
 * Singleton event bus instance
 */
let eventBusInstance: EventBus | null = null;

export function getEventBus(config?: EventBusConfig): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(config);
  }
  return eventBusInstance;
}

/**
 * Initialize and get event bus
 */
export async function initializeEventBus(config?: EventBusConfig): Promise<EventBus> {
  const bus = getEventBus(config);
  await bus.initialize();
  return bus;
}
