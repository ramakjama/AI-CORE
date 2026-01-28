/**
 * Kafka Client Configuration
 */

import { Kafka, KafkaConfig, logLevel } from 'kafkajs';
import { createLogger } from '@ait-core/shared/logger';

const logger = createLogger('@ait-core/kafka');

export interface KafkaClientConfig extends Partial<KafkaConfig> {
  brokers?: string[];
  clientId?: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

/**
 * Create Kafka client instance
 */
export function createKafkaClient(config?: KafkaClientConfig): Kafka {
  const defaultConfig: KafkaConfig = {
    clientId: config?.clientId || process.env.KAFKA_CLIENT_ID || 'ait-core',
    brokers: config?.brokers || process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    logLevel: logLevel.INFO,
    retry: {
      initialRetryTime: 300,
      retries: 8,
      maxRetryTime: 30000,
      multiplier: 2,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  // Add SSL configuration if enabled
  if (config?.ssl || process.env.KAFKA_SSL_ENABLED === 'true') {
    defaultConfig.ssl = true;
  }

  // Add SASL authentication if configured
  if (config?.sasl || process.env.KAFKA_SASL_MECHANISM) {
    defaultConfig.sasl = config?.sasl || {
      mechanism: (process.env.KAFKA_SASL_MECHANISM as any) || 'plain',
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || '',
    };
  }

  const kafka = new Kafka({
    ...defaultConfig,
    ...config,
  });

  logger.info('Kafka client created', {
    clientId: defaultConfig.clientId,
    brokers: defaultConfig.brokers,
  });

  return kafka;
}

/**
 * Singleton Kafka client instance
 */
let kafkaInstance: Kafka | null = null;

export function getKafkaClient(config?: KafkaClientConfig): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = createKafkaClient(config);
  }
  return kafkaInstance;
}

/**
 * Reset Kafka client (useful for testing)
 */
export function resetKafkaClient(): void {
  kafkaInstance = null;
}
