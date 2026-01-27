// AI-LLM Types - Multi-model LLM Integration

export type LLMProvider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE' | 'MISTRAL' | 'LOCAL';

export type ModelId =
  // Anthropic Claude
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  // OpenAI GPT
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'o1-preview'
  | 'o1-mini'
  // Google Gemini
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export interface ModelConfig {
  id: ModelId;
  provider: LLMProvider;
  maxTokens: number;
  contextWindow: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: ImageSource;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  toolUseId?: string;
  content?: string;
}

export interface ImageSource {
  type: 'base64' | 'url';
  mediaType: string;
  data?: string;
  url?: string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface CompletionRequest {
  model: ModelId;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  tools?: Tool[];
  stream?: boolean;
  systemPrompt?: string;
}

export interface CompletionResponse {
  id: string;
  model: ModelId;
  content: string;
  toolCalls?: ToolCall[];
  usage: TokenUsage;
  stopReason: 'end_turn' | 'max_tokens' | 'tool_use' | 'stop_sequence';
  latencyMs: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'done';
  text?: string;
  toolCall?: ToolCall;
}

export interface EmbeddingRequest {
  model: 'text-embedding-3-large' | 'text-embedding-3-small' | 'text-embedding-ada-002';
  input: string | string[];
  dimensions?: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: { totalTokens: number };
}

export interface ConversationContext {
  conversationId: string;
  messages: Message[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model: ModelId;
  tools: Tool[];
  temperature?: number;
  maxTurns?: number;
}
