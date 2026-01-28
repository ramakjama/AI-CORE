import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin, logLevel } from 'kafkajs';

/**
 * Kafka Service
 *
 * Core Kafka connection and lifecycle management service.
 * Provides the base Kafka instance and manages connections.
 *
 * Configuration:
 * - KAFKA_BROKERS: Comma-separated list of broker addresses
 * - KAFKA_CLIENT_ID: Client identifier
 * - KAFKA_GROUP_ID: Consumer group ID
 * - KAFKA_SASL_ENABLED: Enable SASL authentication
 * - KAFKA_SASL_MECHANISM: SASL mechanism (plain, scram-sha-256, scram-sha-512)
 * - KAFKA_SASL_USERNAME: SASL username
 * - KAFKA_SASL_PASSWORD: SASL password
 *
 * @service KafkaService
 */
@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.initializeKafka();
  }

  /**
   * Initialize Kafka client
   */
  private initializeKafka() {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',');

    const clientId = this.configService.get<string>(
      'KAFKA_CLIENT_ID',
      'ait-core-api',
    );

    const saslEnabled = this.configService.get<boolean>('KAFKA_SASL_ENABLED', false);

    const kafkaConfig: any = {
      clientId,
      brokers,
      logLevel: logLevel.ERROR,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        multiplier: 2,
        factor: 0.2,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    };

    // Add SASL configuration if enabled
    if (saslEnabled) {
      kafkaConfig.sasl = {
        mechanism: this.configService.get<string>('KAFKA_SASL_MECHANISM', 'plain'),
        username: this.configService.get<string>('KAFKA_SASL_USERNAME', ''),
        password: this.configService.get<string>('KAFKA_SASL_PASSWORD', ''),
      };

      // Enable SSL if SASL is enabled
      kafkaConfig.ssl = true;
    }

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer({
      idempotent: true,
      maxInFlightRequests: 5,
      transactionalId: `${clientId}-transactional`,
    });

    this.admin = this.kafka.admin();

    this.logger.log('Kafka client initialized');
    this.logger.log(`Brokers: ${brokers.join(', ')}`);
    this.logger.log(`Client ID: ${clientId}`);
  }

  /**
   * Connect to Kafka on module initialization
   */
  async onModuleInit() {
    try {
      await this.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Kafka on module init:', error);
      // Don't throw error to allow app to start even if Kafka is unavailable
    }
  }

  /**
   * Disconnect from Kafka on module destruction
   */
  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('Already connected to Kafka');
      return;
    }

    try {
      // Connect producer
      await this.producer.connect();
      this.logger.log('Kafka producer connected');

      // Connect admin
      await this.admin.connect();
      this.logger.log('Kafka admin connected');

      this.isConnected = true;
      this.logger.log('Successfully connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      throw error;
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
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        this.logger.log(`Consumer disconnected: ${groupId}`);
      }
      this.consumers.clear();

      // Disconnect producer
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');

      // Disconnect admin
      await this.admin.disconnect();
      this.logger.log('Kafka admin disconnected');

      this.isConnected = false;
      this.logger.log('Successfully disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  /**
   * Get Kafka instance
   */
  getKafka(): Kafka {
    return this.kafka;
  }

  /**
   * Get producer instance
   */
  getProducer(): Producer {
    return this.producer;
  }

  /**
   * Get admin instance
   */
  getAdmin(): Admin {
    return this.admin;
  }

  /**
   * Create a new consumer
   */
  async createConsumer(groupId: string): Promise<Consumer> {
    if (this.consumers.has(groupId)) {
      return this.consumers.get(groupId)!;
    }

    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576, // 1MB
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    await consumer.connect();
    this.consumers.set(groupId, consumer);
    this.logger.log(`Consumer created and connected: ${groupId}`);

    return consumer;
  }

  /**
   * Remove consumer
   */
  async removeConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(groupId);
      this.logger.log(`Consumer removed: ${groupId}`);
    }
  }

  /**
   * Check if connected to Kafka
   */
  isKafkaConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.admin.listTopics();
      return true;
    } catch (error) {
      this.logger.error('Kafka health check failed:', error);
      return false;
    }
  }
}
