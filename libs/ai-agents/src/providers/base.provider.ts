/**
 * Base Provider
 * Abstract base class for all LLM providers
 */

import { EventEmitter } from 'eventemitter3';
import pino from 'pino';
import type {
  IProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamEvent,
  StreamHandler,
  ProviderError,
  RateLimitInfo,
  ProviderType,
  StreamEventType,
} from '../types';

export abstract class BaseProvider extends EventEmitter implements IProvider {
  protected config: ProviderConfig;
  protected logger: pino.Logger;
  protected rateLimitInfo?: RateLimitInfo;

  abstract readonly type: ProviderType;
  abstract readonly name: string;

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
    this.logger = pino({
      name: `provider:${config.type}`,
      level: config.debug ? 'debug' : 'info',
    });
  }

  /**
   * Execute a completion request
   */
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Execute a streaming completion request
   */
  abstract completeStream(
    request: CompletionRequest,
    handler: StreamHandler
  ): Promise<CompletionResponse>;

  /**
   * Generate embeddings
   */
  abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * Count tokens in text
   */
  abstract countTokens(text: string, model?: string): Promise<number>;

  /**
   * List available models
   */
  abstract listModels(): Promise<string[]>;

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a provider error
   */
  protected createError(
    code: string,
    message: string,
    statusCode?: number,
    retryable = false,
    raw?: unknown
  ): ProviderError {
    return {
      provider: this.type,
      code,
      message,
      statusCode,
      retryable,
      raw,
    };
  }

  /**
   * Create a stream event
   */
  protected createStreamEvent(
    type: StreamEventType,
    data: Partial<StreamEvent> = {}
  ): StreamEvent {
    return {
      type,
      ...data,
    };
  }

  /**
   * Handle rate limiting
   */
  protected handleRateLimit(headers: Record<string, string>): void {
    const requestsRemaining = parseInt(headers['x-ratelimit-remaining-requests'] || '0');
    const tokensRemaining = parseInt(headers['x-ratelimit-remaining-tokens'] || '0');
    const requestsReset = headers['x-ratelimit-reset-requests'];
    const tokensReset = headers['x-ratelimit-reset-tokens'];

    this.rateLimitInfo = {
      provider: this.type,
      requestsPerMinute: parseInt(headers['x-ratelimit-limit-requests'] || '0'),
      tokensPerMinute: parseInt(headers['x-ratelimit-limit-tokens'] || '0'),
      requestsUsed: parseInt(headers['x-ratelimit-limit-requests'] || '0') - requestsRemaining,
      tokensUsed: parseInt(headers['x-ratelimit-limit-tokens'] || '0') - tokensRemaining,
      requestsResetAt: requestsReset ? new Date(requestsReset) : new Date(),
      tokensResetAt: tokensReset ? new Date(tokensReset) : new Date(),
      isLimited: requestsRemaining === 0 || tokensRemaining === 0,
    };
  }

  /**
   * Retry with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        const providerError = error as ProviderError;
        if (providerError.retryable === false) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;

        // Check for retry-after header
        if (providerError.retryAfter) {
          await this.sleep(providerError.retryAfter * 1000);
        } else {
          await this.sleep(delay);
        }

        this.logger.warn(
          { attempt, maxRetries, delay },
          'Retrying request after error'
        );
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  /**
   * Validate request
   */
  protected validateRequest(request: CompletionRequest): void {
    if (!request.model) {
      throw this.createError('INVALID_REQUEST', 'Model is required');
    }

    if (!request.messages || request.messages.length === 0) {
      throw this.createError('INVALID_REQUEST', 'Messages are required');
    }
  }

  /**
   * Log request/response
   */
  protected logRequest(
    request: CompletionRequest,
    response: CompletionResponse,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;
    this.logger.debug(
      {
        model: request.model,
        messages: request.messages.length,
        usage: response.usage,
        duration,
      },
      'Completion request completed'
    );
  }
}

/**
 * Provider Factory Interface
 */
export interface ProviderFactory {
  create(config: ProviderConfig): IProvider;
}
