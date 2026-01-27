// Agent Orchestrator - Manages multiple agents and handoffs

import type {
  AgentType,
  AgentContext,
  AgentInstance,
  AgentExecutionResult,
  HandoffRequest,
  EscalationRequest,
} from '../types';
import { BaseAgent } from '../agents/base.agent';
import { SalesAgent } from '../agents/specialized/sales.agent';
import { ClaimsAgent } from '../agents/specialized/claims.agent';
import { CustomerServiceAgent } from '../agents/specialized/customer-service.agent';
import { RetentionAgent } from '../agents/specialized/retention.agent';

export class AgentOrchestrator {
  private agents: Map<AgentType, () => BaseAgent> = new Map();
  private activeInstances: Map<string, BaseAgent> = new Map();
  private handoffQueue: HandoffRequest[] = [];
  private escalationQueue: EscalationRequest[] = [];

  constructor() {
    this.registerDefaultAgents();
  }

  private registerDefaultAgents(): void {
    // Commercial / Sales
    this.agents.set('SALES_AGENT', () => new SalesAgent());
    this.agents.set('LEAD_QUALIFIER', () => new SalesAgent()); // Reuse for now
    this.agents.set('CROSS_SELL_AGENT', () => new SalesAgent());
    this.agents.set('QUOTE_GENERATOR', () => new SalesAgent());

    // Customer Service
    this.agents.set('CUSTOMER_SERVICE', () => new CustomerServiceAgent());
    this.agents.set('CLAIMS_INTAKE', () => new ClaimsAgent());
    this.agents.set('CLAIMS_PROCESSOR', () => new ClaimsAgent());
    this.agents.set('RETENTION_AGENT', () => new RetentionAgent());

    // More agents can be registered dynamically
  }

  registerAgent(type: AgentType, factory: () => BaseAgent): void {
    this.agents.set(type, factory);
  }

  async startAgent(
    type: AgentType,
    context: AgentContext
  ): Promise<AgentInstance> {
    const factory = this.agents.get(type);
    if (!factory) {
      throw new Error(`Agent type not registered: ${type}`);
    }

    const agent = factory();
    const instance = await agent.start(context);

    this.activeInstances.set(instance.id, agent);

    return instance;
  }

  async sendMessage(instanceId: string, message: string): Promise<string> {
    const agent = this.activeInstances.get(instanceId);
    if (!agent) {
      throw new Error(`Agent instance not found: ${instanceId}`);
    }

    const response = await agent.processUserMessage(message);
    return response.content;
  }

  async stopAgent(instanceId: string): Promise<AgentExecutionResult> {
    const agent = this.activeInstances.get(instanceId);
    if (!agent) {
      throw new Error(`Agent instance not found: ${instanceId}`);
    }

    const result = await agent.stop();
    this.activeInstances.delete(instanceId);

    // Save to database
    await this.saveAgentResult(result);

    return result;
  }

  async handoff(request: HandoffRequest): Promise<AgentInstance> {
    // Stop current agent if running
    const currentAgent = Array.from(this.activeInstances.entries())
      .find(([_, agent]) => agent.getContext()?.entityId === request.context.entityId);

    if (currentAgent) {
      await this.stopAgent(currentAgent[0]);
    }

    // Log handoff
    console.log(`Handoff from ${request.fromAgent} to ${request.toAgent}: ${request.reason}`);

    // Start new agent with enriched context
    return this.startAgent(request.toAgent, {
      ...request.context,
      customData: {
        ...request.context.customData,
        handoffFrom: request.fromAgent,
        handoffReason: request.reason,
      },
    });
  }

  async escalate(request: EscalationRequest): Promise<void> {
    this.escalationQueue.push(request);

    // Create ticket in sm_tickets
    console.log(`Escalation created: ${request.severity} - ${request.reason}`);

    // Notify target user/role
    if (request.targetUserId) {
      // Send notification
    }
  }

  routeToAgent(message: string, context: AgentContext): AgentType {
    const lowerMessage = message.toLowerCase();

    // Intent detection
    if (lowerMessage.includes('siniestro') || lowerMessage.includes('accidente') || lowerMessage.includes('parte')) {
      return 'CLAIMS_INTAKE';
    }

    if (lowerMessage.includes('cotización') || lowerMessage.includes('presupuesto') || lowerMessage.includes('contratar')) {
      return 'SALES_AGENT';
    }

    if (lowerMessage.includes('baja') || lowerMessage.includes('cancelar') || lowerMessage.includes('anular')) {
      return 'RETENTION_AGENT';
    }

    if (lowerMessage.includes('queja') || lowerMessage.includes('reclamación')) {
      return 'CUSTOMER_SERVICE';
    }

    // Default to general customer service
    return 'CUSTOMER_SERVICE';
  }

  async processIncoming(
    message: string,
    context: AgentContext,
    existingInstanceId?: string
  ): Promise<{ instanceId: string; response: string }> {
    let instanceId = existingInstanceId;
    let agent: BaseAgent | undefined;

    if (instanceId) {
      agent = this.activeInstances.get(instanceId);
    }

    if (!agent) {
      // Route to appropriate agent
      const agentType = this.routeToAgent(message, context);
      const instance = await this.startAgent(agentType, context);
      instanceId = instance.id;
      agent = this.activeInstances.get(instanceId)!;
    }

    const responseMessage = await agent.processUserMessage(message);

    return {
      instanceId: instanceId!,
      response: responseMessage.content,
    };
  }

  getActiveInstances(): AgentInstance[] {
    return Array.from(this.activeInstances.values())
      .map(agent => ({
        id: agent['instance']?.id ?? '',
        definitionId: agent['definition']?.id ?? '',
        conversationId: agent['instance']?.conversationId ?? '',
        status: agent.getStatus(),
        currentStep: agent['instance']?.currentStep ?? 0,
        totalSteps: agent['instance']?.totalSteps ?? 0,
        context: agent.getContext() ?? {},
        startedAt: agent['instance']?.startedAt ?? new Date(),
      }));
  }

  private async saveAgentResult(result: AgentExecutionResult): Promise<void> {
    // TODO: Save to sm_ai_agents database
    console.log('Saving agent result:', result.instanceId);
  }
}

export const agentOrchestrator = new AgentOrchestrator();
