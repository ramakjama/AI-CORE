/**
 * Anthropic Service Unit Tests
 */

import { AnthropicService, MessageRequest } from '../services/anthropic.service';
import { AnthropicConfig } from '../config/anthropic.config';

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('AnthropicService', () => {
  let anthropicService: AnthropicService;
  let mockClient: any;

  const mockConfig: Partial<AnthropicConfig> = {
    apiKey: 'test-api-key',
    timeout: 30000,
    maxRetries: 3,
    models: {
      opus: 'claude-opus-4-5-20251101',
      sonnet: 'claude-sonnet-4-5-20250929',
      haiku: 'claude-3-5-haiku-20241022',
    },
    costs: {
      opus: { input: 15.0, output: 75.0 },
      sonnet: { input: 3.0, output: 15.0 },
      haiku: { input: 0.8, output: 4.0 },
    },
  };

  beforeEach(() => {
    mockClient = {
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
      },
    };

    anthropicService = new AnthropicService(mockConfig);
    (anthropicService as any).client = mockClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: 'Test response' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const request: MessageRequest = {
        model: 'sonnet',
        messages: [{ role: 'user', content: 'Test message' }],
        systemPrompt: 'You are a helpful assistant',
      };

      const result = await anthropicService.sendMessage(request);

      expect(result).toMatchObject({
        id: 'msg_123',
        content: 'Test response',
        model: 'claude-sonnet-4-5-20250929',
        stopReason: 'end_turn',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        },
      });

      expect(result.cost).toBeGreaterThan(0);
    });

    it('should handle timeout', async () => {
      jest.useFakeTimers();

      mockClient.messages.create.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 60000)),
      );

      const request: MessageRequest = {
        model: 'sonnet',
        messages: [{ role: 'user', content: 'Test message' }],
        timeout: 1000,
      };

      const promise = anthropicService.sendMessage(request);

      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow();

      jest.useRealTimers();
    });

    it('should track costs', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: 'Test response' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const request: MessageRequest = {
        model: 'sonnet',
        messages: [{ role: 'user', content: 'Test message' }],
      };

      await anthropicService.sendMessage(request);

      const stats = anthropicService.getCostStats();

      expect(stats.sonnet).toBeGreaterThan(0);
      expect(stats.total).toBe(stats.sonnet);
    });
  });

  describe('sendMessageWithRetry', () => {
    it('should retry on retryable error', async () => {
      const mockError = {
        status: 500,
        error: { type: 'server_error' },
      };

      const mockResponse = {
        id: 'msg_123',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: 'Test response' }],
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      mockClient.messages.create
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockResponse);

      const request: MessageRequest = {
        model: 'sonnet',
        messages: [{ role: 'user', content: 'Test message' }],
      };

      const result = await anthropicService.sendMessageWithRetry(request, 3, 100, 2);

      expect(mockClient.messages.create).toHaveBeenCalledTimes(3);
      expect(result.content).toBe('Test response');
    });

    it('should not retry on non-retryable error', async () => {
      const mockError = {
        status: 400,
        error: { type: 'invalid_request_error' },
      };

      mockClient.messages.create.mockRejectedValue(mockError);

      const request: MessageRequest = {
        model: 'sonnet',
        messages: [{ role: 'user', content: 'Test message' }],
      };

      await expect(
        anthropicService.sendMessageWithRetry(request, 3, 100, 2),
      ).rejects.toThrow();

      expect(mockClient.messages.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCostStats', () => {
    it('should return cost statistics', () => {
      (anthropicService as any).costTracker.set('sonnet', 0.123);
      (anthropicService as any).costTracker.set('haiku', 0.045);

      const stats = anthropicService.getCostStats();

      expect(stats).toMatchObject({
        sonnet: 0.123,
        haiku: 0.045,
        total: 0.168,
      });
    });
  });

  describe('checkDailyBudget', () => {
    it('should check if daily budget is exceeded', () => {
      (anthropicService as any).costTracker.set('sonnet', 5.0);
      (anthropicService as any).costTracker.set('haiku', 3.0);

      const result = anthropicService.checkDailyBudget(10.0);

      expect(result).toMatchObject({
        isExceeded: false,
        currentCost: 8.0,
        remaining: 2.0,
      });
    });

    it('should detect when budget is exceeded', () => {
      (anthropicService as any).costTracker.set('sonnet', 12.0);

      const result = anthropicService.checkDailyBudget(10.0);

      expect(result).toMatchObject({
        isExceeded: true,
        currentCost: 12.0,
        remaining: 0,
      });
    });
  });

  describe('resetCostTracker', () => {
    it('should reset cost tracker', () => {
      (anthropicService as any).costTracker.set('sonnet', 5.0);

      anthropicService.resetCostTracker();

      const stats = anthropicService.getCostStats();

      expect(stats.total).toBe(0);
    });
  });
});
