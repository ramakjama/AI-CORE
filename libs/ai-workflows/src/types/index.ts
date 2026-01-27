/**
 * AI-Workflows - Tipos y definiciones para motor BPM BPMN 2.0
 * @module @ai-core/ai-workflows/types
 */

// ============================================================================
// ENUMS - Estados y tipos de workflow
// ============================================================================

/**
 * Estado del workflow/instancia
 */
export enum WorkflowStatus {
  /** Borrador, no publicado */
  DRAFT = 'DRAFT',
  /** Activo y disponible para ejecución */
  ACTIVE = 'ACTIVE',
  /** Suspendido temporalmente */
  SUSPENDED = 'SUSPENDED',
  /** Completado exitosamente */
  COMPLETED = 'COMPLETED',
  /** Cancelado manualmente */
  CANCELLED = 'CANCELLED',
  /** Terminado con error */
  TERMINATED = 'TERMINATED',
  /** Archivado */
  ARCHIVED = 'ARCHIVED'
}

/**
 * Estado de una tarea
 */
export enum TaskStatus {
  /** Pendiente de asignación */
  PENDING = 'PENDING',
  /** Asignada a un usuario */
  ASSIGNED = 'ASSIGNED',
  /** En progreso */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Completada */
  COMPLETED = 'COMPLETED',
  /** Cancelada */
  CANCELLED = 'CANCELLED',
  /** Escalada */
  ESCALATED = 'ESCALATED',
  /** Expirada por SLA */
  EXPIRED = 'EXPIRED',
  /** Delegada a otro usuario */
  DELEGATED = 'DELEGATED',
  /** En espera de aprobación */
  AWAITING_APPROVAL = 'AWAITING_APPROVAL'
}

/**
 * Tipos de nodos BPMN 2.0
 */
export enum NodeType {
  // Eventos de inicio
  START_EVENT = 'START_EVENT',
  START_EVENT_TIMER = 'START_EVENT_TIMER',
  START_EVENT_MESSAGE = 'START_EVENT_MESSAGE',
  START_EVENT_SIGNAL = 'START_EVENT_SIGNAL',
  START_EVENT_CONDITIONAL = 'START_EVENT_CONDITIONAL',

  // Eventos de fin
  END_EVENT = 'END_EVENT',
  END_EVENT_ERROR = 'END_EVENT_ERROR',
  END_EVENT_TERMINATE = 'END_EVENT_TERMINATE',
  END_EVENT_MESSAGE = 'END_EVENT_MESSAGE',
  END_EVENT_SIGNAL = 'END_EVENT_SIGNAL',

  // Eventos intermedios
  INTERMEDIATE_CATCH_EVENT = 'INTERMEDIATE_CATCH_EVENT',
  INTERMEDIATE_THROW_EVENT = 'INTERMEDIATE_THROW_EVENT',
  INTERMEDIATE_TIMER_EVENT = 'INTERMEDIATE_TIMER_EVENT',
  INTERMEDIATE_MESSAGE_EVENT = 'INTERMEDIATE_MESSAGE_EVENT',
  INTERMEDIATE_SIGNAL_EVENT = 'INTERMEDIATE_SIGNAL_EVENT',

  // Tareas
  USER_TASK = 'USER_TASK',
  SERVICE_TASK = 'SERVICE_TASK',
  SCRIPT_TASK = 'SCRIPT_TASK',
  SEND_TASK = 'SEND_TASK',
  RECEIVE_TASK = 'RECEIVE_TASK',
  MANUAL_TASK = 'MANUAL_TASK',
  BUSINESS_RULE_TASK = 'BUSINESS_RULE_TASK',
  CALL_ACTIVITY = 'CALL_ACTIVITY',

  // Gateways
  EXCLUSIVE_GATEWAY = 'EXCLUSIVE_GATEWAY',
  INCLUSIVE_GATEWAY = 'INCLUSIVE_GATEWAY',
  PARALLEL_GATEWAY = 'PARALLEL_GATEWAY',
  EVENT_BASED_GATEWAY = 'EVENT_BASED_GATEWAY',
  COMPLEX_GATEWAY = 'COMPLEX_GATEWAY',

