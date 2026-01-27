/**
 * Base Provider Interface
 * Common interface for all communication providers
 */

import { Channel, ChannelStatus } from '../types/channel.types';
import { SendMessageRequest, SendMessageResponse, MessageStatus } from '../types/message.types';

export interface ProviderConfig {
  apiKey?: string;
  apiSecret?: string;
  accountSid?: string;
  authToken?: string;
  projectId?: string;
  region?: string;
  sandbox?: boolean;
  timeout?: number;
  retryConfig?: RetryConfig;
  webhookSecret?: string;
  baseUrl?: string;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ProviderResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryable: boolean;
  };
  rawResponse?: unknown;
}

export interface DeliveryStatus {
  messageId: string;
  externalId: string;
  status: MessageStatus;
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookPayload {
  provider: string;
  event: string;
  messageId?: string;
  externalId?: string;
  timestamp: Date;
  data: Record<string, unknown>;
  signature?: string;
}

export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected channel: Channel;
  protected initialized: boolean = false;

  constructor(channel: Channel, config: ProviderConfig) {
    this.channel = channel;
    this.config = {
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
      },
      ...config
    };
  }

  /**
   * Initialize the provider
   */
  abstract initialize(): Promise<void>;

  /**
   * Send a message
   */
  abstract send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>>;

  /**
   * Get message status
   */
  abstract getStatus(externalId: string): Promise<ProviderResponse<DeliveryStatus>>;

  /**
   * Cancel a scheduled message
   */
  abstract cancel(externalId: string): Promise<ProviderResponse<boolean>>;

  /**
   * Validate webhook signature
   */
  abstract validateWebhook(payload: unknown, signature: string): boolean;

  /**
   * Parse webhook payload
   */
  abstract parseWebhook(payload: unknown): WebhookPayload;

  /**
   * Check provider health
   */
  abstract healthCheck(): Promise<ChannelStatus>;

  /**
   * Get channel type
   */
  getChannel(): Channel {
    return this.channel;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  protected calculateRetryDelay(attempt: number): number {
    const { initialDelayMs, maxDelayMs, backoffMultiplier } = this.config.retryConfig!;
    const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelayMs);
  }

  /**
   * Execute with retry logic
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: unknown) => boolean = () => true
  ): Promise<T> {
    const { maxRetries } = this.config.retryConfig!;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries && shouldRetry(error)) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }
}

/**
 * Provider Factory Interface
 */
export interface ProviderFactory {
  create(channel: Channel, config: ProviderConfig): BaseProvider;
}

/**
 * Provider Registry
 */
export class ProviderRegistry {
  private static providers: Map<Channel, BaseProvider> = new Map();

  static register(channel: Channel, provider: BaseProvider): void {
    this.providers.set(channel, provider);
  }

  static get(channel: Channel): BaseProvider | undefined {
    return this.providers.get(channel);
  }

  static has(channel: Channel): boolean {
    return this.providers.has(channel);
  }

  static remove(channel: Channel): boolean {
    return this.providers.delete(channel);
  }

  static getAll(): Map<Channel, BaseProvider> {
    return new Map(this.providers);
  }

  static clear(): void {
    this.providers.clear();
  }
}
