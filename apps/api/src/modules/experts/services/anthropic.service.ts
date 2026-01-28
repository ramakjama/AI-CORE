/**
 * Anthropic Service
 * Service for integrating with Anthropic's Claude API
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  AnthropicConfig,
  defaultAnthropicConfig,
  validateAnthropicConfig,
  getModelName,
  calculateCost,
} from '../config/anthropic.config';
import { LoggerService } from '../config/logger.config';
import { ErrorHandler, TimeoutError, APIError } from '../utils/error-handler';

export interface MessageRequest {
  model: 'opus' | 'sonnet' | 'haiku';
  systemPrompt?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  metadata?: Record<string, any>;
  timeout?: number;
}

export interface MessageResponse {
  id: string;
  content: string;
  model: string;
  stopReason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class AnthropicService implements OnModuleInit {
  private client!: Anthropic;
  private config: AnthropicConfig;
  private logger: LoggerService;
  private costTracker: Map<string, number> = new Map();

  constructor(config?: Partial<AnthropicConfig>) {
    this.config = { ...defaultAnthropicConfig, ...config };
    validateAnthropicConfig(this.config);
    this.logger = new LoggerService('AnthropicService');
  }

  async onModuleInit() {
    this.initialize();
  }

  /**
   * Initialize Anthropic client
   */
  initialize(): void {
    try {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
        maxRetries: this.config.maxRetries,
        timeout: this.config.timeout,
      });

      this.logger.log('Anthropic client initialized');
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to initialize Anthropic client', err.stack, {
        error: err.message,
      });
      throw new APIError('Failed to initialize Anthropic client', 500);
    }
  }

  /**
   * Send a message to Claude
   */
  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    const startTime = Date.now();
    const modelName = getModelName(request.model, this.config);

    try {
      this.logger.debug('Sending message to Claude', {
        model: request.model,
        modelName,
        messageCount: request.messages.length,
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = request.timeout || this.config.timeout || 60000;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await this.client.messages.create(
          {
            model: modelName,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature ?? 0.7,
            system: request.systemPrompt,
            messages: request.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            stop_sequences: request.stopSequences,
            metadata: request.metadata,
          },
          {
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        // Extract text content
        const textContent = response.content
          .filter(block => block.type === 'text')
          .map(block => (block as any).text)
          .join('\n');

        // Calculate cost
        const cost = calculateCost(
          request.model,
          response.usage.input_tokens,
          response.usage.output_tokens,
          this.config,
        );

        // Track cost
        this.trackCost(request.model, cost);

        const duration = Date.now() - startTime;

        this.logger.log('Message sent successfully', {
          model: request.model,
          duration,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost: cost.toFixed(4),
        });

        return {
          id: response.id,
          content: textContent,
          model: response.model,
          stopReason: response.stop_reason as any,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          },
          cost,
          metadata: request.metadata,
        };

      } catch (error) {
        clearTimeout(timeoutId);

        const err = error as Error;
        if (err.name === 'AbortError') {
          throw new TimeoutError('anthropic', timeout);
        }

        throw err;
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      this.logger.error('Failed to send message', err.stack, {
        model: request.model,
        duration,
        error: err.message,
      });

      throw ErrorHandler.handleError(err, 'anthropic');
    }
  }

  /**
   * Send a message with retry logic
   */
  async sendMessageWithRetry(
    request: MessageRequest,
    maxAttempts: number = 3,
    backoffMs: number = 1000,
    backoffMultiplier: number = 2,
  ): Promise<MessageResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.sendMessage(request);

      } catch (error) {
        const err = error as Error;
        lastError = err;

        const expertError = ErrorHandler.handleError(err, 'anthropic');

        if (!expertError.isRetryable || attempt === maxAttempts - 1) {
          throw expertError;
        }

        const delay = ErrorHandler.getRetryDelay(
          expertError,
          attempt,
          backoffMs,
          backoffMultiplier,
        );

        this.logger.warn(`Retrying after ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`, {
          error: expertError.message,
          attempt: attempt + 1,
        });

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Stream a message (for future implementation)
   */
  async streamMessage(request: MessageRequest): Promise<AsyncIterable<string>> {
    const modelName = getModelName(request.model, this.config);

    try {
      const stream = await this.client.messages.stream({
        model: modelName,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stop_sequences: request.stopSequences,
        metadata: request.metadata,
      });

      // Return async generator
      return (async function* () {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && (chunk as any).delta?.text) {
            yield (chunk as any).delta.text;
          }
        }
      })();

    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to stream message', err.stack, {
        model: request.model,
        error: err.message,
      });

      throw ErrorHandler.handleError(err, 'anthropic');
    }
  }

  /**
   * Track cost per model
   */
  private trackCost(model: string, cost: number): void {
    const current = this.costTracker.get(model) || 0;
    this.costTracker.set(model, current + cost);
  }

  /**
   * Get cost statistics
   */
  getCostStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.costTracker.forEach((cost, model) => {
      stats[model] = parseFloat(cost.toFixed(4));
    });

    stats['total'] = parseFloat(
      Array.from(this.costTracker.values())
        .reduce((sum, cost) => sum + cost, 0)
        .toFixed(4),
    );

    return stats;
  }

  /**
   * Reset cost tracker
   */
  resetCostTracker(): void {
    this.costTracker.clear();
    this.logger.log('Cost tracker reset');
  }

  /**
   * Get daily cost limit alert
   */
  checkDailyBudget(dailyBudget: number): {
    isExceeded: boolean;
    currentCost: number;
    remaining: number;
  } {
    const stats = this.getCostStats();
    const currentCost = stats['total'] || 0;

    return {
      isExceeded: currentCost >= dailyBudget,
      currentCost,
      remaining: Math.max(0, dailyBudget - currentCost),
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple check - verify client is initialized
      return !!this.client;
    } catch (error) {
      return false;
    }
  }
}
