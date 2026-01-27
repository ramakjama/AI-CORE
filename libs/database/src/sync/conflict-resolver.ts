/**
 * Conflict Resolver
 * Resolves synchronization conflicts between databases
 */

import {
  ChangeRecord,
  ConflictResolution,
  ConflictStrategy,
  DatabaseName,
} from '../types';

// ============================================
// CONFLICT RESOLVER TYPES
// ============================================

export interface ConflictResolverConfig {
  defaultStrategy: ConflictStrategy;
  entityStrategies: Map<string, ConflictStrategy>;
  fieldPriorities: Map<string, 'source' | 'target'>;
  mergeableFields: string[];
  nonMergeableFields: string[];
}

export interface ConflictDetails {
  conflictType: 'update_update' | 'update_delete' | 'delete_update';
  conflictingFields: string[];
  sourceTimestamp: Date;
  targetTimestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MergeResult {
  success: boolean;
  mergedData: Record<string, unknown> | null;
  mergedFields: string[];
  conflictingFields: string[];
  resolutionNotes: string[];
}

// ============================================
// CONFLICT RESOLVER CLASS
// ============================================

export class ConflictResolver {
  private config: ConflictResolverConfig;
  private resolutionHistory: ConflictResolution[] = [];

  constructor(defaultStrategy: ConflictStrategy = 'latest_wins') {
    this.config = {
      defaultStrategy,
      entityStrategies: new Map(),
      fieldPriorities: new Map(),
      mergeableFields: ['metadata', 'tags', 'notes', 'description'],
      nonMergeableFields: ['id', 'createdAt', 'version', 'checksum'],
    };
  }

  /**
   * Resolve a conflict between source and target records
   */
  async resolve(
    sourceRecord: ChangeRecord,
    targetRecord: ChangeRecord,
    strategy?: ConflictStrategy
  ): Promise<ConflictResolution> {
    const effectiveStrategy = this.getEffectiveStrategy(
      sourceRecord.tableName,
      strategy
    );

    const conflictDetails = this.analyzeConflict(sourceRecord, targetRecord);
    let resolvedData: Record<string, unknown> | null = null;
    let resolvedBy: 'auto' | 'manual' = 'auto';
    const notes: string[] = [];

    switch (effectiveStrategy) {
      case 'source_wins':
        resolvedData = sourceRecord.newData;
        notes.push('Resolved using source_wins strategy');
        break;

      case 'target_wins':
        resolvedData = targetRecord.newData;
        notes.push('Resolved using target_wins strategy');
        break;

      case 'latest_wins':
        if (sourceRecord.changedAt >= targetRecord.changedAt) {
          resolvedData = sourceRecord.newData;
          notes.push(`Resolved using latest_wins: source is newer (${sourceRecord.changedAt.toISOString()})`);
        } else {
          resolvedData = targetRecord.newData;
          notes.push(`Resolved using latest_wins: target is newer (${targetRecord.changedAt.toISOString()})`);
        }
        break;

      case 'merge':
        const mergeResult = this.mergeRecords(sourceRecord, targetRecord);
        if (mergeResult.success) {
          resolvedData = mergeResult.mergedData;
          notes.push(...mergeResult.resolutionNotes);
        } else {
          // Fallback to latest_wins if merge fails
          resolvedData = sourceRecord.changedAt >= targetRecord.changedAt
            ? sourceRecord.newData
            : targetRecord.newData;
          notes.push('Merge failed, fell back to latest_wins');
          notes.push(`Conflicting fields: ${mergeResult.conflictingFields.join(', ')}`);
        }
        break;

      case 'manual':
        resolvedData = null;
        resolvedBy = 'manual';
        notes.push('Manual resolution required');
        break;

      default:
        resolvedData = sourceRecord.newData;
        notes.push('Resolved using default (source_wins)');
    }

    const resolution: ConflictResolution = {
      id: crypto.randomUUID(),
      syncEventId: sourceRecord.id,
      sourceRecord,
      targetRecord,
      conflictType: conflictDetails.conflictType,
      strategy: effectiveStrategy,
      resolvedData,
      resolvedBy,
      resolvedAt: new Date(),
      notes: notes.join('; '),
    };

    this.resolutionHistory.push(resolution);
    return resolution;
  }

