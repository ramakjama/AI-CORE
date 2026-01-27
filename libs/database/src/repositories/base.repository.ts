/**
 * Base Repository
 * Generic CRUD operations for all entities across 38 databases
 */

import {
  DatabaseName,
  Repository,
  PaginationOptions,
  PaginatedResult,
  FilterOptions,
  QueryOptions,
  QueryResult,
  QueryError,
} from '../types';
import { getDatabase, connectionPool } from '../connections';

// ============================================
// BASE REPOSITORY CLASS
// ============================================

export abstract class BaseRepository<T, CreateInput, UpdateInput> implements Repository<T, CreateInput, UpdateInput> {
  protected readonly database: DatabaseName;
  protected readonly modelName: string;
  protected readonly primaryKey: string;

  constructor(database: DatabaseName, modelName: string, primaryKey = 'id') {
    this.database = database;
    this.modelName = modelName;
    this.primaryKey = primaryKey;
  }

  /**
   * Gets the Prisma delegate for the model
   */
  protected async getDelegate(): Promise<any> {
    const client = await getDatabase(this.database);
    const delegate = (client as any)[this.modelName];
    if (!delegate) {
      throw new QueryError(this.database, `Model ${this.modelName} not found`);
    }
    return delegate;
  }

  /**
   * Executes a query with retry logic
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    options: QueryOptions = {}
  ): Promise<R> {
    const maxRetries = options.retries ?? 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const executionTime = Date.now() - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.debug(`[${this.modelName}] Query executed in ${executionTime}ms`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[${this.modelName}] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);

        if (attempt < maxRetries - 1) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw new QueryError(this.database, `${this.modelName} operation failed`, lastError);
  }

  /**
   * Find a record by ID
   */
  async findById(id: string, options?: FilterOptions): Promise<T | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findUnique({
        where: { [this.primaryKey]: id },
        include: options?.include,
        select: options?.select,
      });
    });
  }

  /**
   * Find multiple records with pagination
   */
  async findMany(options?: FilterOptions & PaginationOptions): Promise<PaginatedResult<T>> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();

      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const orderBy = options?.orderBy
        ? { [options.orderBy]: options.orderDirection ?? 'asc' }
        : undefined;

      const [data, totalItems] = await Promise.all([
        delegate.findMany({
          where: options?.where,
          include: options?.include,
          select: options?.select,
          skip,
          take: pageSize,
          orderBy,
        }),
        delegate.count({ where: options?.where }),
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    });
  }

  /**
   * Find the first record matching filters
   */
  async findFirst(options?: FilterOptions): Promise<T | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findFirst({
        where: options?.where,
        include: options?.include,
        select: options?.select,
      });
    });
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.create({ data });
    });
  }

  /**
   * Create multiple records
   */
  async createMany(data: CreateInput[]): Promise<T[]> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();

      // Prisma's createMany doesn't return created records
      // So we use a transaction with individual creates
      const client = await getDatabase(this.database);
      return (client as any).$transaction(
        data.map((item: CreateInput) => delegate.create({ data: item }))
      );
    });
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.update({
        where: { [this.primaryKey]: id },
        data,
      });
    });
  }

  /**
   * Update multiple records
   */
  async updateMany(where: Record<string, unknown>, data: UpdateInput): Promise<number> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      const result = await delegate.updateMany({ where, data });
      return result.count;
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      await delegate.delete({ where: { [this.primaryKey]: id } });
    });
  }

  /**
   * Delete multiple records
   */
  async deleteMany(where: Record<string, unknown>): Promise<number> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      const result = await delegate.deleteMany({ where });
      return result.count;
    });
  }

  /**
   * Count records
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.count({ where });
    });
  }

  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  /**
   * Upsert a record
   */
  async upsert(id: string, create: CreateInput, update: UpdateInput): Promise<T> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.upsert({
        where: { [this.primaryKey]: id },
        create: { ...create, [this.primaryKey]: id },
        update,
      });
    });
  }

  /**
   * Execute a raw query
   */
  async rawQuery<R = unknown>(query: string, params: unknown[] = []): Promise<R> {
    return this.executeWithRetry(async () => {
      const client = await getDatabase(this.database);
      return (client as any).$queryRawUnsafe(query, ...params);
    });
  }

  /**
   * Execute within a transaction
   */
  async transaction<R>(
    callback: (tx: any) => Promise<R>
  ): Promise<R> {
    const client = await getDatabase(this.database);
    return (client as any).$transaction(callback);
  }

  /**
   * Bulk operations helper
   */
  async bulkOperation<R>(
    operations: Array<() => Promise<R>>
  ): Promise<R[]> {
    const client = await getDatabase(this.database);
    return (client as any).$transaction(operations.map(op => op()));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// REPOSITORY FACTORY
// ============================================

export function createRepository<T, CreateInput, UpdateInput>(
  database: DatabaseName,
  modelName: string,
  primaryKey = 'id'
): Repository<T, CreateInput, UpdateInput> {
  return new (class extends BaseRepository<T, CreateInput, UpdateInput> {
    constructor() {
      super(database, modelName, primaryKey);
    }
  })();
}

// ============================================
// CROSS-DATABASE REPOSITORY
// ============================================

export class CrossDatabaseRepository {
  /**
   * Executes operations across multiple databases
   */
  static async executeAcrossDatabases<T>(
    operations: Array<{
      database: DatabaseName;
      operation: (client: any) => Promise<T>;
    }>
  ): Promise<Map<DatabaseName, T>> {
    const results = new Map<DatabaseName, T>();

    await Promise.all(
      operations.map(async ({ database, operation }) => {
        const client = await getDatabase(database);
        try {
          const result = await operation(client);
          results.set(database, result);
        } finally {
          connectionPool.releaseConnection(database);
        }
      })
    );

    return results;
  }

  /**
   * Aggregates data from multiple databases
   */
  static async aggregateFromDatabases<T, R>(
    databases: DatabaseName[],
    query: (client: any) => Promise<T[]>,
    aggregator: (results: Map<DatabaseName, T[]>) => R
  ): Promise<R> {
    const allResults = new Map<DatabaseName, T[]>();

    await Promise.all(
      databases.map(async (database) => {
        const client = await getDatabase(database);
        try {
          const result = await query(client);
          allResults.set(database, result);
        } finally {
          connectionPool.releaseConnection(database);
        }
      })
    );

    return aggregator(allResults);
  }
}
