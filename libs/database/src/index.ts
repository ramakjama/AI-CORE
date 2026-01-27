/**
 * AI-CORE Database Layer
 * Unified access to all 38 Prisma databases with connection pooling,
 * bidirectional synchronization, and health monitoring
 *
 * Architecture:
 * - Each database has its own Prisma client
 * - Clients are lazy-loaded on first use
 * - Connection pooling is managed per-database
 * - Bidirectional sync support with conflict resolution
 * - Event bus integration via OutboxEvent pattern
 * - Comprehensive health monitoring
 */

// ============================================
// TYPES - Complete type definitions
// ============================================
export {
  // Database Names & Domains
  type DatabaseName,
  DATABASE_DOMAINS,
  ALL_DATABASES,

  // Connection & Pool Types
  type DatabaseConfig,
  type ConnectionPoolConfig,
  type ConnectionPoolStats,
  type PooledConnection,

  // Query & Result Types
  type QueryOptions,
  type QueryResult,
  type TransactionContext,
  type BatchOperation,

  // Sync Types
  type SyncDirection,
  type SyncStatus,
  type ConflictStrategy,
  type SyncEvent,
  type ChangeRecord,
  type ConflictResolution,
  type SyncConfig,
  type SyncStats,

  // Outbox Event Types
  type OutboxStatus,
  type OutboxEvent,
  type KafkaEventConfig,

  // Migration Types
  type MigrationStatus,
  type Migration,
  type MigrationPlan,
  type MigrationResult,

  // Health Check Types
  type HealthStatus,
  type DatabaseHealth,
  type HealthCheckConfig,
  type SystemHealth,

  // Repository Types
  type PaginationOptions,
  type PaginatedResult,
  type FilterOptions,
  type Repository,

  // Domain Entity Types
  type Party,
  type Address,
  type Policy,
  type Coverage,
  type Claim,
  type Document,
  type Workflow,
  type WorkflowStep,

  // Error Types
  DatabaseError,
  ConnectionError,
  QueryError,
  TransactionError,
  SyncError,
  MigrationError,
} from './types';

// ============================================
// CONNECTIONS - Pool & Connection Management
// ============================================
export {
  // Connection Pool
  ConnectionPool,
  connectionPool,
  type PrismaClientWithConnect,

  // Database Connections Object (all 38 databases)
  databases,

  // Connection Functions
  createConnection,
  getDatabase,
  initializeAllDatabases,
  closeAllDatabases,

  // Connection Helpers
  withConnection,
  withMultipleConnections,
} from './connections';

// ============================================
// REPOSITORIES - Data Access Layer
// ============================================
export {
  // Base Repository
  BaseRepository,
  createRepository,
  CrossDatabaseRepository,

  // Party Repository
  PartyRepository,
  getPartyRepository,
  type PartyCreateInput,
  type PartyUpdateInput,
  type PartySearchCriteria,

  // Policy Repository
  PolicyRepository,
  getPolicyRepository,
  type PolicyStatus,
  type PolicyCreateInput,
  type PolicyUpdateInput,
  type PolicySearchCriteria,
  type CoverageInput,

  // Claim Repository
  ClaimRepository,
  getClaimRepository,
  type ClaimStatus,
  type ClaimCreateInput,
  type ClaimUpdateInput,
  type ClaimSearchCriteria,
  type ClaimStatusUpdate,

  // Document Repository
  DocumentRepository,
  getDocumentRepository,
  type DocumentType,
  type DocumentCreateInput,
  type DocumentUpdateInput,
  type DocumentSearchCriteria,

  // Workflow Repository
  WorkflowRepository,
  getWorkflowRepository,
  type WorkflowStatus,
  type StepStatus,
  type WorkflowCreateInput,
  type WorkflowStepInput,
  type WorkflowUpdateInput,
  type WorkflowSearchCriteria,
  type StepTransition,
} from './repositories';

// ============================================
// SYNC - Bidirectional Synchronization
// ============================================
export {
  // Sync Manager
  SyncManager,
  getSyncManager,
  type SyncResult,
  type SyncManagerConfig,

  // Change Tracker
  ChangeTracker,
  type ChangeTrackerConfig,
  type ChangeSnapshot,

  // Conflict Resolver
  ConflictResolver,
  getConflictResolver,
  type ConflictResolverConfig,
  type ConflictDetails,
  type MergeResult,

  // Event Publisher
  EventPublisher,
  getEventPublisher,
  type EventPublisherConfig,
  type EventHandler,
  type EventSubscription,
} from './sync';

// ============================================
// HEALTH - Database Health Monitoring
// ============================================
export {
  // Health Monitor
  DatabaseHealthMonitor,
  getDatabaseHealthMonitor,

  // Quick Health Check
  quickHealthCheck,

  // Health Check Endpoint Factory
  createHealthCheckEndpoint,

  // Health Types
  type HealthCheckResult,
  type DomainHealth,
  type HealthTrend,
  type HealthCheckResponse,
} from './health';

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
export * from './client';
export { DatabaseManager, getAllDatabases } from './manager';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Initialize the database layer
 * - Connects to all databases
 * - Starts health monitoring
 * - Initializes sync if configured
 */
export async function initializeDatabaseLayer(options?: {
  connectAll?: boolean;
  startHealthMonitor?: boolean;
  healthCheckIntervalMs?: number;
}): Promise<void> {
  const {
    connectAll = false,
    startHealthMonitor = true,
    healthCheckIntervalMs = 30000,
  } = options ?? {};

  console.info('[DatabaseLayer] Initializing...');

  // Connect to all databases if requested
  if (connectAll) {
    const { initializeAllDatabases } = await import('./connections');
    await initializeAllDatabases();
  }

  // Start health monitoring
  if (startHealthMonitor) {
    const { getDatabaseHealthMonitor } = await import('./health');
    const monitor = getDatabaseHealthMonitor({ intervalMs: healthCheckIntervalMs });
    monitor.start();
  }

  console.info('[DatabaseLayer] Initialization complete');
}

/**
 * Shutdown the database layer gracefully
 */
export async function shutdownDatabaseLayer(): Promise<void> {
  console.info('[DatabaseLayer] Shutting down...');

  // Stop health monitoring
  const { getDatabaseHealthMonitor } = await import('./health');
  const monitor = getDatabaseHealthMonitor();
  monitor.stop();

  // Stop sync manager
  const { getSyncManager } = await import('./sync');
  const syncManager = getSyncManager();
  syncManager.stopAll();

  // Close all database connections
  const { closeAllDatabases } = await import('./connections');
  await closeAllDatabases();

  console.info('[DatabaseLayer] Shutdown complete');
}
