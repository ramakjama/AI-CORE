/**
 * AI-CORE Database Connection Pool
 * Manages connections to all 38 databases with pooling, retry logic, and health checks
 */

import { PrismaClient } from '@prisma/client';
import {
  DatabaseName,
  DatabaseConfig,
  ConnectionPoolConfig,
  ConnectionPoolStats,
  PooledConnection,
  ALL_DATABASES,
  ConnectionError,
  DatabaseError,
} from '../types';

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_POOL_CONFIG: ConnectionPoolConfig = {
  minConnections: 2,
  maxConnections: 10,
  acquireTimeout: 30000,
  idleTimeout: 60000,
  connectionTimeout: 10000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

const DEFAULT_DATABASE_CONFIG: Partial<DatabaseConfig> = {
  poolSize: 10,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  ssl: process.env.NODE_ENV === 'production',
};

// ============================================
// CONNECTION FACTORY
// ============================================

function getEnvVarName(database: DatabaseName): string {
  return `${database.toUpperCase()}_DATABASE_URL`;
}

function getDatabaseUrl(database: DatabaseName): string {
  const envVar = getEnvVarName(database);
  const url = process.env[envVar];
  if (!url) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
  return url;
}

interface PrismaClientWithConnect extends PrismaClient {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

function createPrismaClient(database: DatabaseName, config?: Partial<DatabaseConfig>): PrismaClientWithConnect {
  const url = getDatabaseUrl(database);
  const poolSize = config?.poolSize ?? DEFAULT_DATABASE_CONFIG.poolSize ?? 10;

  // Append connection pool configuration to URL
  const urlWithPool = url.includes('?')
    ? `${url}&connection_limit=${poolSize}`
    : `${url}?connection_limit=${poolSize}`;

  return new PrismaClient({
    datasources: {
      db: { url: urlWithPool },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
  }) as PrismaClientWithConnect;
}

// ============================================
// CONNECTION POOL CLASS
// ============================================

class ConnectionPool {
  private clients: Map<DatabaseName, PrismaClientWithConnect> = new Map();
  private stats: Map<DatabaseName, ConnectionPoolStats> = new Map();
  private healthCheckIntervals: Map<DatabaseName, NodeJS.Timeout> = new Map();
  private config: ConnectionPoolConfig;
  private initialized = false;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
  }

  /**
   * Creates a connection for a specific database
   */
  async createConnection(database: DatabaseName, retryCount = 0): Promise<PrismaClientWithConnect> {
    try {
      const client = createPrismaClient(database);
      await client.$connect();

      this.clients.set(database, client);
      this.stats.set(database, {
        database,
        totalConnections: 1,
        activeConnections: 0,
        idleConnections: 1,
        waitingRequests: 0,
        averageAcquireTime: 0,
        lastHealthCheck: new Date(),
        isHealthy: true,
      });

      console.info(`[ConnectionPool] Connected to ${database}`);
      return client;
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.warn(`[ConnectionPool] Retry ${retryCount + 1}/${this.config.maxRetries} for ${database}`);
        await this.delay(this.config.retryDelayMs * (retryCount + 1));
        return this.createConnection(database, retryCount + 1);
      }
      throw new ConnectionError(database, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Gets or creates a connection for a database
   */
  async getConnection(database: DatabaseName): Promise<PrismaClientWithConnect> {
    if (!this.clients.has(database)) {
      await this.createConnection(database);
    }

    const client = this.clients.get(database);
    if (!client) {
      throw new DatabaseError(`No client available for ${database}`, database, 'NO_CLIENT');
    }

    // Update stats
    const stats = this.stats.get(database);
    if (stats) {
      stats.activeConnections++;
      stats.idleConnections = Math.max(0, stats.idleConnections - 1);
    }

    return client;
  }

  /**
   * Releases a connection back to the pool
   */
  releaseConnection(database: DatabaseName): void {
    const stats = this.stats.get(database);
    if (stats) {
      stats.activeConnections = Math.max(0, stats.activeConnections - 1);
      stats.idleConnections++;
    }
  }

  /**
   * Initializes all database connections
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) {
      console.warn('[ConnectionPool] Already initialized');
      return;
    }

    console.info('[ConnectionPool] Initializing all 38 database connections...');

    const results = await Promise.allSettled(
      ALL_DATABASES.map(db => this.createConnection(db))
    );

    const failed: DatabaseName[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failed.push(ALL_DATABASES[index]);
        console.error(`[ConnectionPool] Failed to connect to ${ALL_DATABASES[index]}:`, result.reason);
      }
    });

    if (failed.length > 0) {
      console.warn(`[ConnectionPool] ${failed.length} databases failed to connect: ${failed.join(', ')}`);
    }

    this.initialized = true;
    console.info(`[ConnectionPool] Initialized ${ALL_DATABASES.length - failed.length}/${ALL_DATABASES.length} connections`);
  }

  /**
   * Closes all connections
   */
  async closeAll(): Promise<void> {
    console.info('[ConnectionPool] Closing all connections...');

    // Clear health check intervals
    this.healthCheckIntervals.forEach(interval => clearInterval(interval));
    this.healthCheckIntervals.clear();

    // Disconnect all clients
    await Promise.all(
      Array.from(this.clients.entries()).map(async ([db, client]) => {
        try {
          await client.$disconnect();
          console.info(`[ConnectionPool] Disconnected from ${db}`);
        } catch (error) {
          console.error(`[ConnectionPool] Error disconnecting from ${db}:`, error);
        }
      })
    );

    this.clients.clear();
    this.stats.clear();
    this.initialized = false;
  }

  /**
   * Checks if a specific database is healthy
   */
  async checkHealth(database: DatabaseName): Promise<boolean> {
    try {
      const client = await this.getConnection(database);
      await client.$queryRaw`SELECT 1`;

      const stats = this.stats.get(database);
      if (stats) {
        stats.isHealthy = true;
        stats.lastHealthCheck = new Date();
      }

      this.releaseConnection(database);
      return true;
    } catch {
      const stats = this.stats.get(database);
      if (stats) {
        stats.isHealthy = false;
        stats.lastHealthCheck = new Date();
      }
      return false;
    }
  }

  /**
   * Gets pool statistics for a database
   */
  getStats(database: DatabaseName): ConnectionPoolStats | undefined {
    return this.stats.get(database);
  }

  /**
   * Gets all pool statistics
   */
  getAllStats(): Map<DatabaseName, ConnectionPoolStats> {
    return new Map(this.stats);
  }

  /**
   * Checks if a database connection exists
   */
  hasConnection(database: DatabaseName): boolean {
    return this.clients.has(database);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// SINGLETON POOL INSTANCE
// ============================================

const globalForPool = globalThis as unknown as {
  connectionPool: ConnectionPool | undefined;
};

export const connectionPool = globalForPool.connectionPool ?? new ConnectionPool();

if (process.env.NODE_ENV !== 'production') {
  globalForPool.connectionPool = connectionPool;
}

// ============================================
// CONNECTION CREATOR HELPER
// ============================================

export function createConnection(database: DatabaseName): () => Promise<PrismaClientWithConnect> {
  return async () => connectionPool.getConnection(database);
}

// ============================================
// DATABASE CONNECTIONS OBJECT - ALL 38 DATABASES
// ============================================

export const databases = {
  // Core Management
  sm_global: createConnection('sm_global'),
  sm_analytics: createConnection('sm_analytics'),
  sm_communications: createConnection('sm_communications'),
  sm_compliance: createConnection('sm_compliance'),
  sm_documents: createConnection('sm_documents'),
  sm_leads: createConnection('sm_leads'),
  sm_strategy: createConnection('sm_strategy'),
  sm_integrations: createConnection('sm_integrations'),
  sm_accounting: createConnection('sm_accounting'),
  sm_hr: createConnection('sm_hr'),
  sm_projects: createConnection('sm_projects'),
  sm_ai_agents: createConnection('sm_ai_agents'),
  sm_workflows: createConnection('sm_workflows'),
  sm_audit: createConnection('sm_audit'),
  sm_marketing: createConnection('sm_marketing'),
  sm_inventory: createConnection('sm_inventory'),
  sm_techteam: createConnection('sm_techteam'),
  sm_commercial: createConnection('sm_commercial'),
  sm_products: createConnection('sm_products'),
  sm_objectives: createConnection('sm_objectives'),
  sm_notifications: createConnection('sm_notifications'),
  sm_scheduling: createConnection('sm_scheduling'),
  sm_data_quality: createConnection('sm_data_quality'),
  sm_tickets: createConnection('sm_tickets'),
  sm_quality: createConnection('sm_quality'),
  sm_legal: createConnection('sm_legal'),

  // Insurance Specific
  ss_insurance: createConnection('ss_insurance'),
  ss_retention: createConnection('ss_retention'),
  ss_endorsements: createConnection('ss_endorsements'),
  ss_commissions: createConnection('ss_commissions'),
  ss_vigilance: createConnection('ss_vigilance'),

  // Utilities
  se_energy: createConnection('se_energy'),
  st_telecom: createConnection('st_telecom'),
  sf_finance: createConnection('sf_finance'),

  // Services
  sr_repairs: createConnection('sr_repairs'),
  sw_workshops: createConnection('sw_workshops'),

  // External/Client facing
  soriano_ecliente: createConnection('soriano_ecliente'),
  soriano_web_premium: createConnection('soriano_web_premium'),
} as const;

// ============================================
// EXPORTS
// ============================================

export { ConnectionPool };
export type { PrismaClientWithConnect };

// Helper to get a database by name
export async function getDatabase(name: DatabaseName): Promise<PrismaClientWithConnect> {
  return connectionPool.getConnection(name);
}

// Initialize all connections
export async function initializeAllDatabases(): Promise<void> {
  return connectionPool.initializeAll();
}

// Close all connections
export async function closeAllDatabases(): Promise<void> {
  return connectionPool.closeAll();
}

// Execute with automatic connection release
export async function withConnection<T>(
  database: DatabaseName,
  callback: (client: PrismaClientWithConnect) => Promise<T>
): Promise<T> {
  const client = await connectionPool.getConnection(database);
  try {
    return await callback(client);
  } finally {
    connectionPool.releaseConnection(database);
  }
}

// Execute across multiple databases
export async function withMultipleConnections<T>(
  dbs: DatabaseName[],
  callback: (clients: Map<DatabaseName, PrismaClientWithConnect>) => Promise<T>
): Promise<T> {
  const clients = new Map<DatabaseName, PrismaClientWithConnect>();

  try {
    for (const db of dbs) {
      clients.set(db, await connectionPool.getConnection(db));
    }
    return await callback(clients);
  } finally {
    for (const db of dbs) {
      connectionPool.releaseConnection(db);
    }
  }
}
