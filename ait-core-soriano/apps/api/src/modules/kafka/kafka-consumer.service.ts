import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { Consumer, EachMessagePayload, EachBatchPayload } from 'kafkajs';

export interface ConsumeOptions {
  groupId: string;
  topics: string[];
  fromBeginning?: boolean;
  autoCommit?: boolean;
  autoCommitInterval?: number;
  sessionTimeout?: number;
  heartbeatInterval?: number;
}

export type MessageHandler = (payload: {
  topic: string;
  partition: number;
  message: any;
}) => Promise<void>;

/**
 * Kafka Consumer Service
 *
 * Service for consuming messages from Kafka topics.
 *
 * Features:
 * - Consumer group management
 * - Automatic offset management
 * - Message deserialization
 * - Error handling and retry logic
 * - Dead letter queue support
 * - Batch processing
 * - Pause/resume consumption
 *
 * Usage:
 * ```typescript
 * await this.kafkaConsumer.consume({
 *   groupId: 'user-service',
 *   topics: ['user-events'],
 * }, async ({ topic, message }) => {
 *   // Process message
 *   console.log('Received:', message);
 * });
 * ```
 *
 * @service KafkaConsumerService
 */
@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumers: Map<string, Consumer> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();

  constructor(private kafkaService: KafkaService) {}

  /**
   * Start consuming messages from topics
   *
   * @param options - Consumer options
   * @param handler - Message handler function
   */
  async consume(
    options: ConsumeOptions,
    handler: MessageHandler,
  ): Promise<void> {
    const { groupId, topics, fromBeginning = false } = options;

    try {
      // Create consumer if it doesn't exist
      let consumer = this.consumers.get(groupId);
      if (!consumer) {
        consumer = await this.kafkaService.createConsumer(groupId);
        this.consumers.set(groupId, consumer);
      }

      // Store message handler
      this.messageHandlers.set(groupId, handler);

      // Subscribe to topics
      await consumer.subscribe({
        topics,
        fromBeginning,
      });

      this.logger.log(`Consumer ${groupId} subscribed to topics: ${topics.join(', ')}`);

      // Start consuming
      await consumer.run({
        autoCommit: options.autoCommit !== false,
        autoCommitInterval: options.autoCommitInterval || 5000,
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(groupId, payload, handler);
        },
      });

      this.logger.log(`Consumer ${groupId} started successfully`);
    } catch (error) {
      this.logger.error(`Error starting consumer ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Consume messages in batch mode
   *
   * @param options - Consumer options
   * @param handler - Batch handler function
   */
  async consumeBatch(
    options: ConsumeOptions,
    handler: (payload: {
      batch: {
        topic: string;
        partition: number;
        messages: any[];
      };
    }) => Promise<void>,
  ): Promise<void> {
    const { groupId, topics, fromBeginning = false } = options;

    try {
      let consumer = this.consumers.get(groupId);
      if (!consumer) {
        consumer = await this.kafkaService.createConsumer(groupId);
        this.consumers.set(groupId, consumer);
      }

      await consumer.subscribe({
        topics,
        fromBeginning,
      });

      this.logger.log(`Batch consumer ${groupId} subscribed to topics: ${topics.join(', ')}`);

      await consumer.run({
        autoCommit: options.autoCommit !== false,
        autoCommitInterval: options.autoCommitInterval || 5000,
        eachBatch: async (payload: EachBatchPayload) => {
          await this.handleBatch(groupId, payload, handler);
        },
      });

      this.logger.log(`Batch consumer ${groupId} started successfully`);
    } catch (error) {
      this.logger.error(`Error starting batch consumer ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Handle individual message
   */
  private async handleMessage(
    groupId: string,
    payload: EachMessagePayload,
    handler: MessageHandler,
  ): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // Deserialize message
      const deserializedMessage = {
        key: message.key?.toString(),
        value: message.value ? JSON.parse(message.value.toString()) : null,
        headers: this.deserializeHeaders(message.headers),
        offset: message.offset,
        timestamp: message.timestamp,
      };

      this.logger.debug(
        `Processing message from ${topic} [${partition}] @ offset ${message.offset}`,
      );

      // Call handler
      await handler({
        topic,
        partition,
        message: deserializedMessage,
      });

      this.logger.debug(
        `Successfully processed message from ${topic} [${partition}] @ offset ${message.offset}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message from ${topic} [${partition}] @ offset ${message.offset}:`,
        error,
      );

      // Send to DLQ if available
      await this.sendToDLQ(topic, message, error);

      // Re-throw to trigger retry
      throw error;
    }
  }

  /**
   * Handle batch of messages
   */
  private async handleBatch(
    groupId: string,
    payload: EachBatchPayload,
    handler: (payload: {
      batch: {
        topic: string;
        partition: number;
        messages: any[];
      };
    }) => Promise<void>,
  ): Promise<void> {
    const { batch } = payload;
    const { topic, partition, messages } = batch;

    try {
      // Deserialize messages
      const deserializedMessages = messages.map((message) => ({
        key: message.key?.toString(),
        value: message.value ? JSON.parse(message.value.toString()) : null,
        headers: this.deserializeHeaders(message.headers),
        offset: message.offset,
        timestamp: message.timestamp,
      }));

      this.logger.debug(
        `Processing batch of ${messages.length} messages from ${topic} [${partition}]`,
      );

      // Call handler
      await handler({
        batch: {
          topic,
          partition,
          messages: deserializedMessages,
        },
      });

      this.logger.log(
        `Successfully processed batch of ${messages.length} messages from ${topic} [${partition}]`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing batch from ${topic} [${partition}]:`,
        error,
      );

      // Process failed messages individually to identify which ones failed
      for (const message of messages) {
        try {
          const handler = this.messageHandlers.get(groupId);
          if (handler) {
            const deserializedMessage = {
              key: message.key?.toString(),
              value: message.value ? JSON.parse(message.value.toString()) : null,
              headers: this.deserializeHeaders(message.headers),
              offset: message.offset,
              timestamp: message.timestamp,
            };

            await handler({
              topic,
              partition,
              message: deserializedMessage,
            });
          }
        } catch (msgError) {
          await this.sendToDLQ(topic, message, msgError);
        }
      }

      throw error;
    }
  }

  /**
   * Deserialize message headers
   */
  private deserializeHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        if (value) {
          result[key] = (value as Buffer).toString();
        }
      }
    }

    return result;
  }

  /**
   * Send failed message to Dead Letter Queue
   */
  private async sendToDLQ(
    topic: string,
    message: any,
    error: Error,
  ): Promise<void> {
    try {
      const producer = this.kafkaService.getProducer();
      const dlqTopic = `${topic}.dlq`;

      await producer.send({
        topic: dlqTopic,
        messages: [
          {
            key: message.key,
            value: JSON.stringify({
              originalTopic: topic,
              originalMessage: {
                key: message.key?.toString(),
                value: message.value?.toString(),
                offset: message.offset,
                timestamp: message.timestamp,
              },
              error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
              },
            }),
            headers: {
              'x-original-topic': topic,
              'x-error-message': error.message,
              'x-failed-at': new Date().toISOString(),
            },
          },
        ],
      });

      this.logger.log(`Message sent to DLQ: ${dlqTopic}`);
    } catch (dlqError) {
      this.logger.error('Failed to send message to DLQ:', dlqError);
    }
  }

  /**
   * Pause consumption for a consumer group
   *
   * @param groupId - Consumer group ID
   */
  async pause(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.pause();
      this.logger.log(`Consumer ${groupId} paused`);
    }
  }

  /**
   * Resume consumption for a consumer group
   *
   * @param groupId - Consumer group ID
   */
  async resume(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.resume();
      this.logger.log(`Consumer ${groupId} resumed`);
    }
  }

  /**
   * Stop consumer
   *
   * @param groupId - Consumer group ID
   */
  async stop(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(groupId);
      this.messageHandlers.delete(groupId);
      this.logger.log(`Consumer ${groupId} stopped`);
    }
  }

  /**
   * Cleanup on module destruction
   */
  async onModuleDestroy() {
    // Stop all consumers
    for (const [groupId, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect();
        this.logger.log(`Consumer ${groupId} disconnected`);
      } catch (error) {
        this.logger.error(`Error disconnecting consumer ${groupId}:`, error);
      }
    }

    this.consumers.clear();
    this.messageHandlers.clear();
  }

  /**
   * Get consumer by group ID
   */
  getConsumer(groupId: string): Consumer | undefined {
    return this.consumers.get(groupId);
  }

  /**
   * Get all active consumer group IDs
   */
  getActiveConsumers(): string[] {
    return Array.from(this.consumers.keys());
  }
}
