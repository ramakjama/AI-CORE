/**
 * Expert Context Interface
 * Defines the context passed to experts for analysis and decision-making
 */

export interface ExpertContext {
  /**
   * User making the request
   */
  user: {
    id: string;
    email?: string;
    role?: string;
    permissions?: string[];
    metadata?: Record<string, any>;
  };

  /**
   * Company/organization context
   */
  company?: {
    id: string;
    name: string;
    industry?: string;
    size?: string;
    metadata?: Record<string, any>;
  };

  /**
   * Current session information
   */
  session?: {
    id: string;
    startedAt: Date;
    conversationHistory?: ConversationMessage[];
    metadata?: Record<string, any>;
  };

  /**
   * Request-specific data
   */
  request: {
    /**
     * Type of request
     */
    type: 'analysis' | 'suggestion' | 'execution' | 'query';

    /**
     * Request payload
     */
    payload: any;

    /**
     * Additional parameters
     */
    parameters?: Record<string, any>;

    /**
     * Priority of the request
     */
    priority?: 'high' | 'medium' | 'low';

    /**
     * Request metadata
     */
    metadata?: Record<string, any>;
  };

  /**
   * Shared context from other experts
   */
  sharedContext?: {
    /**
     * Previous expert responses
     */
    expertResponses?: Array<{
      expertName: string;
      response: any;
      timestamp: Date;
    }>;

    /**
     * Accumulated insights
     */
    insights?: string[];

    /**
     * Shared data between experts
     */
    sharedData?: Record<string, any>;
  };

  /**
   * Database/data access context
   */
  dataContext?: {
    /**
     * Available data sources
     */
    sources?: string[];

    /**
     * Query constraints
     */
    constraints?: Record<string, any>;

    /**
     * Data filters
     */
    filters?: Record<string, any>;
  };

  /**
   * Environmental context
   */
  environment?: {
    /**
     * Environment name (dev, staging, prod)
     */
    name: string;

    /**
     * Feature flags
     */
    featureFlags?: Record<string, boolean>;

    /**
     * Configuration
     */
    config?: Record<string, any>;
  };

  /**
   * Timing constraints
   */
  timing?: {
    /**
     * Timeout for the request
     */
    timeout?: number;

    /**
     * Expected response time
     */
    expectedResponseTime?: number;

    /**
     * Request deadline
     */
    deadline?: Date;
  };
}

/**
 * Conversation message in session history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Helper function to create a basic context
 */
export function createBasicContext(
  userId: string,
  requestType: ExpertContext['request']['type'],
  payload: any,
): ExpertContext {
  return {
    user: {
      id: userId,
    },
    request: {
      type: requestType,
      payload,
    },
    environment: {
      name: process.env['NODE_ENV'] || 'development',
    },
  };
}
