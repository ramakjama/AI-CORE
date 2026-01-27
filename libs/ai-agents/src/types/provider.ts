/**
 * Provider Types
 * Interfaces for LLM providers
 */

import type { ProviderType, StreamEventType } from './enums';
import type { Message } from './conversation';
import type { Tool, ToolCall, ToolResult } from './tool';

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;

  // Endpoints
  baseUrl?: string;
  apiVersion?: string;

  // Organization
  organization?: string;
  project?: string;

  // Timeouts
  timeout?: number;
  maxRetries?: number;

  // Rate limiting
  maxRequestsPerMinute?: number;
  maxTokensPerMinute?: number;

  // Custom headers
  headers?: Record<string, string>;

  // Debug
  debug?: boolean;
}

/**
 * Completion Request
 */
export interface CompletionRequest {
  model: string;
  messages: ProviderMessage[];

  // Generation parameters
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Stop sequences
  stop?: string[];

  // Tools
  tools?: ProviderTool[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

  // Streaming
  stream?: boolean;

  // Response format
  responseFormat?: {
    type: 'text' | 'json_object';
    schema?: Record<string, unknown>;
  };

  // User tracking
  user?: string;

  // Seed for reproducibility
  seed?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Provider Message Format
 */
export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];

  // For assistant messages with tool calls
  toolCalls?: ProviderToolCall[];

  // For tool result messages
  toolCallId?: string;
  name?: string;
}

/**
 * Content Part (for multimodal)
 */
export interface ContentPart {
  type: 'text' | 'image_url' | 'image';
  text?: string;
  imageUrl?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
  source?: {
    type: 'base64';
    mediaType: string;
    data: string;
  };
}

/**
 * Provider Tool Format
 */
export interface ProviderTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Provider Tool Call
 */
export interface ProviderToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Completion Response
 */
export interface CompletionResponse {
  id: string;
  model: string;

  // Content
  content: string;
  role: 'assistant';

  // Tool calls
  toolCalls?: ProviderToolCall[];

  // Finish reason
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';

  // Usage
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  // Timing
  createdAt: Date;
  latencyMs?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Stream Event
 */
export interface StreamEvent {
  type: StreamEventType;
  index?: number;

  // Content
  content?: string;
  delta?: string;

  // Tool call
  toolCall?: {
    id?: string;
    name?: string;
    arguments?: string;
  };

  // Finish
  finishReason?: string;

  // Usage (at end)
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  // Error
  error?: {
    code: string;
    message: string;
  };

  // Raw event
  raw?: unknown;
}

/**
 * Stream Handler
 */
export type StreamHandler = (event: StreamEvent) => void | Promise<void>;

/**
 * Embedding Request
 */
export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
  user?: string;
}

/**
 * Embedding Response
 */
export interface EmbeddingResponse {
  model: string;
  embeddings: number[][];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Provider Interface
 */
export interface IProvider {
  readonly type: ProviderType;
  readonly name: string;

  // Completion
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  completeStream(request: CompletionRequest, handler: StreamHandler): Promise<CompletionResponse>;

  // Embeddings
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  // Utilities
  countTokens(text: string, model?: string): Promise<number>;
  listModels(): Promise<string[]>;

  // Health check
  healthCheck(): Promise<boolean>;
}

/**
 * Provider Factory Options
 */
export interface ProviderFactoryOptions {
  defaultProvider?: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;
}

/**
 * Multi-Model Request (for LiteLLM)
 */
export interface MultiModelRequest extends CompletionRequest {
  // Fallback models
  fallbackModels?: string[];

  // Model selection
  modelSelector?: 'fastest' | 'cheapest' | 'best' | 'round_robin';

  // Routing
  routingKey?: string;

  // Caching
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

/**
 * Model Info
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;

  // Capabilities
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;

  // Pricing (per 1M tokens)
  inputCostPer1M: number;
  outputCostPer1M: number;

  // Performance
  averageLatencyMs?: number;
  tokensPerSecond?: number;

  // Availability
  isAvailable: boolean;
  deprecatedAt?: Date;
}

/**
 * Provider Error
 */
export interface ProviderError {
  provider: ProviderType;
  code: string;
  message: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  raw?: unknown;
}

/**
 * Rate Limit Info
 */
export interface RateLimitInfo {
  provider: ProviderType;

  // Limits
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay?: number;
  tokensPerDay?: number;

  // Current usage
  requestsUsed: number;
  tokensUsed: number;

  // Reset times
  requestsResetAt: Date;
  tokensResetAt: Date;

  // Status
  isLimited: boolean;
  retryAfter?: number;
}

/**
 * Provider Metrics
 */
export interface ProviderMetrics {
  provider: ProviderType;

  // Request stats
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;

  // Latency
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;

  // Tokens
  totalPromptTokens: number;
  totalCompletionTokens: number;

  // Costs
  totalCost: number;

  // Errors
  errorsByCode: Record<string, number>;

  // Time range
  fromDate: Date;
  toDate: Date;
}
