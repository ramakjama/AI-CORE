import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditSearchParams {
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Audit Service
 *
 * Provides comprehensive audit trail functionality for tracking and querying
 * user actions, data changes, and system events.
 *
 * @service AuditService
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create audit log entry
   *
   * @param entry - Audit log entry data
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          changes: entry.changes,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });

      this.logger.debug(
        `Audit log created: ${entry.action} on ${entry.entity}${entry.entityId ? ` (${entry.entityId})` : ''}`,
      );
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Search audit logs
   *
   * @param params - Search parameters
   */
  async search(params: AuditSearchParams) {
    const {
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entity && { entity }),
      ...(entityId && { entityId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user activity history
   *
   * @param userId - User ID
   * @param limit - Number of entries to return
   */
  async getUserActivity(userId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get entity history
   *
   * @param entity - Entity type
   * @param entityId - Entity ID
   */
  async getEntityHistory(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Export audit logs
   *
   * @param params - Export parameters
   */
  async export(params: AuditSearchParams) {
    const where: Prisma.AuditLogWhereInput = {
      ...(params.userId && { userId: params.userId }),
      ...(params.action && { action: params.action }),
      ...(params.entity && { entity: params.entity }),
      ...(params.startDate &&
        params.endDate && {
          createdAt: {
            gte: params.startDate,
            lte: params.endDate,
          },
        }),
    };

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Clean old audit logs
   *
   * @param daysToKeep - Number of days to keep logs
   */
  async cleanup(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.setDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Deleted ${result.count} old audit log entries`);
    return result.count;
  }
}
