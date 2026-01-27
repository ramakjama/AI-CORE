/**
 * AI Integrations - Types & Interfaces
 * Hub de integraciones, ETL y conectores
 */

// ============================================
// ENUMS
// ============================================

/**
 * Tipos de integración soportados
 */
export enum IntegrationType {
  // Compañías de seguros
  INSURANCE_MAPFRE = 'INSURANCE_MAPFRE',
  INSURANCE_ALLIANZ = 'INSURANCE_ALLIANZ',
  INSURANCE_AXA = 'INSURANCE_AXA',
  INSURANCE_GENERALI = 'INSURANCE_GENERALI',
  INSURANCE_ZURICH = 'INSURANCE_ZURICH',
  INSURANCE_CASER = 'INSURANCE_CASER',
  INSURANCE_LIBERTY = 'INSURANCE_LIBERTY',
  INSURANCE_MUTUA = 'INSURANCE_MUTUA',
  INSURANCE_SANITAS = 'INSURANCE_SANITAS',
  INSURANCE_DKV = 'INSURANCE_DKV',
  INSURANCE_GENERIC = 'INSURANCE_GENERIC',

  // Banca
  BANKING_OPEN_BANKING = 'BANKING_OPEN_BANKING',
  BANKING_SEPA = 'BANKING_SEPA',
  BANKING_SWIFT = 'BANKING_SWIFT',
  BANKING_PSD2 = 'BANKING_PSD2',

  // Gobierno
  GOVERNMENT_AEAT_SII = 'GOVERNMENT_AEAT_SII',
  GOVERNMENT_SEG_SOCIAL = 'GOVERNMENT_SEG_SOCIAL',
  GOVERNMENT_REGISTRO_MERCANTIL = 'GOVERNMENT_REGISTRO_MERCANTIL',
  GOVERNMENT_CATASTRO = 'GOVERNMENT_CATASTRO',

  // CRM
  CRM_SALESFORCE = 'CRM_SALESFORCE',
  CRM_HUBSPOT = 'CRM_HUBSPOT',
  CRM_DYNAMICS = 'CRM_DYNAMICS',
  CRM_ZOHO = 'CRM_ZOHO',
  CRM_PIPEDRIVE = 'CRM_PIPEDRIVE',

  // ERP
  ERP_SAP = 'ERP_SAP',
  ERP_ORACLE = 'ERP_ORACLE',
  ERP_MICROSOFT_DYNAMICS = 'ERP_MICROSOFT_DYNAMICS',
  ERP_SAGE = 'ERP_SAGE',
  ERP_ODOO = 'ERP_ODOO',

  // Comunicaciones
  COMM_EMAIL = 'COMM_EMAIL',
  COMM_SMS = 'COMM_SMS',
  COMM_WHATSAPP = 'COMM_WHATSAPP',

  // Almacenamiento
  STORAGE_S3 = 'STORAGE_S3',
  STORAGE_AZURE_BLOB = 'STORAGE_AZURE_BLOB',
  STORAGE_GCS = 'STORAGE_GCS',

  // Mensajería
  MESSAGING_RABBITMQ = 'MESSAGING_RABBITMQ',
  MESSAGING_KAFKA = 'MESSAGING_KAFKA',
  MESSAGING_SQS = 'MESSAGING_SQS',

  // Genérico
  REST_API = 'REST_API',
  SOAP_API = 'SOAP_API',
  GRAPHQL_API = 'GRAPHQL_API',
  FTP_SFTP = 'FTP_SFTP',
  DATABASE = 'DATABASE'
}

/**
 * Dirección de sincronización
 */
export enum SyncDirection {
  INBOUND = 'INBOUND',           // Desde externo hacia el sistema
  OUTBOUND = 'OUTBOUND',         // Desde el sistema hacia externo
  BIDIRECTIONAL = 'BIDIRECTIONAL' // Ambas direcciones
}

/**
 * Estado de sincronización
 */
export enum SyncStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  SCHEDULED = 'SCHEDULED',
  CONFLICT = 'CONFLICT'
}

/**
 * Eventos de webhook
 */
export enum WebhookEvent {
  // Pólizas
  POLICY_CREATED = 'policy.created',
  POLICY_UPDATED = 'policy.updated',
  POLICY_CANCELLED = 'policy.cancelled',
  POLICY_RENEWED = 'policy.renewed',
  POLICY_EXPIRED = 'policy.expired',

