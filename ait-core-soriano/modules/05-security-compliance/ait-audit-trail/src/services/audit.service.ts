import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface AuditLogEntry {
  timestamp: Date;
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  success: boolean;
  durationMs: number;
  serviceName: string;
  apiEndpoint: string;
  httpMethod: string;
  httpStatus: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: entry as any
      });
    } catch (error) {
      this.logger.error(`Audit log failed: ${error.message}`);
    }
  }

  async findByRecordId(tableName: string, recordId: string) {
    return await this.prisma.auditLog.findMany({
      where: { tableName, recordId },
      orderBy: { timestamp: 'desc' }
    });
  }
}
