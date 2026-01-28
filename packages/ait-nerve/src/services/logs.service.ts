import { MotorLog, LogLevel, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface CreateLogDto {
  motorId: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  errorCode?: string;
  errorStack?: string;
  requestId?: string;
  userId?: string;
}

export interface LogsQuery {
  motorId?: string;
  level?: LogLevel | LogLevel[];
  from?: Date;
  to?: Date;
  requestId?: string;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class LogsService {
  /**
   * Create log entry
   */
  static async create(data: CreateLogDto): Promise<MotorLog> {
    const log = await prisma.motorLog.create({
      data: {
        motorId: data.motorId,
        level: data.level,
        message: data.message,
        metadata: data.metadata || null,
        errorCode: data.errorCode,
        errorStack: data.errorStack,
        requestId: data.requestId,
        userId: data.userId,
      },
    });

    // Also log to Winston for centralized logging
    const logLevel = data.level.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
    logger[logLevel](`[${data.motorId}] ${data.message}`, data.metadata);

    return log;
  }

  /**
   * Query logs
   */
  static async query(params: LogsQuery): Promise<{ logs: MotorLog[]; total: number }> {
    const where: Prisma.MotorLogWhereInput = {};

    if (params.motorId) {
      where.motorId = params.motorId;
    }

    if (params.level) {
      where.level = Array.isArray(params.level) ? { in: params.level } : params.level;
    }

    if (params.from || params.to) {
      where.timestamp = {};
      if (params.from) where.timestamp.gte = params.from;
      if (params.to) where.timestamp.lte = params.to;
    }

    if (params.requestId) {
      where.requestId = params.requestId;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.search) {
      where.message = { contains: params.search, mode: 'insensitive' };
    }

    const [logs, total] = await Promise.all([
      prisma.motorLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit || 100,
        skip: params.offset || 0,
      }),
      prisma.motorLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Get error logs for motor
   */
  static async getErrors(motorId: string, limit: number = 50): Promise<MotorLog[]> {
    return prisma.motorLog.findMany({
      where: {
        motorId,
        level: { in: ['ERROR', 'FATAL'] },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Cleanup old logs
   */
  static async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.motorLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result.count} old logs (older than ${olderThanDays} days)`);

    return result.count;
  }
}