  // Siniestros
  CLAIM_CREATED = 'claim.created',
  CLAIM_UPDATED = 'claim.updated',
  CLAIM_RESOLVED = 'claim.resolved',
  CLAIM_REJECTED = 'claim.rejected',

  // Clientes
  CLIENT_CREATED = 'client.created',
  CLIENT_UPDATED = 'client.updated',
  CLIENT_DELETED = 'client.deleted',

  // Pagos
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Documentos
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_SIGNED = 'document.signed',
  DOCUMENT_EXPIRED = 'document.expired',

  // Integraciones
  INTEGRATION_CONNECTED = 'integration.connected',
  INTEGRATION_DISCONNECTED = 'integration.disconnected',
  INTEGRATION_ERROR = 'integration.error',

  // Sincronización
  SYNC_STARTED = 'sync.started',
  SYNC_COMPLETED = 'sync.completed',
  SYNC_FAILED = 'sync.failed',

  // ETL
  ETL_PIPELINE_STARTED = 'etl.pipeline.started',
  ETL_PIPELINE_COMPLETED = 'etl.pipeline.completed',
  ETL_PIPELINE_FAILED = 'etl.pipeline.failed',

  // Genérico
  CUSTOM = 'custom'
}

/**
 * Estado de integración
 */
export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  PENDING_CONFIG = 'PENDING_CONFIG',
  PENDING_AUTH = 'PENDING_AUTH',
  MAINTENANCE = 'MAINTENANCE',
  RATE_LIMITED = 'RATE_LIMITED'
}

/**
 * Tipo de autenticación
 */
export enum AuthType {
  API_KEY = 'API_KEY',
  OAUTH2 = 'OAUTH2',
  BASIC = 'BASIC',
  BEARER = 'BEARER',
  CERTIFICATE = 'CERTIFICATE',
  CUSTOM = 'CUSTOM',
  NONE = 'NONE'
}

/**
 * Tipo de transformación ETL
 */
export enum TransformType {
  MAP = 'MAP',
  FILTER = 'FILTER',
  AGGREGATE = 'AGGREGATE',
  JOIN = 'JOIN',
  SPLIT = 'SPLIT',
  MERGE = 'MERGE',
  VALIDATE = 'VALIDATE',
  ENRICH = 'ENRICH',
  DEDUPLICATE = 'DEDUPLICATE',
  NORMALIZE = 'NORMALIZE',
  CUSTOM = 'CUSTOM'
}

/**
 * Estado de entrega de webhook
 */
export enum DeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

// ============================================
// INTERFACES - INTEGRATIONS
// ============================================

/**
 * Credenciales de integración
 */
export interface IntegrationCredentials {
  authType: AuthType;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  username?: string;
  password?: string;
  certificate?: string;
  privateKey?: string;
  passphrase?: string;
  customHeaders?: Record<string, string>;
  customParams?: Record<string, string>;
}

/**
 * Configuración de integración
 */
export interface IntegrationConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requests: number;
    period: number; // en segundos
  };
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
  ssl?: {
    verify: boolean;
    cert?: string;
    key?: string;
    ca?: string;
  };
  customOptions?: Record<string, unknown>;
}

/**
 * Integración
 */
export interface Integration {
  id: string;
  name: string;
  description?: string;
  type: IntegrationType;
  status: IntegrationStatus;
  config: IntegrationConfig;
  credentials: IntegrationCredentials;
  metadata?: Record<string, unknown>;
  lastSync?: Date;
  lastError?: string;
  errorCount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

/**
 * Log de integración
 */
export interface IntegrationLog {
  id: string;
  integrationId: string;
  action: string;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  message: string;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
  };
  duration?: number;
  timestamp: Date;
}

// ============================================
// INTERFACES - SYNC
// ============================================

/**
 * Mapeo de sincronización
 */
export interface SyncMapping {
  id: string;
  name: string;
  sourceEntity: string;
  targetEntity: string;
  direction: SyncDirection;
  fieldMappings: FieldMapping[];
  filters?: SyncFilter[];
  transformations?: FieldTransformation[];
  conflictResolution?: ConflictResolution;
  enabled: boolean;
}