  // Subprocesos
  SUBPROCESS = 'SUBPROCESS',
  SUBPROCESS_EMBEDDED = 'SUBPROCESS_EMBEDDED',
  SUBPROCESS_EVENT = 'SUBPROCESS_EVENT',
  TRANSACTION = 'TRANSACTION',

  // Boundary events
  BOUNDARY_EVENT = 'BOUNDARY_EVENT',
  BOUNDARY_TIMER_EVENT = 'BOUNDARY_TIMER_EVENT',
  BOUNDARY_ERROR_EVENT = 'BOUNDARY_ERROR_EVENT',
  BOUNDARY_MESSAGE_EVENT = 'BOUNDARY_MESSAGE_EVENT',
  BOUNDARY_SIGNAL_EVENT = 'BOUNDARY_SIGNAL_EVENT'
}

/**
 * Tipos de transición/flujo
 */
export enum TransitionType {
  /** Flujo de secuencia normal */
  SEQUENCE_FLOW = 'SEQUENCE_FLOW',
  /** Flujo condicional */
  CONDITIONAL_FLOW = 'CONDITIONAL_FLOW',
  /** Flujo por defecto */
  DEFAULT_FLOW = 'DEFAULT_FLOW',
  /** Flujo de mensaje */
  MESSAGE_FLOW = 'MESSAGE_FLOW',
  /** Asociación */
  ASSOCIATION = 'ASSOCIATION'
}

/**
 * Tipo de variable de proceso
 */
export enum VariableType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  JSON = 'JSON',
  ARRAY = 'ARRAY',
  FILE = 'FILE',
  USER_REFERENCE = 'USER_REFERENCE',
  ENTITY_REFERENCE = 'ENTITY_REFERENCE'
}

/**
 * Tipos de evento de timer
 */
export enum TimerEventType {
  /** Fecha/hora específica */
  TIME_DATE = 'TIME_DATE',
  /** Duración desde un punto */
  TIME_DURATION = 'TIME_DURATION',
  /** Ciclo repetitivo (cron) */
  TIME_CYCLE = 'TIME_CYCLE'
}

/**
 * Prioridad de tareas
 */
export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}

/**
 * Resultado de una tarea
 */
export enum TaskOutcome {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  DELEGATED = 'DELEGATED',
  ESCALATED = 'ESCALATED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// INTERFACES - Definiciones de Workflow
// ============================================================================

/**
 * Definición de workflow BPMN
 */
export interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  version: number;
  status: WorkflowStatus;

  // Contenido BPMN
  bpmnXml?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];

  // Configuración
  config: WorkflowConfig;

  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: Date;

  // Variables de definición
  variables: VariableDefinition[];

  // Formularios asociados
  forms?: WorkflowFormDefinition[];
}

/**
 * Configuración del workflow
 */
export interface WorkflowConfig {
  /** Permite múltiples instancias simultáneas */
  allowMultipleInstances: boolean;
  /** Timeout global del proceso (ms) */
  processTimeout?: number;
  /** SLA por defecto para tareas (ms) */
  defaultTaskSLA?: number;
  /** Notificar al iniciar */
  notifyOnStart: boolean;
  /** Notificar al completar */
  notifyOnComplete: boolean;
  /** Notificar en errores */
  notifyOnError: boolean;
  /** Reintentos automáticos en errores */
  retryOnError: boolean;
  /** Número máximo de reintentos */
  maxRetries: number;
  /** Intervalo entre reintentos (ms) */
  retryInterval: number;
  /** Roles que pueden iniciar el proceso */
  starterRoles?: string[];
  /** Usuarios que pueden administrar */
  adminUsers?: string[];
  /** Tenant/organización */
  tenantId?: string;
}

/**
 * Nodo del workflow (elemento BPMN)
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;

  // Posición para visualización
  position: {
    x: number;
    y: number;
  };

  // Configuración específica del tipo
  config: NodeConfig;

  // Boundary events adjuntos
  boundaryEvents?: BoundaryEventConfig[];

  // Documentación
  documentation?: string;
}

/**
 * Configuración específica de cada tipo de nodo
 */
