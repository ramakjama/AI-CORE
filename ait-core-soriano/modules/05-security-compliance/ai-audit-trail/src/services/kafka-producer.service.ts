import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from './winston-logger.service';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(
    private configService: ConfigService,
    private logger: WinstonLoggerService,
  ) {
    this.kafka = new Kafka({
      clientId: 'ait-audit-trail',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error.message);
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async sendAuditEvent(topic: string, event: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      this.logger.log(`Audit event sent to topic: ${topic}`, { eventId: event.id });
    } catch (error) {
      this.logger.error('Failed to send audit event to Kafka', error.message, { topic, eventId: event.id });
      throw error;
    }
  }
}
