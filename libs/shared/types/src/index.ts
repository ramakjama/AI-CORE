// AI-CORE Types - Shared TypeScript Types and Interfaces

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'employee' | 'customer' | 'guest';

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

// AI types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export interface Result<T, E = Error> {
  ok: boolean;
  value?: T;
  error?: E;
}

// Event types
export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: Date;
  version: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