export interface NodeConfig {
  // Para User Tasks
  assigneeExpression?: string;
  candidateUsers?: string[];
  candidateGroups?: string[];
  formKey?: string;
  dueDate?: string;
  priority?: TaskPriority;
  slaMinutes?: number;

  // Para Service Tasks
  serviceType?: 'HTTP' | 'GRPC' | 'INTERNAL' | 'SCRIPT';
  serviceEndpoint?: string;
  serviceMethod?: string;
  serviceHeaders?: Record<string, string>;
  servicePayload?: string;
  asyncExecution?: boolean;
  retryConfig?: {
    maxRetries: number;
    retryInterval: number;
    exponentialBackoff: boolean;
  };

  // Para Script Tasks
  scriptLanguage?: 'javascript' | 'python' | 'groovy';
  script?: string;

  // Para Gateways
  defaultFlow?: string;

  // Para Timers
  timerType?: TimerEventType;
  timerExpression?: string;

  // Para Call Activities
  calledElement?: string;
  calledElementBinding?: 'latest' | 'version' | 'deployment';
  calledElementVersion?: number;
  inputMappings?: VariableMapping[];
  outputMappings?: VariableMapping[];

  // Para Subprocesses
  isMultiInstance?: boolean;
  multiInstanceConfig?: MultiInstanceConfig;

  // Variables de entrada/salida
  inputVariables?: string[];
  outputVariables?: string[];

  // Expresión para evaluación
  conditionExpression?: string;

  // Listeners
  executionListeners?: ExecutionListener[];
  taskListeners?: TaskListener[];
}

/**
 * Configuración de multi-instancia (bucles paralelos o secuenciales)
 */
export interface MultiInstanceConfig {
  isSequential: boolean;
  collection: string;
  elementVariable: string;
  completionCondition?: string;
  loopCardinality?: number;
}

/**
 * Mapeo de variables entre procesos
 */
export interface VariableMapping {
  source: string;
  target: string;
  type?: VariableType;
}

/**
 * Listener de ejecución
 */
export interface ExecutionListener {
  event: 'start' | 'end' | 'take';
  listenerType: 'script' | 'class' | 'expression';
  value: string;
}

/**
 * Listener de tareas
 */
export interface TaskListener {
  event: 'create' | 'assignment' | 'complete' | 'delete';
  listenerType: 'script' | 'class' | 'expression';
  value: string;
}

/**
 * Configuración de boundary event
 */
export interface BoundaryEventConfig {
  id: string;
  type: NodeType;
  cancelActivity: boolean;
  timerType?: TimerEventType;
  timerExpression?: string;
  errorCode?: string;
  messageRef?: string;
  signalRef?: string;
  outgoingFlow?: string;
}

/**
 * Arista/flujo del workflow
 */
export interface WorkflowEdge {
  id: string;
  type: TransitionType;
  name?: string;
  sourceNodeId: string;
  targetNodeId: string;
  conditionExpression?: string;
  isDefault?: boolean;
  waypoints?: Array<{ x: number; y: number }>;
}

/**
 * Definición de variable del proceso
 */
export interface VariableDefinition {
  name: string;
  type: VariableType;
  defaultValue?: any;
  required: boolean;
  description?: string;
  validationRules?: ValidationRule[];
}

/**
 * Regla de validación
 */
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

/**
 * Definición de formulario del workflow
 */
export interface WorkflowFormDefinition {
  id: string;
  nodeId: string;
  formKey: string;
  fields: FormFieldDefinition[];
}

/**
 * Definición de campo de formulario
 */
export interface FormFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'file' | 'user';
  variable: string;
  required: boolean;
  readonly: boolean;
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>;
  validationRules?: ValidationRule[];
}

// ============================================================================
// INTERFACES - Instancias y Ejecución
// ============================================================================

/**
 * Instancia de workflow en ejecución
 */
export interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionCode: string;
  definitionVersion: number;
  status: WorkflowStatus;

  // Datos de negocio
  businessKey?: string;
  correlationId?: string;

  // Estado de ejecución
  currentNodeIds: string[];
  executionPath: ExecutionStep[];

  // Variables del proceso
  variables: Record<string, WorkflowVariable>;

  // Tiempos
  startedAt: Date;
  completedAt?: Date;
  dueDate?: Date;

  // Contexto
  startedBy: string;
  tenantId?: string;
  parentInstanceId?: string;
  rootInstanceId?: string;
  callActivityNodeId?: string;

  // Metadatos
  metadata?: Record<string, any>;
}

