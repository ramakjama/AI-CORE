import { Motor, MotorConfigHistory, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CacheService } from '../lib/redis';
import { logger } from '../lib/logger';
import { createError } from '../middleware/error-handler';

export interface UpdateConfigDto {
  config: Prisma.JsonValue;
  reason?: string;
  hotReload?: boolean;
}

export class ConfigService {
  private static readonly CACHE_PREFIX = 'config';

  /**
   * Get current config for motor
   */
  static async getCurrent(motorId: string): Promise<Prisma.JsonValue> {
    const motor = await prisma.motor.findUnique({
      where: { id: motorId },
      select: { config: true },
    });

    if (!motor) {
      throw createError('Motor not found', 404, 'NOT_FOUND');
    }

    return motor.config;
  }

  /**
   * Update motor config with versioning
   */
  static async update(
    motorId: string,
    data: UpdateConfigDto,
    userId: string
  ): Promise<Motor> {
    const motor = await prisma.motor.findUnique({ where: { id: motorId } });

    if (!motor) {
      throw createError('Motor not found', 404, 'NOT_FOUND');
    }

    // Get latest version number
    const latestHistory = await prisma.motorConfigHistory.findFirst({
      where: { motorId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestHistory?.version || 0) + 1;

    // Save config history
    await prisma.motorConfigHistory.create({
      data: {
        motorId,
        version: nextVersion,
        config: data.config,
        changedBy: userId,
        changeReason: data.reason,
        isActive: true,
      },
    });

    // Deactivate previous versions
    await prisma.motorConfigHistory.updateMany({
      where: {
        motorId,
        version: { not: nextVersion },
        isActive: true,
      },
      data: { isActive: false },
    });

    // Update motor config
    const updated = await prisma.motor.update({
      where: { id: motorId },
      data: { config: data.config },
    });

    // Create audit event
    await prisma.motorEvent.create({
      data: {
        motorId,
        eventType: 'CONFIG_UPDATED',
        description: `Config updated to version ${nextVersion}${
          data.reason ? `: ${data.reason}` : ''
        }`,
        userId,
        success: true,
        metadata: { version: nextVersion, hotReload: data.hotReload },
      },
    });

    // Invalidate cache
    await CacheService.del(`${this.CACHE_PREFIX}:${motorId}`);
    await CacheService.del(`motor:${motorId}`);
    await CacheService.del(`motor:slug:${motor.slug}`);

    logger.info(`Config updated for motor ${motor.slug} to version ${nextVersion}`, {
      motorId,
      version: nextVersion,
      userId,
      hotReload: data.hotReload,
    });

    // TODO: If hotReload is true, trigger motor reload via event/webhook

    return updated;
  }

  /**
   * Get config history
   */
  static async getHistory(
    motorId: string,
    limit: number = 50
  ): Promise<MotorConfigHistory[]> {
    return prisma.motorConfigHistory.findMany({
      where: { motorId },
      orderBy: { version: 'desc' },
      take: limit,
    });
  }

  /**
   * Get specific config version
   */
  static async getVersion(
    motorId: string,
    version: number
  ): Promise<MotorConfigHistory | null> {
    return prisma.motorConfigHistory.findUnique({
      where: {
        motorId_version: { motorId, version },
      },
    });
  }

  /**
   * Rollback to previous config version
   */
  static async rollback(
    motorId: string,
    version: number,
    userId: string
  ): Promise<Motor> {
    const configHistory = await this.getVersion(motorId, version);

    if (!configHistory) {
      throw createError('Config version not found', 404, 'VERSION_NOT_FOUND');
    }

    const motor = await prisma.motor.update({
      where: { id: motorId },
      data: { config: configHistory.config },
    });

    // Record rollback
    await prisma.motorConfigHistory.update({
      where: { id: configHistory.id },
      data: {
        isActive: true,
        rolledBackAt: new Date(),
        rolledBackBy: userId,
      },
    });

    // Create audit event
    await prisma.motorEvent.create({
      data: {
        motorId,
        eventType: 'CONFIG_ROLLED_BACK',
        description: `Config rolled back to version ${version}`,
        userId,
        success: true,
        metadata: { version },
      },
    });

    // Invalidate cache
    await CacheService.delPattern(`${this.CACHE_PREFIX}:*`);
    await CacheService.delPattern(`motor:*`);

    logger.warn(`Config rolled back for motor ${motor.slug} to version ${version}`, {
      motorId,
      version,
      userId,
    });

    return motor;
  }

  /**
   * Compare two config versions
   */
  static async compareVersions(
    motorId: string,
    version1: number,
    version2: number
  ): Promise<{ version1: Prisma.JsonValue; version2: Prisma.JsonValue; diff: any }> {
    const [config1, config2] = await Promise.all([
      this.getVersion(motorId, version1),
      this.getVersion(motorId, version2),
    ]);

    if (!config1 || !config2) {
      throw createError('One or both config versions not found', 404, 'VERSION_NOT_FOUND');
    }

    // Simple diff (in production, use a proper diff library)
    const diff = {
      added: {},
      removed: {},
      modified: {},
    };

    return {
      version1: config1.config,
      version2: config2.config,
      diff,
    };
  }
}
