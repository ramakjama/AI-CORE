/**
 * Sync Manager
 * Coordinates bidirectional synchronization between databases
 */

import {
  DatabaseName,
  SyncConfig,
  SyncEvent,
  SyncStatus,
  SyncStats,
  ChangeRecord,
  ConflictResolution,
  SyncError,
} from '../types';
import { getDatabase, connectionPool } from '../connections';
import { ChangeTracker } from './change-tracker';
import { ConflictResolver } from './conflict-resolver';
import { EventPublisher } from './event-publisher';

// ============================================
// SYNC MANAGER TYPES
// ============================================

export interface SyncResult {
  configId: string;
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  conflicts: ConflictResolution[];
  errors: string[];
}

export interface SyncManagerConfig {
  batchSize: number;
  maxConcurrentSyncs: number;
  retryAttempts: number;
  retryDelayMs: number;
  enableEventPublishing: boolean;
  conflictStrategy: 'source_wins' | 'target_wins' | 'latest_wins' | 'manual';
}

// ============================================
// SYNC MANAGER CLASS
// ============================================

export class SyncManager {
  private static instance: SyncManager;
  private configs: Map<string, SyncConfig> = new Map();
  private runningSync: Set<string> = new Set();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private changeTracker: ChangeTracker;
  private conflictResolver: ConflictResolver;
  private eventPublisher: EventPublisher;
  private config: SyncManagerConfig;

  private constructor(config: Partial<SyncManagerConfig> = {}) {
    this.config = {
      batchSize: 100,
      maxConcurrentSyncs: 5,
      retryAttempts: 3,
      retryDelayMs: 1000,
      enableEventPublishing: true,
      conflictStrategy: 'latest_wins',
      ...config,
    };

    this.changeTracker = new ChangeTracker();
    this.conflictResolver = new ConflictResolver(this.config.conflictStrategy);
    this.eventPublisher = new EventPublisher();
  }