/**
 * Paso de ejecución (historial)
 */
export interface ExecutionStep {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  startedAt: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'cancelled' | 'error';
  outcome?: string;
  data?: Record<string, any>;
  error?: string;
  executedBy?: string;
}

/**
 * Variable del workflow
 */
export interface WorkflowVariable {
  name: string;
  type: VariableType;
  value: any;
  scope: 'process' | 'local' | 'task';
  nodeId?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * Tarea de workflow
 */
export interface WorkflowTask {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;

  // Estado
  status: TaskStatus;
  priority: TaskPriority;

  // Asignación
  assignee?: string;
  assigneeName?: string;
  candidateUsers?: string[];
  candidateGroups?: string[];
  delegatedFrom?: string;
  owner?: string;

  // Tiempos y SLA
  createdAt: Date;
  claimedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  slaDeadline?: Date;
  slaBreached: boolean;

  // Formulario y datos
  formKey?: string;
  formData?: Record<string, any>;
  outcome?: TaskOutcome;
  outcomeData?: Record<string, any>;
  comments?: TaskComment[];

  // Historial
  assignmentHistory: TaskAssignment[];
  escalationHistory: Escalation[];

  // Contexto
  tenantId?: string;
  businessKey?: string;
}

/**
 * Comentario en tarea
 */
export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  attachments?: string[];
}

/**
 * Asignación de tarea
 */
export interface TaskAssignment {
  id: string;
  taskId: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName?: string;
  assignedAt: Date;
  reason?: string;
  type: 'initial' | 'reassign' | 'delegate' | 'claim' | 'return';
}

/**
 * Escalación de tarea
 */
export interface Escalation {
  id: string;
  taskId: string;
  level: number;
  escalatedTo: string;
  escalatedToName?: string;
  escalatedBy: string;
  escalatedByName?: string;
  escalatedAt: Date;
  reason: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

/**
 * Timer de workflow
 */
export interface WorkflowTimer {
  id: string;
  instanceId: string;
  nodeId: string;
  timerType: TimerEventType;
  expression: string;

  // Estado
  status: 'pending' | 'triggered' | 'cancelled';

  // Tiempos
  createdAt: Date;
  triggerAt: Date;
  triggeredAt?: Date;

  // Para ciclos
  repeatCount?: number;
  currentRepeat: number;

  // Metadata
  data?: Record<string, any>;
}

// ============================================================================
// INTERFACES - Contexto de Ejecución
// ============================================================================

/**
 * Contexto de ejecución del workflow
 */
export interface ExecutionContext {
  /** Instancia del workflow */
  instance: WorkflowInstance;

  /** Nodo actual */
  currentNode: WorkflowNode;

  /** Variables del proceso */
  variables: Record<string, any>;

  /** Usuario que ejecuta */
  userId: string;
  userName?: string;
  userRoles?: string[];

  /** Tenant/organización */
  tenantId?: string;

  /** Metadata adicional */
  metadata?: Record<string, any>;

  /** Servicios auxiliares */
  services?: {
    http?: any;
    database?: any;
    cache?: any;
    notification?: any;
  };
}

/**
 * Resultado de ejecución de nodo
 */
export interface NodeExecutionResult {
  success: boolean;
  nextNodeIds?: string[];
  outputVariables?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  waitForEvent?: {
    type: 'timer' | 'message' | 'signal' | 'task' | 'token' | 'event' | 'subprocess';
    config: any;
  };
}

/**
 * Resultado de evaluación de condición
 */
export interface ConditionEvaluationResult {
  result: boolean;
  expression: string;
  context: Record<string, any>;
  error?: string;
}

/**
 * Configuración de inicio de workflow
 */
export interface StartWorkflowOptions {
  /** Código de la definición */
  definitionCode: string;

  /** Versión específica (opcional, usa la última por defecto) */
  version?: number;

  /** Variables iniciales */
  variables?: Record<string, any>;

  /** Clave de negocio */
  businessKey?: string;

  /** ID de correlación */
  correlationId?: string;

