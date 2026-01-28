import { z } from 'zod';

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

// API Error
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// API Metadata
export interface ApiMeta {
  timestamp: string;
  requestId: string;
  version: string;
}

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Filter operators
export type FilterOperator =
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains'// string contains
  | 'startsWith'
  | 'endsWith'
  | 'between';

// Filter condition
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

// Search params
export interface SearchParams {
  query: string;
  fields?: string[];
  filters?: FilterCondition[];
  pagination?: PaginationParams;
}

// Bulk operation result
export interface BulkOperationResult {
  succeeded: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    duration?: number;
  }>;
}

// WebSocket events
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
  senderId?: string;
}

// Real-time collaboration
export interface CollaborationEvent {
  type: 'join' | 'leave' | 'cursor' | 'selection' | 'change';
  documentId: string;
  userId: string;
  data?: unknown;
}

// AI Request/Response
export interface AIRequest {
  prompt: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter';
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  usage?: AIResponse['usage'];
}
