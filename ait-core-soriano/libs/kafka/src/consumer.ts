/**
 * Kafka Consumer
 */

import {
  Consumer,
  ConsumerConfig,
  EachMessagePayload,
  EachBatchPayload,
  KafkaMessage,
} from 'kafkajs';
import { getKafkaClient } from './client';
import { createLogger } from '@ait-core/shared/logger';
import { KafkaError } from '@ait-core/shared/errors';
import type { DomainEvent, MessageHandler, BatchHandler } from './types';

const logger = createLogger('@ait-core/kafka:consumer');

export interface ConsumerOptions extends Partial<ConsumerConfig> {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
}

export class KafkaConsumer {
  private consumer: Consumer;
  private isConnected: boolean = false;
  private readonly topics: string[];
  private readonly fromBeginning: boolean;
  private handlers: Map<string, MessageHandler> = new Map();

  constructor(options: ConsumerOptions) {
    const kafka = getKafkaClient();

    this.consumer = kafka.consumer({
      groupId: options.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        retries: 5,
      },
      ...options,
    });

    this.topics = options.topics;
    this.fromBeginning = options.fromBeginning ?? false;
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('Kafka consumer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka consumer', { error });
      throw new KafkaError('Failed to connect consumer', error);
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Kafka consumer', { error });
    }
  }

  /**
   * Subscribe to topics
   */
  async subscribe(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      await this.consumer.subscribe({
        topics: this.topics,
        fromBeginning: this.fromBeginning,
      });

      logger.info('Subscribed to topics', { topics: this.topics });
    } catch (error) {
      logger.error('Failed to subscribe to topics', { topics: this.topics, error });
      throw new KafkaError('Failed to subscribe to topics', error);
    }
  }

  /**
   * Register message handler for a topic
   */
  on(topic: string, handler: MessageHandler): void {
    this.handlers.set(topic, handler);
    logger.debug('Handler registered', { topic });
  }

  /**
   * Run consumer with message handling
   */
  async run(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
      await this.subscribe();
    }

    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      logger.info('Consumer running');
    } catch (error) {
      logger.error('Consumer run failed', { error });
      throw new KafkaError('Consumer run failed', error);
    }
  }

  /**
   * Run consumer with batch handling
   */
  async runBatch(batchHandler: BatchHandler): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
      await this.subscribe();
    }

    try {
      await this.consumer.run({
        eachBatch: async (payload: EachBatchPayload) => {
          await batchHandler(payload);
        },
      });

      logger.info('Consumer running (batch mode)');
    } catch (error) {
      logger.error('Consumer batch run failed', { error });
      throw new KafkaError('Consumer batch run failed', error);
    }
  }

  /**
   * Handle individual message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      logger.debug('Processing message', {
        topic,
        partition,
        offset: message.offset,
      });

      const handler = this.handlers.get(topic);

      if (!handler) {
        logger.warn('No handler registered for topic', { topic });
        return;
      }

      await handler(message, { topic, partition });

      logger.debug('Message processed', {
        topic,
        partition,
        offset: message.offset,
      });
    } catch (error) {
      logger.error('Failed to process message', {
        topic,
        partition,
        offset: message.offset,
        error,
      });

      // Re-throw to trigger retry or DLQ
      throw error;
    }
  }

  /**
   * Parse domain event from message
   */
  parseDomainEvent<T = any>(message: KafkaMessage): DomainEvent<T> {
    const headers = message.headers || {};

    return {
      id: headers.eventId?.toString() || '',
      type: headers.eventType?.toString() || '',
      aggregateId: message.key?.toString() || '',
      aggregateType: headers.aggregateType?.toString() || '',
      version: parseInt(headers.version?.toString() || '1', 10),
      data: JSON.parse(message.value?.toString() || '{}'),
      metadata: Object.fromEntries(
        Object.entries(headers)
          .filter(([key]) => !['eventId', 'eventType', 'aggregateType', 'version', 'timestamp'].includes(key))
          .map(([key, value]) => [key, value?.toString()])
      ),
      timestamp: new Date(headers.timestamp?.toString() || Date.now()),
    };
  }

  /**
   * Pause consumption
   */
  async pause(): Promise<void> {
    this.consumer.pause(this.topics.map((topic) => ({ topic })));
    logger.info('Consumer paused');
  }

  /**
   * Resume consumption
   */
  async resume(): Promise<void> {
    this.consumer.resume(this.topics.map((topic) => ({ topic })));
    logger.info('Consumer resumed');
  }

  /**
   * Seek to offset
   */
  async seek(topic: string, partition: number, offset: string): Promise<void> {
    this.consumer.seek({ topic, partition, offset });
    logger.info('Seeked to offset', { topic, partition, offset });
  }
}

/**
 * Create consumer instance
 */
export function createConsumer(options: ConsumerOptions): KafkaConsumer {
  return new KafkaConsumer(options);
}
