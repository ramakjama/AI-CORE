/**
 * AI Orchestrator Service Unit Tests
 */

import { AIOrchestratorService } from '../orchestrator/ai-orchestrator.service';
import { BaseExpert } from '../base/base-expert';
import { CacheService } from '../services/cache.service';
import { ExpertContext, ExpertResponse } from '../types';

// Mock expert implementation
class MockExpert extends BaseExpert {
  async analyze(context: ExpertContext): Promise<ExpertResponse> {
    return this.createSuccessResponse({
      summary: 'Mock analysis',
      insights: ['Insight 1'],
      recommendations: ['Recommendation 1'],
    });
  }

  async suggest(context: ExpertContext): Promise<ExpertResponse> {
    return this.createSuccessResponse({
      suggestions: [],
      rationale: 'Mock suggestion',
    });
  }

  async execute(action: string, params: any, context: ExpertContext): Promise<ExpertResponse> {
    return this.createSuccessResponse({
      action,
      status: 'success',
      result: params,
      steps: [],
      duration: 100,
    });
  }
}

describe('AIOrchestratorService', () => {
  let orchestrator: AIOrchestratorService;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockExpert1: MockExpert;
  let mockExpert2: MockExpert;

  const testContext: ExpertContext = {
    user: {
      id: 'user-123',
    },
    request: {
      type: 'analysis',
      payload: {},
    },
    environment: {
      name: 'test',
    },
  };

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deletePattern: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    } as any;

    orchestrator = new AIOrchestratorService(mockCacheService, {
      enableCache: false, // Disable cache for tests
      enableLoadBalancing: false,
    });

    // Create mock experts
    mockExpert1 = new MockExpert(
      {
        name: 'expert-1',
        displayName: 'Expert 1',
        description: 'First test expert for analysis',
        model: 'sonnet',
        systemPrompt: 'You are expert 1',
        tags: ['analysis', 'test'],
        priority: 10,
      },
      null as any,
      null as any,
    );

    mockExpert2 = new MockExpert(
      {
        name: 'expert-2',
        displayName: 'Expert 2',
        description: 'Second test expert for suggestions',
        model: 'haiku',
        systemPrompt: 'You are expert 2',
        tags: ['suggestion', 'test'],
        priority: 5,
      },
      null as any,
      null as any,
    );

    // Mock the process method
    jest.spyOn(mockExpert1, 'process').mockResolvedValue({
      success: true,
      data: { summary: 'Expert 1 result', insights: [], recommendations: [] },
      metadata: {
        expertName: 'expert-1',
        model: 'sonnet',
        timestamp: new Date(),
        responseTime: 100,
        cached: false,
      },
    });

    jest.spyOn(mockExpert2, 'process').mockResolvedValue({
      success: true,
      data: { summary: 'Expert 2 result', insights: [], recommendations: [] },
      metadata: {
        expertName: 'expert-2',
        model: 'haiku',
        timestamp: new Date(),
        responseTime: 50,
        cached: false,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerExpert', () => {
    it('should register an expert', () => {
      orchestrator.registerExpert(mockExpert1);

      const experts = orchestrator.getExperts();

      expect(experts).toHaveLength(1);
      expect(experts[0].getName()).toBe('expert-1');
    });

    it('should replace existing expert with same name', () => {
      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert1);

      const experts = orchestrator.getExperts();

      expect(experts).toHaveLength(1);
    });
  });

  describe('unregisterExpert', () => {
    it('should unregister an expert', () => {
      orchestrator.registerExpert(mockExpert1);
      orchestrator.unregisterExpert('expert-1');

      const experts = orchestrator.getExperts();

      expect(experts).toHaveLength(0);
    });
  });

  describe('getExpert', () => {
    it('should get expert by name', () => {
      orchestrator.registerExpert(mockExpert1);

      const expert = orchestrator.getExpert('expert-1');

      expect(expert).toBeDefined();
      expect(expert?.getName()).toBe('expert-1');
    });

    it('should return undefined for non-existent expert', () => {
      const expert = orchestrator.getExpert('non-existent');

      expect(expert).toBeUndefined();
    });
  });

  describe('route', () => {
    beforeEach(() => {
      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert2);
    });

    it('should route query to expert with hint', async () => {
      const result = await orchestrator.route(
        'Test query',
        testContext,
        'expert-1',
      );

      expect(result.success).toBe(true);
      expect(mockExpert1.process).toHaveBeenCalled();
    });

    it('should route query intelligently without hint', async () => {
      const result = await orchestrator.route(
        'Please analyze this data',
        testContext,
      );

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('routing');
    });

    it('should return error if no expert found', async () => {
      const emptyOrchestrator = new AIOrchestratorService(mockCacheService);

      const result = await emptyOrchestrator.route('Test query', testContext);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_EXPERT_FOUND');
    });

    it('should return error if expert hint is invalid', async () => {
      const result = await orchestrator.route(
        'Test query',
        testContext,
        'non-existent',
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EXPERT_NOT_FOUND');
    });
  });

  describe('coordinateExperts', () => {
    beforeEach(() => {
      orchestrator = new AIOrchestratorService(mockCacheService, {
        enableMultiExpert: true,
        maxExperts: 3,
      });

      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert2);
    });

    it('should coordinate multiple experts', async () => {
      const result = await orchestrator.coordinateExperts(
        'Complex query requiring multiple experts',
        testContext,
        ['expert-1', 'expert-2'],
      );

      expect(result.success).toBe(true);
      expect(result.metadata.multiExpert).toBe(true);
      expect(mockExpert1.process).toHaveBeenCalled();
      expect(mockExpert2.process).toHaveBeenCalled();
    });

    it('should return error if multi-expert is disabled', async () => {
      const singleOrchestrator = new AIOrchestratorService(mockCacheService, {
        enableMultiExpert: false,
      });

      const result = await singleOrchestrator.coordinateExperts(
        'Test query',
        testContext,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MULTI_EXPERT_DISABLED');
    });

    it('should aggregate responses from multiple experts', async () => {
      const result = await orchestrator.coordinateExperts(
        'Test query',
        testContext,
        ['expert-1', 'expert-2'],
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('responses');
      expect((result.data as any).responses).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return orchestrator statistics', () => {
      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert2);

      const stats = orchestrator.getStats();

      expect(stats.expertsCount).toBe(2);
      expect(stats.activeRequests).toBe(0);
      expect(stats.queuedRequests).toBe(0);
      expect(stats.experts).toHaveLength(2);
    });
  });

  describe('healthCheck', () => {
    it('should return health status of all experts', async () => {
      jest.spyOn(mockExpert1, 'healthCheck').mockResolvedValue(true);
      jest.spyOn(mockExpert2, 'healthCheck').mockResolvedValue(true);

      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert2);

      const health = await orchestrator.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.expertsHealthy['expert-1']).toBe(true);
      expect(health.expertsHealthy['expert-2']).toBe(true);
    });

    it('should detect unhealthy experts', async () => {
      jest.spyOn(mockExpert1, 'healthCheck').mockResolvedValue(true);
      jest.spyOn(mockExpert2, 'healthCheck').mockResolvedValue(false);

      orchestrator.registerExpert(mockExpert1);
      orchestrator.registerExpert(mockExpert2);

      const health = await orchestrator.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.expertsHealthy['expert-2']).toBe(false);
    });
  });
});
