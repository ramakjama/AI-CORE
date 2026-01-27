/**
 * Router Service Tests
 * Tests for the RouterService class - multi-model routing with fallback
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock providers
jest.mock('../src/providers/anthropic.provider', () => ({
  AnthropicProvider: jest.fn().mockImplementation(() => ({
    complete: jest.fn(),
    stream: jest.fn(),
  })),
}));

jest.mock('../src/providers/openai.provider', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    complete: jest.fn(),
    stream: jest.fn(),
  })),
}));

import { RouterService } from '../src/services/router.service';
import { AnthropicProvider } from '../src/providers/anthropic.provider';
import { OpenAIProvider } from '../src/providers/openai.provider';

describe('RouterService', () => {
  let routerService: RouterService;
  let mockAnthropicProvider: jest.Mocked<any>;
  let mockOpenAIProvider: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get mock instances
    mockAnthropicProvider = (AnthropicProvider as jest.Mock).mock.results[0]?.value || {
      complete: jest.fn(),
      stream: jest.fn(),
    };
    mockOpenAIProvider = (OpenAIProvider as jest.Mock).mock.results[0]?.value || {
      complete: jest.fn(),
      stream: jest.fn(),
    };

    routerService = new RouterService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a RouterService instance', () => {
      expect(routerService).toBeDefined();
      expect(routerService).toBeInstanceOf(RouterService);
    });

    it('should use default configuration when none provided', () => {
      const defaultRouter = new RouterService();
      expect(defaultRouter).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customRouter = new RouterService({
        defaultModel: 'gpt-4o',
        fallbackModels: ['claude-3-5-sonnet-20241022'],
        maxRetries: 5,
        costOptimization: false,
      });
      expect(customRouter).toBeDefined();
    });
  });

  // ==========================================================================
  // Complete Method Tests
  // ==========================================================================

  describe('complete', () => {
    const mockRequest = {
      model: 'claude-3-5-sonnet-20241022' as const,
      messages: [{ role: 'user' as const, content: 'Hello' }],
      maxTokens: 1000,
    };

    const mockResponse = {
      id: 'response-123',
      content: 'Hello! How can I help you?',
      model: 'claude-3-5-sonnet-20241022',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
      },
      stopReason: 'end_turn' as const,
    };

    it('should complete request with specified model', async () => {
      const router = new RouterService();
      const anthropicInstance = (router as any).anthropic;
      anthropicInstance.complete = jest.fn().mockResolvedValue(mockResponse);

      const response = await router.complete(mockRequest);

      expect(response).toBeDefined();
      expect(anthropicInstance.complete).toHaveBeenCalled();
    });

    it('should use default model when none specified', async () => {
      const router = new RouterService();
      const anthropicInstance = (router as any).anthropic;
      anthropicInstance.complete = jest.fn().mockResolvedValue(mockResponse);

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        maxTokens: 1000,
      };

      const response = await router.complete(request);

      expect(response).toBeDefined();
    });

    it('should route to OpenAI provider for GPT models', async () => {
      const router = new RouterService();
      const openaiInstance = (router as any).openai;
      openaiInstance.complete = jest.fn().mockResolvedValue({
        ...mockResponse,
        model: 'gpt-4o',
      });

      const response = await router.complete({
        ...mockRequest,
        model: 'gpt-4o',
      });

      expect(response).toBeDefined();
      expect(openaiInstance.complete).toHaveBeenCalled();
    });

    it('should throw error for unknown model', async () => {
      await expect(
        routerService.complete({
          ...mockRequest,
          model: 'unknown-model' as any,
        })
      ).rejects.toThrow('Unknown model');
    });

    it('should fallback to alternative model on failure', async () => {
      const router = new RouterService({
        defaultModel: 'claude-3-5-sonnet-20241022',
        fallbackModels: ['gpt-4o'],
      });

      const anthropicInstance = (router as any).anthropic;
      const openaiInstance = (router as any).openai;

      anthropicInstance.complete = jest.fn().mockRejectedValue(new Error('Primary failed'));
      openaiInstance.complete = jest.fn().mockResolvedValue({
        ...mockResponse,
        model: 'gpt-4o',
      });

      const response = await router.complete(mockRequest);

      expect(response).toBeDefined();
    });

    it('should throw error when all models fail', async () => {
      const router = new RouterService({
        defaultModel: 'claude-3-5-sonnet-20241022',
        fallbackModels: ['gpt-4o'],
      });

      const anthropicInstance = (router as any).anthropic;
      const openaiInstance = (router as any).openai;

      anthropicInstance.complete = jest.fn().mockRejectedValue(new Error('Anthropic failed'));
      openaiInstance.complete = jest.fn().mockRejectedValue(new Error('OpenAI failed'));

      await expect(router.complete(mockRequest)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Stream Method Tests
  // ==========================================================================

  describe('stream', () => {
    const mockRequest = {
      model: 'claude-3-5-sonnet-20241022' as const,
      messages: [{ role: 'user' as const, content: 'Hello' }],
      maxTokens: 1000,
    };

    it('should stream response from specified model', async () => {
      const router = new RouterService();
      const anthropicInstance = (router as any).anthropic;

      async function* mockStream() {
        yield { type: 'content', delta: 'Hello' };
        yield { type: 'content', delta: ' World' };
        yield { type: 'done' };
      }

      anthropicInstance.stream = jest.fn().mockReturnValue(mockStream());

      const chunks: any[] = [];
      for await (const chunk of router.stream(mockRequest)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown model in stream', async () => {
      const router = new RouterService();

      const generator = router.stream({
        ...mockRequest,
        model: 'unknown-model' as any,
      });

      await expect(generator.next()).rejects.toThrow('Unknown model');
    });

    it('should route stream to OpenAI for GPT models', async () => {
      const router = new RouterService();
      const openaiInstance = (router as any).openai;

      async function* mockStream() {
        yield { type: 'content', delta: 'Response' };
      }

      openaiInstance.stream = jest.fn().mockReturnValue(mockStream());

      const chunks: any[] = [];
      for await (const chunk of router.stream({
        ...mockRequest,
        model: 'gpt-4o',
      })) {
        chunks.push(chunk);
      }

      expect(openaiInstance.stream).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Model Selection Tests
  // ==========================================================================

  describe('selectOptimalModel', () => {
    it('should select fast model for simple tasks', () => {
      const model = routerService.selectOptimalModel('simple', 1000, false);

      expect(model).toBeDefined();
      // Should select a cost-efficient model
      expect(['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-1.5-flash']).toContain(model);
    });

    it('should select powerful model for complex tasks', () => {
      const model = routerService.selectOptimalModel('complex', 1000, false);

      expect(model).toBeDefined();
      // Should select a capable model
      expect(['claude-3-5-sonnet-20241022', 'gpt-4o', 'claude-sonnet-4-20250514']).toContain(model);
    });

    it('should select reasoning model for reasoning tasks', () => {
      const model = routerService.selectOptimalModel('reasoning', 1000, false);

      expect(model).toBeDefined();
      // Should select an advanced reasoning model
    });

    it('should select coding-optimized model for coding tasks', () => {
      const model = routerService.selectOptimalModel('coding', 1000, false);

      expect(model).toBe('claude-sonnet-4-20250514');
    });

    it('should respect context length requirements', () => {
      // Request model that can handle large context
      const model = routerService.selectOptimalModel('simple', 150000, false);

      // Should select model with sufficient context window
      expect(model).toBeDefined();
    });

    it('should filter out models without tool support when required', () => {
      const model = routerService.selectOptimalModel('simple', 1000, true);

      // Should not select o1 models (no tool support)
      expect(model).not.toBe('o1-preview');
      expect(model).not.toBe('o1-mini');
    });

    it('should return default model when no candidates match', () => {
      const router = new RouterService({
        defaultModel: 'claude-3-5-sonnet-20241022',
      });

      // Request with impossible requirements
      const model = router.selectOptimalModel('simple', 10000000, true);

      expect(model).toBe('claude-3-5-sonnet-20241022');
    });
  });

  // ==========================================================================
  // Model Configuration Tests
  // ==========================================================================

  describe('getModelConfig', () => {
    it('should return config for valid model', () => {
      const config = routerService.getModelConfig('claude-3-5-sonnet-20241022');

      expect(config).toBeDefined();
      expect(config?.provider).toBe('ANTHROPIC');
      expect(config?.supportsTools).toBe(true);
      expect(config?.contextWindow).toBeGreaterThan(0);
    });

    it('should return undefined for unknown model', () => {
      const config = routerService.getModelConfig('unknown-model' as any);

      expect(config).toBeUndefined();
    });

    it('should return correct config for OpenAI models', () => {
      const config = routerService.getModelConfig('gpt-4o');

      expect(config).toBeDefined();
      expect(config?.provider).toBe('OPENAI');
      expect(config?.supportsVision).toBe(true);
    });

    it('should return correct config for o1 models', () => {
      const config = routerService.getModelConfig('o1-preview');

      expect(config).toBeDefined();
      expect(config?.supportsTools).toBe(false);
      expect(config?.supportsStreaming).toBe(false);
    });
  });

  // ==========================================================================
  // Available Models Tests
  // ==========================================================================

  describe('getAvailableModels', () => {
    it('should return list of all available models', () => {
      const models = routerService.getAvailableModels();

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should include models from multiple providers', () => {
      const models = routerService.getAvailableModels();

      const providers = new Set(models.map(m => m.provider));

      expect(providers.has('ANTHROPIC')).toBe(true);
      expect(providers.has('OPENAI')).toBe(true);
    });

    it('should include model costs', () => {
      const models = routerService.getAvailableModels();

      for (const model of models) {
        expect(model.costPer1kInputTokens).toBeGreaterThanOrEqual(0);
        expect(model.costPer1kOutputTokens).toBeGreaterThanOrEqual(0);
      }
    });

    it('should include capability flags', () => {
      const models = routerService.getAvailableModels();

      for (const model of models) {
        expect(typeof model.supportsTools).toBe('boolean');
        expect(typeof model.supportsVision).toBe('boolean');
        expect(typeof model.supportsStreaming).toBe('boolean');
      }
    });
  });

  // ==========================================================================
  // Cost Optimization Tests
  // ==========================================================================

  describe('cost optimization', () => {
    it('should prefer cheaper models when cost optimization is enabled', () => {
      const router = new RouterService({
        costOptimization: true,
      });

      const model = router.selectOptimalModel('simple', 1000, false);

      // Should select cost-effective model
      const config = router.getModelConfig(model);
      expect(config?.costPer1kInputTokens).toBeLessThan(0.01);
    });

    it('should not prioritize cost when optimization is disabled', () => {
      const router = new RouterService({
        costOptimization: false,
      });

      const model = router.selectOptimalModel('simple', 1000, false);

      // Should still return a valid model
      expect(model).toBeDefined();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should handle provider initialization errors', () => {
      // This should not throw during construction
      expect(() => new RouterService()).not.toThrow();
    });

    it('should handle malformed requests', async () => {
      await expect(
        routerService.complete({
          messages: [],
          model: 'claude-3-5-sonnet-20241022',
        } as any)
      ).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const router = new RouterService();
      const anthropicInstance = (router as any).anthropic;

      anthropicInstance.complete = jest.fn().mockRejectedValue(
        new Error('Network error: Connection refused')
      );

      await expect(
        router.complete({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      ).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      const router = new RouterService({
        fallbackModels: ['gpt-4o'],
      });

      const anthropicInstance = (router as any).anthropic;
      const openaiInstance = (router as any).openai;

      anthropicInstance.complete = jest.fn().mockRejectedValue(
        new Error('Rate limit exceeded')
      );
      openaiInstance.complete = jest.fn().mockResolvedValue({
        content: 'Fallback response',
      });

      const response = await router.complete({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(response).toBeDefined();
    });
  });
});
