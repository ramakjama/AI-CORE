// AI-LLM Router Service - Multi-model routing with fallback

import { AnthropicProvider } from '../providers/anthropic.provider';
import { OpenAIProvider } from '../providers/openai.provider';
import type {
  CompletionRequest,
  CompletionResponse,
  ModelId,
  ModelConfig,
  LLMProvider,
  StreamChunk,
} from '../types';

const MODEL_REGISTRY: Record<ModelId, ModelConfig> = {
  // Anthropic Claude
  'claude-opus-4-5-20251101': {
    id: 'claude-opus-4-5-20251101',
    provider: 'ANTHROPIC',
    maxTokens: 32768,
    contextWindow: 200000,
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-sonnet-4-20250514': {
    id: 'claude-sonnet-4-20250514',
    provider: 'ANTHROPIC',
    maxTokens: 64000,
    contextWindow: 200000,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'ANTHROPIC',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'ANTHROPIC',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kInputTokens: 0.0008,
    costPer1kOutputTokens: 0.004,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  // OpenAI GPT
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'OPENAI',
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kInputTokens: 0.005,
    costPer1kOutputTokens: 0.015,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'OPENAI',
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.0006,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    provider: 'OPENAI',
    maxTokens: 4096,
    contextWindow: 128000,
    costPer1kInputTokens: 0.01,
    costPer1kOutputTokens: 0.03,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'o1-preview': {
    id: 'o1-preview',
    provider: 'OPENAI',
    maxTokens: 32768,
    contextWindow: 128000,
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.06,
    supportsTools: false,
    supportsVision: false,
    supportsStreaming: false,
  },
  'o1-mini': {
    id: 'o1-mini',
    provider: 'OPENAI',
    maxTokens: 65536,
    contextWindow: 128000,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.012,
    supportsTools: false,
    supportsVision: false,
    supportsStreaming: false,
  },
  // Google Gemini
  'gemini-2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    provider: 'GOOGLE',
    maxTokens: 8192,
    contextWindow: 1000000,
    costPer1kInputTokens: 0.00025,
    costPer1kOutputTokens: 0.001,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    provider: 'GOOGLE',
    maxTokens: 8192,
    contextWindow: 2000000,
    costPer1kInputTokens: 0.00125,
    costPer1kOutputTokens: 0.005,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'GOOGLE',
    maxTokens: 8192,
    contextWindow: 1000000,
    costPer1kInputTokens: 0.000075,
    costPer1kOutputTokens: 0.0003,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
};

export interface RouterConfig {
  defaultModel: ModelId;
  fallbackModels: ModelId[];
  maxRetries: number;
  costOptimization: boolean;
  preferredProvider?: LLMProvider;
}

export class RouterService {
  private anthropic: AnthropicProvider;
  private openai: OpenAIProvider;
  private config: RouterConfig;

  constructor(config?: Partial<RouterConfig>) {
    this.anthropic = new AnthropicProvider();
    this.openai = new OpenAIProvider();
    this.config = {
      defaultModel: 'claude-3-5-sonnet-20241022',
      fallbackModels: ['gpt-4o', 'claude-3-5-haiku-20241022'],
      maxRetries: 3,
      costOptimization: true,
      ...config,
    };
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const model = request.model ?? this.config.defaultModel;
    const modelConfig = MODEL_REGISTRY[model];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    const modelsToTry = [model, ...this.config.fallbackModels.filter(m => m !== model)];

    let lastError: Error | null = null;

    for (const modelId of modelsToTry) {
      try {
        return await this.routeToProvider({ ...request, model: modelId });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Model ${modelId} failed, trying fallback...`, error);
      }
    }

    throw lastError ?? new Error('All models failed');
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const model = request.model ?? this.config.defaultModel;
    const modelConfig = MODEL_REGISTRY[model];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${model}`);
    }

    yield* this.routeStreamToProvider(request);
  }

  private async routeToProvider(request: CompletionRequest): Promise<CompletionResponse> {
    const modelConfig = MODEL_REGISTRY[request.model];

    switch (modelConfig?.provider) {
      case 'ANTHROPIC':
        return this.anthropic.complete(request);
      case 'OPENAI':
        return this.openai.complete(request);
      case 'GOOGLE':
        // TODO: Implement Google provider
        throw new Error('Google provider not yet implemented');
      default:
        throw new Error(`Unknown provider for model: ${request.model}`);
    }
  }

  private async *routeStreamToProvider(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const modelConfig = MODEL_REGISTRY[request.model];

    switch (modelConfig?.provider) {
      case 'ANTHROPIC':
        yield* this.anthropic.stream(request);
        break;
      case 'OPENAI':
        yield* this.openai.stream(request);
        break;
      default:
        throw new Error(`Streaming not supported for model: ${request.model}`);
    }
  }

  selectOptimalModel(
    taskType: 'simple' | 'complex' | 'coding' | 'reasoning',
    contextLength: number,
    requiresTools: boolean,
    budgetPerRequest?: number
  ): ModelId {
    const candidates = Object.values(MODEL_REGISTRY).filter(model => {
      if (contextLength > model.contextWindow) return false;
      if (requiresTools && !model.supportsTools) return false;
      return true;
    });

    if (candidates.length === 0) {
      return this.config.defaultModel;
    }

    // Sort by cost if budget optimization is enabled
    if (this.config.costOptimization) {
      candidates.sort((a, b) => a.costPer1kInputTokens - b.costPer1kInputTokens);
    }

    // Select based on task type
    switch (taskType) {
      case 'reasoning':
        return candidates.find(m => m.id.includes('o1') || m.id.includes('opus'))?.id ?? 'claude-opus-4-5-20251101';
      case 'complex':
        return candidates.find(m => m.id.includes('sonnet') || m.id.includes('gpt-4o'))?.id ?? 'claude-3-5-sonnet-20241022';
      case 'coding':
        return 'claude-sonnet-4-20250514';
      case 'simple':
      default:
        return candidates.find(m => m.id.includes('haiku') || m.id.includes('mini') || m.id.includes('flash'))?.id ?? 'gpt-4o-mini';
    }
  }

  getModelConfig(modelId: ModelId): ModelConfig | undefined {
    return MODEL_REGISTRY[modelId];
  }

  getAvailableModels(): ModelConfig[] {
    return Object.values(MODEL_REGISTRY);
  }
}

export const routerService = new RouterService();
