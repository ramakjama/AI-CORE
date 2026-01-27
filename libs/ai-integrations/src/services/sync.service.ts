/**
 * Sync Service
 * Gestión de sincronización de datos entre sistemas
 */

import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';
import {
  SyncJob,
  SyncMapping,
  SyncStatus,
  SyncLog,
  SyncStats,
  SyncConflict,
  SyncError,
  SyncDirection,
  OperationResult,
  PaginatedResult,
  QueryFilters
} from '../types';

/**
 * Almacenamiento en memoria (reemplazar por base de datos en producción)
 */
const syncJobs: Map<string, SyncJob> = new Map();
const syncLogs: Map<string, SyncLog[]> = new Map();
const syncConflicts: Map<string, SyncConflict[]> = new Map();
const scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Tipo para cambios de datos
 */
interface DataChange {
  id: string;
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: Date;
  sourceId?: string;
}

/**
 * Servicio de Sincronización
 */
export class SyncService {
  private tenantId: string;
  private integrationService: {
    executeRequest: <T>(integrationId: string, config: unknown) => Promise<OperationResult<T>>
  };

  constructor(
    tenantId: string,
    integrationService: {
      executeRequest: <T>(integrationId: string, config: unknown) => Promise<OperationResult<T>>
    }
  ) {
    this.tenantId = tenantId;
    this.integrationService = integrationService;
  }

