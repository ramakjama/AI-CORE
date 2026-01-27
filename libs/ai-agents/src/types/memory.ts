/**
 * Memory Types
 * Interfaces for short-term and long-term memory management
 */

/**
 * Memory Type
 */
export enum MemoryType {
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural',
}

/**
 * Memory Entry
 */
export interface MemoryEntry {
  id: string;
  conversationId?: string;
  userId?: string;
  agentId?: string;

  // Content
  key: string;
  value: string;
  category?: string;

  // Type
  type: MemoryType;

  // Importance (1-10)
  importance: number;
  isPinned: boolean;

  // Embedding for semantic search
  embedding?: number[];
  embeddingModel?: string;

  // Validity
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Access tracking
  accessCount: number;
  lastAccessedAt?: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Short-term Memory (Conversation Context)
 */
export interface ShortTermMemory {
  conversationId: string;

  // Recent messages window
  recentMessages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;

  // Working memory
  workingMemory: Record<string, unknown>;

  // Current context
  currentContext: {
    topic?: string;
    intent?: string;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
    sentiment?: string;
    urgency?: number;
  };

  // Pending tasks
  pendingTasks: Array<{
    id: string;
    description: string;
    priority: number;
    createdAt: Date;
  }>;

  // Token budget
  tokenCount: number;
  maxTokens: number;

  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
}

/**
 * Long-term Memory
 */
export interface LongTermMemory {
  userId: string;
  agentId?: string;

  // User profile
  userProfile: {
    name?: string;
    preferences: Record<string, unknown>;
    communicationStyle?: string;
    expertise?: string[];
    language?: string;
  };

  // Interaction history
  interactionSummary: {
    totalConversations: number;
    totalMessages: number;
    averageSatisfaction?: number;
    commonTopics: Array<{
      topic: string;
      frequency: number;
    }>;
    lastInteraction?: Date;
  };

  // Important facts
  facts: Array<{
    id: string;
    fact: string;
    category: string;
    confidence: number;
    source: string;
    createdAt: Date;
  }>;

  // Preferences learned
  learnedPreferences: Array<{
    key: string;
    value: unknown;
    confidence: number;
    observedCount: number;
    lastObserved: Date;
  }>;

  // Important dates
  importantDates: Array<{
    date: Date;
    description: string;
    recurring: boolean;
    notifyBefore?: number;
  }>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Episodic Memory (Specific Events/Conversations)
 */
export interface EpisodicMemory {
  id: string;
  userId?: string;
  conversationId?: string;

  // Episode details
  title: string;
  summary: string;
  keyMoments: Array<{
    timestamp: Date;
    description: string;
    importance: number;
  }>;

  // Emotional context
  emotionalContext: {
    startSentiment?: string;
    endSentiment?: string;
    peakEmotion?: string;
    resolution?: string;
  };

  // Outcomes
  outcome: {
    resolved: boolean;
    satisfaction?: number;
    actionsTaken: string[];
    followUpRequired: boolean;
  };

  // Links to other memories
  relatedEpisodes: string[];
  relatedFacts: string[];

  // Timestamps
  occurredAt: Date;
  recalledAt?: Date;
  recallCount: number;
}

/**
 * Memory Search Query
 */
export interface MemorySearchQuery {
  // Filters
  userId?: string;
  agentId?: string;
  conversationId?: string;
  type?: MemoryType;
  category?: string;

  // Search
  query?: string;
  embedding?: number[];

  // Relevance
  minImportance?: number;
  minSimilarity?: number;

  // Pagination
  limit?: number;
  offset?: number;

  // Time range
  createdAfter?: Date;
  createdBefore?: Date;

  // Include expired
  includeExpired?: boolean;
}

/**
 * Memory Search Result
 */
export interface MemorySearchResult {
  memory: MemoryEntry;
  similarity?: number;
  relevanceScore?: number;
}

/**
 * Create Memory Input
 */
export interface CreateMemoryInput {
  conversationId?: string;
  userId?: string;
  agentId?: string;

  key: string;
  value: string;
  category?: string;

  type?: MemoryType;
  importance?: number;
  isPinned?: boolean;

  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Update Memory Input
 */
export interface UpdateMemoryInput {
  id: string;

  value?: string;
  category?: string;
  importance?: number;
  isPinned?: boolean;
  expiresAt?: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Memory Consolidation Result
 */
export interface MemoryConsolidationResult {
  processedCount: number;
  consolidatedCount: number;
  expiredCount: number;
  newLongTermMemories: string[];
  errors: Array<{
    memoryId: string;
    error: string;
  }>;
}

/**
 * Memory Statistics
 */
export interface MemoryStatistics {
  userId?: string;
  agentId?: string;

  totalMemories: number;
  byType: Record<MemoryType, number>;
  byCategory: Record<string, number>;

  averageImportance: number;
  pinnedCount: number;
  expiringCount: number;

  oldestMemory?: Date;
  newestMemory?: Date;

  totalTokens: number;
}

/**
 * Memory Context for Agent
 */
export interface MemoryContext {
  // Short-term context
  shortTerm: ShortTermMemory;

  // Relevant long-term memories
  relevantMemories: MemoryEntry[];

  // User profile summary
  userProfile?: LongTermMemory['userProfile'];

  // Recent episodes
  recentEpisodes?: EpisodicMemory[];

  // Token usage
  totalTokens: number;
  tokenBudget: number;
}
