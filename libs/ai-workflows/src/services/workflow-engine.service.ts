/**
 * AI-Workflows - Motor principal de ejecución de workflows BPMN 2.0
 * @module @ai-core/ai-workflows/services/workflow-engine
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';
import { addMilliseconds, addMinutes, addHours, addDays, isBefore, isAfter } from 'date-fns';
import * as cronParser from 'cron-parser';
import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTask,
  WorkflowTimer,
  WorkflowVariable,
  WorkflowStatus,
  TaskStatus,
  NodeType,
  TransitionType,
  TimerEventType,
  VariableType,
  TaskPriority,
  TaskOutcome,
  ExecutionContext,
  NodeExecutionResult,
  ConditionEvaluationResult,
  ExecutionStep,
  StartWorkflowOptions,
  CompleteTaskOptions,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowEventHandler,
  WorkflowError,
  WorkflowErrorCode,
  WorkflowConfig
} from '../types';
import { BpmnParserService, bpmnParserService } from './bpmn-parser.service';

/**
 * Repositorio de datos del workflow (interfaz abstracta)
 */
export interface WorkflowRepository {
  // Definiciones
  getDefinitionByCode(code: string, version?: number): Promise<WorkflowDefinition | null>;
  getDefinitionById(id: string): Promise<WorkflowDefinition | null>;
  saveDefinition(definition: WorkflowDefinition): Promise<WorkflowDefinition>;

  // Instancias
  getInstance(id: string): Promise<WorkflowInstance | null>;
  saveInstance(instance: WorkflowInstance): Promise<WorkflowInstance>;
  getInstancesByDefinition(definitionId: string): Promise<WorkflowInstance[]>;
  getActiveInstances(): Promise<WorkflowInstance[]>;

  // Tareas
  getTask(id: string): Promise<WorkflowTask | null>;
  saveTask(task: WorkflowTask): Promise<WorkflowTask>;
  getTasksByInstance(instanceId: string): Promise<WorkflowTask[]>;
  getTasksByUser(userId: string): Promise<WorkflowTask[]>;
  getTasksByStatus(status: TaskStatus): Promise<WorkflowTask[]>;

  // Timers
  getTimer(id: string): Promise<WorkflowTimer | null>;
  saveTimer(timer: WorkflowTimer): Promise<WorkflowTimer>;
  getPendingTimers(): Promise<WorkflowTimer[]>;
  getTimersByInstance(instanceId: string): Promise<WorkflowTimer[]>;
}

/**
 * Implementación en memoria del repositorio (para desarrollo/testing)
 */
export class InMemoryWorkflowRepository implements WorkflowRepository {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private instances: Map<string, WorkflowInstance> = new Map();
  private tasks: Map<string, WorkflowTask> = new Map();
  private timers: Map<string, WorkflowTimer> = new Map();

  async getDefinitionByCode(code: string, version?: number): Promise<WorkflowDefinition | null> {
    const defs = Array.from(this.definitions.values())
      .filter(d => d.code === code)
      .sort((a, b) => b.version - a.version);

    if (version !== undefined) {
      return defs.find(d => d.version === version) || null;
    }
    return defs[0] || null;
  }

  async getDefinitionById(id: string): Promise<WorkflowDefinition | null> {
    return this.definitions.get(id) || null;
  }

  async saveDefinition(definition: WorkflowDefinition): Promise<WorkflowDefinition> {
    this.definitions.set(definition.id, definition);
    return definition;
  }

  async getInstance(id: string): Promise<WorkflowInstance | null> {
    return this.instances.get(id) || null;
  }

  async saveInstance(instance: WorkflowInstance): Promise<WorkflowInstance> {
    this.instances.set(instance.id, instance);
    return instance;
  }

  async getInstancesByDefinition(definitionId: string): Promise<WorkflowInstance[]> {
    return Array.from(this.instances.values())
      .filter(i => i.definitionId === definitionId);
  }

  async getActiveInstances(): Promise<WorkflowInstance[]> {
    return Array.from(this.instances.values())
      .filter(i => i.status === WorkflowStatus.ACTIVE);
  }

  async getTask(id: string): Promise<WorkflowTask | null> {
    return this.tasks.get(id) || null;
  }

  async saveTask(task: WorkflowTask): Promise<WorkflowTask> {
    this.tasks.set(task.id, task);
    return task;
  }

  async getTasksByInstance(instanceId: string): Promise<WorkflowTask[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.instanceId === instanceId);
  }

  async getTasksByUser(userId: string): Promise<WorkflowTask[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.assignee === userId || t.candidateUsers?.includes(userId));
  }

  async getTasksByStatus(status: TaskStatus): Promise<WorkflowTask[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.status === status);
  }

  async getTimer(id: string): Promise<WorkflowTimer | null> {
    return this.timers.get(id) || null;
  }

  async saveTimer(timer: WorkflowTimer): Promise<WorkflowTimer> {
    this.timers.set(timer.id, timer);
    return timer;
  }

  async getPendingTimers(): Promise<WorkflowTimer[]> {
    return Array.from(this.timers.values())
      .filter(t => t.status === 'pending');
  }

  async getTimersByInstance(instanceId: string): Promise<WorkflowTimer[]> {
    return Array.from(this.timers.values())
      .filter(t => t.instanceId === instanceId);
  }
}

/**
 * Configuración del motor de workflow
 */
export interface WorkflowEngineConfig {
  /** Intervalo de verificación de timers (ms) */
  timerCheckInterval: number;
  /** Intervalo de verificación de SLAs (ms) */
  slaCheckInterval: number;
  /** Reintentos por defecto en errores de servicio */
  defaultRetries: number;
  /** Timeout por defecto para service tasks (ms) */
  serviceTaskTimeout: number;
  /** Habilitar logging detallado */
  debugMode: boolean;
}

/**
 * Motor principal de ejecución de workflows BPMN 2.0
 */
export class WorkflowEngineService extends EventEmitter {
  private repository: WorkflowRepository;
  private bpmnParser: BpmnParserService;
  private config: WorkflowEngineConfig;
  private timerInterval?: NodeJS.Timeout;
  private slaInterval?: NodeJS.Timeout;
  private eventHandlers: Map<WorkflowEventType, WorkflowEventHandler[]> = new Map();

  // Cache de tokens para parallel gateways
  private parallelTokens: Map<string, Map<string, Set<string>>> = new Map();

  // Handlers de service tasks personalizados
  private serviceTaskHandlers: Map<string, (context: ExecutionContext) => Promise<Record<string, any>>> = new Map();

  constructor(
    repository?: WorkflowRepository,
    config?: Partial<WorkflowEngineConfig>
  ) {
    super();

    this.repository = repository || new InMemoryWorkflowRepository();
    this.bpmnParser = bpmnParserService;

    this.config = {
      timerCheckInterval: 10000, // 10 segundos
      slaCheckInterval: 60000, // 1 minuto
      defaultRetries: 3,
      serviceTaskTimeout: 30000, // 30 segundos
      debugMode: false,
      ...config
    };
  }

