// Base Agent - Abstract class for all specialized agents

import type { AgentDefinition, AgentInstance, AgentMessage, AgentTool, AgentContext } from '../types';

export abstract class BaseAgent {
  protected definition: AgentDefinition;
  protected instance: AgentInstance | null = null;
  protected messages: AgentMessage[] = [];
  protected tools: Map<string, AgentTool> = new Map();

  constructor(definition: AgentDefinition) {
    this.definition = definition;
  }

  get id(): string { return this.definition.id; }
  get type(): string { return this.definition.type; }
  get name(): string { return this.definition.name; }

  async initialize(context: AgentContext): Promise<AgentInstance> {
    this.instance = {
      id: this.generateId(),
      agentId: this.definition.id,
      status: 'ACTIVE',
      context,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      turnCount: 0,
      metadata: {},
    };

    // Add system message
    this.messages.push({
      id: this.generateId(),
      instanceId: this.instance.id,
      role: 'system',
      content: this.definition.systemPrompt,
      timestamp: new Date(),
    });

    return this.instance;
  }

  async processMessage(content: string): Promise<AgentMessage> {
    if (!this.instance) throw new Error('Agent not initialized');

    // Add user message
    const userMessage: AgentMessage = {
      id: this.generateId(),
      instanceId: this.instance.id,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    this.messages.push(userMessage);

    // Update instance
    this.instance.lastActivityAt = new Date();
    this.instance.turnCount++;

    // Check turn limit
    if (this.instance.turnCount >= this.definition.maxTurns) {
      return this.createSystemMessage('Se ha alcanzado el límite de turnos. Transfiriendo a un agente humano.');
    }

    // Think and respond
    return this.think();
  }

  protected abstract think(): Promise<AgentMessage>;

  registerTools(tools: AgentTool[]): void {
    tools.forEach(tool => this.tools.set(tool.name, tool));
  }

  async executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    return tool.handler(params, this.instance?.context ?? {});
  }

  getConversationHistory(): AgentMessage[] {
    return [...this.messages];
  }

  async terminate(): Promise<void> {
    if (this.instance) {
      this.instance.status = 'COMPLETED';
      this.instance.completedAt = new Date();
    }
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createSystemMessage(content: string): AgentMessage {
    const msg: AgentMessage = {
      id: this.generateId(),
      instanceId: this.instance!.id,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }
}
