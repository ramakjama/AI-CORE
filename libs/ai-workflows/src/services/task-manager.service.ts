/**
 * AI-Workflows - Servicio de gestión de tareas de usuario
 * @module @ai-core/ai-workflows/services/task-manager
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';
import { addMinutes, addHours, addDays, isBefore, differenceInMinutes } from 'date-fns';
import {
  WorkflowTask,
  TaskStatus,
  TaskPriority,
  TaskOutcome,
  TaskAssignment,
  Escalation,
  TaskComment,
  TaskQueryFilters,
  PaginatedResult,
  PaginationOptions,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowEventHandler,
  WorkflowError,
  WorkflowErrorCode,
  NodeType
} from '../types';
import { WorkflowRepository, InMemoryWorkflowRepository } from './workflow-engine.service';

/**
 * Configuración del gestor de tareas
 */
export interface TaskManagerConfig {
  /** Intervalo de verificación de SLAs (ms) */
  slaCheckInterval: number;
  /** Niveles de escalación por defecto */
  defaultEscalationLevels: EscalationLevel[];
  /** Notificar al asignar tarea */
  notifyOnAssignment: boolean;
  /** Notificar al completar tarea */
  notifyOnCompletion: boolean;
  /** Notificar en SLA warning */
  notifyOnSlaWarning: boolean;
  /** Porcentaje del SLA para warning */
  slaWarningThreshold: number;
  /** Habilitar auto-escalación */
  autoEscalation: boolean;
  /** Habilitar logging */
  debugMode: boolean;
}

/**
 * Nivel de escalación
 */
export interface EscalationLevel {
  level: number;
  /** Minutos después del SLA para escalar */
  afterMinutes: number;
  /** Usuarios/grupos a notificar */
  escalateTo: string[];
  /** Acción a tomar */
  action: 'notify' | 'reassign' | 'escalate';
}

/**
 * Estadísticas de tareas
 */
export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  averageCompletionTime: number;
  slaBreachRate: number;
  overdueTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
}

/**
 * Filtros avanzados de tareas
 */
export interface AdvancedTaskFilters extends TaskQueryFilters {
  searchText?: string;
  includeCompleted?: boolean;
  includeCancelled?: boolean;
  orderBy?: 'createdAt' | 'dueDate' | 'priority' | 'status';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Servicio de gestión de tareas de usuario
 */
export class TaskManagerService extends EventEmitter {
  private repository: WorkflowRepository;
  private config: TaskManagerConfig;
  private slaCheckInterval?: NodeJS.Timeout;
  private eventHandlers: Map<WorkflowEventType, WorkflowEventHandler[]> = new Map();

