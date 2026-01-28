import { MotorMetric } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { updateMotorMetrics } from '../lib/prometheus';

export interface CreateMetricDto {
  motorId: string;
  requestsPerHour?: number;
  avgResponseTimeMs?: number;
  errorRate?: number;
  uptime?: number;
  cpuUsage?: number;
  memoryUsageMB?: number;
  activeConnections?: number;
  customMetrics?: Record<string, any>;
}

export interface MetricsQuery {
  motorId: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

export class MetricsService {
  /**
   * Record new metric
   */
  static async create(data: CreateMetricDto): Promise<MotorMetric> {
    const metric = await prisma.motorMetric.create({
      data: {
        motorId: data.motorId,
        requestsPerHour: data.requestsPerHour || 0,
        avgResponseTimeMs: data.avgResponseTimeMs || 0,
        errorRate: data.errorRate || 0,
        uptime: data.uptime || 0,
        cpuUsage: data.cpuUsage,
        memoryUsageMB: data.memoryUsageMB,
        activeConnections: data.activeConnections,
        customMetrics: data.customMetrics || {},
      },
    });

    // Update Prometheus metrics
    const motor = await prisma.motor.findUnique({
      where: { id: data.motorId },
    });

    if (motor) {
      updateMotorMetrics(motor.slug, motor.name, {
        health: motor.health,
        requestsPerHour: metric.requestsPerHour,
        avgResponseTimeMs: metric.avgResponseTimeMs,
        errorRate: metric.errorRate,
      });
    }

    logger.debug(`Metric recorded for motor ${data.motorId}`);

    return metric;
  }

  /**
   * Query metrics
   */
  static async query(params: MetricsQuery): Promise<MotorMetric[]> {
    return prisma.motorMetric.findMany({
      where: {
        motorId: params.motorId,
        timestamp: {
          gte: params.from,
          lte: params.to,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: params.limit || 1000,
    });
  }

  /**
   * Get latest metric for motor
   */
  static async getLatest(motorId: string): Promise<MotorMetric | null> {
    return prisma.motorMetric.findFirst({
      where: { motorId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get time-series metrics with aggregation
   */
  static async getTimeSeries(
    motorId: string,
    from: Date,
    to: Date,
    interval: 'minute' | 'hour' | 'day' = 'hour'
  ) {
    // This is a simplified version. In production, use a time-series DB or aggregation
    const metrics = await prisma.motorMetric.findMany({
      where: {
        motorId,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: 'asc' },
    });

    return metrics;
  }

  /**
   * Cleanup old metrics
   */
  static async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.motorMetric.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result.count} old metrics (older than ${olderThanDays} days)`);

    return result.count;
  }
}
