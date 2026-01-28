/**
 * Expert Response Interface
 * Standardized response format from AI experts
 */

export interface ExpertResponse<T = any> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Response data
   */
  data?: T;

  /**
   * Error information if failed
   */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /**
   * Metadata about the response
   */
  metadata: {
    /**
     * Expert that generated this response
     */
    expertName: string;

    /**
     * Model used
     */
    model: string;

    /**
     * Request timestamp
     */
    timestamp: Date;

    /**
     * Response time in milliseconds
     */
    responseTime: number;

    /**
     * Tokens used in request
     */
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };

    /**
     * Cost of the request
     */
    cost?: number;

    /**
     * Whether response was served from cache
     */
    cached: boolean;

    /**
     * Cache key if cached
     */
    cacheKey?: string;

    /**
     * Number of retry attempts
     */
    retryAttempts?: number;

    /**
     * Stop reason
     */
    stopReason?: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';

    /**
     * Additional metadata properties
     */
    [key: string]: any;
  };

  /**
   * Confidence score (0-1)
   */
  confidence?: number;

  /**
   * Alternative suggestions if applicable
   */
  alternatives?: T[];

  /**
   * Follow-up questions or suggestions
   */
  followUp?: string[];

  /**
   * References or sources used
   */
  references?: string[];
}

/**
 * Analysis response data structure
 */
export interface AnalysisResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  risks?: string[];
  opportunities?: string[];
  metrics?: Record<string, any>;
}

/**
 * Suggestion response data structure
 */
export interface SuggestionResponse {
  suggestions: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    steps?: string[];
  }>;
  rationale: string;
}

/**
 * Execution response data structure
 */
export interface ExecutionResponse {
  action: string;
  status: 'success' | 'failure' | 'partial';
  result: any;
  steps: Array<{
    step: string;
    status: 'completed' | 'failed' | 'skipped';
    output?: any;
    error?: string;
  }>;
  duration: number;
}
