/**
 * AI-CORE - Agent Types
 */

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools?: AgentTool[];
  isActive: boolean;
}

export type AgentType = 
  | 'cfo'
  | 'claims'
  | 'hr'
  | 'sales'
  | 'operations'
  | 'customer-service'
  | 'compliance'
  | 'risk'
  | 'marketing';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (args: any) => Promise<any>;
}

export interface AgentMemory {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  context: Record<string, any>;
  metadata: Record<string, any>;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  tokensUsed?: number;
  cost?: number;
  error?: string;
}

export interface AgentMetrics {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  totalTokensUsed: number;
  totalCost: number;
  lastExecutedAt?: Date;
}