  /**
   * Analyze the conflict to determine type and severity
   */
  analyzeConflict(
    sourceRecord: ChangeRecord,
    targetRecord: ChangeRecord
  ): ConflictDetails {
    let conflictType: ConflictDetails['conflictType'];

    if (sourceRecord.operation === 'DELETE') {
      conflictType = 'delete_update';
    } else if (targetRecord.operation === 'DELETE') {
      conflictType = 'update_delete';
    } else {
      conflictType = 'update_update';
    }

    // Find conflicting fields
    const conflictingFields = this.findConflictingFields(
      sourceRecord.newData,
      targetRecord.newData,
      sourceRecord.changedFields,
      targetRecord.changedFields
    );

    // Determine severity
    const severity = this.calculateSeverity(conflictType, conflictingFields);

    return {
      conflictType,
      conflictingFields,
      sourceTimestamp: sourceRecord.changedAt,
      targetTimestamp: targetRecord.changedAt,
      severity,
    };
  }

  /**
   * Find fields that have conflicting values
   */
  private findConflictingFields(
    sourceData: Record<string, unknown> | null,
    targetData: Record<string, unknown> | null,
    sourceChangedFields: string[],
    targetChangedFields: string[]
  ): string[] {
    if (!sourceData || !targetData) return [];

    const commonChangedFields = sourceChangedFields.filter(
      field => targetChangedFields.includes(field)
    );

    return commonChangedFields.filter(field => {
      const sourceValue = JSON.stringify(sourceData[field]);
      const targetValue = JSON.stringify(targetData[field]);
      return sourceValue !== targetValue;
    });
  }

  /**
   * Calculate conflict severity
   */
  private calculateSeverity(
    conflictType: ConflictDetails['conflictType'],
    conflictingFields: string[]
  ): ConflictDetails['severity'] {
    // Delete conflicts are always high severity
    if (conflictType !== 'update_update') {
      return 'high';
    }

    // Check for critical fields
    const criticalFields = ['status', 'amount', 'premium', 'balance'];
    const hasCriticalConflict = conflictingFields.some(
      field => criticalFields.includes(field)
    );

    if (hasCriticalConflict) {
      return 'critical';
    }

    // Based on number of conflicts
    if (conflictingFields.length > 5) {
      return 'high';
    } else if (conflictingFields.length > 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Merge two records field by field
   */
  mergeRecords(
    sourceRecord: ChangeRecord,
    targetRecord: ChangeRecord
  ): MergeResult {
    const sourceData = sourceRecord.newData ?? {};
    const targetData = targetRecord.newData ?? {};

    const mergedData: Record<string, unknown> = {};
    const mergedFields: string[] = [];
    const conflictingFields: string[] = [];
    const resolutionNotes: string[] = [];

    const allFields = new Set([
      ...Object.keys(sourceData),
      ...Object.keys(targetData),
    ]);

    for (const field of allFields) {
      // Skip non-mergeable fields - use source
      if (this.config.nonMergeableFields.includes(field)) {
        mergedData[field] = sourceData[field] ?? targetData[field];
        continue;
      }

      const sourceValue = sourceData[field];
      const targetValue = targetData[field];
      const sourceChanged = sourceRecord.changedFields.includes(field);
      const targetChanged = targetRecord.changedFields.includes(field);

      if (JSON.stringify(sourceValue) === JSON.stringify(targetValue)) {
        // No conflict
        mergedData[field] = sourceValue;
      } else if (sourceChanged && !targetChanged) {
        // Only source changed
        mergedData[field] = sourceValue;
        mergedFields.push(field);
        resolutionNotes.push(`${field}: used source value (only source changed)`);
      } else if (!sourceChanged && targetChanged) {
        // Only target changed
        mergedData[field] = targetValue;
        mergedFields.push(field);
        resolutionNotes.push(`${field}: used target value (only target changed)`);
      } else if (this.config.fieldPriorities.has(field)) {
        // Use configured priority
        const priority = this.config.fieldPriorities.get(field);
        mergedData[field] = priority === 'source' ? sourceValue : targetValue;
        mergedFields.push(field);
        resolutionNotes.push(`${field}: used ${priority} value (configured priority)`);
      } else if (this.config.mergeableFields.includes(field)) {
        // Try to merge the field
        const merged = this.mergeFieldValues(sourceValue, targetValue);
        if (merged !== null) {
          mergedData[field] = merged;
          mergedFields.push(field);
          resolutionNotes.push(`${field}: merged values`);
        } else {
          conflictingFields.push(field);
        }
      } else {
        // Use latest value
        if (sourceRecord.changedAt >= targetRecord.changedAt) {
          mergedData[field] = sourceValue;
          resolutionNotes.push(`${field}: used source value (newer)`);
        } else {
          mergedData[field] = targetValue;
          resolutionNotes.push(`${field}: used target value (newer)`);
        }
        mergedFields.push(field);
      }
    }

    return {
      success: conflictingFields.length === 0,
      mergedData: conflictingFields.length === 0 ? mergedData : null,
      mergedFields,
      conflictingFields,
      resolutionNotes,
    };
  }

  /**
   * Try to merge two field values
   */
  private mergeFieldValues(
    sourceValue: unknown,
    targetValue: unknown
  ): unknown {
    // Merge arrays
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      const merged = [...new Set([...sourceValue, ...targetValue])];
      return merged;
    }

    // Merge objects
    if (
      typeof sourceValue === 'object' &&
      typeof targetValue === 'object' &&
      sourceValue !== null &&
      targetValue !== null &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      return {
        ...(targetValue as Record<string, unknown>),
        ...(sourceValue as Record<string, unknown>),
      };
    }

    // Concatenate strings (for notes/descriptions)
    if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
      if (sourceValue.includes(targetValue)) return sourceValue;
      if (targetValue.includes(sourceValue)) return targetValue;
      return `${targetValue}\n---\n${sourceValue}`;
    }

    // Can't merge other types
    return null;
  }

