/**
 * AI-Workflows - Motor BPM BPMN 2.0 completo
 *
 * Este módulo implementa un motor de workflows empresarial compatible con BPMN 2.0,
 * incluyendo soporte para:
 *
 * - Eventos de inicio/fin (simples, timer, mensaje, señal)
 * - Tareas de usuario con SLAs y escalaciones
 * - Tareas de servicio (HTTP, GRPC, scripts)
 * - Gateways exclusivos, inclusivos y paralelos
 * - Eventos de timer (fecha, duración, ciclo)
 * - Subprocesos y llamadas a actividades
 * - Variables de proceso y expresiones
 *
 * @module @ai-core/ai-workflows
 * @version 1.0.0
 *
 * @example
 * ```typescript
 * import {
 *   WorkflowEngineService,
 *   TaskManagerService,
 *   BpmnParserService,
 *   WorkflowStatus,
 *   TaskStatus
 * } from '@ai-core/ai-workflows';
 *
 * // Crear instancias de servicios
 * const engine = new WorkflowEngineService();
 * const taskManager = new TaskManagerService();
 * const parser = new BpmnParserService();
 *
 * // Iniciar motor
 * engine.start();
 * taskManager.start();
 *
 * // Parsear definición BPMN
 * const result = await parser.parseXML(bpmnXml);
 * if (result.success && result.definition) {
 *   // Iniciar workflow
 *   const instance = await engine.startWorkflow({
 *     definitionCode: 'proceso-aprobacion',
 *     variables: { solicitante: 'usuario@empresa.com' },
 *     startedBy: 'admin'
 *   });
 *
 *   // Obtener tareas del usuario
 *   const tasks = await taskManager.getTasksByUser('aprobador');
 *
 *   // Completar tarea
 *   await engine.completeTask({
 *     taskId: tasks.items[0].id,
 *     outcome: TaskOutcome.APPROVED,
 *     data: { comentario: 'Aprobado sin observaciones' },
 *     completedBy: 'aprobador'
 *   });
 * }
 * ```
 */

// ============================================================================
// Types - Tipos y enumeraciones
// ============================================================================

export {
  // Enums
  WorkflowStatus,
  TaskStatus,
  NodeType,
  TransitionType,
  VariableType,
  TimerEventType,
  TaskPriority,
  TaskOutcome,
  WorkflowEventType,
  WorkflowErrorCode,

  // Interfaces de definición
  WorkflowDefinition,
  WorkflowConfig,
  WorkflowNode,
  NodeConfig,
  WorkflowEdge,
  VariableDefinition,
  ValidationRule,
  WorkflowFormDefinition,
  FormFieldDefinition,
  BoundaryEventConfig,
  MultiInstanceConfig,
  VariableMapping,
  ExecutionListener,
  TaskListener,

  // Interfaces de ejecución
  WorkflowInstance,
  ExecutionStep,
  WorkflowVariable,
  WorkflowTask,
  TaskComment,
  TaskAssignment,
  Escalation,
  WorkflowTimer,

  // Interfaces de contexto
  ExecutionContext,
  NodeExecutionResult,
  ConditionEvaluationResult,

  // Interfaces de opciones
  StartWorkflowOptions,
  CompleteTaskOptions,
  TaskQueryFilters,
  PaginatedResult,
  PaginationOptions,

  // Eventos
  WorkflowEvent,
  WorkflowEventHandler,

  // Errores
  WorkflowError
} from './types';

// ============================================================================
// Services - Servicios principales
// ============================================================================

export {
  // Servicio de motor de workflow
  WorkflowEngineService,
  workflowEngineService,
  WorkflowEngineConfig,
  WorkflowRepository,
  InMemoryWorkflowRepository
} from './services/workflow-engine.service';

export {
  // Servicio de gestión de tareas
  TaskManagerService,
  taskManagerService,
  TaskManagerConfig,
  EscalationLevel,
  TaskStatistics,
  AdvancedTaskFilters
} from './services/task-manager.service';

export {
  // Servicio de parsing BPMN
  BpmnParserService,
  bpmnParserService,
  BpmnParseResult,
  BpmnValidationError,
  BpmnValidationWarning
} from './services/bpmn-parser.service';

// ============================================================================
// Factory Functions - Funciones de creación
// ============================================================================

import { WorkflowEngineService, workflowEngineService, WorkflowRepository, WorkflowEngineConfig } from './services/workflow-engine.service';
import { TaskManagerService, taskManagerService, TaskManagerConfig } from './services/task-manager.service';
import { BpmnParserService, bpmnParserService } from './services/bpmn-parser.service';

/**
 * Crea una nueva instancia del motor de workflow
 */
export function createWorkflowEngine(
  repository?: WorkflowRepository,
  config?: Partial<WorkflowEngineConfig>
): WorkflowEngineService {
  return new WorkflowEngineService(repository, config);
}

/**
 * Crea una nueva instancia del gestor de tareas
 */
