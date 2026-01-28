import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditTrailController } from './controllers/audit-trail.controller';
import { AuditTrailService } from './services/audit-trail.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { AuditSearchService } from './services/audit-search.service';
import { AuditRetentionService } from './services/audit-retention.service';
import { AuditEncryptionService } from './services/audit-encryption.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { PrismaService } from './services/prisma.service';
import { WinstonLoggerService } from './services/winston-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AuditTrailController],
  providers: [
    AuditTrailService,
    AuditLoggerService,
    AuditSearchService,
    AuditRetentionService,
    AuditEncryptionService,
    KafkaProducerService,
    PrismaService,
    WinstonLoggerService,
  ],
  exports: [
    AuditTrailService,
    AuditLoggerService,
  ],
})
export class AuditTrailModule {}
