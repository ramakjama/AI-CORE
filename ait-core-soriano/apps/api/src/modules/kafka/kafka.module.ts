import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from './kafka.service';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaAdminService } from './kafka-admin.service';

/**
 * Kafka Module
 *
 * Provides Apache Kafka integration for event streaming and microservice communication.
 *
 * Features:
 * - Message production with retries and error handling
 * - Consumer groups with automatic offset management
 * - Topic administration (create, delete, describe)
 * - Dead letter queue (DLQ) support
 * - Message compression (gzip, snappy, lz4)
 * - Idempotent producers
 * - At-least-once delivery guarantee
 *
 * Architecture Patterns:
 * - Event Sourcing
 * - CQRS (Command Query Responsibility Segregation)
 * - Saga Pattern
 * - Change Data Capture (CDC)
 *
 * @module KafkaModule
 */
@Global()
@Module({})
export class KafkaModule {
  static forRoot(): DynamicModule {
    return {
      module: KafkaModule,
      providers: [
        KafkaService,
        KafkaProducerService,
        KafkaConsumerService,
        KafkaAdminService,
      ],
      exports: [
        KafkaService,
        KafkaProducerService,
        KafkaConsumerService,
        KafkaAdminService,
      ],
    };
  }
}
