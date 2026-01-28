/**
 * Orchestrator Options Interface
 * Configuration options for the AI Orchestrator
 */

export interface OrchestratorOptions {
  /**
   * Routing strategy for selecting experts
   */
  routingStrategy?: 'priority' | 'round-robin' | 'least-loaded' | 'intelligent';

  /**
   * Whether to enable multi-expert coordination
   */
  enableMultiExpert?: boolean;

  /**
   * Maximum number of experts to use in multi-expert mode
   */
  maxExperts?: number;

  /**
   * Whether to enable response caching
   */
  enableCache?: boolean;

  /**
   * Global cache TTL in seconds
   */
  cacheTTL?: number;

  /**
   * Whether to enable load balancing
   */
  enableLoadBalancing?: boolean;

  /**
   * Load balancing thresholds
   */
  loadBalancing?: {
    maxConcurrentRequests: number;
    requestQueueSize: number;
    cpuThreshold: number;
    memoryThreshold: number;
  };

  /**
   * Cost management settings
   */
  costManagement?: {
    enableTracking: boolean;
    dailyBudget?: number;
    costAlertThreshold?: number;
    preferLowerCostModels?: boolean;
  };

  /**
   * Fallback configuration
   */
  fallback?: {
    enableFallback: boolean;
    fallbackModel?: 'opus' | 'sonnet' | 'haiku';
    maxFallbackAttempts?: number;
  };

  /**
   * Timeout configuration
   */
  timeout?: {
    default: number;
    max: number;
  };

  /**
   * Retry configuration
   */
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };

  /**
   * Monitoring and logging
   */
  monitoring?: {
    enableMetrics: boolean;
    enableTracing: boolean;
    enableDetailedLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Default orchestrator options
 */
export const DEFAULT_ORCHESTRATOR_OPTIONS: OrchestratorOptions = {
  routingStrategy: 'intelligent',
  enableMultiExpert: true,
  maxExperts: 3,
  enableCache: true,
  cacheTTL: 3600,
  enableLoadBalancing: true,
  loadBalancing: {
    maxConcurrentRequests: 100,
    requestQueueSize: 500,
    cpuThreshold: 80,
    memoryThreshold: 85,
  },
  costManagement: {
    enableTracking: true,
    preferLowerCostModels: false,
  },
  fallback: {
    enableFallback: true,
    fallbackModel: 'haiku',
    maxFallbackAttempts: 2,
  },
  timeout: {
    default: 30000,
    max: 120000,
  },
  retry: {
    enabled: true,
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
  monitoring: {
    enableMetrics: true,
    enableTracing: true,
    enableDetailedLogging: false,
    logLevel: 'info',
  },
};

/**
 * Expert routing result
 */
export interface ExpertRoutingResult {
  /**
   * Selected expert name
   */
  expertName: string;

  /**
   * Confidence in the routing decision (0-1)
   */
  confidence: number;

  /**
   * Alternative experts
   */
  alternatives?: Array<{
    expertName: string;
    confidence: number;
  }>;

  /**
   * Routing reason
   */
  reason: string;

  /**
   * Routing metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Multi-expert coordination plan
 */
export interface MultiExpertPlan {
  /**
   * Experts involved in the plan
   */
  experts: Array<{
    expertName: string;
    role: string;
    order: number;
    dependencies?: string[];
  }>;

  /**
   * Execution strategy
   */
  strategy: 'sequential' | 'parallel' | 'hybrid';

  /**
   * Expected duration
   */
  estimatedDuration?: number;

  /**
   * Expected cost
   */
  estimatedCost?: number;
}
