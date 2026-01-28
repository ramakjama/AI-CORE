import { Motor, MotorStatus, MotorHealth, MotorCategory, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CacheService } from '../lib/redis';
import { logger } from '../lib/logger';
import { updateMotorMetrics } from '../lib/prometheus';
import { createError } from '../middleware/error-handler';

export interface CreateMotorDto {
  slug: string;
  name: string;
  description?: string;
  category: MotorCategory;
  version?: string;
  config?: Prisma.JsonValue;
  icon?: string;
  color?: string;
  order?: number;
}

export interface UpdateMotorDto {
  name?: string;
  description?: string;
  category?: MotorCategory;
  version?: string;
  enabled?: boolean;
  status?: MotorStatus;
  health?: MotorHealth;
  config?: Prisma.JsonValue;
  icon?: string;
  color?: string;
  order?: number;
}

export interface MotorWithMetrics extends Motor {
  latestMetric?: {
    requestsPerHour: number;
    avgResponseTimeMs: number;
    errorRate: number;
    uptime: number;
    timestamp: Date;
  };
}

export class MotorService {
  private static readonly CACHE_PREFIX = 'motor';
  private static readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get all motors with optional filters
   */
  static async findAll(filters?: {
    category?: MotorCategory;
    enabled?: boolean;
    status?: MotorStatus;
    health?: MotorHealth;
  }): Promise<MotorWithMetrics[]> {
    const cacheKey = `${this.CACHE_PREFIX}:list:${JSON.stringify(filters || {})}`;

    // Try cache first
    const cached = await CacheService.get<MotorWithMetrics[]>(cacheKey);
    if (cached) {
      logger.debug('Motors retrieved from cache');
      return cached;
    }

    const motors = await prisma.motor.findMany({
      where: filters,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const motorsWithMetrics: MotorWithMetrics[] = motors.map((motor) => ({
      ...motor,
      latestMetric: motor.metrics[0] || undefined,
    }));

    // Cache results
    await CacheService.set(cacheKey, motorsWithMetrics, this.CACHE_TTL);

    return motorsWithMetrics;
  }

  /**
   * Get motor by ID
   */
  static async findById(id: string): Promise<MotorWithMetrics | null> {
    const cacheKey = `${this.CACHE_PREFIX}:${id}`;

    // Try cache first
    const cached = await CacheService.get<MotorWithMetrics>(cacheKey);
    if (cached) {
      logger.debug(`Motor ${id} retrieved from cache`);
      return cached;
    }

    const motor = await prisma.motor.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!motor) {
      return null;
    }

    const motorWithMetrics: MotorWithMetrics = {
      ...motor,
      latestMetric: motor.metrics[0] || undefined,
    };

    // Cache result
    await CacheService.set(cacheKey, motorWithMetrics, this.CACHE_TTL);

    return motorWithMetrics;
  }

  /**
   * Get motor by slug
   */
  static async findBySlug(slug: string): Promise<MotorWithMetrics | null> {
    const cacheKey = `${this.CACHE_PREFIX}:slug:${slug}`;

    const cached = await CacheService.get<MotorWithMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const motor = await prisma.motor.findUnique({
      where: { slug },
      include: {
        metrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!motor) {
      return null;
    }

    const motorWithMetrics: MotorWithMetrics = {
      ...motor,
      latestMetric: motor.metrics[0] || undefined,
    };

    await CacheService.set(cacheKey, motorWithMetrics, this.CACHE_TTL);

    return motorWithMetrics;
  }

  /**
   * Create new motor
   */
  static async create(data: CreateMotorDto, createdBy: string): Promise<Motor> {
    // Check if slug already exists
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw createError('Motor with this slug already exists', 409, 'DUPLICATE_SLUG');
    }

    const motor = await prisma.motor.create({
      data: {
        ...data,
        config: data.config || {},
      },
    });

    // Create audit event
    await this.createEvent(motor.id, 'CONFIG_UPDATED', 'Motor created', createdBy, true);

    // Invalidate cache
    await CacheService.delPattern(`${this.CACHE_PREFIX}:*`);

    logger.info(`Motor created: ${motor.slug}`, { motorId: motor.id, createdBy });

    return motor;
  }

  /**
   * Update motor
   */
  static async update(
    id: string,
    data: UpdateMotorDto,
    updatedBy: string
  ): Promise<Motor> {
    const motor = await prisma.motor.findUnique({ where: { id } });

    if (!motor) {
      throw createError('Motor not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.motor.update({
      where: { id },
      data,
    });

    // Create audit event
    await this.createEvent(id, 'CONFIG_UPDATED', 'Motor updated', updatedBy, true);

    // Invalidate cache
    await CacheService.delPattern(`${this.CACHE_PREFIX}:*`);

    logger.info(`Motor updated: ${updated.slug}`, { motorId: id, updatedBy });

    return updated;
  }

  /**
   * Delete motor
   */
  static async delete(id: string, deletedBy: string): Promise<void> {
    const motor = await prisma.motor.findUnique({ where: { id } });

    if (!motor) {
      throw createError('Motor not found', 404, 'NOT_FOUND');
    }

    await prisma.motor.delete({ where: { id } });

    // Create audit event (before deletion)
    await this.createEvent(id, 'CONFIG_UPDATED', 'Motor deleted', deletedBy, true);

    // Invalidate cache
    await CacheService.delPattern(`${this.CACHE_PREFIX}:*`);

    logger.info(`Motor deleted: ${motor.slug}`, { motorId: id, deletedBy });
  }

  /**
   * Update motor status
   */
  static async updateStatus(
    id: string,
    status: MotorStatus,
    userId: string
  ): Promise<Motor> {
    const motor = await prisma.motor.update({
      where: { id },
      data: { status },
    });

    // Create event
    const eventType =
      status === 'RUNNING'
        ? 'MOTOR_STARTED'
        : status === 'STOPPED'
        ? 'MOTOR_STOPPED'
        : 'MOTOR_RESTARTED';

    await this.createEvent(id, eventType, `Motor status changed to ${status}`, userId, true);

    // Invalidate cache
    await CacheService.del(`${this.CACHE_PREFIX}:${id}`);
    await CacheService.del(`${this.CACHE_PREFIX}:slug:${motor.slug}`);

    logger.info(`Motor status updated: ${motor.slug} -> ${status}`, {
      motorId: id,
      status,
      userId,
    });

    return motor;
  }

  /**
   * Update motor health
   */
  static async updateHealth(id: string, health: MotorHealth): Promise<Motor> {
    const motor = await prisma.motor.update({
      where: { id },
      data: { health },
    });

    // Create event if unhealthy
    if (health !== 'HEALTHY') {
      await this.createEvent(
        id,
        'HEALTH_CHECK_FAILED',
        `Motor health changed to ${health}`,
        'system',
        false
      );
    }

    // Update Prometheus metrics
    const latestMetric = await prisma.motorMetric.findFirst({
      where: { motorId: id },
      orderBy: { timestamp: 'desc' },
    });

    if (latestMetric) {
      updateMotorMetrics(motor.slug, motor.name, {
        health,
        requestsPerHour: latestMetric.requestsPerHour,
        avgResponseTimeMs: latestMetric.avgResponseTimeMs,
        errorRate: latestMetric.errorRate,
      });
    }

    // Invalidate cache
    await CacheService.del(`${this.CACHE_PREFIX}:${id}`);

    return motor;
  }

  /**
   * Get motor statistics
   */
  static async getStats() {
    const [total, byCategory, byStatus, byHealth] = await Promise.all([
      prisma.motor.count(),
      prisma.motor.groupBy({
        by: ['category'],
        _count: true,
      }),
      prisma.motor.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.motor.groupBy({
        by: ['health'],
        _count: true,
      }),
    ]);

    const healthyCount = byHealth.find((h) => h.health === 'HEALTHY')?._count || 0;
    const overallHealth = total > 0 ? (healthyCount / total) * 100 : 0;

    return {
      total,
      byCategory: Object.fromEntries(byCategory.map((c) => [c.category, c._count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byHealth: Object.fromEntries(byHealth.map((h) => [h.health, h._count])),
      overallHealth: Math.round(overallHealth * 100) / 100,
    };
  }

  /**
   * Create motor event (audit trail)
   */
  private static async createEvent(
    motorId: string,
    eventType: string,
    description: string,
    userId: string,
    success: boolean,
    errorMessage?: string
  ) {
    await prisma.motorEvent.create({
      data: {
        motorId,
        eventType: eventType as any,
        description,
        userId,
        success,
        errorMessage,
      },
    });
  }
}