  static getInstance(config?: Partial<SyncManagerConfig>): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(config);
    }
    return SyncManager.instance;
  }

  /**
   * Register a sync configuration
   */
  registerSync(config: SyncConfig): string {
    const configId = this.generateConfigId(config);
    this.configs.set(configId, config);
    console.info(`[SyncManager] Registered sync config: ${configId}`);
    return configId;
  }

  /**
   * Unregister a sync configuration
   */
  unregisterSync(configId: string): void {
    this.stopSync(configId);
    this.configs.delete(configId);
    console.info(`[SyncManager] Unregistered sync config: ${configId}`);
  }

  /**
   * Start automatic sync for a configuration
   */
  startSync(configId: string): void {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Sync config not found: ${configId}`);
    }

    if (this.syncIntervals.has(configId)) {
      console.warn(`[SyncManager] Sync already running for: ${configId}`);
      return;
    }

    const interval = setInterval(() => {
      this.executeSync(configId).catch(err => {
        console.error(`[SyncManager] Sync error for ${configId}:`, err);
      });
    }, config.intervalMs);

    this.syncIntervals.set(configId, interval);
    console.info(`[SyncManager] Started sync for: ${configId}`);

    // Execute immediately
    this.executeSync(configId).catch(console.error);
  }

  /**
   * Stop automatic sync for a configuration
   */
  stopSync(configId: string): void {
    const interval = this.syncIntervals.get(configId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(configId);
      console.info(`[SyncManager] Stopped sync for: ${configId}`);
    }
  }

  /**
   * Execute sync for a configuration
   */
  async executeSync(configId: string): Promise<SyncResult> {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Sync config not found: ${configId}`);
    }

    if (this.runningSync.has(configId)) {
      console.warn(`[SyncManager] Sync already in progress for: ${configId}`);
      return {
        configId,
        success: false,
        startedAt: new Date(),
        completedAt: new Date(),
        recordsProcessed: 0,
        recordsSynced: 0,
        recordsFailed: 0,
        conflicts: [],
        errors: ['Sync already in progress'],
      };
    }

    if (this.runningSync.size >= this.config.maxConcurrentSyncs) {
      throw new Error('Maximum concurrent syncs reached');
    }

    this.runningSync.add(configId);
    const startedAt = new Date();
    const result: SyncResult = {
      configId,
      success: true,
      startedAt,
      completedAt: new Date(),
      recordsProcessed: 0,
      recordsSynced: 0,
      recordsFailed: 0,
      conflicts: [],
      errors: [],
    };

    try {
      // Get changes from source database
      const changes = await this.changeTracker.getChanges(
        config.sourceDatabase,
        config.entities,
        this.config.batchSize
      );

      result.recordsProcessed = changes.length;

      for (const change of changes) {
        try {
          await this.syncChange(config, change, result);
          result.recordsSynced++;
        } catch (error) {
          result.recordsFailed++;
          result.errors.push(
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      // Handle bidirectional sync
      if (config.direction === 'bidirectional') {
        const reverseChanges = await this.changeTracker.getChanges(
          config.targetDatabase,
          config.entities,
          this.config.batchSize
        );

        result.recordsProcessed += reverseChanges.length;

        for (const change of reverseChanges) {
          try {
            await this.syncChange(
              { ...config, sourceDatabase: config.targetDatabase, targetDatabase: config.sourceDatabase },
              change,
              result
            );
            result.recordsSynced++;
          } catch (error) {
            result.recordsFailed++;
            result.errors.push(
              error instanceof Error ? error.message : String(error)
            );
          }
        }
      }

      result.success = result.recordsFailed === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    } finally {
      this.runningSync.delete(configId);
      result.completedAt = new Date();
    }

    console.info(`[SyncManager] Sync completed for ${configId}: ${result.recordsSynced}/${result.recordsProcessed} records synced`);
    return result;
  }

  /**
   * Sync a single change record
   */
  private async syncChange(
    config: SyncConfig,
    change: ChangeRecord,
    result: SyncResult
  ): Promise<void> {
    const targetClient = await getDatabase(config.targetDatabase);

    try {
      // Check for conflicts
      const existingRecord = await this.getTargetRecord(
        targetClient,
        change.tableName,
        change.recordId
      );

      if (existingRecord && change.operation === 'UPDATE') {
        // Check for conflict
        const targetChange = await this.changeTracker.getRecordVersion(
          config.targetDatabase,
          change.tableName,
          change.recordId
        );

        if (targetChange && targetChange.version !== change.version) {
          // Conflict detected
          const resolution = await this.conflictResolver.resolve(
            change,
            targetChange,
            config.conflictStrategy
          );
          result.conflicts.push(resolution);

          if (resolution.resolvedData === null) {
            // Skip this record
            return;
          }

          // Apply resolved data
          await this.applyChange(
            targetClient,
            change.tableName,
            change.recordId,
            'UPDATE',
            resolution.resolvedData
          );
        } else {
          // No conflict, apply change
          await this.applyChange(
            targetClient,
            change.tableName,
            change.recordId,
            change.operation,
            change.newData
          );
        }
      } else {
        // No conflict possible, apply change directly
        await this.applyChange(
          targetClient,
          change.tableName,
          change.recordId,
          change.operation,
          change.operation === 'DELETE' ? null : change.newData
        );
      }

      // Mark change as synced
      await this.changeTracker.markSynced(
        config.sourceDatabase,
        change.id
      );

      // Publish event if enabled
      if (this.config.enableEventPublishing) {
        await this.eventPublisher.publish({
          id: crypto.randomUUID(),
          sourceDatabase: config.sourceDatabase,
          targetDatabase: config.targetDatabase,
          entityType: change.tableName,
          entityId: change.recordId,
          operation: change.operation === 'INSERT' ? 'create' : change.operation === 'DELETE' ? 'delete' : 'update',
          payload: change.newData ?? {},
          version: change.version,
          timestamp: new Date(),
          status: 'completed',
        });
      }
    } finally {
      connectionPool.releaseConnection(config.targetDatabase);
    }
  }

  /**
   * Get record from target database
   */
  private async getTargetRecord(
    client: any,
    tableName: string,
    recordId: string
  ): Promise<Record<string, unknown> | null> {
    try {
      const model = client[tableName];
      if (!model) return null;
      return await model.findUnique({ where: { id: recordId } });
    } catch {
      return null;
    }
  }

  /**
   * Apply change to target database
   */
  private async applyChange(
    client: any,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: Record<string, unknown> | null
  ): Promise<void> {
    const model = client[tableName];
    if (!model) {
      throw new Error(`Model ${tableName} not found`);
    }

    switch (operation) {
      case 'INSERT':
        await model.create({ data: { ...data, id: recordId } });
        break;
      case 'UPDATE':
        await model.update({
          where: { id: recordId },
          data,
        });
        break;
      case 'DELETE':
        await model.delete({ where: { id: recordId } });
        break;
    }
  }

  /**
   * Generate unique config ID
   */
  private generateConfigId(config: SyncConfig): string {
    return `${config.sourceDatabase}->${config.targetDatabase}:${config.entities.join(',')}`;
  }

  /**
   * Get sync statistics
   */
  async getStats(configId: string): Promise<SyncStats | null> {
    const config = this.configs.get(configId);
    if (!config) return null;

    // Get stats from tracking table
    const sourceClient = await getDatabase(config.sourceDatabase);
    try {
      const stats = await (sourceClient as any).syncStats.findFirst({
        where: { configId },
        orderBy: { lastSyncAt: 'desc' },
      });
      return stats;
    } catch {
      return null;
    } finally {
      connectionPool.releaseConnection(config.sourceDatabase);
    }
  }

  /**
   * Get all registered sync configs
   */
  getConfigs(): Map<string, SyncConfig> {
    return new Map(this.configs);
  }

  /**
   * Check if sync is running
   */
  isSyncRunning(configId: string): boolean {
    return this.runningSync.has(configId);
  }

  /**
   * Stop all syncs
   */
  stopAll(): void {
    for (const configId of this.syncIntervals.keys()) {
      this.stopSync(configId);
    }
    console.info('[SyncManager] All syncs stopped');
  }

  /**
   * Force sync for specific entities
   */
  async forceSync(
    sourceDatabase: DatabaseName,
    targetDatabase: DatabaseName,
    entityType: string,
    entityIds: string[]
  ): Promise<SyncResult> {
    const config: SyncConfig = {
      sourceDatabase,
      targetDatabase,
      entities: [entityType],
      direction: 'push',
      conflictStrategy: 'source_wins',
      batchSize: entityIds.length,
      intervalMs: 0,
      enabled: true,
    };

    const configId = this.generateConfigId(config);
    this.configs.set(configId, config);

    // Get specific records
    const sourceClient = await getDatabase(sourceDatabase);
    const records: ChangeRecord[] = [];

    try {
      const model = (sourceClient as any)[entityType];
      if (model) {
        const data = await model.findMany({
          where: { id: { in: entityIds } },
        });

        for (const record of data) {
          records.push({
            id: crypto.randomUUID(),
            database: sourceDatabase,
            tableName: entityType,
            recordId: record.id,
            operation: 'UPDATE',
            oldData: null,
            newData: record,
            changedFields: Object.keys(record),
            changedBy: 'force-sync',
            changedAt: new Date(),
            version: 1,
            checksum: '',
          });
        }
      }
    } finally {
      connectionPool.releaseConnection(sourceDatabase);
    }

    // Sync records
    const result: SyncResult = {
      configId,
      success: true,
      startedAt: new Date(),
      completedAt: new Date(),
      recordsProcessed: records.length,
      recordsSynced: 0,
      recordsFailed: 0,
      conflicts: [],
      errors: [],
    };

    for (const record of records) {
      try {
        await this.syncChange(config, record, result);
        result.recordsSynced++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    result.success = result.recordsFailed === 0;
    result.completedAt = new Date();

    // Clean up temp config
    this.configs.delete(configId);

    return result;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export function getSyncManager(config?: Partial<SyncManagerConfig>): SyncManager {
  return SyncManager.getInstance(config);
}