  // Cache de tareas para mejor rendimiento
  private taskCache: Map<string, { task: WorkflowTask; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto

  constructor(
    repository?: WorkflowRepository,
    config?: Partial<TaskManagerConfig>
  ) {
    super();

    this.repository = repository || new InMemoryWorkflowRepository();

    this.config = {
      slaCheckInterval: 60000, // 1 minuto
      defaultEscalationLevels: [
        { level: 1, afterMinutes: 30, escalateTo: ['supervisor'], action: 'notify' },
        { level: 2, afterMinutes: 60, escalateTo: ['manager'], action: 'notify' },
        { level: 3, afterMinutes: 120, escalateTo: ['director'], action: 'escalate' }
      ],
      notifyOnAssignment: true,
      notifyOnCompletion: true,
      notifyOnSlaWarning: true,
      slaWarningThreshold: 0.8, // 80% del SLA
      autoEscalation: true,
      debugMode: false,
      ...config
    };
  }

  /**
   * Inicia el servicio
   */
  start(): void {
    this.log('Gestor de tareas iniciado');

    // Iniciar verificación de SLAs
    this.slaCheckInterval = setInterval(
      () => this.checkSLAs(),
      this.config.slaCheckInterval
    );
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    if (this.slaCheckInterval) {
      clearInterval(this.slaCheckInterval);
    }
    this.taskCache.clear();
    this.log('Gestor de tareas detenido');
  }

  /**
   * Registra un handler de eventos
   */
  onTaskEvent(eventType: WorkflowEventType, handler: WorkflowEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // ========================================================================
  // Creación y gestión básica de tareas
  // ========================================================================

  /**
   * Crea una nueva tarea
   */
  async createTask(options: {
    instanceId: string;
    nodeId: string;
    nodeName: string;
    nodeType: NodeType;
    assignee?: string;
    candidateUsers?: string[];
    candidateGroups?: string[];
    formKey?: string;
    priority?: TaskPriority;
    dueDate?: Date;
    slaMinutes?: number;
    tenantId?: string;
    businessKey?: string;
    formData?: Record<string, any>;
  }): Promise<WorkflowTask> {
    const {
      instanceId,
      nodeId,
      nodeName,
      nodeType,
      assignee,
      candidateUsers,
      candidateGroups,
      formKey,
      priority = TaskPriority.NORMAL,
      dueDate,
      slaMinutes,
      tenantId,
      businessKey,
      formData
    } = options;

    const now = new Date();
    const slaDeadline = slaMinutes ? addMinutes(now, slaMinutes) : undefined;

    const task: WorkflowTask = {
      id: uuidv4(),
      instanceId,
      nodeId,
      nodeName,
      nodeType,
      status: assignee ? TaskStatus.ASSIGNED : TaskStatus.PENDING,
      priority,
      assignee,
      candidateUsers,
      candidateGroups,
      createdAt: now,
      claimedAt: assignee ? now : undefined,
      dueDate,
      slaDeadline,
      slaBreached: false,
      formKey,
      formData,
      assignmentHistory: [],
      escalationHistory: [],
      tenantId,
      businessKey
    };

    // Agregar asignación inicial al historial
    if (assignee) {
      task.assignmentHistory.push({
        id: uuidv4(),
        taskId: task.id,
        assignedTo: assignee,
        assignedBy: 'system',
        assignedAt: now,
        type: 'initial'
      });
    }

    await this.repository.saveTask(task);
    this.updateCache(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_CREATED,
      instanceId,
      nodeId,
      taskId: task.id,
      timestamp: now,
      data: { assignee, priority }
    });

    this.log(`Tarea creada: ${task.id} (${nodeName})`);

    return task;
  }

  /**
   * Obtiene una tarea por ID
   */
  async getTask(taskId: string): Promise<WorkflowTask | null> {
    // Verificar cache
    const cached = this.taskCache.get(taskId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.task;
    }

    const task = await this.repository.getTask(taskId);
    if (task) {
      this.updateCache(task);
    }
    return task;
  }

  /**
   * Actualiza una tarea
   */
  async updateTask(taskId: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    // Aplicar actualizaciones
    Object.assign(task, updates);

    await this.repository.saveTask(task);
    this.updateCache(task);

    return task;
  }

  // ========================================================================
  // Asignación de tareas
  // ========================================================================

  /**
   * Asigna una tarea a un usuario
   */
  async assignTask(
    taskId: string,
    userId: string,
    assignedBy: string,
    reason?: string
  ): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La tarea ya está finalizada: ${task.status}`
      );
    }

    const previousAssignee = task.assignee;
    const now = new Date();

    // Actualizar tarea
    task.assignee = userId;
    task.status = TaskStatus.ASSIGNED;
    task.claimedAt = now;

    // Agregar al historial
    task.assignmentHistory.push({
      id: uuidv4(),
      taskId,
      assignedTo: userId,
      assignedBy,
      assignedAt: now,
      reason,
      type: previousAssignee ? 'reassign' : 'initial'
    });

    await this.repository.saveTask(task);
    this.updateCache(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_ASSIGNED,
      instanceId: task.instanceId,
      nodeId: task.nodeId,
      taskId,
      timestamp: now,
      userId: assignedBy,
      data: { assignee: userId, previousAssignee, reason }
    });

    this.log(`Tarea ${taskId} asignada a ${userId}`);

    return task;
  }

  /**
   * Reasigna una tarea a otro usuario
   */
  async reassignTask(
    taskId: string,
    newUserId: string,
    reassignedBy: string,
    reason?: string
  ): Promise<WorkflowTask> {
    return this.assignTask(taskId, newUserId, reassignedBy, reason);
  }

  /**
   * Usuario reclama una tarea
   */
  async claimTask(taskId: string, userId: string): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    // Verificar que la tarea está disponible
    if (task.status !== TaskStatus.PENDING) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La tarea no está disponible para reclamar: ${task.status}`
      );
    }

