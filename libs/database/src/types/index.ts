/**
 * AI-CORE Database Types
 * Complete type definitions for 38 databases integration layer
 */

// ============================================
// DATABASE NAMES - 38 Databases
// ============================================

export type DatabaseName =
  // Core Management (SM = Soriano Management)
  | 'sm_global'
  | 'sm_analytics'
  | 'sm_communications'
  | 'sm_compliance'
  | 'sm_documents'
  | 'sm_leads'
  | 'sm_strategy'
  | 'sm_integrations'
  | 'sm_accounting'
  | 'sm_hr'
  | 'sm_projects'
  | 'sm_ai_agents'
  | 'sm_workflows'
  | 'sm_audit'
  | 'sm_marketing'
  | 'sm_inventory'
  | 'sm_techteam'
  | 'sm_commercial'
  | 'sm_products'
  | 'sm_objectives'
  | 'sm_notifications'
  | 'sm_scheduling'
  | 'sm_data_quality'
  | 'sm_tickets'
  | 'sm_quality'
  | 'sm_legal'
  // Insurance Specific (SS = Soriano Seguros)
  | 'ss_insurance'
  | 'ss_retention'
  | 'ss_endorsements'
  | 'ss_commissions'
  | 'ss_vigilance'
  // Utilities (SE = Soriano Energy, ST = Soriano Telecom, SF = Soriano Finance)
  | 'se_energy'
  | 'st_telecom'
  | 'sf_finance'
  // Services
  | 'sr_repairs'
  | 'sw_workshops'
  // External/Client facing
  | 'soriano_ecliente'
  | 'soriano_web_premium';

// ============================================
// DATABASE DOMAINS
// ============================================

export const DATABASE_DOMAINS = {
  CORE: ['sm_global'] as const,
  INSURANCE: ['ss_insurance', 'ss_commissions', 'ss_endorsements', 'ss_retention', 'ss_vigilance'] as const,
  UTILITIES: ['se_energy', 'st_telecom', 'sf_finance'] as const,
  SERVICES: ['sr_repairs', 'sw_workshops'] as const,
  OPERATIONS: [
    'sm_analytics', 'sm_communications', 'sm_documents', 'sm_compliance',
    'sm_leads', 'sm_marketing', 'sm_hr', 'sm_inventory', 'sm_integrations',
    'sm_projects', 'sm_strategy', 'sm_ai_agents', 'sm_accounting',
    'sm_techteam', 'sm_commercial', 'sm_products', 'sm_objectives',
    'sm_notifications', 'sm_scheduling', 'sm_audit', 'sm_workflows',
    'sm_data_quality', 'sm_tickets', 'sm_quality', 'sm_legal'
  ] as const,
  EXTERNAL: ['soriano_ecliente', 'soriano_web_premium'] as const,
} as const;

export const ALL_DATABASES: DatabaseName[] = [
  ...DATABASE_DOMAINS.CORE,
  ...DATABASE_DOMAINS.INSURANCE,
  ...DATABASE_DOMAINS.UTILITIES,
  ...DATABASE_DOMAINS.SERVICES,
  ...DATABASE_DOMAINS.OPERATIONS,
  ...DATABASE_DOMAINS.EXTERNAL,
];

// ============================================
// CONNECTION & POOL TYPES
// ============================================

export interface DatabaseConfig {
  name: DatabaseName;
  url: string;
  poolSize: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  ssl: boolean;
  schema?: string;
}

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  connectionTimeout: number;
  maxRetries: number;
  retryDelayMs: number;
}

export interface ConnectionPoolStats {
  database: DatabaseName;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageAcquireTime: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

export interface PooledConnection<T = unknown> {
  client: T;
  database: DatabaseName;
  createdAt: Date;
  lastUsedAt: Date;
  queryCount: number;
  release: () => void;
}

// ============================================
// QUERY & RESULT TYPES
// ============================================

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
  transaction?: boolean;
}

export interface QueryResult<T = unknown> {
  data: T;
  rowCount: number;
  executionTime: number;
  cached: boolean;
  database: DatabaseName;
}

export interface TransactionContext {
  id: string;
  databases: DatabaseName[];
  startedAt: Date;
  status: 'active' | 'committed' | 'rolled_back';
}

export interface BatchOperation<T = unknown> {
  database: DatabaseName;
  operation: 'create' | 'update' | 'delete' | 'upsert';
  model: string;
  data: T[];
}

// ============================================
// SYNC TYPES
// ============================================

export type SyncDirection = 'push' | 'pull' | 'bidirectional';
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflict';
export type ConflictStrategy = 'source_wins' | 'target_wins' | 'latest_wins' | 'manual' | 'merge';

export interface SyncEvent {
  id: string;
  sourceDatabase: DatabaseName;
  targetDatabase: DatabaseName;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  version: number;
  timestamp: Date;
  status: SyncStatus;
  error?: string;
}

export interface ChangeRecord {
  id: string;
  database: DatabaseName;
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedFields: string[];
  changedBy: string;
  changedAt: Date;
  version: number;
  checksum: string;
}

export interface ConflictResolution {
  id: string;
  syncEventId: string;
  sourceRecord: ChangeRecord;
  targetRecord: ChangeRecord;
  conflictType: 'update_update' | 'update_delete' | 'delete_update';
  strategy: ConflictStrategy;
  resolvedData: Record<string, unknown> | null;
  resolvedBy: 'auto' | 'manual';
  resolvedAt: Date;
  notes?: string;
}