export function createTaskManager(
  repository?: WorkflowRepository,
  config?: Partial<TaskManagerConfig>
): TaskManagerService {
  return new TaskManagerService(repository, config);
}

/**
 * Crea una nueva instancia del parser BPMN
 */
export function createBpmnParser(): BpmnParserService {
  return new BpmnParserService();
}

/**
 * Crea un sistema de workflow completo con motor y gestor de tareas compartiendo repositorio
 */
export function createWorkflowSystem(
  repository?: WorkflowRepository,
  engineConfig?: Partial<WorkflowEngineConfig>,
  taskManagerConfig?: Partial<TaskManagerConfig>
): {
  engine: WorkflowEngineService;
  taskManager: TaskManagerService;
  bpmnParser: BpmnParserService;
} {
  const engine = new WorkflowEngineService(repository, engineConfig);
  const taskManager = new TaskManagerService(repository, taskManagerConfig);
  const bpmnParser = new BpmnParserService();

  return {
    engine,
    taskManager,
    bpmnParser
  };
}

// ============================================================================
// Default export
// ============================================================================

export default {
  // Servicios singleton
  engine: workflowEngineService,
  taskManager: taskManagerService,
  bpmnParser: bpmnParserService,

  // Factories
  createWorkflowEngine,
  createTaskManager,
  createBpmnParser,
  createWorkflowSystem
};

// ============================================================================
// Mensajes del sistema en español
// ============================================================================

/**
 * Mensajes de error en español para el sistema de workflows
 */
export const WorkflowMessages = {
  // Errores de definición
  DEFINITION_NOT_FOUND: 'No se encontró la definición del workflow',
  DEFINITION_NOT_ACTIVE: 'La definición del workflow no está activa',
  DEFINITION_INVALID: 'La definición del workflow no es válida',

  // Errores de instancia
  INSTANCE_NOT_FOUND: 'No se encontró la instancia del workflow',
  INSTANCE_ALREADY_EXISTS: 'Ya existe una instancia activa de este workflow',
  INSTANCE_NOT_ACTIVE: 'La instancia del workflow no está activa',
  INSTANCE_COMPLETED: 'La instancia del workflow ya está completada',
  INSTANCE_CANCELLED: 'La instancia del workflow fue cancelada',

  // Errores de tarea
  TASK_NOT_FOUND: 'No se encontró la tarea',
  TASK_ALREADY_COMPLETED: 'La tarea ya está completada',
  TASK_NOT_AVAILABLE: 'La tarea no está disponible',
  TASK_NOT_ASSIGNED: 'La tarea no está asignada',
  TASK_ASSIGNED_TO_OTHER: 'La tarea está asignada a otro usuario',

  // Errores de permisos
  PERMISSION_DENIED: 'No tiene permisos para realizar esta acción',
  NOT_CANDIDATE: 'El usuario no es candidato para esta tarea',

  // Errores de ejecución
  GATEWAY_NO_CONDITION: 'Ninguna condición del gateway se cumplió',
  SERVICE_TASK_FAILED: 'Error al ejecutar tarea de servicio',
  SCRIPT_EXECUTION_ERROR: 'Error al ejecutar script',
  EXPRESSION_EVALUATION_ERROR: 'Error al evaluar expresión',

  // Errores de timer
  TIMER_INVALID_EXPRESSION: 'Expresión de timer inválida',
  TIMER_ALREADY_TRIGGERED: 'El timer ya fue disparado',

  // Errores de BPMN
  BPMN_PARSE_ERROR: 'Error al parsear documento BPMN',
  BPMN_NO_START_EVENT: 'El proceso debe tener al menos un evento de inicio',
  BPMN_NO_END_EVENT: 'El proceso debe tener al menos un evento de fin',
  BPMN_DISCONNECTED_NODE: 'Nodo desconectado en el proceso',

  // Mensajes informativos
  WORKFLOW_STARTED: 'Workflow iniciado correctamente',
  WORKFLOW_COMPLETED: 'Workflow completado correctamente',
  WORKFLOW_SUSPENDED: 'Workflow suspendido',
  WORKFLOW_RESUMED: 'Workflow reanudado',
  WORKFLOW_CANCELLED: 'Workflow cancelado',

  TASK_CREATED: 'Tarea creada',
  TASK_ASSIGNED: 'Tarea asignada',
  TASK_COMPLETED: 'Tarea completada',
  TASK_ESCALATED: 'Tarea escalada',
  TASK_SLA_BREACHED: 'SLA de tarea incumplido',

  TIMER_SCHEDULED: 'Timer programado',
  TIMER_FIRED: 'Timer disparado',
  TIMER_CANCELLED: 'Timer cancelado'
} as const;

/**
 * Obtiene un mensaje localizado
 */
export function getMessage(key: keyof typeof WorkflowMessages, params?: Record<string, string>): string {
  let message: string = WorkflowMessages[key];

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      message = message.replace(`{${param}}`, value);
    }
  }

  return message;
}