/**
 * Mapeo de campo
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  defaultValue?: unknown;
  required?: boolean;
  transform?: FieldTransformation;
}

/**
 * Transformación de campo
 */
export interface FieldTransformation {
  type: 'uppercase' | 'lowercase' | 'trim' | 'date_format' | 'number_format' | 'lookup' | 'custom';
  params?: Record<string, unknown>;
  customFunction?: string;
}

/**
 * Filtro de sincronización
 */
export interface SyncFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: unknown;
}

/**
 * Resolución de conflictos
 */
export interface ConflictResolution {
  strategy: 'source_wins' | 'target_wins' | 'newest_wins' | 'manual' | 'custom';
  customResolver?: string;
}

/**
 * Trabajo de sincronización
 */
export interface SyncJob {
  id: string;
  integrationId: string;
  name: string;
  description?: string;
  mapping: SyncMapping;
  schedule?: string; // Expresión cron
  status: SyncStatus;
  lastRun?: Date;
  nextRun?: Date;
  stats?: SyncStats;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Estadísticas de sincronización
 */
export interface SyncStats {
  totalRecords: number;
  processedRecords: number;
  createdRecords: number;
  updatedRecords: number;
  deletedRecords: number;
  skippedRecords: number;
  failedRecords: number;
  conflicts: number;
  duration: number;
}

/**
 * Log de sincronización
 */
export interface SyncLog {
  id: string;
  jobId: string;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  stats?: SyncStats;
  errors?: SyncError[];
  warnings?: string[];
}

/**
 * Error de sincronización
 */
export interface SyncError {
  recordId: string;
  field?: string;
  error: string;
  details?: unknown;
}

/**
 * Conflicto de sincronización
 */
export interface SyncConflict {
  id: string;
  syncLogId: string;
  recordId: string;
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  conflictFields: string[];
  resolution?: 'source' | 'target' | 'merged' | 'skipped';
  resolvedBy?: string;
  resolvedAt?: Date;
}

// ============================================
// INTERFACES - WEBHOOKS
// ============================================

/**
 * Webhook
 */
export interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  enabled: boolean;
  retryPolicy?: RetryPolicy;
  filters?: WebhookFilter[];
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

/**
 * Política de reintentos
 */
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number; // en segundos
  backoffMultiplier?: number;
  maxDelay?: number;
}

/**
 * Filtro de webhook
 */
export interface WebhookFilter {
  field: string;
  operator: 'eq' | 'neq' | 'contains' | 'in';
  value: unknown;
}

/**
 * Entrega de webhook
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  attempts: number;
  lastAttempt?: Date;
  nextRetry?: Date;
  response?: {
    status: number;
    body?: string;
    headers?: Record<string, string>;
  };
  error?: string;
  createdAt: Date;
}

/**
 * Log de webhook
 */
export interface WebhookLog {
  id: string;
  webhookId: string;
  deliveryId: string;
  event: WebhookEvent;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body?: string;
  };
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

// ============================================
// INTERFACES - ETL
// ============================================

/**
 * Paso ETL
 */
export interface ETLStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'load' | 'validate';
  order: number;
  config: ETLStepConfig;
  enabled: boolean;
  onError?: 'stop' | 'skip' | 'retry';
  retryAttempts?: number;
}

/**
 * Configuración de paso ETL
 */
export interface ETLStepConfig {
  // Para extract
  source?: {
    type: 'database' | 'api' | 'file' | 'queue';
    connection: string;
    query?: string;
    endpoint?: string;
    path?: string;
  };
  // Para transform
  transformations?: Transform[];
  // Para load
  target?: {
    type: 'database' | 'api' | 'file' | 'queue';
    connection: string;
    table?: string;
    endpoint?: string;
    path?: string;
    mode?: 'insert' | 'upsert' | 'replace';
  };
  // Para validate
  schema?: Record<string, unknown>;
  rules?: ValidationRule[];
}

/**
 * Transformación
 */
export interface Transform {
  type: TransformType;
  name: string;
  config: TransformConfig;
}

/**
 * Configuración de transformación
 */