export interface SyncConfig {
  sourceDatabase: DatabaseName;
  targetDatabase: DatabaseName;
  entities: string[];
  direction: SyncDirection;
  conflictStrategy: ConflictStrategy;
  batchSize: number;
  intervalMs: number;
  enabled: boolean;
}

export interface SyncStats {
  configId: string;
  lastSyncAt: Date;
  recordsSynced: number;
  recordsFailed: number;
  conflictsDetected: number;
  conflictsResolved: number;
  averageSyncTime: number;
}

// ============================================
// OUTBOX EVENT TYPES (for Kafka integration)
// ============================================

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'RETRY';

export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  publishedAt: Date | null;
  status: OutboxStatus;
  retryCount: number;
  lastError: string | null;
  topic: string;
  partitionKey: string;
}

export interface KafkaEventConfig {
  topic: string;
  partitionKey: string;
  headers?: Record<string, string>;
  acks?: 'all' | 'leader' | 'none';
}

// ============================================
// MIGRATION TYPES
// ============================================

export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';

export interface Migration {
  id: string;
  name: string;
  database: DatabaseName;
  version: string;
  description: string;
  upScript: string;
  downScript: string;
  checksum: string;
  appliedAt: Date | null;
  status: MigrationStatus;
  executionTime: number | null;
  error: string | null;
}

export interface MigrationPlan {
  database: DatabaseName;
  pendingMigrations: Migration[];
  appliedMigrations: Migration[];
  currentVersion: string;
  targetVersion: string;
}

export interface MigrationResult {
  migration: Migration;
  success: boolean;
  executionTime: number;
  error?: string;
  rollbackAvailable: boolean;
}

// ============================================
// HEALTH CHECK TYPES
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface DatabaseHealth {
  database: DatabaseName;
  status: HealthStatus;
  latencyMs: number;
  connectionCount: number;
  maxConnections: number;
  lastCheckedAt: Date;
  version: string;
  uptime: number;
  replicationLag?: number;
  diskUsagePercent?: number;
  errors: string[];
}

export interface HealthCheckConfig {
  intervalMs: number;
  timeoutMs: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  checkReplication: boolean;
  checkDiskUsage: boolean;
}

export interface SystemHealth {
  overall: HealthStatus;
  databases: Record<DatabaseName, DatabaseHealth>;
  timestamp: Date;
  uptime: number;
  version: string;
}

// ============================================
// REPOSITORY TYPES
// ============================================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface FilterOptions {
  where?: Record<string, unknown>;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}

export interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string, options?: FilterOptions): Promise<T | null>;
  findMany(options?: FilterOptions & PaginationOptions): Promise<PaginatedResult<T>>;
  findFirst(options?: FilterOptions): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  createMany(data: CreateInput[]): Promise<T[]>;
  update(id: string, data: UpdateInput): Promise<T>;
  updateMany(where: Record<string, unknown>, data: UpdateInput): Promise<number>;
  delete(id: string): Promise<void>;
  deleteMany(where: Record<string, unknown>): Promise<number>;
  count(where?: Record<string, unknown>): Promise<number>;
  exists(id: string): Promise<boolean>;
  upsert(id: string, create: CreateInput, update: UpdateInput): Promise<T>;
}

// ============================================
// DOMAIN ENTITY TYPES
// ============================================

export interface Party {
  id: string;
  type: 'PERSON' | 'COMPANY' | 'ORGANIZATION';
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: Address;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  productId: string;
  partyId: string;
  status: 'QUOTE' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
  effectiveDate: Date;
  expirationDate: Date;
  premium: number;
  currency: string;
  coverages: Coverage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Coverage {
  id: string;
  name: string;
  code: string;
  limit: number;
  deductible: number;
  premium: number;
}

export interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'APPROVED' | 'DENIED' | 'CLOSED';
  type: string;
  description: string;
  incidentDate: Date;
  reportedDate: Date;
  claimAmount: number;
  approvedAmount: number | null;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  type: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  entityType: string;
  entityId: string;
  currentStep: string;
  steps: WorkflowStep[];
  assignee: string | null;
  dueDate: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  order: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  assignee: string | null;
  completedBy: string | null;
  completedAt: Date | null;
  notes: string | null;
}

// ============================================
// ERROR TYPES
// ============================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly database: DatabaseName,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(database: DatabaseName, originalError?: Error) {
    super(`Failed to connect to database: ${database}`, database, 'CONNECTION_ERROR', originalError);
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(database: DatabaseName, query: string, originalError?: Error) {
    super(`Query failed on database ${database}: ${query.substring(0, 100)}...`, database, 'QUERY_ERROR', originalError);
    this.name = 'QueryError';
  }
}

export class TransactionError extends DatabaseError {
  constructor(database: DatabaseName, transactionId: string, originalError?: Error) {
    super(`Transaction ${transactionId} failed on database: ${database}`, database, 'TRANSACTION_ERROR', originalError);
    this.name = 'TransactionError';
  }
}

export class SyncError extends Error {
  constructor(
    message: string,
    public readonly sourceDatabase: DatabaseName,
    public readonly targetDatabase: DatabaseName,
    public readonly syncEventId?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly database: DatabaseName,
    public readonly migrationId: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}
