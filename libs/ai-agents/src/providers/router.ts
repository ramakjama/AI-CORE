// Multi-Model Router - Intelligent model selection based on task
import { ModelConfig, ChatCompletionRequest, ChatCompletionResponse } from '../types';

interface ModelCapabilities {
  maxTokens: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsTools: boolean;
  supportsVision: boolean;
  latencyMs: number;
  strengths: string[];
}

const MODEL_REGISTRY: Record<string, ModelCapabilities> = {
  'gpt-4o': {
    maxTokens: 128000,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    supportsTools: true,
    supportsVision: true,
    latencyMs: 500,
    strengths: ['general', 'coding', 'analysis', 'vision']
  },
  'gpt-4-turbo': {
    maxTokens: 128000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
    supportsTools: true,
    supportsVision: true,
    latencyMs: 800,
    strengths: ['complex-reasoning', 'long-context']
  },
  'claude-3-5-sonnet': {
    maxTokens: 200000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    supportsTools: true,
    supportsVision: true,
    latencyMs: 400,
    strengths: ['coding', 'analysis', 'writing', 'safety']
  },
  'claude-3-opus': {
    maxTokens: 200000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    supportsTools: true,
    supportsVision: true,
    latencyMs: 1200,
    strengths: ['complex-reasoning', 'nuanced-writing']
  },
  'gemini-1.5-pro': {
    maxTokens: 1000000,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
    supportsTools: true,
    supportsVision: true,
    latencyMs: 600,
    strengths: ['long-context', 'multimodal', 'cost-effective']
  }
};

export type TaskType = 'chat' | 'coding' | 'analysis' | 'writing' | 'vision' | 'complex-reasoning';

export function selectOptimalModel(
  taskType: TaskType,
  contextLength: number,
  requiresTools: boolean = false,
  maxCost?: number
): string {
  const candidates = Object.entries(MODEL_REGISTRY)
    .filter(([_, caps]) => {
      if (contextLength > caps.maxTokens) return false;
      if (requiresTools && !caps.supportsTools) return false;
      return true;
    })
    .sort((a, b) => {
      // Score based on task match and cost
      const scoreA = a[1].strengths.includes(taskType) ? 10 : 0;
      const scoreB = b[1].strengths.includes(taskType) ? 10 : 0;
      const costA = a[1].costPer1kInput + a[1].costPer1kOutput;
      const costB = b[1].costPer1kInput + b[1].costPer1kOutput;
      return (scoreB - costB) - (scoreA - costA);
    });

  return candidates[0]?.[0] || 'gpt-4o';
}

export class ModelRouter {
  private providers: Map<string, any> = new Map();
  private fallbackOrder = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'];

  registerProvider(name: string, provider: any): void {
    this.providers.set(name, provider);
  }

  async route(request: ChatCompletionRequest, config: ModelConfig): Promise<ChatCompletionResponse> {
    const provider = this.providers.get(config.provider);
    
    if (!provider) {
      throw new Error(`Provider ${config.provider} not registered`);
    }

    try {
      return await provider.complete(request);
    } catch (error) {
      // Fallback to next provider
      for (const fallback of this.fallbackOrder) {
        const fallbackProvider = this.providers.get(this.getProviderForModel(fallback));
        if (fallbackProvider) {
          try {
            return await fallbackProvider.complete({ ...request, model: fallback });
          } catch {
            continue;
          }
        }
      }
      throw error;
    }
  }

  private getProviderForModel(model: string): string {
    if (model.startsWith('gpt')) return 'OPENAI';
    if (model.startsWith('claude')) return 'ANTHROPIC';
    if (model.startsWith('gemini')) return 'GOOGLE';
    return 'OPENAI';
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const caps = MODEL_REGISTRY[model];
    if (!caps) return 0;
    return (inputTokens / 1000) * caps.costPer1kInput + (outputTokens / 1000) * caps.costPer1kOutput;
  }
}

export const modelRouter = new ModelRouter();
