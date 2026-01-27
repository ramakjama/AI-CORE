/**
 * Enums for AI Agents Framework
 * Based on sm_ai_agents Prisma schema
 */

export enum AgentType {
  ASSISTANT = 'ASSISTANT',
  SPECIALIST = 'SPECIALIST',
  ORCHESTRATOR = 'ORCHESTRATOR',
  SUPERVISOR = 'SUPERVISOR',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  TRAINING = 'TRAINING',
  DEPRECATED = 'DEPRECATED',
  DISABLED = 'DISABLED',
}

export enum Department {
  SALES = 'SALES',
  CLAIMS = 'CLAIMS',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  UNDERWRITING = 'UNDERWRITING',
  FINANCE = 'FINANCE',
  HR = 'HR',
  LEGAL = 'LEGAL',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
  TOOL = 'TOOL',
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum FeedbackType {
  HELPFUL = 'HELPFUL',
  NOT_HELPFUL = 'NOT_HELPFUL',
  INCORRECT = 'INCORRECT',
  INAPPROPRIATE = 'INAPPROPRIATE',
}

export enum ToolType {
  API = 'API',
  DATABASE = 'DATABASE',
  CALCULATION = 'CALCULATION',
  SEARCH = 'SEARCH',
  RETRIEVAL = 'RETRIEVAL',
  INTEGRATION = 'INTEGRATION',
}

export enum HandoffReason {
  EXPERTISE_REQUIRED = 'EXPERTISE_REQUIRED',
  ESCALATION = 'ESCALATION',
  DEPARTMENT_TRANSFER = 'DEPARTMENT_TRANSFER',
  LANGUAGE = 'LANGUAGE',
  COMPLEXITY = 'COMPLEXITY',
  USER_REQUEST = 'USER_REQUEST',
}

export enum KnowledgeType {
  DOCUMENT = 'DOCUMENT',
  FAQ = 'FAQ',
  PROCEDURE = 'PROCEDURE',
  POLICY = 'POLICY',
  TEMPLATE = 'TEMPLATE',
  GUIDELINE = 'GUIDELINE',
}

export enum ChunkStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  INDEXED = 'INDEXED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum RoutingStrategy {
  INTENT_BASED = 'intent_based',
  ROUND_ROBIN = 'round_robin',
  LOAD_BALANCED = 'load_balanced',
  KEYWORD_MATCH = 'keyword_match',
  HYBRID = 'hybrid',
}

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  AZURE_OPENAI = 'azure_openai',
  LITELLM = 'litellm',
}

export enum StreamEventType {
  START = 'start',
  TOKEN = 'token',
  TOOL_CALL_START = 'tool_call_start',
  TOOL_CALL_DELTA = 'tool_call_delta',
  TOOL_CALL_END = 'tool_call_end',
  CONTENT_BLOCK_START = 'content_block_start',
  CONTENT_BLOCK_DELTA = 'content_block_delta',
  CONTENT_BLOCK_END = 'content_block_end',
  MESSAGE_DELTA = 'message_delta',
  MESSAGE_END = 'message_end',
  ERROR = 'error',
  DONE = 'done',
}
