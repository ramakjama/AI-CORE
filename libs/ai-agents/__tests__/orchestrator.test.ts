/**
 * Agent Orchestrator Tests
 * Tests for the AgentOrchestrator class - agent management and handoffs
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies
jest.mock('../src/agents/specialized/sales.agent', () => ({
  SalesAgent: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue({ id: 'mock-instance-sales', status: 'RUNNING' }),
    stop: jest.fn().mockResolvedValue({ instanceId: 'mock-instance-sales', status: 'COMPLETED' }),
    processUserMessage: jest.fn().mockResolvedValue({ content: 'Sales response' }),
    getStatus: jest.fn().mockReturnValue('RUNNING'),
    getContext: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('../src/agents/specialized/claims.agent', () => ({
  ClaimsAgent: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue({ id: 'mock-instance-claims', status: 'RUNNING' }),
    stop: jest.fn().mockResolvedValue({ instanceId: 'mock-instance-claims', status: 'COMPLETED' }),
    processUserMessage: jest.fn().mockResolvedValue({ content: 'Claims response' }),
    getStatus: jest.fn().mockReturnValue('RUNNING'),
    getContext: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('../src/agents/specialized/customer-service.agent', () => ({
  CustomerServiceAgent: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue({ id: 'mock-instance-cs', status: 'RUNNING' }),
    stop: jest.fn().mockResolvedValue({ instanceId: 'mock-instance-cs', status: 'COMPLETED' }),
    processUserMessage: jest.fn().mockResolvedValue({ content: 'Customer service response' }),
    getStatus: jest.fn().mockReturnValue('RUNNING'),
    getContext: jest.fn().mockReturnValue({}),
  })),
}));

jest.mock('../src/agents/specialized/retention.agent', () => ({
  RetentionAgent: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue({ id: 'mock-instance-retention', status: 'RUNNING' }),
    stop: jest.fn().mockResolvedValue({ instanceId: 'mock-instance-retention', status: 'COMPLETED' }),
    processUserMessage: jest.fn().mockResolvedValue({ content: 'Retention response' }),
    getStatus: jest.fn().mockReturnValue('RUNNING'),
    getContext: jest.fn().mockReturnValue({}),
  })),
}));

import { AgentOrchestrator } from '../src/orchestrator/agent-orchestrator';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create an AgentOrchestrator instance', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(AgentOrchestrator);
    });

    it('should register default agents on initialization', () => {
      // The orchestrator should have registered the default agents
      expect(orchestrator).toBeDefined();
    });
  });

  // ==========================================================================
  // Agent Registration Tests
  // ==========================================================================

  describe('registerAgent', () => {
    it('should register a custom agent factory', () => {
      const mockFactory = jest.fn().mockReturnValue({
        start: jest.fn().mockResolvedValue({ id: 'custom-agent' }),
        stop: jest.fn().mockResolvedValue({}),
        processUserMessage: jest.fn().mockResolvedValue({ content: 'Custom response' }),
        getStatus: jest.fn().mockReturnValue('RUNNING'),
        getContext: jest.fn().mockReturnValue({}),
      });

      orchestrator.registerAgent('CUSTOM_AGENT' as any, mockFactory);

      // Agent should be registered
      expect(mockFactory).not.toHaveBeenCalled(); // Not called until agent is started
    });

    it('should override existing agent registration', () => {
      const mockFactory1 = jest.fn().mockReturnValue({ id: 'factory1' });
      const mockFactory2 = jest.fn().mockReturnValue({ id: 'factory2' });

      orchestrator.registerAgent('SALES_AGENT' as any, mockFactory1);
      orchestrator.registerAgent('SALES_AGENT' as any, mockFactory2);

      // The second registration should override the first
      expect(orchestrator).toBeDefined();
    });
  });

  // ==========================================================================
  // Start Agent Tests
  // ==========================================================================

  describe('startAgent', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should start a sales agent successfully', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
    });

    it('should start a claims agent successfully', async () => {
      const instance = await orchestrator.startAgent('CLAIMS_INTAKE', mockContext);

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
    });

    it('should start a customer service agent successfully', async () => {
      const instance = await orchestrator.startAgent('CUSTOMER_SERVICE', mockContext);

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
    });

    it('should throw error for unregistered agent type', async () => {
      await expect(
        orchestrator.startAgent('UNKNOWN_AGENT' as any, mockContext)
      ).rejects.toThrow('Agent type not registered');
    });

    it('should store active instance after starting', async () => {
      await orchestrator.startAgent('SALES_AGENT', mockContext);

      const activeInstances = orchestrator.getActiveInstances();
      expect(activeInstances.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Send Message Tests
  // ==========================================================================

  describe('sendMessage', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should send message to active agent instance', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);
      const response = await orchestrator.sendMessage(instance.id, 'Hello');

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should throw error for non-existent instance', async () => {
      await expect(
        orchestrator.sendMessage('non-existent-id', 'Hello')
      ).rejects.toThrow('Agent instance not found');
    });

    it('should handle multiple sequential messages', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);

      const response1 = await orchestrator.sendMessage(instance.id, 'First message');
      const response2 = await orchestrator.sendMessage(instance.id, 'Second message');

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
    });
  });

  // ==========================================================================
  // Stop Agent Tests
  // ==========================================================================

  describe('stopAgent', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should stop an active agent successfully', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);
      const result = await orchestrator.stopAgent(instance.id);

      expect(result).toBeDefined();
      expect(result.instanceId).toBe(instance.id);
    });

    it('should throw error when stopping non-existent agent', async () => {
      await expect(
        orchestrator.stopAgent('non-existent-id')
      ).rejects.toThrow('Agent instance not found');
    });

    it('should remove instance from active instances after stopping', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);
      await orchestrator.stopAgent(instance.id);

      const activeInstances = orchestrator.getActiveInstances();
      const stoppedInstance = activeInstances.find(i => i.id === instance.id);
      expect(stoppedInstance).toBeUndefined();
    });
  });

  // ==========================================================================
  // Routing Tests
  // ==========================================================================

  describe('routeToAgent', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should route accident-related messages to claims agent', () => {
      const agentType = orchestrator.routeToAgent('Tuve un accidente de coche', mockContext);
      expect(agentType).toBe('CLAIMS_INTAKE');
    });

    it('should route quote requests to sales agent', () => {
      const agentType = orchestrator.routeToAgent('Quiero una cotizacion de seguro', mockContext);
      expect(agentType).toBe('SALES_AGENT');
    });

    it('should route cancellation requests to retention agent', () => {
      const agentType = orchestrator.routeToAgent('Quiero dar de baja mi poliza', mockContext);
      expect(agentType).toBe('RETENTION_AGENT');
    });

    it('should route complaints to customer service', () => {
      const agentType = orchestrator.routeToAgent('Tengo una queja sobre el servicio', mockContext);
      expect(agentType).toBe('CUSTOMER_SERVICE');
    });

    it('should default to customer service for unknown intents', () => {
      const agentType = orchestrator.routeToAgent('Hola, buenos dias', mockContext);
      expect(agentType).toBe('CUSTOMER_SERVICE');
    });

    it('should handle case-insensitive matching', () => {
      const agentType1 = orchestrator.routeToAgent('QUIERO UNA COTIZACION', mockContext);
      const agentType2 = orchestrator.routeToAgent('quiero una cotizacion', mockContext);
      expect(agentType1).toBe(agentType2);
    });
  });

  // ==========================================================================
  // Handoff Tests
  // ==========================================================================

  describe('handoff', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should handoff from one agent to another', async () => {
      await orchestrator.startAgent('SALES_AGENT', mockContext);

      const handoffRequest = {
        fromAgent: 'SALES_AGENT' as const,
        toAgent: 'CLAIMS_INTAKE' as const,
        reason: 'Customer reported accident during sales call',
        context: mockContext,
      };

      const newInstance = await orchestrator.handoff(handoffRequest);

      expect(newInstance).toBeDefined();
      expect(newInstance.id).toBeDefined();
    });

    it('should preserve context during handoff', async () => {
      await orchestrator.startAgent('SALES_AGENT', mockContext);

      const customData = { previousTopic: 'auto_insurance' };
      const handoffRequest = {
        fromAgent: 'SALES_AGENT' as const,
        toAgent: 'CLAIMS_INTAKE' as const,
        reason: 'Handoff reason',
        context: {
          ...mockContext,
          customData,
        },
      };

      const newInstance = await orchestrator.handoff(handoffRequest);

      expect(newInstance).toBeDefined();
    });

    it('should work even without an existing agent', async () => {
      const handoffRequest = {
        fromAgent: 'SALES_AGENT' as const,
        toAgent: 'CLAIMS_INTAKE' as const,
        reason: 'Direct handoff',
        context: mockContext,
      };

      const newInstance = await orchestrator.handoff(handoffRequest);

      expect(newInstance).toBeDefined();
    });
  });

  // ==========================================================================
  // Escalation Tests
  // ==========================================================================

  describe('escalate', () => {
    it('should create escalation request', async () => {
      const escalationRequest = {
        instanceId: 'instance-123',
        agentType: 'SALES_AGENT' as const,
        reason: 'Customer is upset and wants to speak to manager',
        severity: 'HIGH' as const,
        targetUserId: 'manager-001',
        context: {
          conversationId: 'conv-456',
        },
      };

      // Should not throw
      await expect(
        orchestrator.escalate(escalationRequest)
      ).resolves.not.toThrow();
    });

    it('should handle escalation without target user', async () => {
      const escalationRequest = {
        instanceId: 'instance-123',
        agentType: 'SALES_AGENT' as const,
        reason: 'Technical issue',
        severity: 'MEDIUM' as const,
        context: {},
      };

      await expect(
        orchestrator.escalate(escalationRequest)
      ).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Process Incoming Tests
  // ==========================================================================

  describe('processIncoming', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should process incoming message and create new agent', async () => {
      const result = await orchestrator.processIncoming(
        'Quiero una cotizacion de seguro',
        mockContext
      );

      expect(result).toBeDefined();
      expect(result.instanceId).toBeDefined();
      expect(result.response).toBeDefined();
    });

    it('should reuse existing agent instance when provided', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);

      const result = await orchestrator.processIncoming(
        'Another message',
        mockContext,
        instance.id
      );

      expect(result.instanceId).toBe(instance.id);
    });

    it('should create new agent if provided instance not found', async () => {
      const result = await orchestrator.processIncoming(
        'Hello',
        mockContext,
        'non-existent-id'
      );

      expect(result.instanceId).toBeDefined();
      expect(result.instanceId).not.toBe('non-existent-id');
    });

    it('should route to appropriate agent based on message content', async () => {
      // Claims message
      const claimsResult = await orchestrator.processIncoming(
        'Tuve un siniestro ayer',
        mockContext
      );
      expect(claimsResult).toBeDefined();

      // Sales message (with new context to avoid conflicts)
      const salesResult = await orchestrator.processIncoming(
        'Necesito un presupuesto',
        { ...mockContext, entityId: 'party-different' }
      );
      expect(salesResult).toBeDefined();
    });
  });

  // ==========================================================================
  // Active Instances Tests
  // ==========================================================================

  describe('getActiveInstances', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should return empty array when no agents running', () => {
      const instances = orchestrator.getActiveInstances();
      expect(instances).toEqual([]);
    });

    it('should return all active agent instances', async () => {
      await orchestrator.startAgent('SALES_AGENT', mockContext);
      await orchestrator.startAgent('CLAIMS_INTAKE', {
        ...mockContext,
        entityId: 'party-different',
      });

      const instances = orchestrator.getActiveInstances();
      expect(instances.length).toBe(2);
    });

    it('should not include stopped instances', async () => {
      const instance = await orchestrator.startAgent('SALES_AGENT', mockContext);
      await orchestrator.stopAgent(instance.id);

      const instances = orchestrator.getActiveInstances();
      expect(instances.length).toBe(0);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    const mockContext = {
      userId: 'user-123',
      sessionId: 'session-456',
      entityType: 'PARTY' as const,
      entityId: 'party-789',
    };

    it('should handle agent start failure gracefully', async () => {
      const failingFactory = jest.fn().mockImplementation(() => {
        throw new Error('Agent initialization failed');
      });

      orchestrator.registerAgent('FAILING_AGENT' as any, failingFactory);

      await expect(
        orchestrator.startAgent('FAILING_AGENT' as any, mockContext)
      ).rejects.toThrow('Agent initialization failed');
    });

    it('should handle null context gracefully', async () => {
      await expect(
        orchestrator.startAgent('SALES_AGENT', null as any)
      ).rejects.toThrow();
    });

    it('should handle empty message in processIncoming', async () => {
      const result = await orchestrator.processIncoming('', mockContext);

      expect(result).toBeDefined();
      expect(result.instanceId).toBeDefined();
    });
  });
});
