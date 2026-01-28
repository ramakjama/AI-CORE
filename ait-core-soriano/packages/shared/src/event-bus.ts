/**
 * Event Bus - Centralized Event System
 * Uses Redis Streams for distributed event handling across all services
 */

import Redis from 'ioredis';
import EventEmitter from 'eventemitter3';
import { Event, EventType } from './types';

export class EventBus {
  private redis: Redis;
  private localEmitter: EventEmitter;
  private subscribers: Map<string, (event: Event) => void>;
  private consumerGroup: string;
  private consumerId: string;
  private isConsuming: boolean;

  constructor(config: {
    redis: Redis;
    consumerGroup?: string;
    consumerId?: string;
  }) {
    this.redis = config.redis;
    this.localEmitter = new EventEmitter();
    this.subscribers = new Map();
    this.consumerGroup = config.consumerGroup || 'ait-core-default';
    this.consumerId = config.consumerId || `consumer-${Date.now()}`;
    this.isConsuming = false;
  }

  /**
   * Publish an event to the bus
   */
  async publish<T = any>(type: EventType, data: T, metadata?: Record<string, any>): Promise<string> {
    const event: Event<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      data,
      metadata: {
        ...metadata,
        publishedBy: this.consumerId
      }
    };

    // Publish to Redis Stream
    const streamKey = `events:${type}`;
    const eventId = await this.redis.xadd(
      streamKey,
      '*', // Auto-generate ID
      'event', JSON.stringify(event)
    );

    // Emit locally for same-process subscribers
    this.localEmitter.emit(type, event);
    this.localEmitter.emit('*', event);

