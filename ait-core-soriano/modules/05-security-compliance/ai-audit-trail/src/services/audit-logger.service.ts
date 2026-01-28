import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuditEncryptionService } from './audit-encryption.service';
import { KafkaProducerService } from './kafka-producer.service';
import { WinstonLoggerService } from './winston-logger.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLog, AuditSeverity } from '../entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditLoggerService {
  constructor(
    private prisma: PrismaService,
    private encryption: AuditEncryptionService,
    private kafka: KafkaProducerService,
    private logger: WinstonLoggerService,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    try {
      const auditLog: any = {
        id: uuidv4(),
        timestamp: new Date(),
        ...dto,
        severity: dto.severity || AuditSeverity.INFO,
        encrypted: false,
        checksum: '',
        createdAt: new Date(),
      };

      // Generate checksum before encryption
      auditLog.checksum = this.encryption.generateChecksum(auditLog);

      // Encrypt sensitive fields if needed
      if (this.shouldEncrypt(dto)) {
        const encryptedData = this.encryption.encrypt({
          requestParams: dto.requestParams,
          oldValue: dto.oldValue,
          newValue: dto.newValue,
          metadata: dto.metadata,
        });
        
        auditLog.requestParams = encryptedData;
        auditLog.encrypted = true;
      }

      // Store in database
      const savedLog = await this.prisma.auditLog.create({
        data: auditLog,
      });

      // Send to Kafka for real-time processing
      await this.kafka.sendAuditEvent('audit-trail.events', savedLog);

      // Log to Winston
      this.logger.log('Audit log created', {
        id: savedLog.id,
        action: savedLog.action,
        userId: savedLog.userId,
        resourceType: savedLog.resourceType,
      });

      // Send critical alerts
      if (dto.severity === AuditSeverity.CRITICAL) {
        await this.kafka.sendAuditEvent('audit-trail.critical', savedLog);
      }

      return savedLog as AuditLog;
    } catch (error) {
      this.logger.error('Failed to create audit log', error.message, dto);
      throw error;
    }
  }

  private shouldEncrypt(dto: CreateAuditLogDto): boolean {
    // Encrypt if contains sensitive data
    return !!(dto.requestParams || dto.oldValue || dto.newValue || dto.metadata);
  }

  async bulkLog(dtos: CreateAuditLogDto[]): Promise<AuditLog[]> {
    return Promise.all(dtos.map(dto => this.log(dto)));
  }
}
