/**
 * Agent Types
 * Core interfaces for AI Agents
 */

import type { AgentType, AgentStatus, Department, ProviderType } from './enums';

/**
 * Agent Personality Configuration
 */
export interface AgentPersonality {
  id: string;
  code: string;
  name: string;
  description?: string;

  // Personality characteristics (1-10 scale)
  tone?: string;
  formality: number;
  empathy: number;
  verbosity: number;
  proactivity: number;
  technicalLevel: number;

  // Communication style
  greetingStyle?: string;
  closingStyle?: string;
  errorHandling?: string;
  uncertaintyStyle?: string;

  // Restrictions
  prohibitedTopics: string[];
  prohibitedWords: string[];

  // Language
  primaryLanguage: string;
  supportedLanguages: string[];

  metadata?: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Agent Model Configuration
 */
export interface AgentModel {
  id: string;
  code: string;
  name: string;
  provider: ProviderType;
  modelId: string;
  description?: string;

  // Capabilities
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;

  // Costs (per 1M tokens)
  inputCostPer1M: number;
  outputCostPer1M: number;

  // Configuration
  apiEndpoint?: string;
  apiVersion?: string;

  isActive: boolean;
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  // Model settings
  modelId?: string;
  model?: AgentModel;

  // Personality
  personalityId?: string;
  personality?: AgentPersonality;

  // Generation parameters
  systemPrompt?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  // Limits
  maxConversationTurns: number;
  maxExecutionTime: number;
  maxToolCalls: number;

  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Agent Capability
 */
export interface AgentCapability {
  id: string;
  agentId: string;
  code: string;
  name: string;
  description?: string;

  isEnabled: boolean;
  confidenceMin: number;
  priority: number;

  metadata?: Record<string, unknown>;
}

/**
 * Agent Specialization
 */
export interface AgentSpecialization {
  id: string;
  agentId: string;
  code: string;
  name: string;
  description?: string;

  domain: string;
  topics: string[];
  keywords: string[];

  expertiseLevel: number;

  metadata?: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Agent Knowledge Base
 */
export interface AgentKnowledgeBase {
  id: string;
  agentId: string;
  code: string;
  name: string;
  description?: string;

  // Retrieval configuration
  retrievalTopK: number;
  similarityThreshold: number;
  useReranking: boolean;
  maxTokensPerRetrieval: number;

  sources: string[];

  metadata?: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Department Agent Assignment
 */
export interface DepartmentAgent {
  id: string;
  department: Department;
  agentId: string;

  isPrimary: boolean;
  priority: number;
  maxConcurrentChats: number;

  // Availability
  availableFrom?: string;
  availableTo?: string;
  availableDays: number[];

  metadata?: Record<string, unknown>;
  isActive: boolean;
}

/**
 * Main Agent Interface
 */
export interface Agent {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: AgentType;
  status: AgentStatus;

  // Configuration
  config: AgentConfig;

  // Relationships
  capabilities: AgentCapability[];
  specializations: AgentSpecialization[];
  knowledgeBases: AgentKnowledgeBase[];
  departmentAgents: DepartmentAgent[];

  // Metadata
  metadata?: Record<string, unknown>;
  isDefault: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  deletedAt?: Date;
}

/**
 * Agent Version
 */
export interface AgentVersion {
  id: string;
  agentId: string;
  version: string;
  changelog?: string;

  // Configuration snapshot
  systemPrompt?: string;
  temperature?: number;
  modelId?: string;
  configSnapshot?: Record<string, unknown>;

  isActive: boolean;
  publishedAt?: Date;
  createdAt: Date;
  createdBy?: string;
}

/**
 * Agent Creation Input
 */
export interface CreateAgentInput {
  code: string;
  name: string;
  description?: string;
  type?: AgentType;
  status?: AgentStatus;

  // Configuration
  modelId?: string;
  personalityId?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Limits
  maxConversationTurns?: number;
  maxExecutionTime?: number;
  maxToolCalls?: number;

  metadata?: Record<string, unknown>;
  isDefault?: boolean;
}

/**
 * Agent Update Input
 */
export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  id: string;
}

/**
 * Agent Query Filters
 */
export interface AgentFilters {
  type?: AgentType;
  status?: AgentStatus;
  department?: Department;
  isDefault?: boolean;
  search?: string;
  ids?: string[];
}

/**
 * Agent Execution Result
 */
export interface AgentExecutionResult {
  success: boolean;
  response?: string;
  structured?: Record<string, unknown>;

  // Classification
  intent?: string;
  intentConfidence?: number;
  sentiment?: string;
  topics: string[];

  // Actions
  suggestedActions?: Record<string, unknown>;
  requiresFollowUp: boolean;

  metadata?: Record<string, unknown>;
}

/**
 * Agent Metrics
 */
export interface AgentMetrics {
  agentId: string;

  // Tokens
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Costs
  promptCost: number;
  completionCost: number;
  totalCost: number;

  // Latency
  timeToFirstToken?: number;
  totalLatency?: number;
  modelLatency?: number;
  toolLatency?: number;

  // Calls
  modelCalls: number;
  toolCalls: number;
  retrievalCalls: number;

  cacheHit: boolean;
}
