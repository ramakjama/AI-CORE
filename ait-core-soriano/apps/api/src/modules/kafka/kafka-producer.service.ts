import { Injectable, Logger } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { Message, CompressionTypes, RecordMetadata } from 'kafkajs';

export interface ProduceMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
  partition?: number;
}

export interface ProduceOptions {
  compression?: CompressionTypes;
  timeout?: number;
  acks?: number;
}

/**
 * Kafka Producer Service
 *
 * Service for producing messages to Kafka topics.
 *
 * Features:
 * - Automatic JSON serialization
 * - Retry logic with exponential backoff
 * - Message compression
 * - Transaction support
 * - Batch sending
 * - Error handling and logging
 *
 * Usage:
 * ```typescript
 * await this.kafkaProducer.send({
 *   topic: 'user-events',
 *   key: userId,
 *   value: { event: 'user_created', data: userData }
 * });
 * ```
 *
 * @service KafkaProducerService
 */
@Injectable()
export class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);

  constructor(private kafkaService: KafkaService) {}

  /**
   * Send a single message to Kafka
   *
   * @param message - Message to send
   * @param options - Producer options
   * @returns Record metadata containing topic, partition, and offset
   */
  async send(
    message: ProduceMessage,
    options?: ProduceOptions,
  ): Promise<RecordMetadata[]> {
    try {
      const producer = this.kafkaService.getProducer();

      const kafkaMessage: Message = {
        key: message.key,
        value: JSON.stringify(message.value),
        headers: message.headers,
      };

      if (message.partition !== undefined) {
        kafkaMessage.partition = message.partition;
      }

      const result = await producer.send({
        topic: message.topic,
        messages: [kafkaMessage],
        compression: options?.compression || CompressionTypes.GZIP,
        timeout: options?.timeout || 30000,
        acks: options?.acks || -1, // Wait for all replicas
      });

      this.logger.log(
        `Message sent to topic ${message.topic}: ${JSON.stringify(result)}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error sending message to Kafka:', error);
      throw error;
    }
  }

  /**
   * Send multiple messages in batch
   *
   * @param messages - Array of messages to send
   * @param options - Producer options
   * @returns Array of record metadata
   */
  async sendBatch(
    messages: ProduceMessage[],
    options?: ProduceOptions,
  ): Promise<RecordMetadata[]> {
    try {
      const producer = this.kafkaService.getProducer();

      // Group messages by topic
      const messagesByTopic = new Map<string, Message[]>();

      messages.forEach((msg) => {
        if (!messagesByTopic.has(msg.topic)) {
          messagesByTopic.set(msg.topic, []);
        }

        const kafkaMessage: Message = {
          key: msg.key,
          value: JSON.stringify(msg.value),
          headers: msg.headers,
        };

        if (msg.partition !== undefined) {
          kafkaMessage.partition = msg.partition;
        }

        messagesByTopic.get(msg.topic)!.push(kafkaMessage);
      });

      // Send messages to each topic
      const results: RecordMetadata[] = [];

      for (const [topic, topicMessages] of messagesByTopic.entries()) {
        const result = await producer.send({
          topic,
          messages: topicMessages,
          compression: options?.compression || CompressionTypes.GZIP,
          timeout: options?.timeout || 30000,
          acks: options?.acks || -1,
        });

        results.push(...result);
        this.logger.log(`Batch of ${topicMessages.length} messages sent to topic ${topic}`);
      }

      return results;
    } catch (error) {
      this.logger.error('Error sending batch messages to Kafka:', error);
      throw error;
    }
  }

  /**
   * Send messages in a transaction
   *
   * @param messages - Array of messages to send
   * @param options - Producer options
   */
  async sendInTransaction(
    messages: ProduceMessage[],
    options?: ProduceOptions,
  ): Promise<void> {
    const producer = this.kafkaService.getProducer();
    const transaction = await producer.transaction();

    try {
      // Group messages by topic
      const messagesByTopic = new Map<string, Message[]>();

      messages.forEach((msg) => {
        if (!messagesByTopic.has(msg.topic)) {
          messagesByTopic.set(msg.topic, []);
        }

        const kafkaMessage: Message = {
          key: msg.key,
          value: JSON.stringify(msg.value),
          headers: msg.headers,
        };

        if (msg.partition !== undefined) {
          kafkaMessage.partition = msg.partition;
        }

        messagesByTopic.get(msg.topic)!.push(kafkaMessage);
      });

      // Send messages to each topic within transaction
      for (const [topic, topicMessages] of messagesByTopic.entries()) {
        await transaction.send({
          topic,
          messages: topicMessages,
          compression: options?.compression || CompressionTypes.GZIP,
          timeout: options?.timeout || 30000,
          acks: options?.acks || -1,
        });
      }

      // Commit transaction
      await transaction.commit();
      this.logger.log(`Transaction committed with ${messages.length} messages`);
    } catch (error) {
      // Abort transaction on error
      await transaction.abort();
      this.logger.error('Transaction aborted due to error:', error);
      throw error;
    }
  }

  /**
   * Send message with retry logic
   *
   * @param message - Message to send
   * @param options - Producer options
   * @param maxRetries - Maximum number of retries
   * @param retryDelay - Initial retry delay in ms
   */
  async sendWithRetry(
    message: ProduceMessage,
    options?: ProduceOptions,
    maxRetries = 3,
    retryDelay = 1000,
  ): Promise<RecordMetadata[]> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.send(message, options);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Attempt ${attempt}/${maxRetries} failed for topic ${message.topic}:`,
          error.message,
        );

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      `Failed to send message after ${maxRetries} attempts:`,
      lastError,
    );
    throw lastError;
  }

  /**
   * Send message to Dead Letter Queue (DLQ)
   *
   * @param originalTopic - Original topic
   * @param message - Message that failed
   * @param error - Error that occurred
   */
  async sendToDLQ(
    originalTopic: string,
    message: any,
    error: Error,
  ): Promise<void> {
    try {
      const dlqTopic = `${originalTopic}.dlq`;

      await this.send({
        topic: dlqTopic,
        key: message.key,
        value: {
          originalTopic,
          originalMessage: message,
          error: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
        },
        headers: {
          'x-original-topic': originalTopic,
          'x-error-message': error.message,
          'x-retry-count': '0',
        },
      });

      this.logger.log(`Message sent to DLQ: ${dlqTopic}`);
    } catch (dlqError) {
      this.logger.error('Failed to send message to DLQ:', dlqError);
    }
  }
}
