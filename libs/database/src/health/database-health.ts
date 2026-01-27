/**
 * Database Health Monitor
 * Health checks for all 38 databases with comprehensive monitoring
 */

import {
  DatabaseName,
  DatabaseHealth,
  HealthStatus,
  HealthCheckConfig,
  SystemHealth,
  ALL_DATABASES,
  DATABASE_DOMAINS,
} from '../types';
import { connectionPool, getDatabase } from '../connections';

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  intervalMs: 30000, // 30 seconds
  timeoutMs: 5000,   // 5 seconds
  unhealthyThreshold: 3,
  healthyThreshold: 2,
  checkReplication: false,
  checkDiskUsage: false,
};

// ============================================
// HEALTH CHECK RESULT TYPES
// ============================================

export interface HealthCheckResult {
  database: DatabaseName;
  healthy: boolean;
  latencyMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DomainHealth {
  domain: string;
  databases: DatabaseName[];
  status: HealthStatus;
  healthyCount: number;
  unhealthyCount: number;
  degradedCount: number;
}

export interface HealthTrend {
  database: DatabaseName;
  checks: Array<{
    timestamp: Date;
    healthy: boolean;
    latencyMs: number;
  }>;
  averageLatency: number;
  uptime: number;
  lastDowntime?: Date;
}

// ============================================
// DATABASE HEALTH MONITOR CLASS
// ============================================

export class DatabaseHealthMonitor {
  private static instance: DatabaseHealthMonitor;
  private config: HealthCheckConfig;
  private healthState: Map<DatabaseName, DatabaseHealth> = new Map();
  private healthHistory: Map<DatabaseName, HealthCheckResult[]> = new Map();
  private failureCount: Map<DatabaseName, number> = new Map();
  private successCount: Map<DatabaseName, number> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private startTime: Date = new Date();