  /**
   * Crear un trabajo de sincronización
   */
  async createSyncJob(
    integrationId: string,
    mapping: Omit<SyncMapping, 'id'>,
    options?: {
      name?: string;
      description?: string;
      schedule?: string;
    }
  ): Promise<OperationResult<SyncJob>> {
    try {
      const id = uuidv4();
      const mappingId = uuidv4();
      const now = new Date();

      const syncMapping: SyncMapping = {
        id: mappingId,
        ...mapping
      };

      const syncJob: SyncJob = {
        id,
        integrationId,
        name: options?.name || `Sync Job ${id.substring(0, 8)}`,
        description: options?.description,
        mapping: syncMapping,
        schedule: options?.schedule,
        status: SyncStatus.PENDING,
        enabled: true,
        createdAt: now,
        updatedAt: now
      };

      // Si hay schedule, calcular próxima ejecución
      if (options?.schedule && cron.validate(options.schedule)) {
        syncJob.nextRun = this.getNextRunDate(options.schedule);
      }

      syncJobs.set(id, syncJob);
      syncLogs.set(id, []);
      syncConflicts.set(id, []);

      return {
        success: true,
        data: syncJob
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create sync job'
        }
      };
    }
  }

  /**
   * Ejecutar sincronización
   */
  async runSync(jobId: string): Promise<OperationResult<SyncLog>> {
    const startTime = Date.now();

    try {
      const job = syncJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Sync job ${jobId} not found`
          }
        };
      }

      if (!job.enabled) {
        return {
          success: false,
          error: {
            code: 'DISABLED',
            message: 'Sync job is disabled'
          }
        };
      }

      // Crear log de sincronización
      const logId = uuidv4();
      const syncLog: SyncLog = {
        id: logId,
        jobId,
        status: SyncStatus.RUNNING,
        startTime: new Date(),
        errors: [],
        warnings: []
      };

      // Actualizar estado del job
      job.status = SyncStatus.RUNNING;
      job.updatedAt = new Date();

      const stats: SyncStats = {
        totalRecords: 0,
        processedRecords: 0,
        createdRecords: 0,
        updatedRecords: 0,
        deletedRecords: 0,
        skippedRecords: 0,
        failedRecords: 0,
        conflicts: 0,
        duration: 0
      };

      const errors: SyncError[] = [];

      try {
        // Obtener cambios desde origen
        const changes = await this.getChangesFromSource(
          job.integrationId,
          job.lastRun
        );

        if (!changes.success || !changes.data) {
          throw new Error(changes.error?.message || 'Failed to get changes from source');
        }

        stats.totalRecords = changes.data.length;

        // Procesar cada cambio
        for (const change of changes.data) {
          try {
            const result = await this.processChange(job, change);

            if (result.success) {
              stats.processedRecords++;
              switch (change.operation) {
                case 'create':
                  stats.createdRecords++;
                  break;
                case 'update':
                  stats.updatedRecords++;
                  break;
                case 'delete':
                  stats.deletedRecords++;
                  break;
              }
            } else if (result.conflict) {
              stats.conflicts++;
              // Guardar conflicto
              await this.saveConflict(jobId, logId, change, result.targetData);
            } else {
              stats.failedRecords++;
              errors.push({
                recordId: change.id,
                error: result.error || 'Unknown error',
                details: change.data
              });
            }
          } catch (changeError) {
            stats.failedRecords++;
            errors.push({
              recordId: change.id,
              error: changeError instanceof Error ? changeError.message : 'Processing error'
            });
          }
        }

        // Si es bidireccional, sincronizar en dirección opuesta
        if (job.mapping.direction === SyncDirection.BIDIRECTIONAL) {
          const reverseChanges = await this.getLocalChanges(job, job.lastRun);

          for (const change of reverseChanges) {
            try {
              await this.pushChangesToTarget(job.integrationId, [change]);
              stats.processedRecords++;
            } catch (pushError) {
              stats.failedRecords++;
              errors.push({
                recordId: change.id,
                error: pushError instanceof Error ? pushError.message : 'Push error'
              });
            }
          }
        }

        stats.duration = Date.now() - startTime;

        // Determinar estado final
        syncLog.status = errors.length === 0
          ? SyncStatus.COMPLETED
          : stats.processedRecords > 0
            ? SyncStatus.PARTIAL
            : SyncStatus.FAILED;

        syncLog.endTime = new Date();
        syncLog.stats = stats;
        syncLog.errors = errors;

        // Actualizar job
        job.status = syncLog.status;
        job.lastRun = new Date();
        job.stats = stats;
        if (job.schedule) {
          job.nextRun = this.getNextRunDate(job.schedule);
        }
        job.updatedAt = new Date();

      } catch (syncError) {
        syncLog.status = SyncStatus.FAILED;
        syncLog.endTime = new Date();
        syncLog.errors = [{
          recordId: 'SYNC',
          error: syncError instanceof Error ? syncError.message : 'Sync failed'
        }];

        job.status = SyncStatus.FAILED;
        job.updatedAt = new Date();
      }

      // Guardar log
      const logs = syncLogs.get(jobId) || [];
      logs.push(syncLog);
      syncLogs.set(jobId, logs);

      return {
        success: syncLog.status !== SyncStatus.FAILED,
        data: syncLog
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'Sync failed'
        }
      };
    }
  }

  /**
   * Programar sincronización periódica
   */
  async scheduleSync(jobId: string, cronExpression: string): Promise<OperationResult<SyncJob>> {
    try {
      const job = syncJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Sync job ${jobId} not found`
          }
        };
      }

      // Validar expresión cron
      if (!cron.validate(cronExpression)) {
        return {
          success: false,
          error: {
            code: 'INVALID_CRON',
            message: 'Invalid cron expression'
          }
        };
      }

      // Cancelar tarea existente si hay
      const existingTask = scheduledTasks.get(jobId);
      if (existingTask) {
        existingTask.stop();
      }

      // Crear nueva tarea programada
      const task = cron.schedule(cronExpression, async () => {
        await this.runSync(jobId);
      });

      scheduledTasks.set(jobId, task);

      // Actualizar job
      job.schedule = cronExpression;
      job.status = SyncStatus.SCHEDULED;
      job.nextRun = this.getNextRunDate(cronExpression);
      job.updatedAt = new Date();

      return {
        success: true,
        data: job
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEDULE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to schedule sync'
        }
      };
    }
  }

  /**
   * Pausar sincronización
   */
  async pauseSync(jobId: string): Promise<OperationResult<SyncJob>> {
    try {
      const job = syncJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Sync job ${jobId} not found`
          }
        };
      }

      // Pausar tarea programada
      const task = scheduledTasks.get(jobId);
      if (task) {
        task.stop();
      }

      job.status = SyncStatus.PAUSED;
      job.enabled = false;
      job.updatedAt = new Date();

      return {
        success: true,
        data: job
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAUSE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pause sync'
        }
      };
    }
  }

  /**
   * Reanudar sincronización
   */
  async resumeSync(jobId: string): Promise<OperationResult<SyncJob>> {
    try {
      const job = syncJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Sync job ${jobId} not found`
          }
        };
      }

      // Reanudar tarea programada
      if (job.schedule) {
        const task = scheduledTasks.get(jobId);
        if (task) {
          task.start();
        } else {
          await this.scheduleSync(jobId, job.schedule);
        }
        job.status = SyncStatus.SCHEDULED;
        job.nextRun = this.getNextRunDate(job.schedule);
      } else {
        job.status = SyncStatus.PENDING;
      }

      job.enabled = true;
      job.updatedAt = new Date();

      return {
        success: true,
        data: job
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESUME_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resume sync'
        }
      };
    }
  }

  /**
   * Obtener historial de sincronización
   */
  async getSyncHistory(
    jobId: string,
    filters?: QueryFilters
  ): Promise<PaginatedResult<SyncLog>> {
    const logs = syncLogs.get(jobId) || [];

    let filtered = [...logs];

    // Filtrar por fecha
    if (filters?.dateFrom) {
      filtered = filtered.filter(l => l.startTime >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(l => l.startTime <= filters.dateTo!);
    }

    // Filtrar por estado
    if (filters?.filters?.status) {
      filtered = filtered.filter(l => l.status === filters.filters!.status);
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    // Paginar
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      hasNext: end < filtered.length,
      hasPrevious: page > 1
    };
  }

  /**
   * Resolver conflicto de sincronización
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'source' | 'target' | 'merged',
    mergedData?: Record<string, unknown>
  ): Promise<OperationResult<SyncConflict>> {
    try {
      // Buscar conflicto en todos los jobs
      let foundConflict: SyncConflict | undefined;
      let jobId: string | undefined;

      for (const [jId, conflicts] of syncConflicts) {
        const conflict = conflicts.find(c => c.id === conflictId);
        if (conflict) {
          foundConflict = conflict;
          jobId = jId;
          break;
        }
      }

      if (!foundConflict || !jobId) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Conflict ${conflictId} not found`
          }
        };
      }

      const job = syncJobs.get(jobId);
      if (!job) {
        return {
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Associated sync job not found'
          }
        };
      }

      // Aplicar resolución
      let dataToApply: Record<string, unknown>;

      switch (resolution) {
        case 'source':
          dataToApply = foundConflict.sourceData;
          break;
        case 'target':
          dataToApply = foundConflict.targetData;
          break;
        case 'merged':
          if (!mergedData) {
            return {
              success: false,
              error: {
                code: 'MISSING_DATA',
                message: 'Merged data is required for merged resolution'
              }
            };
          }
          dataToApply = mergedData;
          break;
      }

      // Aplicar cambios al destino
      await this.pushChangesToTarget(job.integrationId, [{
        id: foundConflict.recordId,
        entity: job.mapping.targetEntity,
        operation: 'update',
        data: dataToApply,
        timestamp: new Date()
      }]);

      // Actualizar conflicto
      foundConflict.resolution = resolution;
      foundConflict.resolvedAt = new Date();
      foundConflict.resolvedBy = 'user'; // TODO: Obtener usuario actual

      return {
        success: true,
        data: foundConflict
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESOLVE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resolve conflict'
        }
      };
    }
  }

  /**
   * Obtener cambios desde origen
   */
  async getChangesFromSource(
    integrationId: string,
    since?: Date
  ): Promise<OperationResult<DataChange[]>> {
    try {
      const sinceParam = since ? since.toISOString() : new Date(0).toISOString();

      const result = await this.integrationService.executeRequest<{
        changes: DataChange[];
      }>(integrationId, {
        method: 'GET',
        url: '/api/changes',
        params: {
          since: sinceParam
        }
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      return {
        success: true,
        data: result.data?.changes || []
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch changes'
        }
      };
    }
  }

  /**
   * Enviar cambios al destino
   */
  async pushChangesToTarget(
    integrationId: string,
    changes: DataChange[]
  ): Promise<OperationResult<{ processed: number; failed: number }>> {
    try {
      let processed = 0;
      let failed = 0;

      for (const change of changes) {
        try {
          const method = change.operation === 'create' ? 'POST'
            : change.operation === 'update' ? 'PUT'
            : 'DELETE';

          const url = change.operation === 'create'
            ? `/api/${change.entity}`
            : `/api/${change.entity}/${change.id}`;

          const result = await this.integrationService.executeRequest(integrationId, {
            method,
            url,
            data: change.operation !== 'delete' ? change.data : undefined
          });

          if (result.success) {
            processed++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      return {
        success: true,
        data: { processed, failed }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PUSH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to push changes'
        }
      };
    }
  }

  /**
   * Obtener trabajo de sincronización
   */
  async getSyncJob(jobId: string): Promise<OperationResult<SyncJob>> {
    const job = syncJobs.get(jobId);
    if (!job) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Sync job ${jobId} not found`
        }
      };
    }

    return {
      success: true,
      data: job
    };
  }

  /**
   * Obtener todos los trabajos de sincronización
   */
  async getSyncJobs(filters?: QueryFilters): Promise<PaginatedResult<SyncJob>> {
    const allJobs = Array.from(syncJobs.values());

    let filtered = allJobs;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        j => j.name.toLowerCase().includes(search) ||
             j.description?.toLowerCase().includes(search)
      );
    }

    if (filters?.filters?.status) {
      filtered = filtered.filter(j => j.status === filters.filters!.status);
    }

    if (filters?.filters?.integrationId) {
      filtered = filtered.filter(j => j.integrationId === filters.filters!.integrationId);
    }

    // Ordenar
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Paginar
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      hasNext: end < filtered.length,
      hasPrevious: page > 1
    };
  }

  /**
   * Obtener conflictos pendientes
   */
  async getPendingConflicts(jobId: string): Promise<OperationResult<SyncConflict[]>> {
    const conflicts = syncConflicts.get(jobId) || [];
    const pending = conflicts.filter(c => !c.resolution);

    return {
      success: true,
      data: pending
    };
  }

  /**
   * Eliminar trabajo de sincronización
   */
  async deleteSyncJob(jobId: string): Promise<OperationResult<void>> {
    try {
      // Detener tarea programada
      const task = scheduledTasks.get(jobId);
      if (task) {
        task.stop();
        scheduledTasks.delete(jobId);
      }

      syncJobs.delete(jobId);
      syncLogs.delete(jobId);
      syncConflicts.delete(jobId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete sync job'
        }
      };
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Procesar un cambio individual
   */
  private async processChange(
    job: SyncJob,
    change: DataChange
  ): Promise<{ success: boolean; conflict?: boolean; targetData?: Record<string, unknown>; error?: string }> {
    try {
      // Aplicar mapeo de campos
      const mappedData = this.applyFieldMapping(change.data, job.mapping);

      // Aplicar transformaciones
      const transformedData = this.applyTransformations(mappedData, job.mapping);

      // Verificar conflictos si es necesario
      if (job.mapping.conflictResolution?.strategy !== 'source_wins') {
        const targetResult = await this.integrationService.executeRequest<Record<string, unknown>>(
          job.integrationId,
          {
            method: 'GET',
            url: `/api/${job.mapping.targetEntity}/${change.id}`
          }
        );

        if (targetResult.success && targetResult.data) {
          // Detectar conflicto
          const conflictFields = this.detectConflictFields(
            transformedData,
            targetResult.data,
            job.mapping
          );

          if (conflictFields.length > 0) {
            if (job.mapping.conflictResolution?.strategy === 'manual') {
              return {
                success: false,
                conflict: true,
                targetData: targetResult.data
              };
            }
            // Aplicar estrategia de resolución automática
          }
        }
      }

      // Enviar al destino
      const pushResult = await this.pushChangesToTarget(job.integrationId, [{
        ...change,
        data: transformedData
      }]);

      return { success: pushResult.success };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing error'
      };
    }
  }

  /**
   * Aplicar mapeo de campos
   */
  private applyFieldMapping(
    data: Record<string, unknown>,
    mapping: SyncMapping
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const fieldMap of mapping.fieldMappings) {
      const sourceValue = this.getNestedValue(data, fieldMap.sourceField);

      if (sourceValue !== undefined) {
        this.setNestedValue(result, fieldMap.targetField, sourceValue);
      } else if (fieldMap.defaultValue !== undefined) {
        this.setNestedValue(result, fieldMap.targetField, fieldMap.defaultValue);
      }
    }

    return result;
  }

  /**
   * Aplicar transformaciones
   */
  private applyTransformations(
    data: Record<string, unknown>,
    mapping: SyncMapping
  ): Record<string, unknown> {
    if (!mapping.transformations || mapping.transformations.length === 0) {
      return data;
    }

    let result = { ...data };

    for (const transform of mapping.transformations) {
      result = this.applyTransformation(result, transform);
    }

    return result;
  }

  /**
   * Aplicar una transformación individual
   */
  private applyTransformation(
    data: Record<string, unknown>,
    transform: { type: string; params?: Record<string, unknown> }
  ): Record<string, unknown> {
    const result = { ...data };

    switch (transform.type) {
      case 'uppercase':
        for (const key in result) {
          if (typeof result[key] === 'string') {
            result[key] = (result[key] as string).toUpperCase();
          }
        }
        break;
      case 'lowercase':
        for (const key in result) {
          if (typeof result[key] === 'string') {
            result[key] = (result[key] as string).toLowerCase();
          }
        }
        break;
      case 'trim':
        for (const key in result) {
          if (typeof result[key] === 'string') {
            result[key] = (result[key] as string).trim();
          }
        }
        break;
    }

    return result;
  }

  /**
   * Detectar campos en conflicto
   */
  private detectConflictFields(
    sourceData: Record<string, unknown>,
    targetData: Record<string, unknown>,
    mapping: SyncMapping
  ): string[] {
    const conflicts: string[] = [];

    for (const fieldMap of mapping.fieldMappings) {
      const sourceValue = this.getNestedValue(sourceData, fieldMap.targetField);
      const targetValue = this.getNestedValue(targetData, fieldMap.targetField);

      if (sourceValue !== undefined && targetValue !== undefined) {
        if (JSON.stringify(sourceValue) !== JSON.stringify(targetValue)) {
          conflicts.push(fieldMap.targetField);
        }
      }
    }

    return conflicts;
  }

  /**
   * Obtener cambios locales para sincronización bidireccional
   */
  private async getLocalChanges(
    job: SyncJob,
    since?: Date
  ): Promise<DataChange[]> {
    // Implementación placeholder - conectar con sistema local
    const _ = job;
    const __ = since;
    return [];
  }

  /**
   * Guardar conflicto
   */
  private async saveConflict(
    jobId: string,
    syncLogId: string,
    change: DataChange,
    targetData?: Record<string, unknown>
  ): Promise<void> {
    const conflicts = syncConflicts.get(jobId) || [];

    conflicts.push({
      id: uuidv4(),
      syncLogId,
      recordId: change.id,
      sourceData: change.data,
      targetData: targetData || {},
      conflictFields: [] // Calcular campos en conflicto
    });

    syncConflicts.set(jobId, conflicts);
  }

  /**
   * Obtener valor anidado de un objeto
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Establecer valor anidado en un objeto
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Calcular próxima fecha de ejecución
   */
  private getNextRunDate(cronExpression: string): Date {
    // Implementación simplificada
    const interval = cron.validate(cronExpression) ? 60000 : 0; // 1 minuto por defecto
    return new Date(Date.now() + interval);
  }
}

/**
 * Factory para crear instancia del servicio
 */
export function createSyncService(
  tenantId: string,
  integrationService: {
    executeRequest: <T>(integrationId: string, config: unknown) => Promise<OperationResult<T>>
  }
): SyncService {
  return new SyncService(tenantId, integrationService);
}

export default SyncService;
