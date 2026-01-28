/**
 * Common TypeScript types and interfaces
 */

/**
 * Generic API Response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  metadata?: ResponseMetadata;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  version?: string;
}

/**
 * Pagination types
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter types
 */
export interface FilterParams {
  [key: string]: any;
}

export interface DateRangeFilter {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Search types
 */
export interface SearchParams extends PaginationParams {
  query: string;
  filters?: FilterParams;
}

/**
 * Entity base types
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: Date | null;
}

export interface AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
  version: number;
}

/**
 * User types
 */
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: Date;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Event types
 */
export interface DomainEvent<T = any> {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: T;
  metadata: EventMetadata;
  timestamp: Date;
}

export interface EventMetadata {
  userId?: string;
  correlationId?: string;
  causationId?: string;
  [key: string]: any;
}

/**
 * Queue message types
 */
export interface QueueMessage<T = any> {
  id: string;
  topic: string;
  key?: string;
  value: T;
  headers?: Record<string, string>;
  timestamp: number;
  partition?: number;
  offset?: number;
}

/**
 * File upload types
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'POLICY_UPDATE'
  | 'CLAIM_UPDATE'
  | 'PAYMENT_DUE'
  | 'RENEWAL_REMINDER';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP';
export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

/**
 * Insurance-specific types
 */
export interface PolicySummary {
  id: string;
  policyNumber: string;
  type: string;
  status: string;
  premium: number;
  startDate: Date;
  endDate: Date;
  customerId: string;
  customerName: string;
}

export interface ClaimSummary {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  type: string;
  status: string;
  amount: number;
  submittedAt: Date;
  customerId: string;
  customerName: string;
}

/**
 * Analytics types
 */
export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface AggregatedMetric {
  name: string;
  period: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

/**
 * Utility types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * Promise utilities
 */
export type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : any;

export type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

/**
 * Constructor type
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Function types
 */
export type AnyFunction = (...args: any[]) => any;
export type AsyncFunction = (...args: any[]) => Promise<any>;
export type VoidFunction = () => void;
export type AsyncVoidFunction = () => Promise<void>;
