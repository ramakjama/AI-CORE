/**
 * AI-MDM Sync Service
 * Handles bidirectional synchronization with external systems
 */

import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import {
  Party,
  SyncRecord,
  SyncConflict,
  SyncStatus,
  SourceSystem,
  ChangelogEntry
} from '../types';
import { getPartiesStore, PartyService } from './party.service';

// In-memory stores
const syncRecords: Map<string, SyncRecord> = new Map();
const syncConflicts: Map<string, SyncConflict[]> = new Map();
const changelog: Map<string, ChangelogEntry[]> = new Map();
const systemConfigs: Map<SourceSystem, SystemConfig> = new Map();

/**
 * System configuration for sync
 */
interface SystemConfig {
  system: SourceSystem;
  priority: number;
  fieldMappings: Record<string, string>;
  conflictResolution: 'SOURCE_WINS' | 'TARGET_WINS' | 'NEWEST_WINS' | 'MANUAL';
  syncInterval?: number; // ms
  enabled: boolean;
  lastSyncAt?: Date;
}

/**
 * Default system priorities
 */
const DEFAULT_PRIORITIES: Record<SourceSystem, number> = {
  [SourceSystem.CORE_INSURANCE]: 100,
  [SourceSystem.CRM]: 90,
  [SourceSystem.AGENT_PORTAL]: 80,
  [SourceSystem.CALL_CENTER]: 70,
  [SourceSystem.WEBSITE]: 60,
  [SourceSystem.MOBILE_APP]: 50,
  [SourceSystem.EXTERNAL_API]: 40,
  [SourceSystem.DATA_IMPORT]: 30,
  [SourceSystem.MANUAL_ENTRY]: 20
};

/**
 * Sync Service
 */
export class SyncService {
  private currentUser: string;
  private partyService: PartyService;

  constructor(currentUser: string = 'system') {
    this.currentUser = currentUser;
    this.partyService = new PartyService(currentUser);
    this.initializeDefaultConfigs();
  }

  /**
   * Set current user for audit
   */
  setCurrentUser(userId: string): void {
    this.currentUser = userId;
    this.partyService.setCurrentUser(userId);
  }

