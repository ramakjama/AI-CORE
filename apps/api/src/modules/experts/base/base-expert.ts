/**
 * Base Expert Abstract Class
 * Foundation for all AI experts in the system
 */

import {
  ExpertConfig,
  ExpertContext,
  ExpertResponse,
  AnalysisResponse,
  SuggestionResponse,
  ExecutionResponse,
  DEFAULT_EXPERT_CONFIG,
} from '../types';
import { AnthropicService, MessageRequest } from '../services/anthropic.service';
import { CacheService } from '../services/cache.service';
import { LoggerService } from '../config/logger.config';
import { ErrorHandler } from '../utils/error-handler';
import { CacheKeyGenerator } from '../utils/cache-key-generator';
import { RateLimiter } from '../utils/rate-limiter';

export abstract class BaseExpert {
  protected readonly config: ExpertConfig;
  protected readonly anthropicService: AnthropicService;
  protected readonly cacheService: CacheService;
  protected readonly logger: LoggerService;
  protected readonly rateLimiter: RateLimiter;

  constructor(
    config: ExpertConfig,
    anthropicService: AnthropicService,
    cacheService: CacheService,
  ) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_EXPERT_CONFIG,
      ...config,
    };

    this.anthropicService = anthropicService;
    this.cacheService = cacheService;
    this.logger = new LoggerService(`Expert:${this.config.name}`);

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: this.config.rateLimit || 60,
      interval: 60000, // 1 minute
      maxTokens: this.config.rateLimit || 60,
    });

    this.logger.log('Expert initialized', {
      name: this.config.name,
      model: this.config.model,
      cacheEnabled: this.config.enableCache,
    });
  }

  /**
   * Abstract methods that must be implemented by concrete experts
   */
  abstract analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>>;
  abstract suggest(context: ExpertContext): Promise<ExpertResponse<SuggestionResponse>>;
  abstract execute(action: string, params: any, context: ExpertContext): Promise<ExpertResponse<ExecutionResponse>>;

  /**
   * Main entry point for expert requests
   */
  async process(
    method: 'analyze' | 'suggest' | 'execute',
    context: ExpertContext,
    action?: string,
    params?: any,
  ): Promise<ExpertResponse> {
    const startTime = Date.now();

    try {
      // Check rate limit
      await this.checkRateLimit();

      // Generate cache key
      const cacheKey = this.generateCacheKey(method, context, { action, params });

      // Try to get from cache
      if (this.config.enableCache) {
        const cached = await this.getFromCache<ExpertResponse>(cacheKey);
        if (cached) {
          this.logger.debug('Returning cached response', { method, cacheKey });
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cached: true,
              cacheKey,
              responseTime: Date.now() - startTime,
            },
          };
        }
      }

      // Execute the method
      let response: ExpertResponse;

      switch (method) {
        case 'analyze':
          response = await this.analyze(context);
          break;
        case 'suggest':
          response = await this.suggest(context);
          break;
        case 'execute':
          if (!action) {
            throw new Error('Action is required for execute method');
          }
          response = await this.execute(action, params || {}, context);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }

      // Update metadata
      response.metadata = {
        ...response.metadata,
        responseTime: Date.now() - startTime,
        cached: false,
      };

      // Cache the response
      if (this.config.enableCache && response.success) {
        await this.saveToCache(cacheKey, response);
      }

      return response;

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process ${method}`, err.stack, {
        method,
        error: err.message,
      });

      return ErrorHandler.createErrorResponse(err, this.config.name);
    }
  }

  /**
   * Call Claude AI with the expert's configuration
   */
  protected async callAI(
    prompt: string,
    context: ExpertContext,
    options?: {
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      // Build conversation history
      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Add session history if available
      if (context.session?.conversationHistory) {
        for (const msg of context.session.conversationHistory) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // Add current prompt
      messages.push({
        role: 'user',
        content: prompt,
      });

      // Prepare request
      const request: MessageRequest = {
        model: this.config.model,
        systemPrompt: options?.systemPrompt || this.config.systemPrompt,
        messages,
        maxTokens: options?.maxTokens || this.config.maxTokens,
        temperature: options?.temperature ?? this.config.temperature,
        timeout: this.config.timeout,
        metadata: {
          expertName: this.config.name,
          userId: context.user.id,
          companyId: context.company?.id,
        },
      };

      // Send with retry
      const response = await this.anthropicService.sendMessageWithRetry(
        request,
        this.config.retry?.maxAttempts,
        this.config.retry?.backoffMs,
        this.config.retry?.backoffMultiplier,
      );

      this.logger.log('AI call completed', {
        model: this.config.model,
        tokensUsed: response.usage.totalTokens,
        cost: response.cost,
      });

      return response.content;

    } catch (error) {
      const err = error as Error;
      this.logger.error('AI call failed', err.stack, {
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Build context string for AI prompts
   */
  protected buildContextString(context: ExpertContext): string {
    const parts: string[] = [];

    // User context
    parts.push(`User ID: ${context.user.id}`);
    if (context.user.role) {
      parts.push(`User Role: ${context.user.role}`);
    }

    // Company context
    if (context.company) {
      parts.push(`Company: ${context.company.name}`);
      if (context.company.industry) {
        parts.push(`Industry: ${context.company.industry}`);
      }
    }

    // Request context
    parts.push(`Request Type: ${context.request.type}`);

    // Data context
    if (context.dataContext?.sources) {
      parts.push(`Available Data Sources: ${context.dataContext.sources.join(', ')}`);
    }

    // Shared context
    if (context.sharedContext?.insights) {
      parts.push(`Previous Insights:\n${context.sharedContext.insights.join('\n')}`);
    }

    // Environment
    if (context.environment) {
      parts.push(`Environment: ${context.environment.name}`);
    }

    return parts.join('\n');
  }

  /**
   * Create success response
   */
  protected createSuccessResponse<T>(
    data: T,
    metadata?: Partial<ExpertResponse['metadata']>,
  ): ExpertResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        expertName: this.config.name,
        model: this.config.model,
        timestamp: new Date(),
        responseTime: 0, // Will be set by process()
        cached: false,
        ...metadata,
      },
    };
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    error: Error,
    code?: string,
  ): ExpertResponse {
    const expertError = ErrorHandler.handleError(error, this.config.name);

    return {
      success: false,
      error: {
        code: code || expertError.code,
        message: expertError.message,
        details: expertError.details,
      },
      metadata: {
        expertName: this.config.name,
        model: this.config.model,
        timestamp: new Date(),
        responseTime: 0,
        cached: false,
      },
    };
  }

  /**
   * Check rate limit
   */
  protected async checkRateLimit(): Promise<void> {
    const allowed = await this.rateLimiter.tryConsume(1);

    if (!allowed) {
      const timeUntilAvailable = this.rateLimiter.getTimeUntilTokensAvailable(1);

      this.logger.warn('Rate limit exceeded', {
        expert: this.config.name,
        timeUntilAvailable,
      });

      throw ErrorHandler.handleError(
        {
          status: 429,
          error: {
            type: 'rate_limit_error',
            retry_after: Math.ceil(timeUntilAvailable / 1000),
          },
        },
        this.config.name,
      );
    }
  }

  /**
   * Generate cache key
   */
  protected generateCacheKey(
    method: string,
    context: ExpertContext,
    additionalParams?: any,
  ): string {
    return CacheKeyGenerator.generate(
      this.config.name,
      method,
      context,
      additionalParams,
    );
  }

  /**
   * Get from cache
   */
  protected async getFromCache<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Cache get failed', { key, error: err.message });
      return null;
    }
  }

  /**
   * Save to cache
   */
  protected async saveToCache(key: string, value: any): Promise<void> {
    try {
      await this.cacheService.set(key, value, this.config.cacheTTL);
    } catch (error) {
      const err = error as Error;
      this.logger.warn('Cache set failed', { key, error: err.message });
    }
  }

  /**
   * Clear cache for this expert
   */
  async clearCache(): Promise<void> {
    try {
      const pattern = CacheKeyGenerator.generatePattern(this.config.name);
      const deleted = await this.cacheService.deletePattern(pattern);

      this.logger.log('Cache cleared', {
        expert: this.config.name,
        deleted,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to clear cache', err.stack, {
        expert: this.config.name,
        error: err.message,
      });
    }
  }

  /**
   * Get expert configuration
   */
  getConfig(): ExpertConfig {
    return { ...this.config };
  }

  /**
   * Get expert name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get expert display name
   */
  getDisplayName(): string {
    return this.config.displayName;
  }

  /**
   * Get expert description
   */
  getDescription(): string {
    return this.config.description;
  }

  /**
   * Get expert tags
   */
  getTags(): string[] {
    return this.config.tags || [];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if services are available
      const anthropicHealth = await this.anthropicService.healthCheck();
      const cacheHealth = await this.cacheService.healthCheck();

      return anthropicHealth && cacheHealth;
    } catch (error) {
      const err = error as Error;
      this.logger.error('Health check failed', err.stack, {
        error: err.message,
      });
      return false;
    }
  }
}
