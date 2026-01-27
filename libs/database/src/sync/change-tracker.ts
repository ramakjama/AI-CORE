/**
 * Change Tracker
 * Detects and tracks changes in databases for synchronization
 */

import { DatabaseName, ChangeRecord } from '../types';
import { getDatabase, connectionPool } from '../connections';
import crypto from 'crypto';

// ============================================
// CHANGE TRACKER TYPES
// ============================================

export interface ChangeTrackerConfig {
  trackingTableName: string;
  checksumAlgorithm: 'md5' | 'sha256';
  includeOldData: boolean;
  maxChangesPerQuery: number;
}

export interface ChangeSnapshot {
  database: DatabaseName;
  tableName: string;
  recordId: string;
  checksum: string;
  version: number;
  capturedAt: Date;
}

// ============================================
// CHANGE TRACKER CLASS
// ============================================

export class ChangeTracker {
  private config: ChangeTrackerConfig;
  private snapshots: Map<string, ChangeSnapshot> = new Map();

  constructor(config: Partial<ChangeTrackerConfig> = {}) {
    this.config = {
      trackingTableName: '_sync_change_log',
      checksumAlgorithm: 'md5',
      includeOldData: true,
      maxChangesPerQuery: 1000,
      ...config,
    };
  }

  /**
   * Get unsynced changes from a database
   */
  async getChanges(
    database: DatabaseName,
    entities: string[],
    limit?: number
  ): Promise<ChangeRecord[]> {
    const client = await getDatabase(database);

    try {
      // Check if change tracking table exists
      const hasTrackingTable = await this.hasTrackingTable(client);

      if (hasTrackingTable) {
        // Use change tracking table
        return this.getChangesFromTrackingTable(client, database, entities, limit);
      } else {
        // Use snapshot-based change detection
        return this.getChangesFromSnapshots(client, database, entities, limit);
      }
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Get changes from tracking table
   */
  private async getChangesFromTrackingTable(
    client: any,
    database: DatabaseName,
    entities: string[],
    limit?: number
  ): Promise<ChangeRecord[]> {
    try {
      const changes = await client.$queryRawUnsafe(`
        SELECT * FROM ${this.config.trackingTableName}
        WHERE table_name IN (${entities.map(e => `'${e}'`).join(',')})
        AND synced = false
        ORDER BY changed_at ASC
        LIMIT ${limit ?? this.config.maxChangesPerQuery}
      `);

      return (changes as any[]).map(change => ({
        id: change.id,
        database,
        tableName: change.table_name,
        recordId: change.record_id,
        operation: change.operation,
        oldData: change.old_data ? JSON.parse(change.old_data) : null,
        newData: change.new_data ? JSON.parse(change.new_data) : null,
        changedFields: change.changed_fields ? JSON.parse(change.changed_fields) : [],
        changedBy: change.changed_by,
        changedAt: new Date(change.changed_at),
        version: change.version,
        checksum: change.checksum,
      }));
    } catch (error) {
      console.error('[ChangeTracker] Error fetching changes:', error);
      return [];
    }
  }

  /**
   * Get changes using snapshot comparison
   */
  private async getChangesFromSnapshots(
    client: any,
    database: DatabaseName,
    entities: string[],
    limit?: number
  ): Promise<ChangeRecord[]> {
    const changes: ChangeRecord[] = [];
    const maxPerEntity = Math.floor((limit ?? this.config.maxChangesPerQuery) / entities.length);

    for (const entity of entities) {
      try {
        const model = client[entity];
        if (!model) continue;

        // Get recent records
        const records = await model.findMany({
          orderBy: { updatedAt: 'desc' },
          take: maxPerEntity,
        });

        for (const record of records) {
          const snapshotKey = `${database}:${entity}:${record.id}`;
          const currentChecksum = this.calculateChecksum(record);
          const snapshot = this.snapshots.get(snapshotKey);

          if (!snapshot) {
            // New record
            changes.push({
              id: crypto.randomUUID(),
              database,
              tableName: entity,
              recordId: record.id,
              operation: 'INSERT',
              oldData: null,
              newData: record,
              changedFields: Object.keys(record),
              changedBy: record.updatedBy ?? 'system',
              changedAt: record.updatedAt ?? new Date(),
              version: 1,
              checksum: currentChecksum,
            });
          } else if (snapshot.checksum !== currentChecksum) {
            // Modified record
            changes.push({
              id: crypto.randomUUID(),
              database,
              tableName: entity,
              recordId: record.id,
              operation: 'UPDATE',
              oldData: null, // Not available in snapshot mode
              newData: record,
              changedFields: Object.keys(record),
              changedBy: record.updatedBy ?? 'system',
              changedAt: record.updatedAt ?? new Date(),
              version: snapshot.version + 1,
              checksum: currentChecksum,
            });
          }

          // Update snapshot
          this.snapshots.set(snapshotKey, {
            database,
            tableName: entity,
            recordId: record.id,
            checksum: currentChecksum,
            version: snapshot ? snapshot.version + 1 : 1,
            capturedAt: new Date(),
          });
        }
      } catch (error) {
        console.error(`[ChangeTracker] Error processing ${entity}:`, error);
      }
    }

    return changes.slice(0, limit ?? this.config.maxChangesPerQuery);
  }

  /**
   * Get version of a specific record
   */
  async getRecordVersion(
    database: DatabaseName,
    tableName: string,
    recordId: string
  ): Promise<ChangeRecord | null> {
    const client = await getDatabase(database);

    try {
      const hasTrackingTable = await this.hasTrackingTable(client);

      if (hasTrackingTable) {
        const change = await client.$queryRawUnsafe(`
          SELECT * FROM ${this.config.trackingTableName}
          WHERE table_name = '${tableName}'
          AND record_id = '${recordId}'
          ORDER BY version DESC
          LIMIT 1
        `);

        if ((change as any[]).length === 0) return null;

        const c = (change as any[])[0];
        return {
          id: c.id,
          database,
          tableName: c.table_name,
          recordId: c.record_id,
          operation: c.operation,
          oldData: c.old_data ? JSON.parse(c.old_data) : null,
          newData: c.new_data ? JSON.parse(c.new_data) : null,
          changedFields: c.changed_fields ? JSON.parse(c.changed_fields) : [],
          changedBy: c.changed_by,
          changedAt: new Date(c.changed_at),
          version: c.version,
          checksum: c.checksum,
        };
      } else {
        // Use snapshot
        const snapshotKey = `${database}:${tableName}:${recordId}`;
        const snapshot = this.snapshots.get(snapshotKey);

        if (!snapshot) return null;

        return {
          id: crypto.randomUUID(),
          database,
          tableName,
          recordId,
          operation: 'UPDATE',
          oldData: null,
          newData: null,
          changedFields: [],
          changedBy: 'system',
          changedAt: snapshot.capturedAt,
          version: snapshot.version,
          checksum: snapshot.checksum,
        };
      }
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Mark a change as synced
   */
  async markSynced(database: DatabaseName, changeId: string): Promise<void> {
    const client = await getDatabase(database);

    try {
      const hasTrackingTable = await this.hasTrackingTable(client);

      if (hasTrackingTable) {
        await client.$executeRawUnsafe(`
          UPDATE ${this.config.trackingTableName}
          SET synced = true, synced_at = NOW()
          WHERE id = '${changeId}'
        `);
      }
      // For snapshot mode, nothing to mark as synced
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Track a change manually
   */
  async trackChange(
    database: DatabaseName,
    tableName: string,
    recordId: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null,
    changedBy: string
  ): Promise<ChangeRecord> {
    const client = await getDatabase(database);

    try {
      const changedFields = this.getChangedFields(oldData, newData);
      const checksum = this.calculateChecksum(newData ?? {});
      const version = await this.getNextVersion(database, tableName, recordId);

      const change: ChangeRecord = {
        id: crypto.randomUUID(),
        database,
        tableName,
        recordId,
        operation,
        oldData,
        newData,
        changedFields,
        changedBy,
        changedAt: new Date(),
        version,
        checksum,
      };

      const hasTrackingTable = await this.hasTrackingTable(client);

      if (hasTrackingTable) {
        await client.$executeRawUnsafe(`
          INSERT INTO ${this.config.trackingTableName}
          (id, table_name, record_id, operation, old_data, new_data, changed_fields, changed_by, changed_at, version, checksum, synced)
          VALUES (
            '${change.id}',
            '${tableName}',
            '${recordId}',
            '${operation}',
            ${oldData ? `'${JSON.stringify(oldData)}'` : 'NULL'},
            ${newData ? `'${JSON.stringify(newData)}'` : 'NULL'},
            '${JSON.stringify(changedFields)}',
            '${changedBy}',
            NOW(),
            ${version},
            '${checksum}',
            false
          )
        `);
      }

      // Update snapshot
      const snapshotKey = `${database}:${tableName}:${recordId}`;
      if (operation === 'DELETE') {
        this.snapshots.delete(snapshotKey);
      } else {
        this.snapshots.set(snapshotKey, {
          database,
          tableName,
          recordId,
          checksum,
          version,
          capturedAt: new Date(),
        });
      }

      return change;
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Create tracking table in database
   */
  async createTrackingTable(database: DatabaseName): Promise<void> {
    const client = await getDatabase(database);

    try {
      await client.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${this.config.trackingTableName} (
          id UUID PRIMARY KEY,
          table_name VARCHAR(255) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          operation VARCHAR(10) NOT NULL,
          old_data JSONB,
          new_data JSONB,
          changed_fields JSONB,
          changed_by VARCHAR(255),
          changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          version INTEGER NOT NULL DEFAULT 1,
          checksum VARCHAR(64),
          synced BOOLEAN NOT NULL DEFAULT false,
          synced_at TIMESTAMP,
          CONSTRAINT chk_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
        );

        CREATE INDEX IF NOT EXISTS idx_change_log_table ON ${this.config.trackingTableName}(table_name);
        CREATE INDEX IF NOT EXISTS idx_change_log_synced ON ${this.config.trackingTableName}(synced);
        CREATE INDEX IF NOT EXISTS idx_change_log_record ON ${this.config.trackingTableName}(table_name, record_id);
      `);

      console.info(`[ChangeTracker] Created tracking table in ${database}`);
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Clear old synced changes
   */
  async clearOldChanges(database: DatabaseName, olderThanDays: number): Promise<number> {
    const client = await getDatabase(database);

    try {
      const hasTrackingTable = await this.hasTrackingTable(client);
      if (!hasTrackingTable) return 0;

      const result = await client.$executeRawUnsafe(`
        DELETE FROM ${this.config.trackingTableName}
        WHERE synced = true
        AND synced_at < NOW() - INTERVAL '${olderThanDays} days'
      `);

      return result as number;
    } finally {
      connectionPool.releaseConnection(database);
    }
  }

  /**
   * Check if tracking table exists
   */
  private async hasTrackingTable(client: any): Promise<boolean> {
    try {
      await client.$queryRawUnsafe(`SELECT 1 FROM ${this.config.trackingTableName} LIMIT 1`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate checksum for data
   */
  private calculateChecksum(data: Record<string, unknown>): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto
      .createHash(this.config.checksumAlgorithm)
      .update(content)
      .digest('hex');
  }

  /**
   * Get changed fields between old and new data
   */
  private getChangedFields(
    oldData: Record<string, unknown> | null,
    newData: Record<string, unknown> | null
  ): string[] {
    if (!oldData) return newData ? Object.keys(newData) : [];
    if (!newData) return Object.keys(oldData);

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changedFields: string[] = [];

    for (const key of allKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Get next version number for a record
   */
  private async getNextVersion(
    database: DatabaseName,
    tableName: string,
    recordId: string
  ): Promise<number> {
    const current = await this.getRecordVersion(database, tableName, recordId);
    return current ? current.version + 1 : 1;
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
  }

  /**
   * Get snapshot count
   */
  getSnapshotCount(): number {
    return this.snapshots.size;
  }
}
