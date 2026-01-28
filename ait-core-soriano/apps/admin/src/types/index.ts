// ============================================================================
// AIT-CORE Admin Panel - Type Definitions
// Production-Ready TypeScript Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  permissions: Permission[];
  metadata?: Record<string, any>;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: PermissionAction[];
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
}

// Module Management Types
export interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  status: ModuleStatus;
  type: ModuleType;
  category: string;
  author: string;
  icon?: string;
  config: ModuleConfig;
  dependencies: ModuleDependency[];
  endpoints: ModuleEndpoint[];
  metrics: ModuleMetrics;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  tags?: string[];
}

export enum ModuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  PENDING = 'pending',
}

export enum ModuleType {
  CORE = 'core',
  AGENT = 'agent',
  SERVICE = 'service',
  INTEGRATION = 'integration',
  UTILITY = 'utility',
}

export interface ModuleConfig {
  enabled: boolean;
  autoStart: boolean;
  priority: number;
  timeout: number;
  retryAttempts: number;
  environment: Record<string, any>;
  resources?: ModuleResources;
}

export interface ModuleResources {
  maxCpu: number;
  maxMemory: number;
  maxThreads: number;
}

export interface ModuleDependency {
  moduleId: string;
  moduleName: string;
  version: string;
  required: boolean;
}

export interface ModuleEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  isPublic: boolean;
}

export interface ModuleMetrics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  lastExecutionTime: number;
  errorCount: number;
  uptime: number;
}

// Agent Monitoring Types
export interface Agent {
  id: string;
  name: string;
  displayName: string;
  type: AgentType;
  status: AgentStatus;
  health: AgentHealth;
  capabilities: string[];
  currentTask?: AgentTask;
  taskQueue: AgentTask[];
  metrics: AgentMetrics;
  configuration: AgentConfiguration;
  metadata: AgentMetadata;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string;
}

export enum AgentType {
  AI_ASSISTANT = 'ai_assistant',
  DATA_PROCESSOR = 'data_processor',
  AUTOMATION = 'automation',
  MONITOR = 'monitor',
  INTEGRATION = 'integration',
}

export enum AgentStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum AgentHealth {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface AgentTask {
  id: string;
  agentId: string;
  name: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  result?: any;
  error?: string;
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksF: number;
  averageTaskDuration: number;
  successRate: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
}

export interface AgentConfiguration {
  maxConcurrentTasks: number;
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  customSettings: Record<string, any>;
}

export interface AgentMetadata {
  version: string;
  host: string;
  region?: string;
  tags: string[];
  owner?: string;
}

// System Health Types
export interface SystemHealth {
  overall: HealthStatus;
  timestamp: string;
  components: ComponentHealth[];
  metrics: SystemMetrics;
  alerts: SystemAlert[];
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
}

export interface ComponentHealth {
  id: string;
  name: string;
  type: ComponentType;
  status: HealthStatus;
  message?: string;
  metrics: Record<string, number>;
  lastCheckedAt: string;
}

export enum ComponentType {
  API = 'api',
  DATABASE = 'database',
  CACHE = 'cache',
  QUEUE = 'queue',
  STORAGE = 'storage',
  EXTERNAL_SERVICE = 'external_service',
}

export interface SystemMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  disk: ResourceMetric;
  network: NetworkMetric;
  database: DatabaseMetric;
  api: ApiMetric;
}

export interface ResourceMetric {
  used: number;
  total: number;
  percentage: number;
  trend: MetricTrend;
}

export enum MetricTrend {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

export interface NetworkMetric {
  inbound: number;
  outbound: number;
  connections: number;
  latency: number;
}

export interface DatabaseMetric {
  connections: number;
  activeQueries: number;
  averageQueryTime: number;
  slowQueries: number;
}

export interface ApiMetric {
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  activeEndpoints: number;
}

export interface SystemAlert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  component: string;
  message: string;
  details?: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertType {
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  AVAILABILITY = 'availability',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: ActivityAction;
  resource: string;
  resourceId?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'success' | 'failure';
}

export enum ActivityAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXECUTE = 'execute',
  CONFIGURE = 'configure',
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ApiMetadata {
  timestamp: string;
  requestId: string;
  version: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

// WebSocket Types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
}

export enum WebSocketMessageType {
  AGENT_STATUS = 'agent_status',
  SYSTEM_METRIC = 'system_metric',
  ALERT = 'alert',
  TASK_UPDATE = 'task_update',
  MODULE_UPDATE = 'module_update',
}

// Chart Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TimeSeriesData {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  config: Record<string, any>;
  data?: any;
}

export enum WidgetType {
  METRIC = 'metric',
  CHART = 'chart',
  TABLE = 'table',
  LIST = 'list',
  STATUS = 'status',
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

// Configuration Types
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: FeatureFlags;
}

export interface FeatureFlags {
  moduleManagement: boolean;
  agentMonitoring: boolean;
  systemHealth: boolean;
  userManagement: boolean;
  advancedAnalytics: boolean;
}

// Filter and Sort Types
export interface FilterOptions {
  search?: string;
  status?: string[];
  type?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TableOptions {
  page: number;
  pageSize: number;
  sort: SortOptions;
  filters: FilterOptions;
}
