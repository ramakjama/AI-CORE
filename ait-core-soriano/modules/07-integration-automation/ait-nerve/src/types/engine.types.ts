/**
 * Engine Types and Interfaces
 * Defines all types for engine management and orchestration
 */

export enum EngineType {
  STATISTICAL = 'statistical',
  ECONOMIC = 'economic',
  FINANCIAL = 'financial',
  STRATEGIC = 'strategic',
  MACHINE_LEARNING = 'machine-learning',
  DEEP_LEARNING = 'deep-learning',
  OPTIMIZATION = 'optimization',
  SIMULATION = 'simulation',
  TIME_SERIES = 'time-series',
  NLP = 'nlp',
  COMPUTER_VISION = 'computer-vision',
  GRAPH_ANALYTICS = 'graph-analytics',
  GEOSPATIAL = 'geospatial',
  RISK_ASSESSMENT = 'risk-assessment',
  PREDICTIVE_MAINTENANCE = 'predictive-maintenance',
  RECOMMENDATION = 'recommendation',
  FRAUD_DETECTION = 'fraud-detection',
  CUSTOMER_ANALYTICS = 'customer-analytics',
  SUPPLY_CHAIN = 'supply-chain',
  PRICING = 'pricing',
  CREDIT_SCORING = 'credit-scoring',
  INSURANCE_ANALYTICS = 'insurance-analytics',
  DOCUMENT_INTELLIGENCE = 'document-intelligence',
}

export enum EngineStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
  UNHEALTHY = 'unhealthy',
  MAINTENANCE = 'maintenance',
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'round-robin',
  WEIGHTED_ROUND_ROBIN = 'weighted-round-robin',
  LEAST_CONNECTIONS = 'least-connections',
  LEAST_RESPONSE_TIME = 'least-response-time',
  RANDOM = 'random',
}

export interface EngineConfig {
  id: string;
  name: string;
  type: EngineType;
  url: string;
  port?: number;
  version: string;
  description: string;
  enabled: boolean;
  maxInstances: number;
  minInstances: number;
  currentInstances: number;
  healthCheckInterval: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  weight: number;
  priority: number;
  capabilities: string[];
  metadata: Record<string, any>;
}

export interface EngineInstance {
  id: string;
  engineId: string;
  url: string;
  status: EngineStatus;
  startedAt: Date;
  lastHealthCheck: Date;
  healthStatus: HealthStatus;
  metrics: EngineMetrics;
  activeConnections: number;
  totalRequests: number;
  failedRequests: number;
}

export interface HealthStatus {
  healthy: boolean;
  status: EngineStatus;
  uptime: number;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  cpuUsage?: number;
  memoryUsage?: number;
  details: Record<string, any>;
}

export interface EngineMetrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsFailed: number;
  requestsInProgress: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

export interface ExecutionRequest {
  engineId?: string;
  engineType?: EngineType;
  operation: string;
  parameters: Record<string, any>;
  priority?: number;
  timeout?: number;
  retryOnFailure?: boolean;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionResponse {
  requestId: string;
  engineId: string;
  engineInstance: string;
  status: 'success' | 'error' | 'timeout';
  result?: any;
  error?: string;
  executionTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BatchExecutionRequest {
  requests: ExecutionRequest[];
  parallel?: boolean;
  failFast?: boolean;
  timeout?: number;
}

export interface BatchExecutionResponse {
  batchId: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  results: ExecutionResponse[];
  executionTime: number;
  timestamp: Date;
}

export interface FailoverConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  fallbackEngines: string[];
}

export interface LoadBalancingConfig {
  strategy: LoadBalancingStrategy;
  weights: Record<string, number>;
  stickySession: boolean;
  sessionTimeout: number;
}

export interface CircuitBreakerState {
  engineId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailure: Date;
  nextRetry: Date;
}

export interface EngineEvent {
  type: EngineEventType;
  engineId: string;
  timestamp: Date;
  data: Record<string, any>;
}

export enum EngineEventType {
  ENGINE_STARTED = 'engine_started',
  ENGINE_STOPPED = 'engine_stopped',
  ENGINE_UNHEALTHY = 'engine_unhealthy',
  ENGINE_RECOVERED = 'engine_recovered',
  ENGINE_ERROR = 'engine_error',
  FAILOVER_TRIGGERED = 'failover_triggered',
  CIRCUIT_BREAKER_OPENED = 'circuit_breaker_opened',
  CIRCUIT_BREAKER_CLOSED = 'circuit_breaker_closed',
  SCALING_TRIGGERED = 'scaling_triggered',
}

export interface ScalingRequest {
  engineId: string;
  targetInstances: number;
  reason?: string;
}

export interface ScalingResponse {
  engineId: string;
  previousInstances: number;
  currentInstances: number;
  targetInstances: number;
  status: 'success' | 'in-progress' | 'failed';
  message?: string;
}
