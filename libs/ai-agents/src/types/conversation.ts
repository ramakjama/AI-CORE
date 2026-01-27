/**
 * Conversation Types
 * Interfaces for conversation management and messages
 */

import type { MessageRole, Department, HandoffReason } from './enums';
import type { ToolCall } from './tool';

/**
 * Message Attachment
 */
export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'link';
  name: string;
  url?: string;
  data?: string; // Base64 encoded
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation Message
 */
export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;

  // Tool-related
  name?: string;
  toolCallId?: string;
  functionName?: string;
  toolCalls?: ToolCall[];

  // Token tracking
  tokenCount: number;

  // Attachments
  attachments?: MessageAttachment[];

  // State
  isHidden: boolean;
  timestamp: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Conversation Context
 */
export interface ConversationContext {
  id: string;
  conversationId: string;

  // User context
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userCompany?: string;
  userRole?: string;

  // Business context
  policyNumber?: string;
  claimNumber?: string;
  quoteNumber?: string;
  customerCode?: string;

  // Conversation state
  currentTopic?: string;
  currentIntent?: string;
  pendingActions: string[];

  // Session variables
  variables: Record<string, unknown>;

  // Sentiment analysis
  sentiment?: 'positive' | 'negative' | 'neutral';
  urgencyLevel: number;
  frustrationLevel: number;

  updatedAt: Date;
}

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  code: string;
  agentId: string;
  userId?: string;

  // Info
  title?: string;
  summary?: string;
  department?: Department;
  channel: string;

  // State
  isActive: boolean;
  startedAt: Date;
  lastActiveAt: Date;
  endedAt?: Date;

  // Metrics
  messageCount: number;
  userMessageCount: number;
  handoffCount: number;
  totalTokens: number;

  // Satisfaction
  satisfactionScore?: number;

  // Relations
  messages: Message[];
  context?: ConversationContext;

  // Metadata
  metadata?: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agent Handoff
 */
export interface AgentHandoff {
  id: string;
  conversationId: string;

  // Agents
  fromAgentId: string;
  toAgentId: string;

  // Reason
  reason: HandoffReason;
  reasonText?: string;
  summary?: string;

  // Context
  contextTransferred?: Record<string, unknown>;
  messageCount: number;

  // State
  isSuccessful: boolean;
  handoffAt: Date;
  completedAt?: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Create Message Input
 */
export interface CreateMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;

  name?: string;
  toolCallId?: string;
  functionName?: string;

  attachments?: MessageAttachment[];
  metadata?: Record<string, unknown>;
}

/**
 * Create Conversation Input
 */
export interface CreateConversationInput {
  agentId: string;
  userId?: string;

  title?: string;
  department?: Department;
  channel?: string;

  // Initial context
  context?: Partial<ConversationContext>;

  metadata?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Update Conversation Input
 */
export interface UpdateConversationInput {
  id: string;

  title?: string;
  summary?: string;
  isActive?: boolean;
  endedAt?: Date;

  satisfactionScore?: number;

  metadata?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Conversation Filters
 */
export interface ConversationFilters {
  agentId?: string;
  userId?: string;
  department?: Department;
  channel?: string;
  isActive?: boolean;

  startedAfter?: Date;
  startedBefore?: Date;

  tags?: string[];
  search?: string;
}

/**
 * Message Stream Chunk
 */
export interface MessageStreamChunk {
  conversationId: string;
  messageId: string;

  type: 'content' | 'tool_call' | 'done' | 'error';
  content?: string;
  toolCall?: Partial<ToolCall>;
  error?: {
    code: string;
    message: string;
  };

  // Accumulated content
  fullContent?: string;

  // Metrics
  tokenCount?: number;
  latencyMs?: number;
}

/**
 * Chat Completion Request
 */
export interface ChatCompletionRequest {
  conversationId?: string;
  agentId: string;

  // Input
  message: string;
  attachments?: MessageAttachment[];

  // Context
  systemPrompt?: string;
  contextMessages?: Message[];

  // Configuration overrides
  temperature?: number;
  maxTokens?: number;

  // Streaming
  stream?: boolean;

  // Tools
  tools?: string[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };

  // User info
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Chat Completion Response
 */
export interface ChatCompletionResponse {
  conversationId: string;
  messageId: string;

  // Response
  content: string;
  role: MessageRole;

  // Tool calls
  toolCalls?: ToolCall[];
  toolResults?: Record<string, unknown>;

  // Metrics
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;

  // Classification
  intent?: string;
  sentiment?: string;

  // Follow-up
  suggestedResponses?: string[];
  requiresFollowUp?: boolean;

  metadata?: Record<string, unknown>;
}

/**
 * Conversation Summary
 */
export interface ConversationSummary {
  id: string;
  conversationId: string;

  summary: string;
  keyPoints: string[];
  mainTopics: string[];

  // Sentiment
  overallSentiment: string;
  sentimentProgression: Array<{
    timestamp: Date;
    sentiment: string;
    score: number;
  }>;

  // Outcomes
  resolved: boolean;
  resolutionNotes?: string;
  actionItems: string[];

  // Entities mentioned
  entities: Array<{
    type: string;
    value: string;
    mentions: number;
  }>;

  generatedAt: Date;
}
