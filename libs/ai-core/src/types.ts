// AI-CORE AI Types

import { type AIMessage, type AIModelConfig } from '@ai-core/types';

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  organization?: string;
}

export interface ChatCompletionRequest {
  messages: AIMessage[];
  config?: Partial<AIModelConfig>;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  message: AIMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface StreamChunk {
  id: string;
  delta: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
}

export interface EmbeddingRequest {
  input: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

// Provider interface
export interface AIProviderInterface {
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  chatStream(
    request: ChatCompletionRequest
  ): AsyncIterable<StreamChunk>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}