  /** Usuario que inicia */
  startedBy: string;

  /** Tenant */
  tenantId?: string;

  /** Instancia padre (para subprocesos) */
  parentInstanceId?: string;

  /** Nodo de call activity (para subprocesos) */
  callActivityNodeId?: string;

  /** Metadata adicional */
  metadata?: Record<string, any>;
}

/**
 * Configuración para completar tarea
 */
export interface CompleteTaskOptions {
  /** ID de la tarea */
  taskId: string;

  /** Resultado de la tarea */
  outcome: TaskOutcome;

  /** Datos del formulario */
  data?: Record<string, any>;

  /** Comentario */
  comment?: string;

  /** Usuario que completa */
  completedBy: string;

  /** Variables a actualizar */
  variables?: Record<string, any>;
}

/**
 * Filtros para consulta de tareas
 */
export interface TaskQueryFilters {
  instanceId?: string;
  assignee?: string;
  candidateUser?: string;
  candidateGroup?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  nodeId?: string;
  formKey?: string;
  dueBefore?: Date;
  dueAfter?: Date;
  createdBefore?: Date;
  createdAfter?: Date;
  slaBreached?: boolean;
  tenantId?: string;
  businessKey?: string;
}

/**
 * Resultado de consulta paginada
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// INTERFACES - Eventos
// ============================================================================

/**
 * Evento del motor de workflow
 */
export interface WorkflowEvent {
  type: WorkflowEventType;
  instanceId: string;
  nodeId?: string;
  taskId?: string;
  timestamp: Date;
  userId?: string;
  data?: Record<string, any>;
}

/**
 * Tipos de eventos del workflow
 */
export enum WorkflowEventType {
  // Eventos de instancia
  INSTANCE_STARTED = 'INSTANCE_STARTED',
  INSTANCE_COMPLETED = 'INSTANCE_COMPLETED',
  INSTANCE_CANCELLED = 'INSTANCE_CANCELLED',
  INSTANCE_SUSPENDED = 'INSTANCE_SUSPENDED',
  INSTANCE_RESUMED = 'INSTANCE_RESUMED',
  INSTANCE_ERROR = 'INSTANCE_ERROR',

  // Eventos de nodo
  NODE_ENTERED = 'NODE_ENTERED',
  NODE_EXITED = 'NODE_EXITED',
  NODE_ERROR = 'NODE_ERROR',

  // Eventos de tarea
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_CLAIMED = 'TASK_CLAIMED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_DELEGATED = 'TASK_DELEGATED',
  TASK_ESCALATED = 'TASK_ESCALATED',
  TASK_SLA_BREACHED = 'TASK_SLA_BREACHED',

  // Eventos de timer
  TIMER_SCHEDULED = 'TIMER_SCHEDULED',
  TIMER_FIRED = 'TIMER_FIRED',
  TIMER_CANCELLED = 'TIMER_CANCELLED',

  // Eventos de variable
  VARIABLE_CREATED = 'VARIABLE_CREATED',
  VARIABLE_UPDATED = 'VARIABLE_UPDATED',
  VARIABLE_DELETED = 'VARIABLE_DELETED'
}

/**
 * Handler de eventos
 */
export type WorkflowEventHandler = (event: WorkflowEvent) => Promise<void>;

// ============================================================================
// INTERFACES - Errores
// ============================================================================

/**
 * Error del motor de workflow
 */
export class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

/**
 * Códigos de error
 */
export enum WorkflowErrorCode {
  DEFINITION_NOT_FOUND = 'DEFINITION_NOT_FOUND',
  INSTANCE_NOT_FOUND = 'INSTANCE_NOT_FOUND',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  CONDITION_EVALUATION_ERROR = 'CONDITION_EVALUATION_ERROR',
  SERVICE_TASK_ERROR = 'SERVICE_TASK_ERROR',
  TIMER_ERROR = 'TIMER_ERROR',
  VARIABLE_ERROR = 'VARIABLE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BPMN_PARSE_ERROR = 'BPMN_PARSE_ERROR',
  SUBPROCESS_ERROR = 'SUBPROCESS_ERROR',
  GATEWAY_ERROR = 'GATEWAY_ERROR'
}