  /**
   * Sync data from an external source system
   */
  async syncFromSource(
    sourceSystem: SourceSystem,
    data: {
      externalId: string;
      partyData: Partial<Party>;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{
    syncRecord: SyncRecord;
    party: Party;
    conflicts: SyncConflict[];
  }> {
    const now = new Date();
    const parties = getPartiesStore();
    const syncRecordId = uuidv4();

    // Find existing party by external ID
    let existingParty: Party | undefined;
    for (const party of parties.values()) {
      if (
        party.sourceSystem === sourceSystem &&
        party.externalId === data.externalId &&
        !party.isDeleted
      ) {
        existingParty = party;
        break;
      }
    }

    // Start sync record
    const syncRecord: SyncRecord = {
      id: syncRecordId,
      partyId: existingParty?.id || '',
      sourceSystem,
      targetSystem: SourceSystem.CORE_INSURANCE, // MDM is the target
      direction: 'INBOUND',
      status: SyncStatus.IN_PROGRESS,
      syncedFields: [],
      conflicts: [],
      startedAt: now,
      retryCount: 0,
      triggeredBy: this.currentUser
    };

    let party: Party;
    const detectedConflicts: SyncConflict[] = [];

    try {
      if (!existingParty) {
        // Create new party
        party = await this.partyService.create({
          ...data.partyData,
          sourceSystem,
          externalId: data.externalId,
          isGoldenRecord: false,
          isActive: true,
          createdBy: this.currentUser
        } as any);

        syncRecord.partyId = party.id;
        syncRecord.syncedFields = Object.keys(data.partyData);
      } else {
        // Update existing party - detect conflicts first
        const conflictingFields = this.detectConflicts(existingParty, data.partyData);

        for (const conflict of conflictingFields) {
          const syncConflict: SyncConflict = {
            id: uuidv4(),
            syncRecordId,
            partyId: existingParty.id,
            fieldPath: conflict.field,
            sourceValue: conflict.sourceValue,
            targetValue: conflict.targetValue,
            sourceUpdatedAt: now,
            targetUpdatedAt: existingParty.updatedAt,
            status: 'PENDING'
          };

          // Auto-resolve based on system config
          const config = systemConfigs.get(sourceSystem);
          if (config) {
            const resolved = this.autoResolveConflict(syncConflict, config);
            if (resolved) {
              syncConflict.status = 'RESOLVED';
              syncConflict.resolution = config.conflictResolution === 'NEWEST_WINS'
                ? (now > existingParty.updatedAt ? 'SOURCE_WINS' : 'TARGET_WINS')
                : config.conflictResolution as any;
              syncConflict.resolvedValue = resolved;
              syncConflict.resolvedAt = now;
              syncConflict.resolvedBy = 'system';
            }
          }

          detectedConflicts.push(syncConflict);
        }

        // Apply non-conflicting updates
        const safeUpdates = this.getSafeUpdates(data.partyData, conflictingFields);

        // Apply resolved conflicts
        for (const conflict of detectedConflicts) {
          if (conflict.status === 'RESOLVED' && conflict.resolvedValue !== undefined) {
            _.set(safeUpdates, conflict.fieldPath, conflict.resolvedValue);
          }
        }

        party = await this.partyService.update(existingParty.id, safeUpdates);
        syncRecord.syncedFields = Object.keys(safeUpdates);
      }

      // Complete sync record
      syncRecord.status = detectedConflicts.some(c => c.status === 'PENDING')
        ? SyncStatus.CONFLICT
        : SyncStatus.COMPLETED;
      syncRecord.completedAt = new Date();
      syncRecord.conflicts = detectedConflicts;

      // Store records
      syncRecords.set(syncRecordId, syncRecord);
      if (detectedConflicts.length > 0) {
        syncConflicts.set(syncRecordId, detectedConflicts);
      }

      // Add to changelog
      this.addChangelogEntry(party.id, 'SYNC', sourceSystem, data.partyData);

    } catch (error) {
      syncRecord.status = SyncStatus.FAILED;
      syncRecord.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      syncRecord.completedAt = new Date();
      syncRecords.set(syncRecordId, syncRecord);

      throw error;
    }

    return {
      syncRecord,
      party,
      conflicts: detectedConflicts
    };
  }

  /**
   * Sync party data to a target system (prepare export)
   */
  async syncToTarget(
    partyId: string,
    targetSystem: SourceSystem
  ): Promise<{
    syncRecord: SyncRecord;
    exportData: Partial<Party>;
  }> {
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    const now = new Date();
    const syncRecordId = uuidv4();

    const config = systemConfigs.get(targetSystem);
    if (!config?.enabled) {
      throw new Error(`Target system not configured or disabled: ${targetSystem}`);
    }

    // Map fields according to system configuration
    const exportData = this.mapFieldsForExport(party, config.fieldMappings);

    const syncRecord: SyncRecord = {
      id: syncRecordId,
      partyId,
      sourceSystem: party.sourceSystem,
      targetSystem,
      direction: 'OUTBOUND',
      status: SyncStatus.COMPLETED,
      syncedFields: Object.keys(exportData),
      startedAt: now,
      completedAt: now,
      retryCount: 0,
      triggeredBy: this.currentUser
    };

    syncRecords.set(syncRecordId, syncRecord);

    // Add to changelog
    this.addChangelogEntry(partyId, 'SYNC', targetSystem, exportData);

    return {
      syncRecord,
      exportData
    };
  }

  /**
   * Get last sync status for a party and system
   */
  async getLastSyncStatus(
    partyId: string,
    system: SourceSystem
  ): Promise<SyncRecord | null> {
    let lastSync: SyncRecord | null = null;

    for (const record of syncRecords.values()) {
      if (record.partyId !== partyId) continue;
      if (record.sourceSystem !== system && record.targetSystem !== system) continue;

      if (!lastSync || record.startedAt > lastSync.startedAt) {
        lastSync = record;
      }
    }

    return lastSync;
  }

  /**
   * Schedule bidirectional sync between systems
   */
  async scheduleBidirectionalSync(
    systems: SourceSystem[]
  ): Promise<{
    jobId: string;
    scheduledSyncs: { system: SourceSystem; nextRunAt: Date }[];
  }> {
    const jobId = uuidv4();
    const now = new Date();
    const scheduledSyncs: { system: SourceSystem; nextRunAt: Date }[] = [];

    for (const system of systems) {
      const config = systemConfigs.get(system);
      if (!config?.enabled) continue;

      const interval = config.syncInterval || 3600000; // Default 1 hour
      const nextRunAt = new Date(now.getTime() + interval);

      config.lastSyncAt = now;
      systemConfigs.set(system, config);

      scheduledSyncs.push({ system, nextRunAt });
    }

    return { jobId, scheduledSyncs };
  }

  /**
   * Handle a specific conflict manually
   */
  async handleConflict(
    partyId: string,
    fieldPath: string,
    resolution: {
      value: unknown;
      resolution: 'SOURCE_WINS' | 'TARGET_WINS' | 'MANUAL' | 'MERGED';
    }
  ): Promise<Party> {
    const parties = getPartiesStore();
    const party = parties.get(partyId);

    if (!party) {
      throw new Error(`Party not found: ${partyId}`);
    }

    // Find pending conflict
    let foundConflict: SyncConflict | undefined;
    let syncRecordId: string | undefined;

    for (const [recordId, conflicts] of syncConflicts) {
      const conflict = conflicts.find(
        c => c.partyId === partyId && c.fieldPath === fieldPath && c.status === 'PENDING'
      );
      if (conflict) {
        foundConflict = conflict;
        syncRecordId = recordId;
        break;
      }
    }

    // Update party with resolved value
    const updates: Partial<Party> = {};
    _.set(updates, fieldPath, resolution.value);
    const updatedParty = await this.partyService.update(partyId, updates);

    // Mark conflict as resolved
    if (foundConflict && syncRecordId) {
      foundConflict.status = 'RESOLVED';
      foundConflict.resolution = resolution.resolution;
      foundConflict.resolvedValue = resolution.value;
      foundConflict.resolvedAt = new Date();
      foundConflict.resolvedBy = this.currentUser;

      // Update sync record status if all conflicts resolved
      const allConflicts = syncConflicts.get(syncRecordId) || [];
      const hasUnresolved = allConflicts.some(c => c.status === 'PENDING');

      const syncRecord = syncRecords.get(syncRecordId);
      if (syncRecord && !hasUnresolved) {
        syncRecord.status = SyncStatus.COMPLETED;
        syncRecords.set(syncRecordId, syncRecord);
      }
    }

    return updatedParty;
  }

  /**
   * Get changelog for a party since a specific date
   */
  async getChangelog(partyId: string, since?: Date): Promise<ChangelogEntry[]> {
    const entries = changelog.get(partyId) || [];

    if (since) {
      return entries.filter(e => e.changedAt >= since);
    }

    return entries;
  }

  /**
   * Get all pending sync conflicts
   */
  async getPendingConflicts(): Promise<{
    syncRecordId: string;
    conflicts: SyncConflict[];
  }[]> {
    const results: { syncRecordId: string; conflicts: SyncConflict[] }[] = [];

    for (const [recordId, conflicts] of syncConflicts) {
      const pending = conflicts.filter(c => c.status === 'PENDING');
      if (pending.length > 0) {
        results.push({ syncRecordId: recordId, conflicts: pending });
      }
    }

    return results;
  }

  /**
   * Configure a source system
   */
  async configureSystem(config: SystemConfig): Promise<void> {
    systemConfigs.set(config.system, config);
  }

  /**
   * Get system configuration
   */
  async getSystemConfig(system: SourceSystem): Promise<SystemConfig | null> {
    return systemConfigs.get(system) || null;
  }

  /**
   * Get all sync records for a party
   */
  async getSyncHistory(partyId: string): Promise<SyncRecord[]> {
    const records: SyncRecord[] = [];

    for (const record of syncRecords.values()) {
      if (record.partyId === partyId) {
        records.push(record);
      }
    }

    return records.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Retry a failed sync
   */
  async retrySync(syncRecordId: string): Promise<SyncRecord> {
    const record = syncRecords.get(syncRecordId);
    if (!record) {
      throw new Error(`Sync record not found: ${syncRecordId}`);
    }

    if (record.status !== SyncStatus.FAILED) {
      throw new Error(`Cannot retry sync with status: ${record.status}`);
    }

    record.status = SyncStatus.PENDING;
    record.retryCount++;
    record.errorMessage = undefined;
    record.errorDetails = undefined;

    syncRecords.set(syncRecordId, record);

    return record;
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Initialize default system configurations
   */
  private initializeDefaultConfigs(): void {
    for (const system of Object.values(SourceSystem)) {
      if (!systemConfigs.has(system)) {
        systemConfigs.set(system, {
          system,
          priority: DEFAULT_PRIORITIES[system] || 50,
          fieldMappings: {},
          conflictResolution: 'NEWEST_WINS',
          enabled: true
        });
      }
    }
  }

  /**
   * Detect conflicts between existing and incoming data
   */
  private detectConflicts(
    existing: Party,
    incoming: Partial<Party>
  ): { field: string; sourceValue: unknown; targetValue: unknown }[] {
    const conflicts: { field: string; sourceValue: unknown; targetValue: unknown }[] = [];

    // Fields to check for conflicts
    const fieldsToCheck = [
      'displayName',
      'individual.firstName',
      'individual.lastName',
      'individual.birthDate',
      'individual.gender',
      'organization.legalName',
      'organization.tradeName'
    ];

    for (const field of fieldsToCheck) {
      const existingValue = _.get(existing, field);
      const incomingValue = _.get(incoming, field);

      if (incomingValue !== undefined && existingValue !== undefined) {
        // Compare values (handling dates)
        const existingStr = existingValue instanceof Date
          ? existingValue.toISOString()
          : JSON.stringify(existingValue);
        const incomingStr = incomingValue instanceof Date
          ? incomingValue.toISOString()
          : JSON.stringify(incomingValue);

        if (existingStr !== incomingStr) {
          conflicts.push({
            field,
            sourceValue: incomingValue,
            targetValue: existingValue
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Auto-resolve conflict based on configuration
   */
  private autoResolveConflict(
    conflict: SyncConflict,
    config: SystemConfig
  ): unknown | undefined {
    switch (config.conflictResolution) {
      case 'SOURCE_WINS':
        return conflict.sourceValue;
      case 'TARGET_WINS':
        return conflict.targetValue;
      case 'NEWEST_WINS':
        return conflict.sourceUpdatedAt > conflict.targetUpdatedAt
          ? conflict.sourceValue
          : conflict.targetValue;
      case 'MANUAL':
      default:
        return undefined;
    }
  }

  /**
   * Get updates that don't conflict
   */
  private getSafeUpdates(
    incoming: Partial<Party>,
    conflicts: { field: string }[]
  ): Partial<Party> {
    const safeUpdates = { ...incoming };
    const conflictFields = new Set(
      conflicts.map(c => c.field.split('.')[0]).filter((f): f is string => f !== undefined)
    );

    // Remove conflicting top-level fields
    for (const field of conflictFields) {
      delete (safeUpdates as Record<string, unknown>)[field];
    }

    return safeUpdates;
  }

  /**
   * Map fields for export to target system
   */
  private mapFieldsForExport(
    party: Party,
    mappings: Record<string, string>
  ): Partial<Party> {
    if (Object.keys(mappings).length === 0) {
      // No mappings, return as-is (minus internal fields)
      const { id, version, createdAt, createdBy, updatedAt, updatedBy, ...exportData } = party;
      return exportData;
    }

    const mapped: Record<string, unknown> = {};

    for (const [sourceField, targetField] of Object.entries(mappings)) {
      const value = _.get(party, sourceField);
      if (value !== undefined) {
        _.set(mapped, targetField, value);
      }
    }

    return mapped as Partial<Party>;
  }

  /**
   * Add entry to changelog
   */
  private addChangelogEntry(
    partyId: string,
    changeType: ChangelogEntry['changeType'],
    sourceSystem: SourceSystem,
    changes: Partial<Party>
  ): void {
    const entries = changelog.get(partyId) || [];

    for (const [field, value] of Object.entries(changes)) {
      entries.push({
        id: uuidv4(),
        partyId,
        changeType,
        fieldPath: field,
        newValue: value,
        sourceSystem,
        changedAt: new Date(),
        changedBy: this.currentUser
      });
    }

    changelog.set(partyId, entries);
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Export store access
export const getSyncRecordsStore = (): Map<string, SyncRecord> => syncRecords;
export const getSyncConflictsStore = (): Map<string, SyncConflict[]> => syncConflicts;
export const getChangelogStore = (): Map<string, ChangelogEntry[]> => changelog;

export default SyncService;