    // Verificar que el usuario es candidato
    const isCandidateUser = task.candidateUsers?.includes(userId);
    const isCandidateGroup = task.candidateGroups?.some(g => this.userInGroup(userId, g));

    if (!isCandidateUser && !isCandidateGroup && task.candidateUsers?.length) {
      throw new WorkflowError(
        WorkflowErrorCode.PERMISSION_DENIED,
        'El usuario no es candidato para esta tarea'
      );
    }

    const now = new Date();

    task.assignee = userId;
    task.status = TaskStatus.ASSIGNED;
    task.claimedAt = now;

    task.assignmentHistory.push({
      id: uuidv4(),
      taskId,
      assignedTo: userId,
      assignedBy: userId,
      assignedAt: now,
      type: 'claim'
    });

    await this.repository.saveTask(task);
    this.updateCache(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_CLAIMED,
      instanceId: task.instanceId,
      nodeId: task.nodeId,
      taskId,
      timestamp: now,
      userId,
      data: { assignee: userId }
    });

    this.log(`Tarea ${taskId} reclamada por ${userId}`);

    return task;
  }

  /**
   * Libera una tarea (unclaim)
   */
  async releaseTask(taskId: string, userId: string, reason?: string): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    if (task.assignee !== userId) {
      throw new WorkflowError(
        WorkflowErrorCode.PERMISSION_DENIED,
        'Solo el asignatario puede liberar la tarea'
      );
    }

    const now = new Date();

    task.assignee = undefined;
    task.status = TaskStatus.PENDING;

    task.assignmentHistory.push({
      id: uuidv4(),
      taskId,
      assignedTo: '',
      assignedBy: userId,
      assignedAt: now,
      reason,
      type: 'return'
    });

    await this.repository.saveTask(task);
    this.updateCache(task);

    this.log(`Tarea ${taskId} liberada por ${userId}`);

    return task;
  }

  /**
   * Delega una tarea a otro usuario
   */
  async delegateTask(
    taskId: string,
    toUserId: string,
    delegatedBy: string,
    reason?: string
  ): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    if (task.assignee !== delegatedBy && task.owner !== delegatedBy) {
      throw new WorkflowError(
        WorkflowErrorCode.PERMISSION_DENIED,
        'Solo el asignatario o propietario puede delegar la tarea'
      );
    }

    const now = new Date();

    // Guardar propietario original
    if (!task.owner) {
      task.owner = task.assignee;
    }

    task.delegatedFrom = task.assignee;
    task.assignee = toUserId;
    task.status = TaskStatus.DELEGATED;

    task.assignmentHistory.push({
      id: uuidv4(),
      taskId,
      assignedTo: toUserId,
      assignedBy: delegatedBy,
      assignedAt: now,
      reason,
      type: 'delegate'
    });

    await this.repository.saveTask(task);
    this.updateCache(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_DELEGATED,
      instanceId: task.instanceId,
      nodeId: task.nodeId,
      taskId,
      timestamp: now,
      userId: delegatedBy,
      data: { toUser: toUserId, reason }
    });

    this.log(`Tarea ${taskId} delegada a ${toUserId}`);

    return task;
  }

  // ========================================================================
  // Escalación
  // ========================================================================

  /**
   * Escala una tarea
   */
  async escalateTask(
    taskId: string,
    escalatedBy: string,
    reason: string,
    escalateTo?: string
  ): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La tarea ya está finalizada: ${task.status}`
      );
    }

    const now = new Date();
    const currentLevel = task.escalationHistory.length > 0
      ? Math.max(...task.escalationHistory.map(e => e.level))
      : 0;

    const newLevel = currentLevel + 1;

    // Determinar a quién escalar
    const escalationTarget = escalateTo ||
      this.getEscalationTarget(newLevel) ||
      'supervisor';

    const escalation: Escalation = {
      id: uuidv4(),
      taskId,
      level: newLevel,
      escalatedTo: escalationTarget,
      escalatedBy,
      escalatedAt: now,
      reason,
      resolved: false
    };

    task.escalationHistory.push(escalation);
    task.status = TaskStatus.ESCALATED;

    await this.repository.saveTask(task);
    this.updateCache(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_ESCALATED,
      instanceId: task.instanceId,
      nodeId: task.nodeId,
      taskId,
      timestamp: now,
      userId: escalatedBy,
      data: { level: newLevel, escalateTo: escalationTarget, reason }
    });

    this.log(`Tarea ${taskId} escalada a nivel ${newLevel}`);

    return task;
  }

  /**
   * Resuelve una escalación
   */
  async resolveEscalation(
    taskId: string,
    escalationId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<WorkflowTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    const escalation = task.escalationHistory.find(e => e.id === escalationId);
    if (!escalation) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la escalación: ${escalationId}`
      );
    }

    const now = new Date();

    escalation.resolved = true;
    escalation.resolvedAt = now;
    escalation.resolvedBy = resolvedBy;
    escalation.resolution = resolution;

    // Verificar si hay más escalaciones pendientes
    const pendingEscalations = task.escalationHistory.filter(e => !e.resolved);
    if (pendingEscalations.length === 0 && task.status === TaskStatus.ESCALATED) {
      task.status = task.assignee ? TaskStatus.ASSIGNED : TaskStatus.PENDING;
    }

    await this.repository.saveTask(task);
    this.updateCache(task);

    this.log(`Escalación ${escalationId} resuelta en tarea ${taskId}`);

    return task;
  }

  // ========================================================================
  // Consultas de tareas
  // ========================================================================

  /**
   * Obtiene tareas de un usuario
   */
  async getTasksByUser(
    userId: string,
    filters?: AdvancedTaskFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<WorkflowTask>> {
    let tasks = await this.repository.getTasksByUser(userId);

    // Aplicar filtros
    tasks = this.applyFilters(tasks, filters);

    // Aplicar ordenación
    tasks = this.sortTasks(tasks, filters?.orderBy, filters?.orderDirection);

    // Paginar
    return this.paginateTasks(tasks, pagination);
  }

  /**
   * Obtiene tareas de una instancia
   */
  async getTasksByInstance(
    instanceId: string,
    filters?: AdvancedTaskFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<WorkflowTask>> {
    let tasks = await this.repository.getTasksByInstance(instanceId);

    // Aplicar filtros
    tasks = this.applyFilters(tasks, filters);

    // Ordenar
    tasks = this.sortTasks(tasks, filters?.orderBy, filters?.orderDirection);

    // Paginar
    return this.paginateTasks(tasks, pagination);
  }

  /**
   * Obtiene tareas por estado
   */
  async getTasksByStatus(
    status: TaskStatus | TaskStatus[],
    filters?: AdvancedTaskFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<WorkflowTask>> {
    const statuses = Array.isArray(status) ? status : [status];
    let allTasks: WorkflowTask[] = [];

    for (const s of statuses) {
      const tasks = await this.repository.getTasksByStatus(s);
      allTasks = allTasks.concat(tasks);
    }

    // Aplicar filtros
    allTasks = this.applyFilters(allTasks, filters);

    // Ordenar
    allTasks = this.sortTasks(allTasks, filters?.orderBy, filters?.orderDirection);

    // Paginar
    return this.paginateTasks(allTasks, pagination);
  }

  /**
   * Obtiene tareas por grupo candidato
   */
  async getTasksByGroup(
    groupId: string,
    filters?: AdvancedTaskFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<WorkflowTask>> {
    // Obtener todas las tareas pendientes
    const pendingTasks = await this.repository.getTasksByStatus(TaskStatus.PENDING);

    // Filtrar por grupo
    let tasks = pendingTasks.filter(t =>
      t.candidateGroups?.includes(groupId)
    );

    // Aplicar filtros adicionales
    tasks = this.applyFilters(tasks, filters);

    // Ordenar
    tasks = this.sortTasks(tasks, filters?.orderBy, filters?.orderDirection);

    // Paginar
    return this.paginateTasks(tasks, pagination);
  }

  /**
   * Busca tareas con filtros avanzados
   */
  async searchTasks(
    filters: AdvancedTaskFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<WorkflowTask>> {
    // Obtener todas las tareas (en producción esto debería ser más eficiente)
    let tasks: WorkflowTask[] = [];

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      for (const status of statuses) {
        tasks = tasks.concat(await this.repository.getTasksByStatus(status));
      }
    } else {
      // Obtener tareas de estados activos
      const activeStatuses = [
        TaskStatus.PENDING,
        TaskStatus.ASSIGNED,
        TaskStatus.IN_PROGRESS,
        TaskStatus.ESCALATED,
        TaskStatus.DELEGATED
      ];

      for (const status of activeStatuses) {
        tasks = tasks.concat(await this.repository.getTasksByStatus(status));
      }

      if (filters.includeCompleted) {
        tasks = tasks.concat(await this.repository.getTasksByStatus(TaskStatus.COMPLETED));
      }
      if (filters.includeCancelled) {
        tasks = tasks.concat(await this.repository.getTasksByStatus(TaskStatus.CANCELLED));
      }
    }

    // Eliminar duplicados
    const taskMap = new Map<string, WorkflowTask>();
    tasks.forEach(t => taskMap.set(t.id, t));
    tasks = Array.from(taskMap.values());

    // Aplicar filtros
    tasks = this.applyFilters(tasks, filters);

    // Ordenar
    tasks = this.sortTasks(tasks, filters.orderBy, filters.orderDirection);

    // Paginar
    return this.paginateTasks(tasks, pagination);
  }

  // ========================================================================
  // Comentarios
  // ========================================================================

  /**
   * Agrega un comentario a una tarea
   */
  async addComment(
    taskId: string,
    userId: string,
    userName: string,
    content: string,
    attachments?: string[]
  ): Promise<TaskComment> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    const comment: TaskComment = {
      id: uuidv4(),
      userId,
      userName,
      content,
      createdAt: new Date(),
      attachments
    };

    if (!task.comments) {
      task.comments = [];
    }
    task.comments.push(comment);

    await this.repository.saveTask(task);
    this.updateCache(task);

    this.log(`Comentario agregado a tarea ${taskId}`);

    return comment;
  }

  /**
   * Obtiene comentarios de una tarea
   */
  async getComments(taskId: string): Promise<TaskComment[]> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new WorkflowError(
        WorkflowErrorCode.TASK_NOT_FOUND,
        `No se encontró la tarea: ${taskId}`
      );
    }

    return task.comments || [];
  }

  // ========================================================================
  // Verificación de SLAs
  // ========================================================================

  /**
   * Verifica SLAs de todas las tareas activas
   */
  async checkSLAs(): Promise<void> {
    this.log('Verificando SLAs de tareas...');

    const now = new Date();

    // Obtener tareas activas
    const activeStatuses = [
      TaskStatus.PENDING,
      TaskStatus.ASSIGNED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.DELEGATED
    ];

    for (const status of activeStatuses) {
      const tasks = await this.repository.getTasksByStatus(status);

      for (const task of tasks) {
        await this.checkTaskSLA(task, now);
      }
    }
  }

  /**
   * Verifica SLA de una tarea específica
   */
  private async checkTaskSLA(task: WorkflowTask, now: Date): Promise<void> {
    if (!task.slaDeadline) return;

    // Verificar SLA breached
    if (isBefore(task.slaDeadline, now) && !task.slaBreached) {
      task.slaBreached = true;
      await this.repository.saveTask(task);
      this.updateCache(task);

      await this.emitEvent({
        type: WorkflowEventType.TASK_SLA_BREACHED,
        instanceId: task.instanceId,
        nodeId: task.nodeId,
        taskId: task.id,
        timestamp: now,
        data: { slaDeadline: task.slaDeadline, breachedMinutes: differenceInMinutes(now, task.slaDeadline) }
      });

      this.log(`SLA incumplido en tarea ${task.id}`);

      // Auto-escalación si está habilitada
      if (this.config.autoEscalation) {
        await this.autoEscalateTask(task, now);
      }
    }

    // Warning de SLA
    else if (this.config.notifyOnSlaWarning) {
      const totalTime = differenceInMinutes(task.slaDeadline, task.createdAt);
      const elapsedTime = differenceInMinutes(now, task.createdAt);
      const threshold = totalTime * this.config.slaWarningThreshold;

      if (elapsedTime >= threshold && elapsedTime < totalTime) {
        // Emitir warning (solo una vez - se podría agregar flag)
        this.log(`SLA warning para tarea ${task.id}`);
      }
    }
  }

  /**
   * Auto-escala una tarea basado en niveles configurados
   */
  private async autoEscalateTask(task: WorkflowTask, now: Date): Promise<void> {
    if (!task.slaDeadline) return;

    const minutesOverdue = differenceInMinutes(now, task.slaDeadline);
    const currentLevel = task.escalationHistory.length > 0
      ? Math.max(...task.escalationHistory.map(e => e.level))
      : 0;

    // Buscar el siguiente nivel de escalación
    const nextLevel = this.config.defaultEscalationLevels.find(
      level => level.level > currentLevel && level.afterMinutes <= minutesOverdue
    );

    if (nextLevel) {
      await this.escalateTask(
        task.id,
        'system',
        `Auto-escalación por SLA: ${minutesOverdue} minutos de retraso`,
        nextLevel.escalateTo[0]
      );
    }
  }

  // ========================================================================
  // Estadísticas
  // ========================================================================

  /**
   * Obtiene estadísticas de tareas
   */
  async getStatistics(filters?: {
    tenantId?: string;
    fromDate?: Date;
    toDate?: Date;
    userId?: string;
  }): Promise<TaskStatistics> {
    // Obtener todas las tareas relevantes
    const allStatuses = Object.values(TaskStatus);
    let allTasks: WorkflowTask[] = [];

    for (const status of allStatuses) {
      const tasks = await this.repository.getTasksByStatus(status);
      allTasks = allTasks.concat(tasks);
    }

    // Aplicar filtros
    if (filters?.tenantId) {
      allTasks = allTasks.filter(t => t.tenantId === filters.tenantId);
    }
    if (filters?.userId) {
      allTasks = allTasks.filter(t => t.assignee === filters.userId);
    }
    if (filters?.fromDate) {
      allTasks = allTasks.filter(t => t.createdAt >= filters.fromDate!);
    }
    if (filters?.toDate) {
      allTasks = allTasks.filter(t => t.createdAt <= filters.toDate!);
    }

    // Calcular estadísticas
    const byStatus: Record<TaskStatus, number> = {} as Record<TaskStatus, number>;
    const byPriority: Record<TaskPriority, number> = {} as Record<TaskPriority, number>;

    for (const status of allStatuses) {
      byStatus[status] = 0;
    }
    for (const priority of Object.values(TaskPriority)) {
      byPriority[priority] = 0;
    }

    let totalCompletionTime = 0;
    let completedCount = 0;
    let slaBreachedCount = 0;
    const now = new Date();

    for (const task of allTasks) {
      byStatus[task.status]++;
      byPriority[task.priority]++;

      if (task.status === TaskStatus.COMPLETED && task.completedAt) {
        totalCompletionTime += differenceInMinutes(task.completedAt, task.createdAt);
        completedCount++;
      }

      if (task.slaBreached) {
        slaBreachedCount++;
      }
    }

    const overdueTasks = allTasks.filter(t =>
      t.dueDate && isBefore(t.dueDate, now) &&
      t.status !== TaskStatus.COMPLETED &&
      t.status !== TaskStatus.CANCELLED
    ).length;

    return {
      total: allTasks.length,
      byStatus,
      byPriority,
      averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0,
      slaBreachRate: allTasks.length > 0 ? slaBreachedCount / allTasks.length : 0,
      overdueTasks,
      assignedTasks: byStatus[TaskStatus.ASSIGNED] + byStatus[TaskStatus.IN_PROGRESS],
      unassignedTasks: byStatus[TaskStatus.PENDING]
    };
  }

  /**
   * Obtiene tareas próximas a vencer
   */
  async getTasksNearingDeadline(withinMinutes: number = 60): Promise<WorkflowTask[]> {
    const now = new Date();
    const deadline = addMinutes(now, withinMinutes);

    const activeStatuses = [
      TaskStatus.PENDING,
      TaskStatus.ASSIGNED,
      TaskStatus.IN_PROGRESS
    ];

    let result: WorkflowTask[] = [];

    for (const status of activeStatuses) {
      const tasks = await this.repository.getTasksByStatus(status);
      const nearingDeadline = tasks.filter(t =>
        t.slaDeadline &&
        isBefore(t.slaDeadline, deadline) &&
        !isBefore(t.slaDeadline, now)
      );
      result = result.concat(nearingDeadline);
    }

    return result.sort((a, b) =>
      (a.slaDeadline?.getTime() || 0) - (b.slaDeadline?.getTime() || 0)
    );
  }

  // ========================================================================
  // Helpers privados
  // ========================================================================

  private applyFilters(tasks: WorkflowTask[], filters?: AdvancedTaskFilters): WorkflowTask[] {
    if (!filters) return tasks;

    let result = tasks;

    if (filters.assignee) {
      result = result.filter(t => t.assignee === filters.assignee);
    }

    if (filters.candidateUser) {
      result = result.filter(t =>
        t.candidateUsers?.includes(filters.candidateUser!) ||
        t.assignee === filters.candidateUser
      );
    }

    if (filters.candidateGroup) {
      result = result.filter(t =>
        t.candidateGroups?.includes(filters.candidateGroup!)
      );
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      result = result.filter(t => priorities.includes(t.priority));
    }

    if (filters.nodeId) {
      result = result.filter(t => t.nodeId === filters.nodeId);
    }

    if (filters.formKey) {
      result = result.filter(t => t.formKey === filters.formKey);
    }

    if (filters.tenantId) {
      result = result.filter(t => t.tenantId === filters.tenantId);
    }

    if (filters.businessKey) {
      result = result.filter(t => t.businessKey === filters.businessKey);
    }

    if (filters.dueBefore) {
      result = result.filter(t => t.dueDate && isBefore(t.dueDate, filters.dueBefore!));
    }

    if (filters.dueAfter) {
      result = result.filter(t => t.dueDate && t.dueDate >= filters.dueAfter!);
    }

    if (filters.createdBefore) {
      result = result.filter(t => isBefore(t.createdAt, filters.createdBefore!));
    }

    if (filters.createdAfter) {
      result = result.filter(t => t.createdAt >= filters.createdAfter!);
    }

    if (filters.slaBreached !== undefined) {
      result = result.filter(t => t.slaBreached === filters.slaBreached);
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      result = result.filter(t =>
        t.nodeName.toLowerCase().includes(searchLower) ||
        t.businessKey?.toLowerCase().includes(searchLower) ||
        t.assignee?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  private sortTasks(
    tasks: WorkflowTask[],
    orderBy?: 'createdAt' | 'dueDate' | 'priority' | 'status',
    orderDirection?: 'asc' | 'desc'
  ): WorkflowTask[] {
    if (!orderBy) return tasks;

    const direction = orderDirection === 'desc' ? -1 : 1;

    return tasks.sort((a, b) => {
      let comparison = 0;

      switch (orderBy) {
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'dueDate':
          const aTime = a.dueDate?.getTime() || Number.MAX_SAFE_INTEGER;
          const bTime = b.dueDate?.getTime() || Number.MAX_SAFE_INTEGER;
          comparison = aTime - bTime;
          break;
        case 'priority':
          const priorityOrder = {
            [TaskPriority.CRITICAL]: 0,
            [TaskPriority.URGENT]: 1,
            [TaskPriority.HIGH]: 2,
            [TaskPriority.NORMAL]: 3,
            [TaskPriority.LOW]: 4
          };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return comparison * direction;
    });
  }

  private paginateTasks(
    tasks: WorkflowTask[],
    pagination?: PaginationOptions
  ): PaginatedResult<WorkflowTask> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const total = tasks.length;
    const totalPages = Math.ceil(total / pageSize);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = tasks.slice(start, end);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  private updateCache(task: WorkflowTask): void {
    this.taskCache.set(task.id, { task, timestamp: Date.now() });
  }

  private getEscalationTarget(level: number): string | undefined {
    const escalationLevel = this.config.defaultEscalationLevels.find(l => l.level === level);
    return escalationLevel?.escalateTo[0];
  }

  private userInGroup(userId: string, groupId: string): boolean {
    // Implementación simplificada - debería consultar un servicio de usuarios
    return false;
  }

  private async emitEvent(event: WorkflowEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.log(`Error en handler de evento ${event.type}: ${error}`);
      }
    }

    this.emit(event.type, event);
    this.emit('task:event', event);
  }

  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[TaskManager] ${message}`);
    }
  }
}

export const taskManagerService = new TaskManagerService();