export interface TransformConfig {
  // MAP
  fieldMappings?: Record<string, string | FieldTransformation>;
  // FILTER
  conditions?: SyncFilter[];
  // AGGREGATE
  groupBy?: string[];
  aggregations?: {
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
    alias: string;
  }[];
  // JOIN
  joinWith?: string;
  joinType?: 'inner' | 'left' | 'right' | 'outer';
  joinOn?: { left: string; right: string }[];
  // SPLIT
  splitField?: string;
  delimiter?: string;
  // MERGE
  mergeFields?: string[];
  targetField?: string;
  separator?: string;
  // VALIDATE
  schema?: Record<string, unknown>;
  // ENRICH
  enrichSource?: string;
  enrichMapping?: Record<string, string>;
  // DEDUPLICATE
  dedupeFields?: string[];
  keepStrategy?: 'first' | 'last' | 'newest' | 'oldest';
  // NORMALIZE
  normalizations?: {
    field: string;
    type: 'phone' | 'email' | 'address' | 'name' | 'date' | 'currency';
  }[];
  // CUSTOM
  customFunction?: string;
}

/**
 * Regla de validación
 */
export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'format' | 'range' | 'enum' | 'regex' | 'custom';
  params?: Record<string, unknown>;
  message?: string;
}

/**
 * Trabajo ETL
 */
export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  steps: ETLStep[];
  schedule?: string; // Expresión cron
  status: SyncStatus;
  lastRun?: Date;
  nextRun?: Date;
  stats?: ETLStats;
  enabled: boolean;
  notifications?: {
    onSuccess?: string[];
    onFailure?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

/**
 * Estadísticas ETL
 */
export interface ETLStats {
  extractedRecords: number;
  transformedRecords: number;
  loadedRecords: number;
  failedRecords: number;
  validationErrors: number;
  duration: number;
  stepDurations: Record<string, number>;
}

/**
 * Ejecución ETL
 */
export interface ETLExecution {
  id: string;
  jobId: string;
  status: SyncStatus;
  startTime: Date;
  endTime?: Date;
  stats?: ETLStats;
  stepResults: ETLStepResult[];
  errors?: ETLError[];
  parameters?: Record<string, unknown>;
}

/**
 * Resultado de paso ETL
 */
export interface ETLStepResult {
  stepId: string;
  stepName: string;
  status: 'success' | 'failed' | 'skipped';
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  error?: string;
}

/**
 * Error ETL
 */
export interface ETLError {
  stepId: string;
  recordId?: string;
  error: string;
  details?: unknown;
  timestamp: Date;
}

// ============================================
// INTERFACES - CONNECTORS
// ============================================

/**
 * Configuración de conector
 */
export interface ConnectorConfig {
  type: IntegrationType;
  name: string;
  version: string;
  endpoints: ConnectorEndpoint[];
  authentication: AuthType[];
  rateLimits?: {
    requests: number;
    period: number;
  };
  retryPolicy?: RetryPolicy;
  features?: string[];
  documentation?: string;
}

/**
 * Endpoint de conector
 */
export interface ConnectorEndpoint {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  parameters?: ConnectorParameter[];
  requestBody?: {
    contentType: string;
    schema: Record<string, unknown>;
  };
  responseSchema?: Record<string, unknown>;
}

/**
 * Parámetro de conector
 */
export interface ConnectorParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: unknown;
}

/**
 * Conector base
 */
export interface Connector {
  config: ConnectorConfig;
  initialize(credentials: IntegrationCredentials): Promise<void>;
  testConnection(): Promise<boolean>;
  execute<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  disconnect(): Promise<void>;
}

// ============================================
// INTERFACES - MENSAJERÍA
// ============================================

/**
 * Configuración de cola de mensajes
 */
export interface QueueConfig {
  type: 'rabbitmq' | 'kafka' | 'sqs';
  connection: {
    host?: string;
    port?: number;
    brokers?: string[];
    region?: string;
  };
  queue?: string;
  topic?: string;
  credentials?: {
    username?: string;
    password?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
}

/**
 * Mensaje de cola
 */
export interface QueueMessage {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  headers?: Record<string, string>;
  timestamp: Date;
  retryCount?: number;
}

// ============================================
// INTERFACES - RESPUESTAS
// ============================================

/**
 * Resultado de operación
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    duration?: number;
    timestamp?: Date;
    requestId?: string;
  };
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Filtros de consulta
 */
export interface QueryFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
  dateFrom?: Date;
  dateTo?: Date;
}
