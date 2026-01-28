/**
 * AIT-CORE Agent Interfaces
 * Shared interfaces for all AI agents
 */

export interface AgentConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  locale: string;
  metadata?: Record<string, any>;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
