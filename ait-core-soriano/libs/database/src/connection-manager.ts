/**
 * Database Connection Manager
 * Handles connection pooling, health checks, and graceful shutdown
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '@ait-core/shared/logger';
import { allDatabases, DatabaseName } from './clients';

const logger = createLogger('@ait-core/database:connection-manager');

export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private isShuttingDown = false;
  private connectionStatus: Map<DatabaseName, boolean> = new Map();

  private constructor() {
    this.setupShutdownHandlers();
  }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Connect to all databases
   */
  async connectAll(): Promise<void> {
    logger.info('Connecting to all databases...');

    const connections = Object.entries(allDatabases).map(async ([name, client]) => {
      try {
        await client.$connect();
        this.connectionStatus.set(name as DatabaseName, true);
        logger.info(`Connected to database: ${name}`);
      } catch (error) {
        this.connectionStatus.set(name as DatabaseName, false);
        logger.error(`Failed to connect to database: ${name}`, { error });
        throw error;
      }
    });

    await Promise.all(connections);
    logger.info('All databases connected successfully');
  }

  /**
   * Disconnect from all databases
   */
  async disconnectAll(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Disconnecting from all databases...');

    const disconnections = Object.entries(allDatabases).map(async ([name, client]) => {
      try {
        await client.$disconnect();
        this.connectionStatus.set(name as DatabaseName, false);
        logger.info(`Disconnected from database: ${name}`);
      } catch (error) {
        logger.error(`Failed to disconnect from database: ${name}`, { error });
      }
    });

    await Promise.all(disconnections);
    logger.info('All databases disconnected');
  }

  /**
   * Health check for a specific database
   */
  async checkHealth(dbName: DatabaseName): Promise<boolean> {
    try {
      const client = allDatabases[dbName];
      await client.$queryRaw`SELECT 1`;
      this.connectionStatus.set(dbName, true);
      return true;
    } catch (error) {
      logger.error(`Health check failed for database: ${dbName}`, { error });
      this.connectionStatus.set(dbName, false);
      return false;
    }
  }

  /**
   * Health check for all databases
   */
  async checkAllHealth(): Promise<Record<DatabaseName, boolean>> {
    const healthChecks = Object.keys(allDatabases).map(async (name) => {
      const isHealthy = await this.checkHealth(name as DatabaseName);
      return [name, isHealthy] as const;
    });

    const results = await Promise.all(healthChecks);
    return Object.fromEntries(results) as Record<DatabaseName, boolean>;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(dbName?: DatabaseName): boolean | Map<DatabaseName, boolean> {
    if (dbName) {
      return this.connectionStatus.get(dbName) ?? false;
    }
    return new Map(this.connectionStatus);
  }

  /**
   * Execute transaction across multiple databases
   * Note: This is a simplified version. For true distributed transactions,
   * consider implementing 2PC or Saga pattern
   */
  async executeTransaction<T>(
    databases: DatabaseName[],
    callback: (clients: Record<DatabaseName, PrismaClient>) => Promise<T>
  ): Promise<T> {
    const clients = Object.fromEntries(
      databases.map((name) => [name, allDatabases[name]])
    ) as Record<DatabaseName, PrismaClient>;

    try {
      return await callback(clients);
    } catch (error) {
      logger.error('Transaction failed', { error, databases });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await this.disconnectAll();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('beforeExit', async () => {
      await this.disconnectAll();
    });
  }
}

/**
 * Singleton instance
 */
export const connectionManager = DatabaseConnectionManager.getInstance();

/**
 * Helper functions
 */
export const connectAllDatabases = () => connectionManager.connectAll();
export const disconnectAllDatabases = () => connectionManager.disconnectAll();
export const checkDatabaseHealth = (dbName: DatabaseName) => connectionManager.checkHealth(dbName);
export const checkAllDatabasesHealth = () => connectionManager.checkAllHealth();
