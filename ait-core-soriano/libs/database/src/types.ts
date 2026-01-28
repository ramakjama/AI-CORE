/**
 * Database-related types and interfaces
 */

export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export interface DatabaseHealthStatus {
  name: string;
  isHealthy: boolean;
  latency?: number;
  error?: string;
}

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  database: string;
}

export interface ConnectionPoolMetrics {
  active: number;
  idle: number;
  waiting: number;
  max: number;
}

/**
 * Prisma Model Types - to be extended when schemas are generated
 */
export type PrismaModel = any;

/**
 * Common database operations result types
 */
export interface CreateResult<T> {
  data: T;
  success: boolean;
}

export interface UpdateResult<T> {
  data: T;
  success: boolean;
}

export interface DeleteResult {
  success: boolean;
  deletedId: string;
}

export interface BulkResult {
  count: number;
  success: boolean;
}

/**
 * Query builder types
 */
export interface WhereClause {
  [key: string]: any;
}

export interface OrderByClause {
  [key: string]: 'asc' | 'desc';
}

export interface PaginationOptions {
  skip?: number;
  take?: number;
  cursor?: any;
}

export interface QueryOptions extends PaginationOptions {
  where?: WhereClause;
  orderBy?: OrderByClause;
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
}
