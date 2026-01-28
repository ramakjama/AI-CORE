/**
 * Expert Configuration Interface
 * Defines the configuration for each AI expert in the system
 */

export interface ExpertConfig {
  /**
   * Unique identifier for the expert
   */
  name: string;

  /**
   * Display name for the expert
   */
  displayName: string;

  /**
   * Description of the expert's capabilities
   */
  description: string;

  /**
   * Claude model to use for this expert
   */
  model: 'opus' | 'sonnet' | 'haiku';

  /**
   * System prompt that defines the expert's behavior and knowledge
   */
  systemPrompt: string;

  /**
   * Tools available to this expert
   */
  tools?: string[];

  /**
   * Maximum tokens for responses
   */
  maxTokens?: number;

  /**
   * Temperature for response generation (0-1)
   */
  temperature?: number;

  /**
   * Whether to cache responses from this expert
   */
  enableCache?: boolean;

  /**
   * Cache TTL in seconds
   */
  cacheTTL?: number;

  /**
   * Rate limit per minute
   */
  rateLimit?: number;

  /**
   * Priority level for load balancing (1-10, higher is more important)
   */
  priority?: number;

  /**
   * Tags for categorizing the expert
   */
  tags?: string[];

  /**
   * Cost per 1000 tokens (for tracking)
   */
  costPerKToken?: number;

  /**
   * Retry configuration
   */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };

  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Default expert configuration values
 */
export const DEFAULT_EXPERT_CONFIG: Partial<ExpertConfig> = {
  maxTokens: 4096,
  temperature: 0.7,
  enableCache: true,
  cacheTTL: 3600, // 1 hour
  rateLimit: 60, // 60 requests per minute
  priority: 5,
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
  timeout: 30000, // 30 seconds
};
