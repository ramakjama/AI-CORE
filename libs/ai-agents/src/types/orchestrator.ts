/**
 * Orchestrator Types
 * Interfaces for multi-agent orchestration and routing
 */

import type { Department, HandoffReason, RoutingStrategy } from './enums';
import type { Agent } from './agent';
import type { Conversation, Message } from './conversation';

/**
 * Orchestrator Configuration
 */
export interface Orchestrator {
  id: string;
  code: string;
  name: string;
  description?: string;

  // Routing configuration
  routingStrategy: RoutingStrategy;
  defaultAgentId?: string;
  fallbackAgentId?: string;

  // Classification
  intentClassifierModel?: string;
  confidenceThreshold: number;

  // Limits
  maxHandoffs: number;
  maxRetries: number;
  timeoutSeconds: number;

  // System
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent Routing Rule
 */
export interface AgentRouting {
  id: string;
  orchestratorId: string;

  // Agents
  fromAgentId?: string;
  fromAgent?: Agent;
  toAgentId: string;
  toAgent?: Agent;

  // Conditions
  intentPatterns: string[];
  keywords: string[];
  departments: Department[];
  conditions?: Record<string, unknown>;

  // Priority and weight
  priority: number;
  weight: number;

  metadata?: Record<string, unknown>;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Orchestrator Decision
 */
export interface OrchestratorDecision {
  id: string;
  orchestratorId: string;
  conversationId?: string;

  // Input analyzed
  inputText: string;
  detectedIntent?: string;
  confidence?: number;

  // Decision
  selectedAgentId: string;
  selectedAgent?: Agent;
  alternativeIds: string[];
  decisionReason?: string;

  // Context
  routingRuleApplied?: string;
  factors?: Record<string, unknown>;

  // Timing
  decisionTime: number;
  decidedAt: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Routing Request
 */
export interface RoutingRequest {
  orchestratorId: string;
  conversationId?: string;

  // Input
  inputText: string;
  context?: {
    currentAgentId?: string;
    department?: Department;
    previousIntents?: string[];
    userPreferences?: Record<string, unknown>;
  };

  // Constraints
  excludeAgentIds?: string[];
  preferredAgentIds?: string[];
  requiredCapabilities?: string[];

  metadata?: Record<string, unknown>;
}

/**
 * Routing Response
 */
export interface RoutingResponse {
  success: boolean;
  decision: OrchestratorDecision;

  // Agent details
  selectedAgent: Agent;
  alternatives: Agent[];

  // Explanation
  reasoning: string;
  confidenceLevel: 'high' | 'medium' | 'low';

  // Handoff details (if routing from another agent)
  handoffRequired: boolean;
  handoffSummary?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Handoff Request
 */
export interface HandoffRequest {
  conversationId: string;
  fromAgentId: string;
  toAgentId: string;

  reason: HandoffReason;
  reasonText?: string;

  // Context to transfer
  transferContext?: {
    summary?: string;
    keyFacts?: string[];
    pendingTasks?: string[];
    userSentiment?: string;
    priority?: number;
  };

  // Include message history
  includeMessageHistory?: boolean;
  maxHistoryMessages?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Handoff Response
 */
export interface HandoffResponse {
  success: boolean;
  handoffId: string;

  // Agents
  fromAgent: Agent;
  toAgent: Agent;

  // Context transferred
  contextSummary: string;
  messageCount: number;

  // Greeting message for new agent
  transitionMessage?: string;

  metadata?: Record<string, unknown>;
}

/**
 * Intent Classification Result
 */
export interface IntentClassification {
  intent: string;
  confidence: number;

  // Alternative intents
  alternatives: Array<{
    intent: string;
    confidence: number;
  }>;

  // Entities detected
  entities: Array<{
    type: string;
    value: string;
    start: number;
    end: number;
    confidence: number;
  }>;

  // Department suggestion
  suggestedDepartment?: Department;

  // Raw classifier output
  rawOutput?: Record<string, unknown>;
}

/**
 * Load Balancer State
 */
export interface LoadBalancerState {
  agentId: string;
  agent: Agent;

  // Current load
  activeConversations: number;
  queuedMessages: number;

  // Capacity
  maxConcurrentChats: number;
  availabilityPercentage: number;

  // Performance
  averageResponseTime: number;
  errorRate: number;

  // Availability
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;

  // Last update
  lastUpdated: Date;
}

/**
 * Agent Selection Criteria
 */
export interface AgentSelectionCriteria {
  // Required
  intent?: string;
  department?: Department;
  capabilities?: string[];

  // Preferred
  preferredAgentId?: string;
  preferredLanguage?: string;
  preferredExpertise?: string[];

  // Constraints
  excludeAgentIds?: string[];
  maxResponseTime?: number;

  // User context
  userId?: string;
  userPreferences?: Record<string, unknown>;
  previousInteractions?: string[];

  // Business context
  priority?: number;
  complexity?: number;
}

/**
 * Agent Score
 */
export interface AgentScore {
  agentId: string;
  agent: Agent;

  // Scores (0-1)
  intentMatch: number;
  expertiseMatch: number;
  availabilityScore: number;
  performanceScore: number;
  preferenceScore: number;

  // Final score
  totalScore: number;
  rank: number;

  // Explanation
  scoreBreakdown: Record<string, number>;
  disqualificationReason?: string;
}

/**
 * Orchestration Event
 */
export interface OrchestrationEvent {
  id: string;
  orchestratorId: string;
  conversationId?: string;

  type: 'routing' | 'handoff' | 'fallback' | 'error' | 'escalation';

  // Details
  fromAgentId?: string;
  toAgentId?: string;
  reason?: string;
  details?: Record<string, unknown>;

  // Timing
  timestamp: Date;
  processingTime: number;

  metadata?: Record<string, unknown>;
}

/**
 * Orchestrator Statistics
 */
export interface OrchestratorStatistics {
  orchestratorId: string;

  // Routing stats
  totalRoutingDecisions: number;
  averageDecisionTime: number;
  routingAccuracy?: number;

  // Handoff stats
  totalHandoffs: number;
  successfulHandoffs: number;
  handoffsByReason: Record<HandoffReason, number>;

  // Agent usage
  agentUsage: Array<{
    agentId: string;
    routedCount: number;
    percentage: number;
  }>;

  // Intent distribution
  intentDistribution: Array<{
    intent: string;
    count: number;
    percentage: number;
  }>;

  // Errors
  totalErrors: number;
  fallbackUsed: number;

  // Time range
  fromDate: Date;
  toDate: Date;
}

/**
 * Create Orchestrator Input
 */
export interface CreateOrchestratorInput {
  code: string;
  name: string;
  description?: string;

  routingStrategy?: RoutingStrategy;
  defaultAgentId?: string;
  fallbackAgentId?: string;

  intentClassifierModel?: string;
  confidenceThreshold?: number;

  maxHandoffs?: number;
  maxRetries?: number;
  timeoutSeconds?: number;

  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create Routing Rule Input
 */
export interface CreateRoutingRuleInput {
  orchestratorId: string;

  fromAgentId?: string;
  toAgentId: string;

  intentPatterns?: string[];
  keywords?: string[];
  departments?: Department[];
  conditions?: Record<string, unknown>;

  priority?: number;
  weight?: number;

  metadata?: Record<string, unknown>;
}
