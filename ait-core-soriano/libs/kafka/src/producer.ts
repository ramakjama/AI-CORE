/**
 * Kafka Producer
 */

import {
  Producer,
  ProducerConfig,
  ProducerRecord,
  RecordMetadata,
  Message,
} from 'kafkajs';
import { getKafkaClient } from './client';
import { createLogger } from '@ait-core/shared/logger';
import { KafkaError } from '@ait-core/shared/errors';
import type { DomainEvent } from './types';

const logger = createLogger('@ait-core/kafka:producer');

export class KafkaProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor(config?: ProducerConfig) {
    const kafka = getKafkaClient();
    this.producer = kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
      ...config,
    });
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      logger.info('Kafka producer connected');
    } catch (error) {
      logger.error('Failed to connect Kafka producer', { error });
      throw new KafkaError('Failed to connect producer', error);
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
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Failed to disconnect Kafka producer', { error });
    }
  }

  /**
   * Send a single message
   */
  async send(
    topic: string,
    message: Message,
    options?: { partition?: number }
  ): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: [message],
        ...options,
      };

      const metadata = await this.producer.send(record);

      logger.debug('Message sent', {
        topic,
        partition: metadata[0].partition,
        offset: metadata[0].offset,
      });

      return metadata;
    } catch (error) {
      logger.error('Failed to send message', { topic, error });
      throw new KafkaError('Failed to send message', error);
    }
  }

  /**
   * Send multiple messages
   */
  async sendBatch(
    topic: string,
    messages: Message[]
  ): Promise<RecordMetadata[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages,
      };

      const metadata = await this.producer.send(record);

      logger.debug('Batch sent', {
        topic,
        count: messages.length,
      });

      return metadata;
    } catch (error) {
      logger.error('Failed to send batch', { topic, count: messages.length, error });
      throw new KafkaError('Failed to send batch', error);
    }
  }

  /**
   * Send a domain event
   */
  async sendEvent<T = any>(event: DomainEvent<T>): Promise<RecordMetadata[]> {
    const message: Message = {
      key: event.aggregateId,
      value: JSON.stringify(event.data),
      headers: {
        eventId: event.id,
        eventType: event.type,
        aggregateType: event.aggregateType,
        version: String(event.version),
        timestamp: event.timestamp.toISOString(),
        ...event.metadata,
      },
    };

    return this.send(event.type, message);
  }

  /**
   * Send multiple domain events
   */
  async sendEvents<T = any>(events: DomainEvent<T>[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // Group events by type (topic)
    const eventsByTopic = events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = [];
      }
      acc[event.type].push(event);
      return acc;
    }, {} as Record<string, DomainEvent<T>[]>);

    // Send each group
    await Promise.all(
      Object.entries(eventsByTopic).map(async ([topic, topicEvents]) => {
        const messages: Message[] = topicEvents.map((event) => ({
          key: event.aggregateId,
          value: JSON.stringify(event.data),
          headers: {
            eventId: event.id,
            eventType: event.type,
            aggregateType: event.aggregateType,
            version: String(event.version),
            timestamp: event.timestamp.toISOString(),
            ...event.metadata,
          },
        }));

        await this.sendBatch(topic, messages);
      })
    );
  }

  /**
   * Send with transaction
   */
  async sendTransaction(
    callback: (transaction: any) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const transaction = await this.producer.transaction();

    try {
      await callback(transaction);
      await transaction.commit();
      logger.debug('Transaction committed');
    } catch (error) {
      await transaction.abort();
      logger.error('Transaction aborted', { error });
      throw new KafkaError('Transaction failed', error);
    }
  }
}

/**
 * Singleton producer instance
 */
let producerInstance: KafkaProducer | null = null;

export function getProducer(config?: ProducerConfig): KafkaProducer {
  if (!producerInstance) {
    producerInstance = new KafkaProducer(config);
  }
  return producerInstance;
}
