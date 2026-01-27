/**
 * Tool Types
 * Interfaces for function calling and tool execution
 */

import type { ToolType, ExecutionStatus } from './enums';

/**
 * JSON Schema for tool parameters
 */
export interface JsonSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array' | 'null';
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
}

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Tool Function Definition (OpenAI format)
 */
export interface ToolFunction {
  name: string;
  description: string;
  parameters: JsonSchema;
}

/**
 * Tool Definition
 */
export interface Tool {
  id: string;
  agentId?: string;
  code: string;
  name: string;
  description?: string;
  type: ToolType;

  // Function schema
  functionSchema: ToolFunction;

  // API configuration
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;

  // Execution settings
  isEnabled: boolean;
  requiresAuth: boolean;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMin?: number;

  // Permissions
  requiredPermissions: string[];

  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Tool Call from LLM
 */
export interface ToolCall {
  id: string;
  executionId?: string;
  toolId: string;
  tool?: Tool;

  // Call details
  callId: string;
  name: string;
  arguments: Record<string, unknown>;

  // Status
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;

  // Response
  response?: ToolResult;

  // Error handling
  errorCode?: string;
  errorMessage?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Tool Execution Result
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };

  // Execution info
  executionTime?: number;
  cached?: boolean;

  metadata?: Record<string, unknown>;
}

/**
 * Tool Call Delta (for streaming)
 */
export interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

/**
 * Pending Tool Call (accumulating during stream)
 */
export interface PendingToolCall {
  id: string;
  name: string;
  argumentsJson: string;
}

/**
 * Tool Registry Entry
 */
export interface ToolRegistryEntry {
  tool: Tool;
  handler: ToolHandler;
  validator?: ToolValidator;
}

/**
 * Tool Handler Function
 */
export type ToolHandler = (
  args: Record<string, unknown>,
  context: ToolExecutionContext
) => Promise<ToolResult>;

/**
 * Tool Validator Function
 */
export type ToolValidator = (
  args: Record<string, unknown>
) => { valid: boolean; errors?: string[] };

/**
 * Tool Execution Context
 */
export interface ToolExecutionContext {
  conversationId?: string;
  userId?: string;
  agentId?: string;
  executionId?: string;

  // Auth
  authToken?: string;
  permissions?: string[];

  // Request context
  requestId?: string;
  traceId?: string;

  // Additional context
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Tool Creation Input
 */
export interface CreateToolInput {
  agentId?: string;
  code: string;
  name: string;
  description?: string;
  type?: ToolType;

  functionSchema: ToolFunction;

  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;

  isEnabled?: boolean;
  requiresAuth?: boolean;
  timeout?: number;
  retryAttempts?: number;
  rateLimitPerMin?: number;

  requiredPermissions?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Tool Update Input
 */
export interface UpdateToolInput extends Partial<CreateToolInput> {
  id: string;
}

/**
 * Built-in Tool Types
 */
export type BuiltInToolType =
  | 'search'
  | 'database'
  | 'calculator'
  | 'api'
  | 'retrieval'
  | 'email'
  | 'calendar'
  | 'document';

/**
 * Tool Usage Statistics
 */
export interface ToolUsageStats {
  toolId: string;
  toolCode: string;

  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;

  averageExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;

  lastUsedAt?: Date;
  errorRate: number;
}