  private constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_HEALTH_CONFIG, ...config };
    this.initializeHealthState();
  }

  static getInstance(config?: Partial<HealthCheckConfig>): DatabaseHealthMonitor {
    if (!DatabaseHealthMonitor.instance) {
      DatabaseHealthMonitor.instance = new DatabaseHealthMonitor(config);
    }
    return DatabaseHealthMonitor.instance;
  }

  /**
   * Initialize health state for all databases
   */
  private initializeHealthState(): void {
    for (const database of ALL_DATABASES) {
      this.healthState.set(database, {
        database,
        status: 'unknown',
        latencyMs: 0,
        connectionCount: 0,
        maxConnections: 10,
        lastCheckedAt: new Date(),
        version: 'unknown',
        uptime: 0,
        errors: [],
      });
      this.healthHistory.set(database, []);
      this.failureCount.set(database, 0);
      this.successCount.set(database, 0);
    }
  }

  /**
   * Start automatic health checks
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[HealthMonitor] Already running');
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    console.info('[HealthMonitor] Starting health monitoring...');

    // Run initial check
    this.checkAllDatabases().catch(console.error);

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllDatabases().catch(console.error);
    }, this.config.intervalMs);
  }

  /**
   * Stop automatic health checks
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    console.info('[HealthMonitor] Stopped health monitoring');
  }

  /**
   * Check health of all databases
   */
  async checkAllDatabases(): Promise<Map<DatabaseName, HealthCheckResult>> {
    const results = new Map<DatabaseName, HealthCheckResult>();

    const checks = ALL_DATABASES.map(async (database) => {
      const result = await this.checkDatabase(database);
      results.set(database, result);
      return result;
    });

    await Promise.allSettled(checks);

    console.info(
      `[HealthMonitor] Health check completed: ${
        Array.from(results.values()).filter(r => r.healthy).length
      }/${ALL_DATABASES.length} healthy`
    );

    return results;
  }

  /**
   * Check health of a single database
   */
  async checkDatabase(database: DatabaseName): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let healthy = false;
    let error: string | undefined;
    let details: Record<string, unknown> = {};

    try {
      const client = await Promise.race([
        getDatabase(database),
        this.timeout(this.config.timeoutMs),
      ]);

      if (!client) {
        throw new Error('Connection timeout');
      }

      // Execute health check query
      await (client as any).$queryRaw`SELECT 1 as health_check`;
      healthy = true;

      // Get additional details if configured
      if (this.config.checkReplication || this.config.checkDiskUsage) {
        details = await this.getExtendedDetails(client as any, database);
      }

      // Release connection
      connectionPool.releaseConnection(database);
    } catch (err) {
      healthy = false;
      error = err instanceof Error ? err.message : String(err);
    }

    const latencyMs = Date.now() - startTime;
    const result: HealthCheckResult = { database, healthy, latencyMs, error, details };

    // Update state
    this.updateHealthState(database, result);

    return result;
  }

  /**
   * Get extended database details
   */
  private async getExtendedDetails(
    client: any,
    database: DatabaseName
  ): Promise<Record<string, unknown>> {
    const details: Record<string, unknown> = {};

    try {
      // Try to get PostgreSQL specific info
      if (this.config.checkReplication) {
        const replicationResult = await client.$queryRawUnsafe(`
          SELECT CASE
            WHEN pg_is_in_recovery() THEN
              COALESCE(
                EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::integer,
                0
              )
            ELSE 0
          END as replication_lag_seconds
        `);
        details.replicationLag = (replicationResult as any[])[0]?.replication_lag_seconds ?? 0;
      }

      if (this.config.checkDiskUsage) {
        const diskResult = await client.$queryRawUnsafe(`
          SELECT pg_database_size(current_database()) as db_size
        `);
        details.databaseSize = (diskResult as any[])[0]?.db_size ?? 0;
      }

      // Get connection count
      const connResult = await client.$queryRawUnsafe(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      details.activeConnections = parseInt((connResult as any[])[0]?.active_connections ?? '0');

    } catch {
      // Ignore errors for extended details
    }

    return details;
  }

  /**
   * Update health state based on check result
   */
  private updateHealthState(database: DatabaseName, result: HealthCheckResult): void {
    const currentState = this.healthState.get(database);
    if (!currentState) return;

    // Update counters
    if (result.healthy) {
      this.successCount.set(database, (this.successCount.get(database) ?? 0) + 1);
      this.failureCount.set(database, 0);
    } else {
      this.failureCount.set(database, (this.failureCount.get(database) ?? 0) + 1);
      this.successCount.set(database, 0);
    }

    // Determine status based on thresholds
    const failures = this.failureCount.get(database) ?? 0;
    const successes = this.successCount.get(database) ?? 0;

    let status: HealthStatus;
    if (failures >= this.config.unhealthyThreshold) {
      status = 'unhealthy';
    } else if (failures > 0 && failures < this.config.unhealthyThreshold) {
      status = 'degraded';
    } else if (successes >= this.config.healthyThreshold) {
      status = 'healthy';
    } else {
      status = currentState.status === 'unknown' ? 'healthy' : currentState.status;
    }

    // Update health record
    const updatedHealth: DatabaseHealth = {
      ...currentState,
      status,
      latencyMs: result.latencyMs,
      lastCheckedAt: new Date(),
      connectionCount: (result.details?.activeConnections as number) ?? currentState.connectionCount,
      replicationLag: result.details?.replicationLag as number,
      errors: result.error ? [...currentState.errors.slice(-9), result.error] : currentState.errors,
    };

    this.healthState.set(database, updatedHealth);

    // Add to history
    const history = this.healthHistory.get(database) ?? [];
    history.push(result);
    if (history.length > 100) history.shift(); // Keep last 100 checks
    this.healthHistory.set(database, history);
  }

  /**
   * Create a timeout promise
   */
  private timeout(ms: number): Promise<null> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  /**
   * Get health status of a single database
   */
  getHealth(database: DatabaseName): DatabaseHealth | undefined {
    return this.healthState.get(database);
  }

  /**
   * Get health status of all databases
   */
  getAllHealth(): Map<DatabaseName, DatabaseHealth> {
    return new Map(this.healthState);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): SystemHealth {
    const databases: Record<DatabaseName, DatabaseHealth> = {} as Record<DatabaseName, DatabaseHealth>;
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;

    for (const [database, health] of this.healthState) {
      databases[database] = health;
      if (health.status === 'healthy') healthyCount++;
      else if (health.status === 'degraded') degradedCount++;
      else if (health.status === 'unhealthy') unhealthyCount++;
    }

    let overall: HealthStatus;
    if (unhealthyCount > ALL_DATABASES.length * 0.2) {
      overall = 'unhealthy';
    } else if (degradedCount > 0 || unhealthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      databases,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: '1.0.0',
    };
  }

  /**
   * Get health by domain
   */
  getDomainHealth(): DomainHealth[] {
    const domains: DomainHealth[] = [];

    for (const [domainName, databaseList] of Object.entries(DATABASE_DOMAINS)) {
      const dbList = databaseList as readonly DatabaseName[];
      let healthyCount = 0;
      let unhealthyCount = 0;
      let degradedCount = 0;

      for (const db of dbList) {
        const health = this.healthState.get(db);
        if (health?.status === 'healthy') healthyCount++;
        else if (health?.status === 'unhealthy') unhealthyCount++;
        else if (health?.status === 'degraded') degradedCount++;
      }

      let status: HealthStatus;
      if (unhealthyCount > dbList.length * 0.5) {
        status = 'unhealthy';
      } else if (degradedCount > 0 || unhealthyCount > 0) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      domains.push({
        domain: domainName,
        databases: [...dbList],
        status,
        healthyCount,
        unhealthyCount,
        degradedCount,
      });
    }

    return domains;
  }

  /**
   * Get health trend for a database
   */
  getHealthTrend(database: DatabaseName): HealthTrend | null {
    const history = this.healthHistory.get(database);
    if (!history || history.length === 0) return null;

    const checks = history.map(h => ({
      timestamp: new Date(),
      healthy: h.healthy,
      latencyMs: h.latencyMs,
    }));

    const healthyChecks = history.filter(h => h.healthy);
    const averageLatency = healthyChecks.length > 0
      ? healthyChecks.reduce((sum, h) => sum + h.latencyMs, 0) / healthyChecks.length
      : 0;

    const uptime = (healthyChecks.length / history.length) * 100;

    // Find last downtime
    let lastDowntime: Date | undefined;
    for (let i = history.length - 1; i >= 0; i--) {
      if (!history[i].healthy) {
        lastDowntime = new Date();
        break;
      }
    }

    return {
      database,
      checks,
      averageLatency,
      uptime,
      lastDowntime,
    };
  }

  /**
   * Get unhealthy databases
   */
  getUnhealthyDatabases(): DatabaseHealth[] {
    return Array.from(this.healthState.values()).filter(
      h => h.status === 'unhealthy' || h.status === 'degraded'
    );
  }

  /**
   * Get databases by status
   */
  getDatabasesByStatus(status: HealthStatus): DatabaseName[] {
    return Array.from(this.healthState.entries())
      .filter(([_, health]) => health.status === status)
      .map(([database]) => database);
  }

  /**
   * Get average latency across all healthy databases
   */
  getAverageLatency(): number {
    const healthyDbs = Array.from(this.healthState.values()).filter(
      h => h.status === 'healthy'
    );

    if (healthyDbs.length === 0) return 0;
    return healthyDbs.reduce((sum, h) => sum + h.latencyMs, 0) / healthyDbs.length;
  }

  /**
   * Check if a database is available
   */
  isAvailable(database: DatabaseName): boolean {
    const health = this.healthState.get(database);
    return health?.status === 'healthy' || health?.status === 'degraded';
  }

  /**
   * Force a health check for specific databases
   */
  async forceCheck(databases: DatabaseName[]): Promise<Map<DatabaseName, HealthCheckResult>> {
    const results = new Map<DatabaseName, HealthCheckResult>();

    for (const database of databases) {
      const result = await this.checkDatabase(database);
      results.set(database, result);
    }

    return results;
  }

  /**
   * Reset health state for a database
   */
  resetHealth(database: DatabaseName): void {
    this.failureCount.set(database, 0);
    this.successCount.set(database, 0);
    this.healthHistory.set(database, []);

    const health = this.healthState.get(database);
    if (health) {
      health.status = 'unknown';
      health.errors = [];
    }
  }

  /**
   * Clear all health history
   */
  clearHistory(): void {
    for (const database of ALL_DATABASES) {
      this.healthHistory.set(database, []);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart if running to apply new interval
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Check if monitor is running
   */
  isMonitorRunning(): boolean {
    return this.isRunning;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

let healthMonitorInstance: DatabaseHealthMonitor | null = null;

export function getDatabaseHealthMonitor(
  config?: Partial<HealthCheckConfig>
): DatabaseHealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = DatabaseHealthMonitor.getInstance(config);
  }
  return healthMonitorInstance;
}

// ============================================
// QUICK HEALTH CHECK FUNCTION
// ============================================

export async function quickHealthCheck(): Promise<{
  healthy: DatabaseName[];
  unhealthy: DatabaseName[];
  total: number;
}> {
  const monitor = getDatabaseHealthMonitor();
  const results = await monitor.checkAllDatabases();

  const healthy: DatabaseName[] = [];
  const unhealthy: DatabaseName[] = [];

  for (const [database, result] of results) {
    if (result.healthy) {
      healthy.push(database);
    } else {
      unhealthy.push(database);
    }
  }

  return {
    healthy,
    unhealthy,
    total: ALL_DATABASES.length,
  };
}

// ============================================
// HEALTH CHECK MIDDLEWARE (for Express/NestJS)
// ============================================

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  uptime: number;
  databases: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
  details?: Record<DatabaseName, { status: HealthStatus; latencyMs: number }>;
}

export function createHealthCheckEndpoint(includeDetails = false): () => Promise<HealthCheckResponse> {
  return async () => {
    const monitor = getDatabaseHealthMonitor();
    const systemHealth = monitor.getSystemHealth();

    const healthy = monitor.getDatabasesByStatus('healthy').length;
    const unhealthy = monitor.getDatabasesByStatus('unhealthy').length;
    const degraded = monitor.getDatabasesByStatus('degraded').length;

    const response: HealthCheckResponse = {
      status: systemHealth.overall === 'healthy' ? 'ok' :
              systemHealth.overall === 'degraded' ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      uptime: systemHealth.uptime,
      databases: {
        total: ALL_DATABASES.length,
        healthy,
        unhealthy,
        degraded,
      },
    };

    if (includeDetails) {
      response.details = {} as Record<DatabaseName, { status: HealthStatus; latencyMs: number }>;
      for (const [db, health] of Object.entries(systemHealth.databases)) {
        response.details[db as DatabaseName] = {
          status: health.status,
          latencyMs: health.latencyMs,
        };
      }
    }

    return response;
  };
}