  /**
   * Inicia el motor de workflow
   */
  start(): void {
    this.log('Motor de workflow iniciado');

    // Iniciar verificación de timers
    this.timerInterval = setInterval(
      () => this.checkPendingTimers(),
      this.config.timerCheckInterval
    );

    // Iniciar verificación de SLAs
    this.slaInterval = setInterval(
      () => this.checkSLAs(),
      this.config.slaCheckInterval
    );
  }

  /**
   * Detiene el motor de workflow
   */
  stop(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.slaInterval) {
      clearInterval(this.slaInterval);
    }
    this.log('Motor de workflow detenido');
  }

  /**
   * Registra un handler de service task
   */
  registerServiceTaskHandler(
    taskType: string,
    handler: (context: ExecutionContext) => Promise<Record<string, any>>
  ): void {
    this.serviceTaskHandlers.set(taskType, handler);
    this.log(`Handler de service task registrado: ${taskType}`);
  }

  /**
   * Registra un handler de eventos
   */
  onWorkflowEvent(eventType: WorkflowEventType, handler: WorkflowEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // ========================================================================
  // Gestión de instancias de workflow
  // ========================================================================

  /**
   * Inicia un nuevo workflow
   */
  async startWorkflow(options: StartWorkflowOptions): Promise<WorkflowInstance> {
    const { definitionCode, version, variables, businessKey, correlationId, startedBy, tenantId, parentInstanceId, callActivityNodeId, metadata } = options;

    // Obtener definición
    const definition = await this.repository.getDefinitionByCode(definitionCode, version);
    if (!definition) {
      throw new WorkflowError(
        WorkflowErrorCode.DEFINITION_NOT_FOUND,
        `No se encontró la definición del workflow: ${definitionCode}`
      );
    }

    // Verificar que la definición esté activa
    if (definition.status !== WorkflowStatus.ACTIVE) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La definición del workflow no está activa: ${definition.status}`
      );
    }

    // Verificar múltiples instancias
    if (!definition.config.allowMultipleInstances) {
      const existingInstances = await this.repository.getInstancesByDefinition(definition.id);
      const activeInstance = existingInstances.find(i => i.status === WorkflowStatus.ACTIVE);
      if (activeInstance) {
        throw new WorkflowError(
          WorkflowErrorCode.INVALID_STATE,
          'Ya existe una instancia activa de este workflow'
        );
      }
    }

    // Encontrar eventos de inicio
    const startEvents = this.bpmnParser.findStartEvents(definition);
    if (startEvents.length === 0) {
      throw new WorkflowError(
        WorkflowErrorCode.BPMN_PARSE_ERROR,
        'El workflow no tiene eventos de inicio'
      );
    }

    // Crear instancia
    const instance: WorkflowInstance = {
      id: uuidv4(),
      definitionId: definition.id,
      definitionCode: definition.code,
      definitionVersion: definition.version,
      status: WorkflowStatus.ACTIVE,
      businessKey,
      correlationId,
      currentNodeIds: [],
      executionPath: [],
      variables: this.initializeVariables(definition, variables || {}),
      startedAt: new Date(),
      startedBy,
      tenantId,
      parentInstanceId,
      rootInstanceId: parentInstanceId ? undefined : undefined,
      callActivityNodeId,
      metadata
    };

    // Guardar instancia
    await this.repository.saveInstance(instance);

    // Emitir evento
    await this.emitEvent({
      type: WorkflowEventType.INSTANCE_STARTED,
      instanceId: instance.id,
      timestamp: new Date(),
      userId: startedBy,
      data: { definitionCode, variables }
    });

    this.log(`Workflow iniciado: ${instance.id} (${definitionCode})`);

    // Ejecutar desde los eventos de inicio
    for (const startEvent of startEvents) {
      // Solo procesar eventos de inicio simples (no timer, message, etc.)
      if (startEvent.type === NodeType.START_EVENT) {
        await this.executeNode(instance, definition, startEvent, { userId: startedBy });
      }
    }

    return instance;
  }

  /**
   * Obtiene el estado de una instancia
   */
  async getInstanceStatus(instanceId: string): Promise<{
    instance: WorkflowInstance;
    tasks: WorkflowTask[];
    timers: WorkflowTimer[];
  }> {
    const instance = await this.repository.getInstance(instanceId);
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.INSTANCE_NOT_FOUND,
        `No se encontró la instancia: ${instanceId}`
      );
    }

    const tasks = await this.repository.getTasksByInstance(instanceId);
    const timers = await this.repository.getTimersByInstance(instanceId);

    return { instance, tasks, timers };
  }

  /**
   * Suspende una instancia
   */
  async suspendInstance(instanceId: string, userId: string): Promise<WorkflowInstance> {
    const instance = await this.repository.getInstance(instanceId);
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.INSTANCE_NOT_FOUND,
        `No se encontró la instancia: ${instanceId}`
      );
    }

    if (instance.status !== WorkflowStatus.ACTIVE) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La instancia no está activa: ${instance.status}`
      );
    }

    instance.status = WorkflowStatus.SUSPENDED;
    await this.repository.saveInstance(instance);

    // Suspender timers
    const timers = await this.repository.getTimersByInstance(instanceId);
    for (const timer of timers) {
      if (timer.status === 'pending') {
        timer.status = 'cancelled';
        await this.repository.saveTimer(timer);
      }
    }

    await this.emitEvent({
      type: WorkflowEventType.INSTANCE_SUSPENDED,
      instanceId,
      timestamp: new Date(),
      userId
    });

    this.log(`Instancia suspendida: ${instanceId}`);
    return instance;
  }

  /**
   * Reanuda una instancia suspendida
   */
  async resumeInstance(instanceId: string, userId: string): Promise<WorkflowInstance> {
    const instance = await this.repository.getInstance(instanceId);
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.INSTANCE_NOT_FOUND,
        `No se encontró la instancia: ${instanceId}`
      );
    }

    if (instance.status !== WorkflowStatus.SUSPENDED) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La instancia no está suspendida: ${instance.status}`
      );
    }

    instance.status = WorkflowStatus.ACTIVE;
    await this.repository.saveInstance(instance);

    // Recrear timers si es necesario
    // (Implementación simplificada)

    await this.emitEvent({
      type: WorkflowEventType.INSTANCE_RESUMED,
      instanceId,
      timestamp: new Date(),
      userId
    });

    this.log(`Instancia reanudada: ${instanceId}`);
    return instance;
  }

  /**
   * Cancela una instancia
   */
  async cancelInstance(instanceId: string, userId: string, reason?: string): Promise<WorkflowInstance> {
    const instance = await this.repository.getInstance(instanceId);
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.INSTANCE_NOT_FOUND,
        `No se encontró la instancia: ${instanceId}`
      );
    }

    if (instance.status === WorkflowStatus.COMPLETED ||
        instance.status === WorkflowStatus.CANCELLED ||
        instance.status === WorkflowStatus.TERMINATED) {
      throw new WorkflowError(
        WorkflowErrorCode.INVALID_STATE,
        `La instancia ya está finalizada: ${instance.status}`
      );
    }

    instance.status = WorkflowStatus.CANCELLED;
    instance.completedAt = new Date();
    await this.repository.saveInstance(instance);

    // Cancelar tareas pendientes
    const tasks = await this.repository.getTasksByInstance(instanceId);
    for (const task of tasks) {
      if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED) {
        task.status = TaskStatus.CANCELLED;
        task.completedAt = new Date();
        await this.repository.saveTask(task);
      }
    }

    // Cancelar timers
    const timers = await this.repository.getTimersByInstance(instanceId);
    for (const timer of timers) {
      if (timer.status === 'pending') {
        timer.status = 'cancelled';
        await this.repository.saveTimer(timer);
      }
    }

    await this.emitEvent({
      type: WorkflowEventType.INSTANCE_CANCELLED,
      instanceId,
      timestamp: new Date(),
      userId,
      data: { reason }
    });

    this.log(`Instancia cancelada: ${instanceId}`);
    return instance;
  }

  // ========================================================================
  // Ejecución de nodos
  // ========================================================================

  /**
   * Ejecuta un nodo del workflow
   */
  private async executeNode(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string; data?: Record<string, any> }
  ): Promise<NodeExecutionResult> {
    this.log(`Ejecutando nodo: ${node.name} (${node.type}) en instancia ${instance.id}`);

    // Registrar entrada al nodo
    const executionStep: ExecutionStep = {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      startedAt: new Date(),
      status: 'active',
      executedBy: context.userId
    };
    instance.executionPath.push(executionStep);
    instance.currentNodeIds.push(node.id);

    await this.emitEvent({
      type: WorkflowEventType.NODE_ENTERED,
      instanceId: instance.id,
      nodeId: node.id,
      timestamp: new Date(),
      userId: context.userId
    });

    try {
      let result: NodeExecutionResult;

      switch (node.type) {
        // Eventos de inicio
        case NodeType.START_EVENT:
        case NodeType.START_EVENT_MESSAGE:
        case NodeType.START_EVENT_SIGNAL:
        case NodeType.START_EVENT_CONDITIONAL:
          result = await this.executeStartEvent(instance, definition, node, context);
          break;

        case NodeType.START_EVENT_TIMER:
          result = await this.executeTimerStartEvent(instance, definition, node, context);
          break;

        // Eventos de fin
        case NodeType.END_EVENT:
        case NodeType.END_EVENT_MESSAGE:
        case NodeType.END_EVENT_SIGNAL:
          result = await this.executeEndEvent(instance, definition, node, context);
          break;

        case NodeType.END_EVENT_ERROR:
          result = await this.executeErrorEndEvent(instance, definition, node, context);
          break;

        case NodeType.END_EVENT_TERMINATE:
          result = await this.executeTerminateEndEvent(instance, definition, node, context);
          break;

        // Tareas
        case NodeType.USER_TASK:
          result = await this.executeUserTask(instance, definition, node, context);
          break;

        case NodeType.SERVICE_TASK:
          result = await this.executeServiceTask(instance, definition, node, context);
          break;

        case NodeType.SCRIPT_TASK:
          result = await this.executeScriptTask(instance, definition, node, context);
          break;

        case NodeType.SEND_TASK:
          result = await this.executeSendTask(instance, definition, node, context);
          break;

        case NodeType.RECEIVE_TASK:
          result = await this.executeReceiveTask(instance, definition, node, context);
          break;

        case NodeType.MANUAL_TASK:
          result = await this.executeManualTask(instance, definition, node, context);
          break;

        case NodeType.BUSINESS_RULE_TASK:
          result = await this.executeBusinessRuleTask(instance, definition, node, context);
          break;

        // Gateways
        case NodeType.EXCLUSIVE_GATEWAY:
          result = await this.executeExclusiveGateway(instance, definition, node, context);
          break;

        case NodeType.INCLUSIVE_GATEWAY:
          result = await this.executeInclusiveGateway(instance, definition, node, context);
          break;

        case NodeType.PARALLEL_GATEWAY:
          result = await this.executeParallelGateway(instance, definition, node, context);
          break;

        case NodeType.EVENT_BASED_GATEWAY:
          result = await this.executeEventBasedGateway(instance, definition, node, context);
          break;

        // Subprocesos
        case NodeType.SUBPROCESS:
        case NodeType.SUBPROCESS_EMBEDDED:
          result = await this.executeSubprocess(instance, definition, node, context);
          break;

        case NodeType.CALL_ACTIVITY:
          result = await this.executeCallActivity(instance, definition, node, context);
          break;

        // Eventos intermedios
        case NodeType.INTERMEDIATE_CATCH_EVENT:
        case NodeType.INTERMEDIATE_MESSAGE_EVENT:
        case NodeType.INTERMEDIATE_SIGNAL_EVENT:
          result = await this.executeIntermediateCatchEvent(instance, definition, node, context);
          break;

        case NodeType.INTERMEDIATE_TIMER_EVENT:
          result = await this.executeIntermediateTimerEvent(instance, definition, node, context);
          break;

        case NodeType.INTERMEDIATE_THROW_EVENT:
          result = await this.executeIntermediateThrowEvent(instance, definition, node, context);
          break;

        default:
          result = {
            success: false,
            error: {
              code: 'UNSUPPORTED_NODE_TYPE',
              message: `Tipo de nodo no soportado: ${node.type}`
            }
          };
      }

      // Actualizar paso de ejecución
      const stepIndex = instance.executionPath.length - 1;
      if (result.success) {
        instance.executionPath[stepIndex].status = result.waitForEvent ? 'active' : 'completed';
        instance.executionPath[stepIndex].completedAt = result.waitForEvent ? undefined : new Date();

        // Actualizar variables de salida
        if (result.outputVariables) {
          for (const [name, value] of Object.entries(result.outputVariables)) {
            this.setVariable(instance, name, value, context.userId);
          }
        }

        // Remover nodo actual de currentNodeIds si no espera evento
        if (!result.waitForEvent) {
          instance.currentNodeIds = instance.currentNodeIds.filter(id => id !== node.id);
        }

        await this.repository.saveInstance(instance);

        // Continuar al siguiente nodo si hay
        if (result.nextNodeIds && result.nextNodeIds.length > 0) {
          for (const nextNodeId of result.nextNodeIds) {
            const nextNode = definition.nodes.find(n => n.id === nextNodeId);
            if (nextNode) {
              // Ejecutar de forma asíncrona para evitar stack overflow en workflows largos
              setImmediate(() => {
                this.executeNode(instance, definition, nextNode, context).catch(err => {
                  this.log(`Error ejecutando nodo ${nextNodeId}: ${err.message}`);
                });
              });
            }
          }
        }
      } else {
        instance.executionPath[stepIndex].status = 'error';
        instance.executionPath[stepIndex].error = result.error?.message;
        await this.repository.saveInstance(instance);

        await this.emitEvent({
          type: WorkflowEventType.NODE_ERROR,
          instanceId: instance.id,
          nodeId: node.id,
          timestamp: new Date(),
          userId: context.userId,
          data: { error: result.error }
        });
      }

      await this.emitEvent({
        type: WorkflowEventType.NODE_EXITED,
        instanceId: instance.id,
        nodeId: node.id,
        timestamp: new Date(),
        userId: context.userId,
        data: { result }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      instance.executionPath[instance.executionPath.length - 1].status = 'error';
      instance.executionPath[instance.executionPath.length - 1].error = errorMessage;
      await this.repository.saveInstance(instance);

      await this.emitEvent({
        type: WorkflowEventType.NODE_ERROR,
        instanceId: instance.id,
        nodeId: node.id,
        timestamp: new Date(),
        userId: context.userId,
        data: { error: errorMessage }
      });

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: errorMessage
        }
      };
    }
  }

  // ========================================================================
  // Implementación de tipos de nodo
  // ========================================================================

  private async executeStartEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Evento de inicio simple - continuar al siguiente nodo
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeTimerStartEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Crear timer si tiene configuración
    if (node.config.timerExpression) {
      const triggerAt = this.calculateTimerTrigger(
        node.config.timerType || TimerEventType.TIME_DURATION,
        node.config.timerExpression
      );

      const timer: WorkflowTimer = {
        id: uuidv4(),
        instanceId: instance.id,
        nodeId: node.id,
        timerType: node.config.timerType || TimerEventType.TIME_DURATION,
        expression: node.config.timerExpression,
        status: 'pending',
        createdAt: new Date(),
        triggerAt,
        currentRepeat: 0
      };

      await this.repository.saveTimer(timer);

      return {
        success: true,
        waitForEvent: {
          type: 'timer',
          config: { timerId: timer.id }
        }
      };
    }

    // Si no hay timer, continuar
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeEndEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Verificar si hay otros nodos activos
    const otherActiveNodes = instance.currentNodeIds.filter(id => id !== node.id);

    if (otherActiveNodes.length === 0) {
      // Completar instancia
      instance.status = WorkflowStatus.COMPLETED;
      instance.completedAt = new Date();
      await this.repository.saveInstance(instance);

      await this.emitEvent({
        type: WorkflowEventType.INSTANCE_COMPLETED,
        instanceId: instance.id,
        timestamp: new Date(),
        userId: context.userId
      });

      this.log(`Instancia completada: ${instance.id}`);

      // Si es subproceso, notificar al padre
      if (instance.parentInstanceId && instance.callActivityNodeId) {
        await this.handleSubprocessCompletion(instance);
      }
    }

    return { success: true };
  }

  private async executeErrorEndEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Terminar con error
    instance.status = WorkflowStatus.TERMINATED;
    instance.completedAt = new Date();
    await this.repository.saveInstance(instance);

    await this.emitEvent({
      type: WorkflowEventType.INSTANCE_ERROR,
      instanceId: instance.id,
      timestamp: new Date(),
      userId: context.userId,
      data: { errorNode: node.id }
    });

    return { success: true };
  }

  private async executeTerminateEndEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Terminar inmediatamente todas las ramas
    instance.status = WorkflowStatus.TERMINATED;
    instance.completedAt = new Date();
    instance.currentNodeIds = [];
    await this.repository.saveInstance(instance);

    // Cancelar tareas pendientes
    const tasks = await this.repository.getTasksByInstance(instance.id);
    for (const task of tasks) {
      if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED) {
        task.status = TaskStatus.CANCELLED;
        await this.repository.saveTask(task);
      }
    }

    return { success: true };
  }

  private async executeUserTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Crear tarea de usuario
    const assignee = node.config.assigneeExpression
      ? this.evaluateExpression(node.config.assigneeExpression, instance.variables)
      : undefined;

    const dueDate = node.config.dueDate
      ? this.evaluateExpression(node.config.dueDate, instance.variables)
      : undefined;

    const slaDeadline = node.config.slaMinutes
      ? addMinutes(new Date(), node.config.slaMinutes)
      : undefined;

    const task: WorkflowTask = {
      id: uuidv4(),
      instanceId: instance.id,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: assignee ? TaskStatus.ASSIGNED : TaskStatus.PENDING,
      priority: node.config.priority || TaskPriority.NORMAL,
      assignee,
      candidateUsers: node.config.candidateUsers,
      candidateGroups: node.config.candidateGroups,
      createdAt: new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      slaDeadline,
      slaBreached: false,
      formKey: node.config.formKey,
      assignmentHistory: assignee ? [{
        id: uuidv4(),
        taskId: '',
        assignedTo: assignee,
        assignedBy: 'system',
        assignedAt: new Date(),
        type: 'initial'
      }] : [],
      escalationHistory: [],
      tenantId: instance.tenantId,
      businessKey: instance.businessKey
    };

    task.assignmentHistory[0].taskId = task.id;

    await this.repository.saveTask(task);

    await this.emitEvent({
      type: WorkflowEventType.TASK_CREATED,
      instanceId: instance.id,
      nodeId: node.id,
      taskId: task.id,
      timestamp: new Date(),
      userId: context.userId,
      data: { assignee, candidateUsers: node.config.candidateUsers }
    });

    this.log(`Tarea creada: ${task.id} (${node.name})`);

    return {
      success: true,
      waitForEvent: {
        type: 'task',
        config: { taskId: task.id }
      }
    };
  }

  private async executeServiceTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    const executionContext: ExecutionContext = {
      instance,
      currentNode: node,
      variables: this.getVariablesAsObject(instance),
      userId: context.userId,
      tenantId: instance.tenantId
    };

    try {
      let outputVariables: Record<string, any> = {};

      // Buscar handler registrado
      const serviceType = node.config.serviceEndpoint || node.config.serviceType || 'default';
      const handler = this.serviceTaskHandlers.get(serviceType);

      if (handler) {
        outputVariables = await handler(executionContext);
      } else if (node.config.serviceType === 'HTTP' && node.config.serviceEndpoint) {
        // Ejecutar llamada HTTP
        outputVariables = await this.executeHttpServiceTask(node, executionContext);
      } else if (node.config.serviceType === 'SCRIPT' && node.config.script) {
        // Ejecutar script
        outputVariables = await this.executeScript(node.config.script, executionContext);
      } else {
        this.log(`Advertencia: Service task sin handler: ${node.name}`);
      }

      const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

      return {
        success: true,
        nextNodeIds: outgoingEdges.map(e => e.targetNodeId),
        outputVariables
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Verificar reintentos
      const retryConfig = node.config.retryConfig || {
        maxRetries: this.config.defaultRetries,
        retryInterval: 5000,
        exponentialBackoff: false
      };

      // Por ahora, fallar directamente
      return {
        success: false,
        error: {
          code: WorkflowErrorCode.SERVICE_TASK_ERROR,
          message: errorMessage
        }
      };
    }
  }

  private async executeHttpServiceTask(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<Record<string, any>> {
    const endpoint = this.evaluateExpression(node.config.serviceEndpoint!, context.variables);
    const method = node.config.serviceMethod || 'POST';
    const headers = node.config.serviceHeaders || {};
    const payload = node.config.servicePayload
      ? this.evaluateExpression(node.config.servicePayload, context.variables)
      : undefined;

    // Usar fetch nativo
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: payload ? JSON.stringify(payload) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { serviceResponse: data };
  }

  private async executeScriptTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    if (!node.config.script) {
      return {
        success: false,
        error: {
          code: 'SCRIPT_MISSING',
          message: 'Script no definido'
        }
      };
    }

    const executionContext: ExecutionContext = {
      instance,
      currentNode: node,
      variables: this.getVariablesAsObject(instance),
      userId: context.userId,
      tenantId: instance.tenantId
    };

    try {
      const outputVariables = await this.executeScript(node.config.script, executionContext);
      const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

      return {
        success: true,
        nextNodeIds: outgoingEdges.map(e => e.targetNodeId),
        outputVariables
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SCRIPT_ERROR',
          message: error instanceof Error ? error.message : 'Error en script'
        }
      };
    }
  }

  private async executeSendTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Implementación simplificada - emitir evento de mensaje
    await this.emitEvent({
      type: WorkflowEventType.NODE_EXITED,
      instanceId: instance.id,
      nodeId: node.id,
      timestamp: new Date(),
      userId: context.userId,
      data: { messageType: 'send' }
    });

    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeReceiveTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Esperar mensaje externo
    return {
      success: true,
      waitForEvent: {
        type: 'message',
        config: { nodeId: node.id }
      }
    };
  }

  private async executeManualTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Similar a user task pero sin formulario
    return this.executeUserTask(instance, definition, node, context);
  }

  private async executeBusinessRuleTask(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Evaluar regla de negocio (simplificado)
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeExclusiveGateway(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    const variables = this.getVariablesAsObject(instance);

    // Evaluar condiciones en orden
    for (const edge of outgoingEdges) {
      if (edge.isDefault) continue;

      if (edge.conditionExpression) {
        const result = this.evaluateCondition(edge.conditionExpression, variables);
        if (result.result) {
          return {
            success: true,
            nextNodeIds: [edge.targetNodeId]
          };
        }
      }
    }

    // Usar flujo por defecto
    const defaultEdge = outgoingEdges.find(e => e.isDefault);
    if (defaultEdge) {
      return {
        success: true,
        nextNodeIds: [defaultEdge.targetNodeId]
      };
    }

    // Si solo hay un flujo, usarlo
    if (outgoingEdges.length === 1) {
      return {
        success: true,
        nextNodeIds: [outgoingEdges[0].targetNodeId]
      };
    }

    return {
      success: false,
      error: {
        code: WorkflowErrorCode.GATEWAY_ERROR,
        message: 'Ninguna condición del gateway exclusivo se cumplió y no hay flujo por defecto'
      }
    };
  }

  private async executeInclusiveGateway(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    const incomingEdges = definition.edges.filter(e => e.targetNodeId === node.id);
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

    // Si es gateway de convergencia
    if (incomingEdges.length > 1) {
      // Verificar tokens (simplificado - no maneja sincronización completa)
    }

    // Si es gateway de divergencia
    const variables = this.getVariablesAsObject(instance);
    const selectedEdges: WorkflowEdge[] = [];

    for (const edge of outgoingEdges) {
      if (edge.isDefault) continue;

      if (edge.conditionExpression) {
        const result = this.evaluateCondition(edge.conditionExpression, variables);
        if (result.result) {
          selectedEdges.push(edge);
        }
      }
    }

    // Si ninguna condición se cumple, usar flujo por defecto
    if (selectedEdges.length === 0) {
      const defaultEdge = outgoingEdges.find(e => e.isDefault);
      if (defaultEdge) {
        selectedEdges.push(defaultEdge);
      }
    }

    if (selectedEdges.length === 0) {
      return {
        success: false,
        error: {
          code: WorkflowErrorCode.GATEWAY_ERROR,
          message: 'Ninguna condición del gateway inclusivo se cumplió'
        }
      };
    }

    return {
      success: true,
      nextNodeIds: selectedEdges.map(e => e.targetNodeId)
    };
  }

  private async executeParallelGateway(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    const incomingEdges = definition.edges.filter(e => e.targetNodeId === node.id);
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

    // Si es gateway de divergencia (fork)
    if (incomingEdges.length === 1) {
      return {
        success: true,
        nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
      };
    }

    // Si es gateway de convergencia (join)
    if (incomingEdges.length > 1) {
      // Inicializar tokens para esta instancia/nodo
      const instanceTokens = this.parallelTokens.get(instance.id) || new Map();
      const nodeTokens = instanceTokens.get(node.id) || new Set();

      // Encontrar el paso actual para determinar de qué edge venimos
      const currentStep = instance.executionPath[instance.executionPath.length - 2];
      if (currentStep) {
        const sourceEdge = incomingEdges.find(e => e.sourceNodeId === currentStep.nodeId);
        if (sourceEdge) {
          nodeTokens.add(sourceEdge.id);
        }
      } else {
        // Añadir un token genérico
        nodeTokens.add('token-' + Date.now());
      }

      instanceTokens.set(node.id, nodeTokens);
      this.parallelTokens.set(instance.id, instanceTokens);

      // Verificar si tenemos todos los tokens
      if (nodeTokens.size >= incomingEdges.length) {
        // Limpiar tokens
        instanceTokens.delete(node.id);
        this.parallelTokens.set(instance.id, instanceTokens);

        return {
          success: true,
          nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
        };
      }

      // Esperar más tokens
      return {
        success: true,
        waitForEvent: {
          type: 'token',
          config: { nodeId: node.id, pending: incomingEdges.length - nodeTokens.size }
        }
      };
    }

    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeEventBasedGateway(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Esperar el primer evento que ocurra
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

    // Crear listeners para todos los eventos siguientes
    for (const edge of outgoingEdges) {
      const targetNode = definition.nodes.find(n => n.id === edge.targetNodeId);
      if (targetNode) {
        // Configurar timer o mensaje según el tipo de evento
        if (targetNode.type === NodeType.INTERMEDIATE_TIMER_EVENT && targetNode.config.timerExpression) {
          const triggerAt = this.calculateTimerTrigger(
            targetNode.config.timerType || TimerEventType.TIME_DURATION,
            targetNode.config.timerExpression
          );

          const timer: WorkflowTimer = {
            id: uuidv4(),
            instanceId: instance.id,
            nodeId: targetNode.id,
            timerType: targetNode.config.timerType || TimerEventType.TIME_DURATION,
            expression: targetNode.config.timerExpression,
            status: 'pending',
            createdAt: new Date(),
            triggerAt,
            currentRepeat: 0,
            data: { gatewayId: node.id }
          };

          await this.repository.saveTimer(timer);
        }
      }
    }

    return {
      success: true,
      waitForEvent: {
        type: 'event',
        config: { gatewayId: node.id, candidates: outgoingEdges.map(e => e.targetNodeId) }
      }
    };
  }

  private async executeSubprocess(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Implementación simplificada - los subprocesos embebidos deberían
    // ejecutar sus nodos internos
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);

    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  private async executeCallActivity(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    if (!node.config.calledElement) {
      return {
        success: false,
        error: {
          code: WorkflowErrorCode.SUBPROCESS_ERROR,
          message: 'Call activity sin proceso llamado definido'
        }
      };
    }

    // Preparar variables de entrada
    const inputVariables: Record<string, any> = {};
    const instanceVariables = this.getVariablesAsObject(instance);

    if (node.config.inputMappings) {
      for (const mapping of node.config.inputMappings) {
        inputVariables[mapping.target] = instanceVariables[mapping.source];
      }
    }

    try {
      // Iniciar subproceso
      const childInstance = await this.startWorkflow({
        definitionCode: node.config.calledElement,
        version: node.config.calledElementVersion,
        variables: inputVariables,
        startedBy: context.userId,
        tenantId: instance.tenantId,
        parentInstanceId: instance.id,
        callActivityNodeId: node.id,
        businessKey: instance.businessKey
      });

      return {
        success: true,
        waitForEvent: {
          type: 'subprocess',
          config: { childInstanceId: childInstance.id }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: WorkflowErrorCode.SUBPROCESS_ERROR,
          message: error instanceof Error ? error.message : 'Error iniciando subproceso'
        }
      };
    }
  }

  private async executeIntermediateCatchEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    return {
      success: true,
      waitForEvent: {
        type: 'message',
        config: { nodeId: node.id }
      }
    };
  }

  private async executeIntermediateTimerEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    if (!node.config.timerExpression) {
      // Si no hay timer, continuar inmediatamente
      const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
      return {
        success: true,
        nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
      };
    }

    const triggerAt = this.calculateTimerTrigger(
      node.config.timerType || TimerEventType.TIME_DURATION,
      node.config.timerExpression
    );

    const timer: WorkflowTimer = {
      id: uuidv4(),
      instanceId: instance.id,
      nodeId: node.id,
      timerType: node.config.timerType || TimerEventType.TIME_DURATION,
      expression: node.config.timerExpression,
      status: 'pending',
      createdAt: new Date(),
      triggerAt,
      currentRepeat: 0
    };

    await this.repository.saveTimer(timer);

    await this.emitEvent({
      type: WorkflowEventType.TIMER_SCHEDULED,
      instanceId: instance.id,
      nodeId: node.id,
      timestamp: new Date(),
      userId: context.userId,
      data: { timerId: timer.id, triggerAt }
    });

    return {
      success: true,
      waitForEvent: {
        type: 'timer',
        config: { timerId: timer.id }
      }
    };
  }

  private async executeIntermediateThrowEvent(
    instance: WorkflowInstance,
    definition: WorkflowDefinition,
    node: WorkflowNode,
    context: { userId: string }
  ): Promise<NodeExecutionResult> {
    // Emitir señal/mensaje
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    return {
      success: true,
      nextNodeIds: outgoingEdges.map(e => e.targetNodeId)
    };
  }

  // ========================================================================
  // Completar tareas
  // ========================================================================

  /**
   * Completa una tarea de usuario
   */
  async completeTask(options: CompleteTaskOptions): Promise<WorkflowTask> {
    const { taskId, outcome, data, comment, completedBy, variables } = options;

    const task = await this.repository.getTask(taskId);
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

    // Verificar que el usuario puede completar la tarea
    if (task.assignee && task.assignee !== completedBy) {
      throw new WorkflowError(
        WorkflowErrorCode.PERMISSION_DENIED,
        'La tarea está asignada a otro usuario'
      );
    }

    // Obtener instancia y definición
    const instance = await this.repository.getInstance(task.instanceId);
    if (!instance) {
      throw new WorkflowError(
        WorkflowErrorCode.INSTANCE_NOT_FOUND,
        `No se encontró la instancia: ${task.instanceId}`
      );
    }

    const definition = await this.repository.getDefinitionById(instance.definitionId);
    if (!definition) {
      throw new WorkflowError(
        WorkflowErrorCode.DEFINITION_NOT_FOUND,
        `No se encontró la definición: ${instance.definitionId}`
      );
    }

    // Actualizar tarea
    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.outcome = outcome;
    task.outcomeData = data;

    if (comment) {
      if (!task.comments) task.comments = [];
      task.comments.push({
        id: uuidv4(),
        userId: completedBy,
        userName: completedBy,
        content: comment,
        createdAt: new Date()
      });
    }

    await this.repository.saveTask(task);

    // Actualizar variables
    if (variables) {
      for (const [name, value] of Object.entries(variables)) {
        this.setVariable(instance, name, value, completedBy);
      }
    }

    // Guardar datos del formulario como variables
    if (data) {
      for (const [name, value] of Object.entries(data)) {
        this.setVariable(instance, name, value, completedBy);
      }
    }

    // Remover nodo de currentNodeIds
    instance.currentNodeIds = instance.currentNodeIds.filter(id => id !== task.nodeId);

    // Marcar paso como completado
    const step = instance.executionPath.find(s => s.nodeId === task.nodeId && s.status === 'active');
    if (step) {
      step.status = 'completed';
      step.completedAt = new Date();
      step.outcome = outcome;
      step.data = data;
    }

    await this.repository.saveInstance(instance);

    await this.emitEvent({
      type: WorkflowEventType.TASK_COMPLETED,
      instanceId: instance.id,
      nodeId: task.nodeId,
      taskId: task.id,
      timestamp: new Date(),
      userId: completedBy,
      data: { outcome, data }
    });

    this.log(`Tarea completada: ${task.id} con resultado ${outcome}`);

    // Continuar al siguiente nodo
    const node = definition.nodes.find(n => n.id === task.nodeId);
    if (node) {
      const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
      for (const edge of outgoingEdges) {
        const nextNode = definition.nodes.find(n => n.id === edge.targetNodeId);
        if (nextNode) {
          setImmediate(() => {
            this.executeNode(instance, definition, nextNode, { userId: completedBy }).catch(err => {
              this.log(`Error continuando desde tarea: ${err.message}`);
            });
          });
        }
      }
    }

    return task;
  }

  // ========================================================================
  // Timers
  // ========================================================================

  /**
   * Maneja un evento de timer
   */
  async handleTimerEvent(timerId: string): Promise<void> {
    const timer = await this.repository.getTimer(timerId);
    if (!timer || timer.status !== 'pending') {
      return;
    }

    const instance = await this.repository.getInstance(timer.instanceId);
    if (!instance || instance.status !== WorkflowStatus.ACTIVE) {
      timer.status = 'cancelled';
      await this.repository.saveTimer(timer);
      return;
    }

    const definition = await this.repository.getDefinitionById(instance.definitionId);
    if (!definition) {
      return;
    }

    const node = definition.nodes.find(n => n.id === timer.nodeId);
    if (!node) {
      return;
    }

    // Marcar timer como disparado
    timer.status = 'triggered';
    timer.triggeredAt = new Date();
    await this.repository.saveTimer(timer);

    await this.emitEvent({
      type: WorkflowEventType.TIMER_FIRED,
      instanceId: instance.id,
      nodeId: timer.nodeId,
      timestamp: new Date(),
      data: { timerId }
    });

    this.log(`Timer disparado: ${timerId}`);

    // Continuar ejecución
    const outgoingEdges = definition.edges.filter(e => e.sourceNodeId === node.id);
    for (const edge of outgoingEdges) {
      const nextNode = definition.nodes.find(n => n.id === edge.targetNodeId);
      if (nextNode) {
        await this.executeNode(instance, definition, nextNode, { userId: 'system' });
      }
    }

    // Manejar ciclos
    if (timer.timerType === TimerEventType.TIME_CYCLE && timer.repeatCount) {
      if (timer.currentRepeat < timer.repeatCount) {
        const newTimer: WorkflowTimer = {
          ...timer,
          id: uuidv4(),
          status: 'pending',
          createdAt: new Date(),
          triggerAt: this.calculateTimerTrigger(TimerEventType.TIME_CYCLE, timer.expression),
          currentRepeat: timer.currentRepeat + 1
        };
        await this.repository.saveTimer(newTimer);
      }
    }
  }

  /**
   * Verifica timers pendientes
   */
  private async checkPendingTimers(): Promise<void> {
    const pendingTimers = await this.repository.getPendingTimers();
    const now = new Date();

    for (const timer of pendingTimers) {
      if (isBefore(timer.triggerAt, now) || timer.triggerAt <= now) {
        await this.handleTimerEvent(timer.id);
      }
    }
  }

  // ========================================================================
  // SLAs
  // ========================================================================

  /**
   * Verifica SLAs de tareas
   */
  private async checkSLAs(): Promise<void> {
    const assignedTasks = await this.repository.getTasksByStatus(TaskStatus.ASSIGNED);
    const pendingTasks = await this.repository.getTasksByStatus(TaskStatus.PENDING);
    const inProgressTasks = await this.repository.getTasksByStatus(TaskStatus.IN_PROGRESS);

    const allActiveTasks = [...assignedTasks, ...pendingTasks, ...inProgressTasks];
    const now = new Date();

    for (const task of allActiveTasks) {
      if (task.slaDeadline && isBefore(task.slaDeadline, now) && !task.slaBreached) {
        task.slaBreached = true;
        await this.repository.saveTask(task);

        await this.emitEvent({
          type: WorkflowEventType.TASK_SLA_BREACHED,
          instanceId: task.instanceId,
          nodeId: task.nodeId,
          taskId: task.id,
          timestamp: new Date(),
          data: { slaDeadline: task.slaDeadline }
        });

        this.log(`SLA incumplido en tarea: ${task.id}`);
      }
    }
  }

  // ========================================================================
  // Variables y expresiones
  // ========================================================================

  /**
   * Evalúa una condición
   */
  evaluateCondition(expression: string, context: Record<string, any>): ConditionEvaluationResult {
    try {
      // Limpiar expresión
      let cleanExpr = expression.trim();

      // Remover delimitadores ${...}
      if (cleanExpr.startsWith('${') && cleanExpr.endsWith('}')) {
        cleanExpr = cleanExpr.slice(2, -1);
      }

      // Reemplazar variables
      let evalExpr = cleanExpr;
      for (const [key, value] of Object.entries(context)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        if (typeof value === 'string') {
          evalExpr = evalExpr.replace(regex, `"${value}"`);
        } else if (value === null || value === undefined) {
          evalExpr = evalExpr.replace(regex, 'null');
        } else {
          evalExpr = evalExpr.replace(regex, JSON.stringify(value));
        }
      }

      // Evaluar expresión de forma segura
      const result = this.safeEval(evalExpr);

      return {
        result: Boolean(result),
        expression,
        context
      };
    } catch (error) {
      return {
        result: false,
        expression,
        context,
        error: error instanceof Error ? error.message : 'Error evaluando expresión'
      };
    }
  }

  /**
   * Evalúa una expresión y retorna el valor
   */
  private evaluateExpression(expression: string, context: Record<string, any>): any {
    if (!expression) return expression;

    // Si es una referencia simple a variable
    const varMatch = expression.match(/^\$\{(\w+)\}$/);
    if (varMatch) {
      return context[varMatch[1]];
    }

    // Reemplazar todas las referencias ${var}
    let result = expression;
    const varPattern = /\$\{(\w+)\}/g;
    let match;

    while ((match = varPattern.exec(expression)) !== null) {
      const varName = match[1];
      const value = context[varName];
      result = result.replace(match[0], value !== undefined ? String(value) : '');
    }

    return result;
  }

  /**
   * Ejecuta un script de forma segura
   */
  private async executeScript(
    script: string,
    context: ExecutionContext
  ): Promise<Record<string, any>> {
    // Crear contexto de ejecución
    const scriptContext = {
      variables: context.variables,
      instance: {
        id: context.instance.id,
        businessKey: context.instance.businessKey
      },
      execution: {
        setVariable: (name: string, value: any) => {
          (scriptContext as any)._outputs[name] = value;
        }
      },
      _outputs: {} as Record<string, any>
    };

    try {
      // Crear función con contexto limitado
      const fn = new Function(
        'variables', 'instance', 'execution',
        `
        ${script}
        return execution._outputs || {};
        `
      );

      const outputs = fn(
        scriptContext.variables,
        scriptContext.instance,
        scriptContext.execution
      );

      return { ...scriptContext._outputs, ...outputs };
    } catch (error) {
      throw new Error(`Error en script: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Evaluación segura de expresiones
   */
  private safeEval(expression: string): any {
    // Operadores permitidos
    const allowedOperators = ['===', '!==', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '+', '-', '*', '/', '%'];

    // Verificar que no haya código malicioso
    const dangerousPatterns = [
      /function\s*\(/,
      /=>/,
      /new\s+/,
      /eval\s*\(/,
      /\bthis\b/,
      /\bwindow\b/,
      /\bglobal\b/,
      /\bprocess\b/,
      /\brequire\b/,
      /\bimport\b/,
      /\bexport\b/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(expression)) {
        throw new Error(`Expresión no permitida: ${expression}`);
      }
    }

    // Evaluar
    try {
      return new Function(`return (${expression})`)();
    } catch (e) {
      throw new Error(`Error evaluando: ${expression}`);
    }
  }

  /**
   * Establece una variable en la instancia
   */
  private setVariable(
    instance: WorkflowInstance,
    name: string,
    value: any,
    updatedBy: string
  ): void {
    const now = new Date();
    const type = this.inferVariableType(value);

    if (instance.variables[name]) {
      instance.variables[name].value = value;
      instance.variables[name].type = type;
      instance.variables[name].updatedAt = now;
      instance.variables[name].updatedBy = updatedBy;
    } else {
      instance.variables[name] = {
        name,
        type,
        value,
        scope: 'process',
        createdAt: now,
        updatedAt: now,
        updatedBy
      };
    }
  }

  /**
   * Obtiene variables como objeto simple
   */
  private getVariablesAsObject(instance: WorkflowInstance): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, variable] of Object.entries(instance.variables)) {
      result[name] = variable.value;
    }
    return result;
  }

  /**
   * Inicializa variables con valores por defecto
   */
  private initializeVariables(
    definition: WorkflowDefinition,
    initialValues: Record<string, any>
  ): Record<string, WorkflowVariable> {
    const variables: Record<string, WorkflowVariable> = {};
    const now = new Date();

    // Agregar variables definidas con valores por defecto
    for (const varDef of definition.variables) {
      variables[varDef.name] = {
        name: varDef.name,
        type: varDef.type,
        value: initialValues[varDef.name] ?? varDef.defaultValue,
        scope: 'process',
        createdAt: now,
        updatedAt: now
      };
    }

    // Agregar variables iniciales no definidas
    for (const [name, value] of Object.entries(initialValues)) {
      if (!variables[name]) {
        variables[name] = {
          name,
          type: this.inferVariableType(value),
          value,
          scope: 'process',
          createdAt: now,
          updatedAt: now
        };
      }
    }

    return variables;
  }

  /**
   * Infiere el tipo de variable
   */
  private inferVariableType(value: any): VariableType {
    if (value === null || value === undefined) return VariableType.STRING;
    if (typeof value === 'string') return VariableType.STRING;
    if (typeof value === 'number') return VariableType.NUMBER;
    if (typeof value === 'boolean') return VariableType.BOOLEAN;
    if (value instanceof Date) return VariableType.DATETIME;
    if (Array.isArray(value)) return VariableType.ARRAY;
    if (typeof value === 'object') return VariableType.JSON;
    return VariableType.STRING;
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  /**
   * Calcula cuándo debe dispararse un timer
   */
  private calculateTimerTrigger(type: TimerEventType, expression: string): Date {
    const now = new Date();

    switch (type) {
      case TimerEventType.TIME_DATE:
        // ISO 8601 date
        return new Date(expression);

      case TimerEventType.TIME_DURATION:
        // ISO 8601 duration (P1D, PT1H, etc.)
        return this.parseDuration(expression, now);

      case TimerEventType.TIME_CYCLE:
        // Cron expression o repetición
        try {
          const interval = cronParser.parseExpression(expression);
          return interval.next().toDate();
        } catch {
          // Si no es cron válido, intentar como duración
          return this.parseDuration(expression, now);
        }

      default:
        return addMinutes(now, 5);
    }
  }

  /**
   * Parsea una duración ISO 8601
   */
  private parseDuration(duration: string, from: Date): Date {
    // Formato: P[n]Y[n]M[n]DT[n]H[n]M[n]S
    const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);

    if (!match) {
      return addMinutes(from, 5);
    }

    let result = from;
    const [, days, hours, minutes, seconds] = match;

    if (days) result = addDays(result, parseInt(days));
    if (hours) result = addHours(result, parseInt(hours));
    if (minutes) result = addMinutes(result, parseInt(minutes));
    if (seconds) result = addMilliseconds(result, parseInt(seconds) * 1000);

    return result;
  }

  /**
   * Maneja la completación de un subproceso
   */
  private async handleSubprocessCompletion(childInstance: WorkflowInstance): Promise<void> {
    if (!childInstance.parentInstanceId || !childInstance.callActivityNodeId) return;

    const parentInstance = await this.repository.getInstance(childInstance.parentInstanceId);
    if (!parentInstance || parentInstance.status !== WorkflowStatus.ACTIVE) return;

    const parentDefinition = await this.repository.getDefinitionById(parentInstance.definitionId);
    if (!parentDefinition) return;

    const callActivityNode = parentDefinition.nodes.find(n => n.id === childInstance.callActivityNodeId);
    if (!callActivityNode) return;

    // Mapear variables de salida
    if (callActivityNode.config.outputMappings) {
      const childVariables = this.getVariablesAsObject(childInstance);
      for (const mapping of callActivityNode.config.outputMappings) {
        this.setVariable(parentInstance, mapping.target, childVariables[mapping.source], 'system');
      }
    }

    // Continuar ejecución del padre
    const outgoingEdges = parentDefinition.edges.filter(e => e.sourceNodeId === callActivityNode.id);
    for (const edge of outgoingEdges) {
      const nextNode = parentDefinition.nodes.find(n => n.id === edge.targetNodeId);
      if (nextNode) {
        await this.executeNode(parentInstance, parentDefinition, nextNode, { userId: 'system' });
      }
    }
  }

  /**
   * Emite un evento del workflow
   */
  private async emitEvent(event: WorkflowEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.log(`Error en handler de evento ${event.type}: ${error}`);
      }
    }

    // Emitir también via EventEmitter
    this.emit(event.type, event);
    this.emit('workflow:event', event);
  }

  /**
   * Log con modo debug
   */
  private log(message: string): void {
    if (this.config.debugMode) {
      console.log(`[WorkflowEngine] ${message}`);
    }
  }
}

export const workflowEngineService = new WorkflowEngineService();
