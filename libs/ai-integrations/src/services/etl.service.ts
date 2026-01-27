/**
 * ETL Service
 * Gestión de pipelines de Extract, Transform, Load
 */

import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';
import {
  ETLJob,
  ETLStep,
  ETLStepConfig,
  ETLExecution,
  ETLStepResult,
  ETLStats,
  ETLError,
  Transform,
  TransformType,
  TransformConfig,
  ValidationRule,
  SyncStatus,
  OperationResult,
  PaginatedResult,
  QueryFilters
} from '../types';

/**
 * Almacenamiento en memoria (reemplazar por base de datos en producción)
 */
const etlJobs: Map<string, ETLJob> = new Map();
const etlExecutions: Map<string, ETLExecution[]> = new Map();
const scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

/**
 * Servicio ETL
 */
export class ETLService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Crear un pipeline ETL
   */
  async createPipeline(
    name: string,
    steps: Omit<ETLStep, 'id'>[],
    options?: {
      description?: string;
      schedule?: string;
      notifications?: {
        onSuccess?: string[];
        onFailure?: string[];
      };
    }
  ): Promise<OperationResult<ETLJob>> {
    try {
      const id = uuidv4();
      const now = new Date();

      // Validar y numerar pasos
      const processedSteps: ETLStep[] = steps.map((step, index) => ({
        id: uuidv4(),
        ...step,
        order: index + 1
      }));

      // Validar que haya al menos un paso de cada tipo
      const hasExtract = processedSteps.some(s => s.type === 'extract');
      const hasLoad = processedSteps.some(s => s.type === 'load');

      if (!hasExtract) {
        return {
          success: false,
          error: {
            code: 'MISSING_EXTRACT',
            message: 'Pipeline must have at least one extract step'
          }
        };
      }

      if (!hasLoad) {
        return {
          success: false,
          error: {
            code: 'MISSING_LOAD',
            message: 'Pipeline must have at least one load step'
          }
        };
      }

      const pipeline: ETLJob = {
        id,
        name,
        description: options?.description,
        steps: processedSteps,
        schedule: options?.schedule,
        status: SyncStatus.PENDING,
        enabled: true,
        notifications: options?.notifications,
        createdAt: now,
        updatedAt: now,
        tenantId: this.tenantId
      };

      // Si hay schedule, calcular próxima ejecución
      if (options?.schedule && cron.validate(options.schedule)) {
        pipeline.nextRun = this.getNextRunDate(options.schedule);
        pipeline.status = SyncStatus.SCHEDULED;
      }

      etlJobs.set(id, pipeline);
      etlExecutions.set(id, []);

      return {
        success: true,
        data: pipeline
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create pipeline'
        }
      };
    }
  }

  /**
   * Ejecutar pipeline ETL
   */
  async runPipeline(
    pipelineId: string,
    params?: Record<string, unknown>
  ): Promise<OperationResult<ETLExecution>> {
    const startTime = Date.now();

    try {
      const pipeline = etlJobs.get(pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      if (!pipeline.enabled) {
        return {
          success: false,
          error: {
            code: 'DISABLED',
            message: 'Pipeline is disabled'
          }
        };
      }

      // Crear ejecución
      const executionId = uuidv4();
      const execution: ETLExecution = {
        id: executionId,
        jobId: pipelineId,
        status: SyncStatus.RUNNING,
        startTime: new Date(),
        stepResults: [],
        errors: [],
        parameters: params
      };

      // Actualizar estado del pipeline
      pipeline.status = SyncStatus.RUNNING;
      pipeline.updatedAt = new Date();

      const stats: ETLStats = {
        extractedRecords: 0,
        transformedRecords: 0,
        loadedRecords: 0,
        failedRecords: 0,
        validationErrors: 0,
        duration: 0,
        stepDurations: {}
      };

      const errors: ETLError[] = [];
      let currentData: Record<string, unknown>[] = [];

      // Ejecutar pasos en orden
      const sortedSteps = [...pipeline.steps]
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order);

      for (const step of sortedSteps) {
        const stepStartTime = Date.now();
        let stepSuccess = true;
        let recordsProcessed = 0;
        let recordsFailed = 0;
        let stepError: string | undefined;

        try {
          switch (step.type) {
            case 'extract':
              const extractResult = await this.executeExtract(step.config, params);
              if (extractResult.success && extractResult.data) {
                currentData = extractResult.data;
                stats.extractedRecords += currentData.length;
                recordsProcessed = currentData.length;
              } else {
                throw new Error(extractResult.error?.message || 'Extract failed');
              }
              break;

            case 'transform':
              const transformResult = await this.executeTransform(currentData, step.config);
              if (transformResult.success && transformResult.data) {
                currentData = transformResult.data;
                stats.transformedRecords = currentData.length;
                recordsProcessed = currentData.length;
              } else {
                throw new Error(transformResult.error?.message || 'Transform failed');
              }
              break;

            case 'validate':
              const validateResult = await this.executeValidate(currentData, step.config);
              if (validateResult.success && validateResult.data) {
                currentData = validateResult.data.valid;
                stats.validationErrors += validateResult.data.invalid.length;
                recordsProcessed = validateResult.data.valid.length;
                recordsFailed = validateResult.data.invalid.length;

                // Agregar errores de validación
                for (const invalid of validateResult.data.invalid) {
                  errors.push({
                    stepId: step.id,
                    recordId: invalid.recordId,
                    error: invalid.error,
                    timestamp: new Date()
                  });
                }
              }
              break;

            case 'load':
              const loadResult = await this.executeLoad(currentData, step.config);
              if (loadResult.success && loadResult.data) {
                stats.loadedRecords += loadResult.data.loaded;
                stats.failedRecords += loadResult.data.failed;
                recordsProcessed = loadResult.data.loaded;
                recordsFailed = loadResult.data.failed;
              } else {
                throw new Error(loadResult.error?.message || 'Load failed');
              }
              break;
          }
        } catch (stepErr) {
          stepSuccess = false;
          stepError = stepErr instanceof Error ? stepErr.message : 'Step failed';

          errors.push({
            stepId: step.id,
            error: stepError,
            timestamp: new Date()
          });

          // Manejar error según configuración
          if (step.onError === 'stop') {
            execution.status = SyncStatus.FAILED;
            break;
          } else if (step.onError === 'retry' && step.retryAttempts) {
            // Implementar lógica de reintento
            for (let attempt = 0; attempt < step.retryAttempts; attempt++) {
              // Reintentar paso
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          // Si es 'skip', continuar con siguiente paso
        }

        const stepDuration = Date.now() - stepStartTime;
        stats.stepDurations[step.id] = stepDuration;

        execution.stepResults.push({
          stepId: step.id,
          stepName: step.name,
          status: stepSuccess ? 'success' : 'failed',
          recordsProcessed,
          recordsFailed,
          duration: stepDuration,
          error: stepError
        });
      }

      stats.duration = Date.now() - startTime;
      execution.endTime = new Date();
      execution.stats = stats;
      execution.errors = errors;

      // Determinar estado final
      if (execution.status !== SyncStatus.FAILED) {
        execution.status = errors.length === 0
          ? SyncStatus.COMPLETED
          : stats.loadedRecords > 0
            ? SyncStatus.PARTIAL
            : SyncStatus.FAILED;
      }

      // Actualizar pipeline
      pipeline.status = execution.status === SyncStatus.RUNNING
        ? SyncStatus.COMPLETED
        : execution.status;
      pipeline.lastRun = new Date();
      pipeline.stats = stats;
      if (pipeline.schedule) {
        pipeline.nextRun = this.getNextRunDate(pipeline.schedule);
      }
      pipeline.updatedAt = new Date();

      // Guardar ejecución
      const executions = etlExecutions.get(pipelineId) || [];
      executions.push(execution);
      etlExecutions.set(pipelineId, executions);

      // Enviar notificaciones
      await this.sendNotifications(pipeline, execution);

      return {
        success: execution.status !== SyncStatus.FAILED,
        data: execution
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Pipeline execution failed'
        }
      };
    }
  }

  /**
   * Programar ejecución periódica
   */
  async schedulePipeline(
    pipelineId: string,
    cronExpression: string
  ): Promise<OperationResult<ETLJob>> {
    try {
      const pipeline = etlJobs.get(pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      if (!cron.validate(cronExpression)) {
        return {
          success: false,
          error: {
            code: 'INVALID_CRON',
            message: 'Invalid cron expression'
          }
        };
      }

      // Cancelar tarea existente
      const existingTask = scheduledTasks.get(pipelineId);
      if (existingTask) {
        existingTask.stop();
      }

      // Crear nueva tarea
      const task = cron.schedule(cronExpression, async () => {
        await this.runPipeline(pipelineId);
      });

      scheduledTasks.set(pipelineId, task);

      pipeline.schedule = cronExpression;
      pipeline.status = SyncStatus.SCHEDULED;
      pipeline.nextRun = this.getNextRunDate(cronExpression);
      pipeline.updatedAt = new Date();

      return {
        success: true,
        data: pipeline
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCHEDULE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to schedule pipeline'
        }
      };
    }
  }

  /**
   * Transformar datos
   */
  async transform(
    data: Record<string, unknown>[],
    transformations: Transform[]
  ): Promise<OperationResult<Record<string, unknown>[]>> {
    try {
      let result = [...data];

      for (const transform of transformations) {
        result = await this.applyTransformation(result, transform);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSFORM_ERROR',
          message: error instanceof Error ? error.message : 'Transformation failed'
        }
      };
    }
  }

  /**
   * Validar datos contra esquema
   */
  async validate(
    data: Record<string, unknown>[],
    rules: ValidationRule[]
  ): Promise<OperationResult<{
    valid: Record<string, unknown>[];
    invalid: { record: Record<string, unknown>; errors: string[] }[];
  }>> {
    try {
      const valid: Record<string, unknown>[] = [];
      const invalid: { record: Record<string, unknown>; errors: string[] }[] = [];

      for (const record of data) {
        const errors: string[] = [];

        for (const rule of rules) {
          const value = record[rule.field];
          const validationError = this.validateField(value, rule);

          if (validationError) {
            errors.push(rule.message || validationError);
          }
        }

        if (errors.length === 0) {
          valid.push(record);
        } else {
          invalid.push({ record, errors });
        }
      }

      return {
        success: true,
        data: { valid, invalid }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Validation failed'
        }
      };
    }
  }

  /**
   * Cargar datos al destino
   */
  async loadToTarget(
    data: Record<string, unknown>[],
    target: ETLStepConfig['target']
  ): Promise<OperationResult<{ loaded: number; failed: number }>> {
    try {
      if (!target) {
        return {
          success: false,
          error: {
            code: 'NO_TARGET',
            message: 'Target configuration is required'
          }
        };
      }

      let loaded = 0;
      let failed = 0;

      switch (target.type) {
        case 'database':
          // Simular carga a base de datos
          for (const record of data) {
            try {
              // Implementar lógica de inserción
              loaded++;
            } catch {
              failed++;
            }
          }
          break;

        case 'api':
          // Simular carga via API
          for (const record of data) {
            try {
              // Implementar llamada API
              loaded++;
            } catch {
              failed++;
            }
          }
          break;

        case 'file':
          // Simular escritura a archivo
          loaded = data.length;
          break;

        case 'queue':
          // Simular envío a cola
          loaded = data.length;
          break;

        default:
          return {
            success: false,
            error: {
              code: 'UNKNOWN_TARGET',
              message: `Unknown target type: ${target.type}`
            }
          };
      }

      return {
        success: true,
        data: { loaded, failed }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Load failed'
        }
      };
    }
  }

  /**
   * Obtener historial de ejecuciones
   */
  async getExecutionHistory(
    pipelineId: string,
    filters?: QueryFilters
  ): Promise<PaginatedResult<ETLExecution>> {
    const executions = etlExecutions.get(pipelineId) || [];

    let filtered = [...executions];

    if (filters?.dateFrom) {
      filtered = filtered.filter(e => e.startTime >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(e => e.startTime <= filters.dateTo!);
    }

    if (filters?.filters?.status) {
      filtered = filtered.filter(e => e.status === filters.filters!.status);
    }

    filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

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
   * Obtener pipeline
   */
  async getPipeline(pipelineId: string): Promise<OperationResult<ETLJob>> {
    const pipeline = etlJobs.get(pipelineId);
    if (!pipeline) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Pipeline ${pipelineId} not found`
        }
      };
    }

    return {
      success: true,
      data: pipeline
    };
  }

  /**
   * Obtener todos los pipelines
   */
  async getPipelines(filters?: QueryFilters): Promise<PaginatedResult<ETLJob>> {
    const allPipelines = Array.from(etlJobs.values())
      .filter(p => p.tenantId === this.tenantId);

    let filtered = allPipelines;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(search) ||
             p.description?.toLowerCase().includes(search)
      );
    }

    if (filters?.filters?.status) {
      filtered = filtered.filter(p => p.status === filters.filters!.status);
    }

    if (filters?.filters?.enabled !== undefined) {
      filtered = filtered.filter(p => p.enabled === filters.filters!.enabled);
    }

    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

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
   * Actualizar pipeline
   */
  async updatePipeline(
    pipelineId: string,
    updates: Partial<{
      name: string;
      description: string;
      steps: Omit<ETLStep, 'id'>[];
      enabled: boolean;
      notifications: {
        onSuccess?: string[];
        onFailure?: string[];
      };
    }>
  ): Promise<OperationResult<ETLJob>> {
    try {
      const pipeline = etlJobs.get(pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      if (updates.name) pipeline.name = updates.name;
      if (updates.description !== undefined) pipeline.description = updates.description;
      if (updates.enabled !== undefined) pipeline.enabled = updates.enabled;
      if (updates.notifications) pipeline.notifications = updates.notifications;

      if (updates.steps) {
        pipeline.steps = updates.steps.map((step, index) => ({
          id: uuidv4(),
          ...step,
          order: index + 1
        }));
      }

      pipeline.updatedAt = new Date();

      return {
        success: true,
        data: pipeline
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update pipeline'
        }
      };
    }
  }

  /**
   * Eliminar pipeline
   */
  async deletePipeline(pipelineId: string): Promise<OperationResult<void>> {
    try {
      const task = scheduledTasks.get(pipelineId);
      if (task) {
        task.stop();
        scheduledTasks.delete(pipelineId);
      }

      etlJobs.delete(pipelineId);
      etlExecutions.delete(pipelineId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete pipeline'
        }
      };
    }
  }

  /**
   * Pausar pipeline
   */
  async pausePipeline(pipelineId: string): Promise<OperationResult<ETLJob>> {
    try {
      const pipeline = etlJobs.get(pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      const task = scheduledTasks.get(pipelineId);
      if (task) {
        task.stop();
      }

      pipeline.status = SyncStatus.PAUSED;
      pipeline.enabled = false;
      pipeline.updatedAt = new Date();

      return {
        success: true,
        data: pipeline
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PAUSE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pause pipeline'
        }
      };
    }
  }

  /**
   * Reanudar pipeline
   */
  async resumePipeline(pipelineId: string): Promise<OperationResult<ETLJob>> {
    try {
      const pipeline = etlJobs.get(pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Pipeline ${pipelineId} not found`
          }
        };
      }

      if (pipeline.schedule) {
        await this.schedulePipeline(pipelineId, pipeline.schedule);
      } else {
        pipeline.status = SyncStatus.PENDING;
      }

      pipeline.enabled = true;
      pipeline.updatedAt = new Date();

      return {
        success: true,
        data: pipeline
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESUME_ERROR',
          message: error instanceof Error ? error.message : 'Failed to resume pipeline'
        }
      };
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Ejecutar paso de extracción
   */
  private async executeExtract(
    config: ETLStepConfig,
    params?: Record<string, unknown>
  ): Promise<OperationResult<Record<string, unknown>[]>> {
    try {
      if (!config.source) {
        return {
          success: false,
          error: {
            code: 'NO_SOURCE',
            message: 'Source configuration is required'
          }
        };
      }

      // Simular extracción según tipo
      let data: Record<string, unknown>[] = [];

      switch (config.source.type) {
        case 'database':
          // Simular consulta a base de datos
          data = [
            { id: 1, name: 'Sample 1', value: 100 },
            { id: 2, name: 'Sample 2', value: 200 }
          ];
          break;

        case 'api':
          // Simular llamada API
          data = [
            { id: 1, data: 'from_api' }
          ];
          break;

        case 'file':
          // Simular lectura de archivo
          data = [];
          break;

        case 'queue':
          // Simular lectura de cola
          data = [];
          break;
      }

      // Aplicar parámetros si existen
      if (params) {
        // Filtrar o modificar datos según parámetros
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXTRACT_ERROR',
          message: error instanceof Error ? error.message : 'Extract failed'
        }
      };
    }
  }

  /**
   * Ejecutar paso de transformación
   */
  private async executeTransform(
    data: Record<string, unknown>[],
    config: ETLStepConfig
  ): Promise<OperationResult<Record<string, unknown>[]>> {
    try {
      if (!config.transformations || config.transformations.length === 0) {
        return { success: true, data };
      }

      let result = [...data];

      for (const transform of config.transformations) {
        result = await this.applyTransformation(result, transform);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRANSFORM_ERROR',
          message: error instanceof Error ? error.message : 'Transform failed'
        }
      };
    }
  }

  /**
   * Ejecutar paso de validación
   */
  private async executeValidate(
    data: Record<string, unknown>[],
    config: ETLStepConfig
  ): Promise<OperationResult<{
    valid: Record<string, unknown>[];
    invalid: { recordId: string; error: string }[];
  }>> {
    try {
      const valid: Record<string, unknown>[] = [];
      const invalid: { recordId: string; error: string }[] = [];

      for (const record of data) {
        let isValid = true;
        const errors: string[] = [];

        if (config.rules) {
          for (const rule of config.rules) {
            const value = record[rule.field];
            const error = this.validateField(value, rule);
            if (error) {
              isValid = false;
              errors.push(error);
            }
          }
        }

        if (isValid) {
          valid.push(record);
        } else {
          invalid.push({
            recordId: String(record.id || 'unknown'),
            error: errors.join('; ')
          });
        }
      }

      return {
        success: true,
        data: { valid, invalid }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'VALIDATE_ERROR',
          message: error instanceof Error ? error.message : 'Validation failed'
        }
      };
    }
  }

  /**
   * Ejecutar paso de carga
   */
  private async executeLoad(
    data: Record<string, unknown>[],
    config: ETLStepConfig
  ): Promise<OperationResult<{ loaded: number; failed: number }>> {
    return this.loadToTarget(data, config.target);
  }

  /**
   * Aplicar transformación a datos
   */
  private async applyTransformation(
    data: Record<string, unknown>[],
    transform: Transform
  ): Promise<Record<string, unknown>[]> {
    switch (transform.type) {
      case TransformType.MAP:
        return this.applyMapTransform(data, transform.config);

      case TransformType.FILTER:
        return this.applyFilterTransform(data, transform.config);

      case TransformType.AGGREGATE:
        return this.applyAggregateTransform(data, transform.config);

      case TransformType.DEDUPLICATE:
        return this.applyDeduplicateTransform(data, transform.config);

      case TransformType.NORMALIZE:
        return this.applyNormalizeTransform(data, transform.config);

      case TransformType.ENRICH:
        return this.applyEnrichTransform(data, transform.config);

      default:
        return data;
    }
  }

  /**
   * Aplicar transformación MAP
   */
  private applyMapTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    if (!config.fieldMappings) return data;

    return data.map(record => {
      const result: Record<string, unknown> = {};

      for (const [targetField, mapping] of Object.entries(config.fieldMappings!)) {
        if (typeof mapping === 'string') {
          result[targetField] = record[mapping];
        } else {
          // Aplicar transformación de campo
          const sourceValue = record[targetField];
          result[targetField] = this.applyFieldTransform(sourceValue, mapping);
        }
      }

      return result;
    });
  }

  /**
   * Aplicar transformación FILTER
   */
  private applyFilterTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    if (!config.conditions) return data;

    return data.filter(record => {
      return config.conditions!.every(condition => {
        const value = record[condition.field];

        switch (condition.operator) {
          case 'eq': return value === condition.value;
          case 'neq': return value !== condition.value;
          case 'gt': return Number(value) > Number(condition.value);
          case 'gte': return Number(value) >= Number(condition.value);
          case 'lt': return Number(value) < Number(condition.value);
          case 'lte': return Number(value) <= Number(condition.value);
          case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
          case 'nin': return Array.isArray(condition.value) && !condition.value.includes(value);
          case 'contains':
            return typeof value === 'string' &&
                   typeof condition.value === 'string' &&
                   value.includes(condition.value);
          case 'regex':
            return typeof value === 'string' &&
                   new RegExp(String(condition.value)).test(value);
          default: return true;
        }
      });
    });
  }

  /**
   * Aplicar transformación AGGREGATE
   */
  private applyAggregateTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    if (!config.groupBy || !config.aggregations) return data;

    const groups = new Map<string, Record<string, unknown>[]>();

    // Agrupar datos
    for (const record of data) {
      const key = config.groupBy.map(field => String(record[field])).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    // Aplicar agregaciones
    const result: Record<string, unknown>[] = [];

    for (const [key, records] of groups) {
      const aggregated: Record<string, unknown> = {};

      // Incluir campos de agrupación
      const keyValues = key.split('|');
      config.groupBy.forEach((field, index) => {
        aggregated[field] = keyValues[index];
      });

      // Calcular agregaciones
      for (const agg of config.aggregations) {
        const values = records.map(r => Number(r[agg.field]) || 0);

        switch (agg.function) {
          case 'sum':
            aggregated[agg.alias] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregated[agg.alias] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case 'count':
            aggregated[agg.alias] = values.length;
            break;
          case 'min':
            aggregated[agg.alias] = Math.min(...values);
            break;
          case 'max':
            aggregated[agg.alias] = Math.max(...values);
            break;
        }
      }

      result.push(aggregated);
    }

    return result;
  }

  /**
   * Aplicar transformación DEDUPLICATE
   */
  private applyDeduplicateTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    if (!config.dedupeFields) return data;

    const seen = new Map<string, Record<string, unknown>>();

    for (const record of data) {
      const key = config.dedupeFields.map(f => String(record[f])).join('|');

      if (!seen.has(key)) {
        seen.set(key, record);
      } else if (config.keepStrategy === 'last') {
        seen.set(key, record);
      }
      // 'first' es el comportamiento por defecto
    }

    return Array.from(seen.values());
  }

  /**
   * Aplicar transformación NORMALIZE
   */
  private applyNormalizeTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    if (!config.normalizations) return data;

    return data.map(record => {
      const result = { ...record };

      for (const norm of config.normalizations!) {
        const value = result[norm.field];

        if (typeof value !== 'string') continue;

        switch (norm.type) {
          case 'phone':
            result[norm.field] = value.replace(/\D/g, '');
            break;
          case 'email':
            result[norm.field] = value.toLowerCase().trim();
            break;
          case 'name':
            result[norm.field] = value.trim().replace(/\s+/g, ' ');
            break;
          case 'address':
            result[norm.field] = value.trim().toUpperCase();
            break;
        }
      }

      return result;
    });
  }

  /**
   * Aplicar transformación ENRICH
   */
  private applyEnrichTransform(
    data: Record<string, unknown>[],
    config: TransformConfig
  ): Record<string, unknown>[] {
    // Implementación placeholder para enriquecimiento de datos
    // En producción, esto consultaría fuentes externas
    return data;
  }

  /**
   * Aplicar transformación a campo individual
   */
  private applyFieldTransform(
    value: unknown,
    transform: { type: string; params?: Record<string, unknown> }
  ): unknown {
    if (value === undefined || value === null) return value;

    switch (transform.type) {
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'date_format':
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      default:
        return value;
    }
  }

  /**
   * Validar campo
   */
  private validateField(value: unknown, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return `Field ${rule.field} is required`;
        }
        break;

      case 'type':
        const expectedType = rule.params?.type as string;
        if (expectedType && typeof value !== expectedType) {
          return `Field ${rule.field} must be of type ${expectedType}`;
        }
        break;

      case 'format':
        const format = rule.params?.format as string;
        if (format === 'email' && typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return `Field ${rule.field} must be a valid email`;
          }
        }
        break;

      case 'range':
        const min = rule.params?.min as number;
        const max = rule.params?.max as number;
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          return `Field ${rule.field} must be at least ${min}`;
        }
        if (max !== undefined && numValue > max) {
          return `Field ${rule.field} must be at most ${max}`;
        }
        break;

      case 'enum':
        const allowedValues = rule.params?.values as unknown[];
        if (allowedValues && !allowedValues.includes(value)) {
          return `Field ${rule.field} must be one of: ${allowedValues.join(', ')}`;
        }
        break;

      case 'regex':
        const pattern = rule.params?.pattern as string;
        if (pattern && typeof value === 'string') {
          if (!new RegExp(pattern).test(value)) {
            return `Field ${rule.field} does not match required pattern`;
          }
        }
        break;
    }

    return null;
  }

  /**
   * Calcular próxima fecha de ejecución
   */
  private getNextRunDate(cronExpression: string): Date {
    // Implementación simplificada
    return new Date(Date.now() + 60000);
  }

  /**
   * Enviar notificaciones
   */
  private async sendNotifications(
    pipeline: ETLJob,
    execution: ETLExecution
  ): Promise<void> {
    if (!pipeline.notifications) return;

    const recipients = execution.status === SyncStatus.COMPLETED
      ? pipeline.notifications.onSuccess
      : pipeline.notifications.onFailure;

    if (!recipients || recipients.length === 0) return;

    // Implementar envío de notificaciones (email, slack, etc.)
    console.log(`Notifying ${recipients.join(', ')} about pipeline ${pipeline.name} execution`);
  }
}

/**
 * Factory para crear instancia del servicio
 */
export function createETLService(tenantId: string): ETLService {
  return new ETLService(tenantId);
}

export default ETLService;