  /**
   * Get effective strategy for an entity
   */
  private getEffectiveStrategy(
    entityType: string,
    overrideStrategy?: ConflictStrategy
  ): ConflictStrategy {
    if (overrideStrategy) return overrideStrategy;
    return this.config.entityStrategies.get(entityType) ?? this.config.defaultStrategy;
  }

  /**
   * Set strategy for a specific entity type
   */
  setEntityStrategy(entityType: string, strategy: ConflictStrategy): void {
    this.config.entityStrategies.set(entityType, strategy);
  }

  /**
   * Set field priority
   */
  setFieldPriority(field: string, priority: 'source' | 'target'): void {
    this.config.fieldPriorities.set(field, priority);
  }

  /**
   * Add mergeable field
   */
  addMergeableField(field: string): void {
    if (!this.config.mergeableFields.includes(field)) {
      this.config.mergeableFields.push(field);
    }
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(): ConflictResolution[] {
    return [...this.resolutionHistory];
  }

  /**
   * Get resolutions by conflict type
   */
  getResolutionsByType(
    conflictType: ConflictDetails['conflictType']
  ): ConflictResolution[] {
    return this.resolutionHistory.filter(r => r.conflictType === conflictType);
  }

  /**
   * Get manual resolutions pending
   */
  getManualResolutionsPending(): ConflictResolution[] {
    return this.resolutionHistory.filter(
      r => r.resolvedBy === 'manual' && r.resolvedData === null
    );
  }

  /**
   * Manually resolve a conflict
   */
  manualResolve(
    resolutionId: string,
    resolvedData: Record<string, unknown>,
    notes?: string
  ): ConflictResolution | null {
    const resolution = this.resolutionHistory.find(r => r.id === resolutionId);
    if (!resolution) return null;

    resolution.resolvedData = resolvedData;
    resolution.resolvedAt = new Date();
    resolution.notes = notes ?? resolution.notes;

    return resolution;
  }

  /**
   * Clear resolution history
   */
  clearHistory(): void {
    this.resolutionHistory = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalResolutions: number;
    byStrategy: Record<ConflictStrategy, number>;
    byConflictType: Record<string, number>;
    autoResolved: number;
    manualResolved: number;
    pendingManual: number;
  } {
    const stats = {
      totalResolutions: this.resolutionHistory.length,
      byStrategy: {} as Record<ConflictStrategy, number>,
      byConflictType: {} as Record<string, number>,
      autoResolved: 0,
      manualResolved: 0,
      pendingManual: 0,
    };

    for (const resolution of this.resolutionHistory) {
      // By strategy
      stats.byStrategy[resolution.strategy] =
        (stats.byStrategy[resolution.strategy] ?? 0) + 1;

      // By conflict type
      stats.byConflictType[resolution.conflictType] =
        (stats.byConflictType[resolution.conflictType] ?? 0) + 1;

      // Resolution type
      if (resolution.resolvedBy === 'auto') {
        stats.autoResolved++;
      } else if (resolution.resolvedData !== null) {
        stats.manualResolved++;
      } else {
        stats.pendingManual++;
      }
    }

    return stats;
  }
}

// ============================================
// FACTORY FUNCTION
// ============================================

let conflictResolverInstance: ConflictResolver | null = null;

export function getConflictResolver(
  defaultStrategy: ConflictStrategy = 'latest_wins'
): ConflictResolver {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver(defaultStrategy);
  }
  return conflictResolverInstance;
}
