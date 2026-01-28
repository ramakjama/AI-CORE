/**
 * Kafka Types and Interfaces
 */

import { KafkaMessage, EachBatchPayload } from 'kafkajs';

/**
 * Domain Event
 */
export interface DomainEvent<T = any> {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: T;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * Message Handler
 */
export type MessageHandler = (
  message: KafkaMessage,
  context: { topic: string; partition: number }
) => Promise<void>;

/**
 * Event Handler
 */
export type EventHandler<T = any> = (
  event: DomainEvent<T>,
  context: { topic: string; partition: number }
) => Promise<void>;

/**
 * Batch Handler
 */
export type BatchHandler = (payload: EachBatchPayload) => Promise<void>;

/**
 * Event Bus Configuration
 */
export interface EventBusConfig {
  clientId?: string;
  brokers?: string[];
  fromBeginning?: boolean;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

/**
 * Event Metadata
 */
export interface EventMetadata {
  userId?: string;
  correlationId?: string;
  causationId?: string;
  publishedAt?: string;
  [key: string]: any;
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Dead Letter Queue Configuration
 */
export interface DLQConfig {
  topic: string;
  enabled: boolean;
}
