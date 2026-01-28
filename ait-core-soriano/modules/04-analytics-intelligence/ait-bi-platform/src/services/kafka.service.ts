import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: 'ait-bi-platform',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();

    this.logger.log('Kafka producer connected');
  }

  async emit(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic: `bi.${topic}`,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
          },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to emit event: ${error.message}`);
    }
  }

  async subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.consumer) {
      this.consumer = this.kafka.consumer({ groupId: 'ait-bi-platform-group' });
      await this.consumer.connect();
    }

    await this.consumer.subscribe({ topic: `bi.${topic}`, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          await handler(data);
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`);
        }
      },
    });
  }
}
