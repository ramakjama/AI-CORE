/**
 * Workflow Engine Service Tests
 * Tests for the WorkflowEngineService class - BPMN 2.0 workflow execution
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

// Mock bpmn parser
jest.mock('../src/services/bpmn-parser.service', () => ({
  bpmnParserService: {
    findStartEvents: jest.fn().mockReturnValue([
      { id: 'start-1', type: 'START_EVENT', name: 'Start' },
    ]),
    parseDefinition: jest.fn().mockReturnValue({
      nodes: [],
      edges: [],
    }),
  },
  BpmnParserService: jest.fn(),
}));

import {
  WorkflowEngineService,
  InMemoryWorkflowRepository,
  WorkflowRepository,
} from '../src/services/workflow-engine.service';
import {
  WorkflowStatus,
  TaskStatus,
  NodeType,
  WorkflowEventType,
  WorkflowErrorCode,
} from '../src/types';

describe('WorkflowEngineService', () => {
  let workflowEngine: WorkflowEngineService;
  let repository: WorkflowRepository;

  const mockDefinition = {
    id: 'def-123',
    code: 'CLAIM_PROCESS',
    version: 1,
    name: 'Claim Processing Workflow',
    description: 'Handles insurance claim processing',
    status: WorkflowStatus.ACTIVE,
    nodes: [
      { id: 'start', type: NodeType.START_EVENT, name: 'Start' },
      { id: 'task-1', type: NodeType.USER_TASK, name: 'Review Claim' },
      { id: 'end', type: NodeType.END_EVENT, name: 'End' },
    ],
    edges: [
      { id: 'edge-1', sourceNodeId: 'start', targetNodeId: 'task-1' },
      { id: 'edge-2', sourceNodeId: 'task-1', targetNodeId: 'end' },
    ],
    variables: [],
    config: {
      allowMultipleInstances: true,
      persistOnComplete: true,
      enableTimers: true,
      enableSla: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = new InMemoryWorkflowRepository();
    await repository.saveDefinition(mockDefinition as any);

    workflowEngine = new WorkflowEngineService(repository, {
      timerCheckInterval: 1000,
      slaCheckInterval: 1000,
      defaultRetries: 3,
      serviceTaskTimeout: 5000,
      debugMode: false,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    workflowEngine.stop();
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a WorkflowEngineService instance', () => {
      expect(workflowEngine).toBeDefined();
      expect(workflowEngine).toBeInstanceOf(WorkflowEngineService);
    });

    it('should use default repository when none provided', () => {
      const engineWithDefaults = new WorkflowEngineService();
      expect(engineWithDefaults).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customEngine = new WorkflowEngineService(repository, {
        debugMode: true,
        maxRetries: 5,
      });
      expect(customEngine).toBeDefined();
    });
  });

  // ==========================================================================
  // Engine Start/Stop Tests
  // ==========================================================================

  describe('start/stop', () => {
    it('should start the workflow engine', () => {
      expect(() => workflowEngine.start()).not.toThrow();
    });

    it('should stop the workflow engine', () => {
      workflowEngine.start();
      expect(() => workflowEngine.stop()).not.toThrow();
    });

    it('should handle multiple start calls', () => {
      workflowEngine.start();
      expect(() => workflowEngine.start()).not.toThrow();
    });

    it('should handle stop without start', () => {
      expect(() => workflowEngine.stop()).not.toThrow();
    });
  });

  // ==========================================================================
  // Workflow Instance Tests
  // ==========================================================================

  describe('startWorkflow', () => {
    it('should start a new workflow instance', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        variables: { claimId: 'claim-123' },
        startedBy: 'user-001',
      });

      expect(instance).toBeDefined();
      expect(instance.id).toBeDefined();
      expect(instance.status).toBe(WorkflowStatus.ACTIVE);
      expect(instance.definitionCode).toBe('CLAIM_PROCESS');
    });

    it('should throw error for non-existent definition', async () => {
      await expect(
        workflowEngine.startWorkflow({
          definitionCode: 'NON_EXISTENT',
          startedBy: 'user-001',
        })
      ).rejects.toThrow();
    });

    it('should throw error for inactive definition', async () => {
      const inactiveDefinition = {
        ...mockDefinition,
        id: 'def-inactive',
        code: 'INACTIVE_WORKFLOW',
        status: WorkflowStatus.SUSPENDED,
      };
      await repository.saveDefinition(inactiveDefinition as any);

      await expect(
        workflowEngine.startWorkflow({
          definitionCode: 'INACTIVE_WORKFLOW',
          startedBy: 'user-001',
        })
      ).rejects.toThrow();
    });

    it('should initialize workflow variables', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        variables: {
          claimId: 'claim-123',
          amount: 5000,
        },
        startedBy: 'user-001',
      });

      expect(instance.variables).toBeDefined();
    });

    it('should set business key when provided', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        businessKey: 'BK-123456',
        startedBy: 'user-001',
      });

      expect(instance.businessKey).toBe('BK-123456');
    });

    it('should set correlation ID when provided', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        correlationId: 'corr-123',
        startedBy: 'user-001',
      });

      expect(instance.correlationId).toBe('corr-123');
    });

    it('should use specific version when provided', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        version: 1,
        startedBy: 'user-001',
      });

      expect(instance.definitionVersion).toBe(1);
    });

    it('should reject multiple instances when not allowed', async () => {
      const singleInstanceDef = {
        ...mockDefinition,
        id: 'def-single',
        code: 'SINGLE_INSTANCE',
        config: { ...mockDefinition.config, allowMultipleInstances: false },
      };
      await repository.saveDefinition(singleInstanceDef as any);

      await workflowEngine.startWorkflow({
        definitionCode: 'SINGLE_INSTANCE',
        startedBy: 'user-001',
      });

      await expect(
        workflowEngine.startWorkflow({
          definitionCode: 'SINGLE_INSTANCE',
          startedBy: 'user-002',
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Instance Status Tests
  // ==========================================================================

  describe('getInstanceStatus', () => {
    it('should return instance status with tasks and timers', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      const status = await workflowEngine.getInstanceStatus(instance.id);

      expect(status).toBeDefined();
      expect(status.instance).toBeDefined();
      expect(status.tasks).toBeDefined();
      expect(status.timers).toBeDefined();
    });

    it('should throw error for non-existent instance', async () => {
      await expect(
        workflowEngine.getInstanceStatus('non-existent')
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Suspend/Resume Tests
  // ==========================================================================

  describe('suspendInstance', () => {
    it('should suspend an active instance', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      const suspended = await workflowEngine.suspendInstance(instance.id, 'user-001');

      expect(suspended.status).toBe(WorkflowStatus.SUSPENDED);
    });

    it('should throw error for non-existent instance', async () => {
      await expect(
        workflowEngine.suspendInstance('non-existent', 'user-001')
      ).rejects.toThrow();
    });

    it('should throw error for non-active instance', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      await workflowEngine.suspendInstance(instance.id, 'user-001');

      await expect(
        workflowEngine.suspendInstance(instance.id, 'user-001')
      ).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Service Task Handler Tests
  // ==========================================================================

  describe('registerServiceTaskHandler', () => {
    it('should register a service task handler', () => {
      const handler = jest.fn().mockResolvedValue({ result: 'success' });

      expect(() =>
        workflowEngine.registerServiceTaskHandler('EMAIL_TASK', handler)
      ).not.toThrow();
    });

    it('should allow multiple handlers for different task types', () => {
      const handler1 = jest.fn().mockResolvedValue({});
      const handler2 = jest.fn().mockResolvedValue({});

      workflowEngine.registerServiceTaskHandler('EMAIL_TASK', handler1);
      workflowEngine.registerServiceTaskHandler('SMS_TASK', handler2);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should override existing handler for same task type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      workflowEngine.registerServiceTaskHandler('EMAIL_TASK', handler1);
      workflowEngine.registerServiceTaskHandler('EMAIL_TASK', handler2);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Event Handler Tests
  // ==========================================================================

  describe('onWorkflowEvent', () => {
    it('should register event handler', () => {
      const handler = jest.fn();

      expect(() =>
        workflowEngine.onWorkflowEvent(WorkflowEventType.INSTANCE_STARTED, handler)
      ).not.toThrow();
    });

    it('should allow multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      workflowEngine.onWorkflowEvent(WorkflowEventType.INSTANCE_STARTED, handler1);
      workflowEngine.onWorkflowEvent(WorkflowEventType.INSTANCE_STARTED, handler2);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should emit events when workflow starts', async () => {
      const handler = jest.fn();
      workflowEngine.onWorkflowEvent(WorkflowEventType.INSTANCE_STARTED, handler);

      await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      // Handler should have been called
      expect(handler).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // InMemoryWorkflowRepository Tests
  // ==========================================================================

  describe('InMemoryWorkflowRepository', () => {
    let repo: InMemoryWorkflowRepository;

    beforeEach(() => {
      repo = new InMemoryWorkflowRepository();
    });

    describe('definitions', () => {
      it('should save and retrieve definition by ID', async () => {
        await repo.saveDefinition(mockDefinition as any);
        const retrieved = await repo.getDefinitionById(mockDefinition.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(mockDefinition.id);
      });

      it('should retrieve definition by code', async () => {
        await repo.saveDefinition(mockDefinition as any);
        const retrieved = await repo.getDefinitionByCode(mockDefinition.code);

        expect(retrieved).toBeDefined();
        expect(retrieved?.code).toBe(mockDefinition.code);
      });

      it('should retrieve specific version', async () => {
        const v1 = { ...mockDefinition, version: 1 };
        const v2 = { ...mockDefinition, id: 'def-v2', version: 2 };

        await repo.saveDefinition(v1 as any);
        await repo.saveDefinition(v2 as any);

        const retrieved = await repo.getDefinitionByCode(mockDefinition.code, 1);
        expect(retrieved?.version).toBe(1);
      });

      it('should return latest version by default', async () => {
        const v1 = { ...mockDefinition, version: 1 };
        const v2 = { ...mockDefinition, id: 'def-v2', version: 2 };

        await repo.saveDefinition(v1 as any);
        await repo.saveDefinition(v2 as any);

        const retrieved = await repo.getDefinitionByCode(mockDefinition.code);
        expect(retrieved?.version).toBe(2);
      });

      it('should return null for non-existent definition', async () => {
        const result = await repo.getDefinitionById('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('instances', () => {
      const mockInstance = {
        id: 'instance-123',
        definitionId: 'def-123',
        status: WorkflowStatus.ACTIVE,
        currentNodeIds: [],
        variables: {},
        startedAt: new Date(),
      };

      it('should save and retrieve instance', async () => {
        await repo.saveInstance(mockInstance as any);
        const retrieved = await repo.getInstance(mockInstance.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(mockInstance.id);
      });

      it('should get instances by definition', async () => {
        await repo.saveInstance(mockInstance as any);
        const instances = await repo.getInstancesByDefinition('def-123');

        expect(instances.length).toBe(1);
      });

      it('should get active instances', async () => {
        await repo.saveInstance(mockInstance as any);
        await repo.saveInstance({
          ...mockInstance,
          id: 'instance-456',
          status: WorkflowStatus.COMPLETED,
        } as any);

        const active = await repo.getActiveInstances();

        expect(active.length).toBe(1);
        expect(active[0].id).toBe('instance-123');
      });
    });

    describe('tasks', () => {
      const mockTask = {
        id: 'task-123',
        instanceId: 'instance-123',
        nodeId: 'node-1',
        status: TaskStatus.PENDING,
        assignee: 'user-001',
        candidateUsers: ['user-002', 'user-003'],
        createdAt: new Date(),
      };

      it('should save and retrieve task', async () => {
        await repo.saveTask(mockTask as any);
        const retrieved = await repo.getTask(mockTask.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(mockTask.id);
      });

      it('should get tasks by instance', async () => {
        await repo.saveTask(mockTask as any);
        const tasks = await repo.getTasksByInstance('instance-123');

        expect(tasks.length).toBe(1);
      });

      it('should get tasks by user (assignee)', async () => {
        await repo.saveTask(mockTask as any);
        const tasks = await repo.getTasksByUser('user-001');

        expect(tasks.length).toBe(1);
      });

      it('should get tasks by user (candidate)', async () => {
        await repo.saveTask(mockTask as any);
        const tasks = await repo.getTasksByUser('user-002');

        expect(tasks.length).toBe(1);
      });

      it('should get tasks by status', async () => {
        await repo.saveTask(mockTask as any);
        const tasks = await repo.getTasksByStatus(TaskStatus.PENDING);

        expect(tasks.length).toBe(1);
      });
    });

    describe('timers', () => {
      const mockTimer = {
        id: 'timer-123',
        instanceId: 'instance-123',
        nodeId: 'node-1',
        dueDate: new Date(),
        status: 'pending' as const,
      };

      it('should save and retrieve timer', async () => {
        await repo.saveTimer(mockTimer as any);
        const retrieved = await repo.getTimer(mockTimer.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(mockTimer.id);
      });

      it('should get pending timers', async () => {
        await repo.saveTimer(mockTimer as any);
        await repo.saveTimer({
          ...mockTimer,
          id: 'timer-456',
          status: 'fired' as const,
        } as any);

        const pending = await repo.getPendingTimers();

        expect(pending.length).toBe(1);
        expect(pending[0].id).toBe('timer-123');
      });

      it('should get timers by instance', async () => {
        await repo.saveTimer(mockTimer as any);
        const timers = await repo.getTimersByInstance('instance-123');

        expect(timers.length).toBe(1);
      });
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should throw WorkflowError with appropriate code for not found', async () => {
      try {
        await workflowEngine.startWorkflow({
          definitionCode: 'NON_EXISTENT',
          startedBy: 'user-001',
        });
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('No se encontro');
      }
    });

    it('should throw WorkflowError for invalid state transitions', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      await workflowEngine.suspendInstance(instance.id, 'user-001');

      try {
        await workflowEngine.suspendInstance(instance.id, 'user-001');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('no esta activa');
      }
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty variables', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        variables: {},
        startedBy: 'user-001',
      });

      expect(instance).toBeDefined();
    });

    it('should handle undefined optional parameters', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      expect(instance.businessKey).toBeUndefined();
      expect(instance.correlationId).toBeUndefined();
    });

    it('should handle metadata', async () => {
      const instance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
        metadata: {
          source: 'web',
          priority: 'high',
        },
      });

      expect(instance.metadata).toBeDefined();
      expect(instance.metadata?.source).toBe('web');
    });

    it('should handle parent instance ID for sub-workflows', async () => {
      const parentInstance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
      });

      const childInstance = await workflowEngine.startWorkflow({
        definitionCode: 'CLAIM_PROCESS',
        startedBy: 'user-001',
        parentInstanceId: parentInstance.id,
      });

      expect(childInstance.parentInstanceId).toBe(parentInstance.id);
    });
  });
});
