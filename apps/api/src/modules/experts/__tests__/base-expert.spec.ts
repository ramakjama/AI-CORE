/**
 * Base Expert Unit Tests
 */

import { BaseExpert } from '../base/base-expert';
import { ExpertConfig, ExpertContext, ExpertResponse, AnalysisResponse, SuggestionResponse, ExecutionResponse } from '../types';
import { AnthropicService } from '../services/anthropic.service';
import { CacheService } from '../services/cache.service';

// Concrete implementation for testing
class TestExpert extends BaseExpert {
  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    const result = await this.callAI('Analyze this', context);

    return this.createSuccessResponse({
      summary: result,
      insights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1'],
    });
  }

  async suggest(context: ExpertContext): Promise<ExpertResponse<SuggestionResponse>> {
    return this.createSuccessResponse({
      suggestions: [
        {
          title: 'Test Suggestion',
          description: 'A test suggestion',
          priority: 'high',
          impact: 'high',
          effort: 'low',
        },
      ],
      rationale: 'This is a test',
    });
  }

  async execute(action: string, params: any, context: ExpertContext): Promise<ExpertResponse<ExecutionResponse>> {
    return this.createSuccessResponse({
      action,
      status: 'success',
      result: params,
      steps: [
        {
          step: 'Step 1',
          status: 'completed',
          output: 'Success',
        },
      ],
      duration: 100,
    });
  }
}

describe('BaseExpert', () => {
  let expert: TestExpert;
  let mockAnthropicService: jest.Mocked<AnthropicService>;
  let mockCacheService: jest.Mocked<CacheService>;

  const testConfig: ExpertConfig = {
    name: 'test-expert',
    displayName: 'Test Expert',
    description: 'A test expert',
    model: 'sonnet',
    systemPrompt: 'You are a test expert',
    enableCache: true,
    cacheTTL: 3600,
    rateLimit: 60,
  };

  const testContext: ExpertContext = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
    request: {
      type: 'analysis',
      payload: { test: 'data' },
    },
    environment: {
      name: 'test',
    },
  };

  beforeEach(() => {
    mockAnthropicService = {
      sendMessage: jest.fn(),
      sendMessageWithRetry: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    } as any;

    expert = new TestExpert(testConfig, mockAnthropicService, mockCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize expert with configuration', () => {
      expect(expert.getName()).toBe('test-expert');
      expect(expert.getDisplayName()).toBe('Test Expert');
      expect(expert.getDescription()).toBe('A test expert');
    });
  });

  describe('process', () => {
    it('should process analyze request', async () => {
      mockAnthropicService.sendMessageWithRetry.mockResolvedValue({
        id: 'msg_123',
        content: 'Analysis result',
        model: 'claude-sonnet-4-5-20250929',
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        cost: 0.01,
      });

      mockCacheService.get.mockResolvedValue(null);

      const result = await expert.process('analyze', testContext);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata.expertName).toBe('test-expert');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached response if available', async () => {
      const cachedResponse: ExpertResponse = {
        success: true,
        data: { summary: 'Cached', insights: [], recommendations: [] },
        metadata: {
          expertName: 'test-expert',
          model: 'sonnet',
          timestamp: new Date(),
          responseTime: 100,
          cached: true,
        },
      };

      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await expert.process('analyze', testContext);

      expect(result.success).toBe(true);
      expect(result.metadata.cached).toBe(true);
      expect(mockAnthropicService.sendMessageWithRetry).not.toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
      // Exhaust rate limit
      const rateLimiter = (expert as any).rateLimiter;
      rateLimiter.tokens = 0;

      await expect(expert.process('analyze', testContext)).resolves.toMatchObject({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });
    });

    it('should handle errors gracefully', async () => {
      mockAnthropicService.sendMessageWithRetry.mockRejectedValue(
        new Error('API Error'),
      );

      mockCacheService.get.mockResolvedValue(null);

      const result = await expert.process('analyze', testContext);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('callAI', () => {
    it('should call Anthropic service with correct parameters', async () => {
      mockAnthropicService.sendMessageWithRetry.mockResolvedValue({
        id: 'msg_123',
        content: 'AI response',
        model: 'claude-sonnet-4-5-20250929',
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        cost: 0.01,
      });

      const result = await (expert as any).callAI('Test prompt', testContext);

      expect(result).toBe('AI response');
      expect(mockAnthropicService.sendMessageWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'sonnet',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Test prompt',
            }),
          ]),
        }),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should include conversation history if available', async () => {
      const contextWithHistory: ExpertContext = {
        ...testContext,
        session: {
          id: 'session-123',
          startedAt: new Date(),
          conversationHistory: [
            { role: 'user', content: 'Previous message', timestamp: new Date() },
            { role: 'assistant', content: 'Previous response', timestamp: new Date() },
          ],
        },
      };

      mockAnthropicService.sendMessageWithRetry.mockResolvedValue({
        id: 'msg_123',
        content: 'AI response',
        model: 'claude-sonnet-4-5-20250929',
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        cost: 0.01,
      });

      await (expert as any).callAI('Test prompt', contextWithHistory);

      expect(mockAnthropicService.sendMessageWithRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'Previous message' },
            { role: 'assistant', content: 'Previous response' },
            { role: 'user', content: 'Test prompt' },
          ]),
        }),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('buildContextString', () => {
    it('should build context string from context object', () => {
      const contextString = (expert as any).buildContextString(testContext);

      expect(contextString).toContain('User ID: user-123');
      expect(contextString).toContain('Request Type: analysis');
      expect(contextString).toContain('Environment: test');
    });

    it('should include company information if available', () => {
      const contextWithCompany: ExpertContext = {
        ...testContext,
        company: {
          id: 'company-123',
          name: 'Test Company',
          industry: 'Technology',
        },
      };

      const contextString = (expert as any).buildContextString(contextWithCompany);

      expect(contextString).toContain('Company: Test Company');
      expect(contextString).toContain('Industry: Technology');
    });
  });

  describe('clearCache', () => {
    it('should clear cache for expert', async () => {
      mockCacheService.deletePattern.mockResolvedValue(5);

      await expert.clearCache();

      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(
        expect.stringContaining('test-expert'),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when all services are healthy', async () => {
      mockAnthropicService.healthCheck.mockResolvedValue(true);
      mockCacheService.healthCheck.mockResolvedValue(true);

      const healthy = await expert.healthCheck();

      expect(healthy).toBe(true);
    });

    it('should return false when any service is unhealthy', async () => {
      mockAnthropicService.healthCheck.mockResolvedValue(false);
      mockCacheService.healthCheck.mockResolvedValue(true);

      const healthy = await expert.healthCheck();

      expect(healthy).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return expert configuration', () => {
      const config = expert.getConfig();

      expect(config.name).toBe('test-expert');
      expect(config.displayName).toBe('Test Expert');
      expect(config.model).toBe('sonnet');
    });
  });

  describe('getTags', () => {
    it('should return expert tags', () => {
      const expertWithTags = new TestExpert(
        { ...testConfig, tags: ['test', 'demo'] },
        mockAnthropicService,
        mockCacheService,
      );

      const tags = expertWithTags.getTags();

      expect(tags).toEqual(['test', 'demo']);
    });
  });
});