    return eventId;
  }

  /**
   * Subscribe to specific event types
   */
  on<T = any>(eventType: EventType | '*', handler: (event: Event<T>) => void | Promise<void>): void {
    this.localEmitter.on(eventType, handler as any);

    // Track for distributed consumption
    const key = `${eventType}:${handler.toString().substring(0, 20)}`;
    this.subscribers.set(key, handler as any);
  }

  /**
   * Subscribe once to an event
   */
  once<T = any>(eventType: EventType, handler: (event: Event<T>) => void | Promise<void>): void {
    this.localEmitter.once(eventType, handler as any);
  }

  /**
   * Unsubscribe from events
   */
  off(eventType: EventType | '*', handler?: (event: Event) => void): void {
    this.localEmitter.off(eventType, handler as any);
  }

  /**
   * Start consuming events from Redis Streams
   */
  async startConsuming(patterns: EventType[] | '*' = '*'): Promise<void> {
    if (this.isConsuming) {
      return;
    }

    this.isConsuming = true;

    const streamPatterns = patterns === '*' ? ['events:*'] : patterns.map(p => `events:${p}`);

    // Create consumer groups if they don't exist
    for (const pattern of streamPatterns) {
      const streams = await this.redis.keys(pattern);
      for (const stream of streams) {
        try {
          await this.redis.xgroup('CREATE', stream, this.consumerGroup, '0', 'MKSTREAM');
        } catch (err: any) {
          // Group already exists, ignore
          if (!err.message.includes('BUSYGROUP')) {
            console.error('Error creating consumer group:', err);
          }
        }
      }
    }

    // Start consuming loop
    this.consumeLoop(streamPatterns);
  }

  /**
   * Stop consuming events
   */
  stopConsuming(): void {
    this.isConsuming = false;
  }

  /**
   * Internal consume loop
   */
  private async consumeLoop(patterns: string[]): Promise<void> {
    while (this.isConsuming) {
      try {
        // Get all streams matching patterns
        const allStreams: string[] = [];
        for (const pattern of patterns) {
          const streams = await this.redis.keys(pattern);
          allStreams.push(...streams);
        }

        if (allStreams.length === 0) {
          await this.sleep(1000);
          continue;
        }

        // Read from multiple streams
        const streamArgs: string[] = [];
        allStreams.forEach(stream => {
          streamArgs.push(stream, '>');
        });

        const results = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerId,
          'BLOCK',
          5000, // 5 seconds
          'COUNT',
          10,
          'STREAMS',
          ...streamArgs
        );

        if (!results) {
          continue;
        }

        // Process events
        for (const [stream, messages] of results) {
          for (const [messageId, fields] of messages) {
            try {
              const eventData = fields[1]; // fields is ['event', '<json>']
              const event: Event = JSON.parse(eventData);

              // Emit to local handlers
              this.localEmitter.emit(event.type, event);
              this.localEmitter.emit('*', event);

              // ACK the message
              await this.redis.xack(stream, this.consumerGroup, messageId);
            } catch (err) {
              console.error('Error processing event:', err);
              // TODO: Dead letter queue
            }
          }
        }
      } catch (err) {
        console.error('Error in consume loop:', err);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Get pending events count
   */
  async getPendingCount(stream: string): Promise<number> {
    const pending = await this.redis.xpending(stream, this.consumerGroup);
    return pending ? pending[0] : 0;
  }

  /**
   * Claim pending events (for failover)
   */
  async claimPending(stream: string, minIdleTime: number = 60000): Promise<void> {
    const pending = await this.redis.xpending(
      stream,
      this.consumerGroup,
      '-',
      '+',
      10
    );

    if (!pending || pending.length === 0) {
      return;
    }

    for (const [messageId, , idleTime] of pending) {
      if (idleTime > minIdleTime) {
        const claimed = await this.redis.xclaim(
          stream,
          this.consumerGroup,
          this.consumerId,
          minIdleTime,
          messageId
        );

        if (claimed && claimed.length > 0) {
          const [, fields] = claimed[0];
          const event: Event = JSON.parse(fields[1]);

          // Re-emit
          this.localEmitter.emit(event.type, event);
          this.localEmitter.emit('*', event);

          // ACK
          await this.redis.xack(stream, this.consumerGroup, messageId);
        }
      }
    }
  }

  /**
   * Utility: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    this.stopConsuming();
    this.localEmitter.removeAllListeners();
    await this.redis.quit();
  }
}

/**
 * Typed event emitters for specific domains
 */

export class CallEventBus {
  constructor(private bus: EventBus) {}

  onCallStarted(handler: (event: Event<any>) => void) {
    this.bus.on('call.initiated', handler);
  }

  onCallAnswered(handler: (event: Event<any>) => void) {
    this.bus.on('call.answered', handler);
  }

  onCallCompleted(handler: (event: Event<any>) => void) {
    this.bus.on('call.completed', handler);
  }

  async emitCallStarted(data: any) {
    return this.bus.publish('call.initiated', data);
  }

  async emitCallAnswered(data: any) {
    return this.bus.publish('call.answered', data);
  }

  async emitCallCompleted(data: any) {
    return this.bus.publish('call.completed', data);
  }
}

export class CustomerEventBus {
  constructor(private bus: EventBus) {}

  onCustomerCreated(handler: (event: Event<any>) => void) {
    this.bus.on('customer.created', handler);
  }

  onCustomerUpdated(handler: (event: Event<any>) => void) {
    this.bus.on('customer.updated', handler);
  }

  async emitCustomerCreated(data: any) {
    return this.bus.publish('customer.created', data);
  }

  async emitCustomerUpdated(data: any) {
    return this.bus.publish('customer.updated', data);
  }
}

export class PolicyEventBus {
  constructor(private bus: EventBus) {}

  onPolicyCreated(handler: (event: Event<any>) => void) {
    this.bus.on('policy.created', handler);
  }

  onPolicyRenewed(handler: (event: Event<any>) => void) {
    this.bus.on('policy.renewed', handler);
  }

  async emitPolicyCreated(data: any) {
    return this.bus.publish('policy.created', data);
  }

  async emitPolicyRenewed(data: any) {
    return this.bus.publish('policy.renewed', data);
  }
}
