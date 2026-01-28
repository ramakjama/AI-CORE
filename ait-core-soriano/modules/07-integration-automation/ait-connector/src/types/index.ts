/**
 * AIT-CONNECTOR - Core Type Definitions
 * Comprehensive types for module and external connector management
 */

// Module Connector Types
export interface Module {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: ModuleDependency[];
  apis?: ModuleAPI[];
  config?: ModuleConfig;
  status: ModuleStatus;
  metadata?: ModuleMetadata;
  loadedAt?: Date;
  lastHealthCheck?: Date;
}

export interface ModuleDependency {
  moduleId: string;
  version: string;
  required: boolean;
  optional?: boolean;
}

export interface ModuleAPI {
  name: string;
  version: string;
  endpoints: APIEndpoint[];
  authentication?: AuthenticationConfig;
}

export interface APIEndpoint {
  path: string;
  method: HTTPMethod;
  handler: string;
  middleware?: string[];
  description?: string;
  parameters?: EndpointParameter[];
  response?: ResponseSchema;
}

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  validation?: ValidationRule[];
}

export interface ResponseSchema {
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
}

export interface ValidationRule {
  type: 'regex' | 'length' | 'range' | 'custom';
  value: any;
  message?: string;
}

export interface ModuleConfig {
  enabled: boolean;
  autoLoad: boolean;
  priority: number;
  environment?: string;
  settings?: Record<string, any>;
}

export interface ModuleMetadata {
  category?: string;
  tags?: string[];
  license?: string;
  repository?: string;
  homepage?: string;
  supportedPlatforms?: string[];
}

export enum ModuleStatus {
  REGISTERED = 'registered',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  UNLOADING = 'unloading',
  UNLOADED = 'unloaded'
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface ModuleHealthStatus {
  moduleId: string;
  healthy: boolean;
  status: ModuleStatus;
  uptime: number;
  lastCheck: Date;
  metrics?: HealthMetrics;
  issues?: HealthIssue[];
}

export interface HealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ValidationWarning {
  type: string;
  message: string;
  field?: string;
}

// External Connector Types
export interface ExternalConnector {
  id: string;
  name: string;
  type: ConnectorType;
  provider: string;
  version: string;
  config: ConnectorConfig;
  credentials?: ConnectorCredentials;
  status: ConnectionStatus;
  initialize(): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  execute(action: string, params: any): Promise<any>;
}

export enum ConnectorType {
  ERP = 'erp',
  CRM = 'crm',
  COMMUNICATION = 'communication',
  PAYMENT = 'payment',
  STORAGE = 'storage',
  AUTOMATION = 'automation',
  ANALYTICS = 'analytics',
  SECURITY = 'security',
  DATABASE = 'database',
  MESSAGING = 'messaging',
  AI_ML = 'ai_ml',
  INSURANCE = 'insurance',
  CUSTOM = 'custom'
}

export interface ConnectorConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: RateLimitConfig;
  caching?: CacheConfig;
  logging?: LoggingConfig;
  custom?: Record<string, any>;
}

export interface RateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize?: number;
}

export interface LoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  destination?: string;
}

export interface ConnectorCredentials {
  type: 'api-key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  custom?: Record<string, any>;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting'
}

export interface AuthenticationConfig {
  type: 'none' | 'api-key' | 'jwt' | 'oauth2' | 'basic';
  config?: Record<string, any>;
}

// Connector Factory Types
export interface ConnectorFactory {
  create(type: ConnectorType, provider: string, config: ConnectorConfig): ExternalConnector;
  register(provider: string, connectorClass: any): void;
  list(type?: ConnectorType): ConnectorInfo[];
}

export interface ConnectorInfo {
  provider: string;
  type: ConnectorType;
  name: string;
  description: string;
  version: string;
  requiredCredentials: string[];
  supportedActions: string[];
  documentation?: string;
}

// CLI Types
export interface CLICommand {
  name: string;
  description: string;
  options?: CLIOption[];
  action: (...args: any[]) => Promise<void>;
}

export interface CLIOption {
  flags: string;
  description: string;
  defaultValue?: any;
}

// API Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  executionTime: number;
  version: string;
}

// Event Types
export interface ModuleEvent {
  type: ModuleEventType;
  moduleId: string;
  timestamp: Date;
  data?: any;
}

export enum ModuleEventType {
  REGISTERED = 'module:registered',
  LOADED = 'module:loaded',
  UNLOADED = 'module:unloaded',
  ACTIVATED = 'module:activated',
  DEACTIVATED = 'module:deactivated',
  ERROR = 'module:error',
  HEALTH_CHECK = 'module:health-check'
}

export interface ConnectorEvent {
  type: ConnectorEventType;
  connectorId: string;
  timestamp: Date;
  data?: any;
}

export enum ConnectorEventType {
  CONNECTED = 'connector:connected',
  DISCONNECTED = 'connector:disconnected',
  ERROR = 'connector:error',
  RATE_LIMITED = 'connector:rate-limited',
  REQUEST = 'connector:request',
  RESPONSE = 'connector:response'
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;

export interface Logger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
}
