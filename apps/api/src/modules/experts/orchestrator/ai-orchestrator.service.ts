/**
 * AI Orchestrator Service
 * Coordinates and routes requests to appropriate AI experts
 */

import { Injectable } from '@nestjs/common';
import { BaseExpert } from '../base/base-expert';
import {
  ExpertContext,
  ExpertResponse,
  OrchestratorOptions,
  DEFAULT_ORCHESTRATOR_OPTIONS,
  ExpertRoutingResult,
  MultiExpertPlan,
} from '../types';
import { LoggerService } from '../config/logger.config';
import { CacheService } from '../services/cache.service';
import { CacheKeyGenerator } from '../utils/cache-key-generator';

@Injectable()
export class AIOrchestratorService {
  private experts: Map<string, BaseExpert> = new Map();
  private options: OrchestratorOptions;
  private logger: LoggerService;
  private cacheService: CacheService;
  private requestQueue: Array<{ request: any; resolve: Function; reject: Function }> = [];
  private activeRequests: number = 0;

  constructor(
    cacheService: CacheService,
    options?: Partial<OrchestratorOptions>,
  ) {
    this.options = { ...DEFAULT_ORCHESTRATOR_OPTIONS, ...options };
    this.logger = new LoggerService('AIOrchestratorService');
    this.cacheService = cacheService;

    this.logger.log('AI Orchestrator initialized', {
      strategy: this.options.routingStrategy,
      multiExpert: this.options.enableMultiExpert,
      caching: this.options.enableCache,
    });
  }

  /**
   * Register an expert with the orchestrator
   */
  registerExpert(expert: BaseExpert): void {
    const name = expert.getName();

    if (this.experts.has(name)) {
      this.logger.warn(`Expert ${name} already registered, replacing...`);
    }

    this.experts.set(name, expert);
    this.logger.log(`Expert registered: ${name}`, {
      displayName: expert.getDisplayName(),
      tags: expert.getTags(),
    });
  }

  /**
   * Unregister an expert
   */
  unregisterExpert(expertName: string): void {
    if (this.experts.has(expertName)) {
      this.experts.delete(expertName);
      this.logger.log(`Expert unregistered: ${expertName}`);
    }
  }

  /**
   * Get all registered experts
   */
  getExperts(): BaseExpert[] {
    return Array.from(this.experts.values());
  }

  /**
   * Get expert by name
   */
  getExpert(expertName: string): BaseExpert | undefined {
    return this.experts.get(expertName);
  }

  /**
   * Route a query to the appropriate expert
   */
  async route(
    query: string,
    context: ExpertContext,
    expertHint?: string,
  ): Promise<ExpertResponse> {
    const startTime = Date.now();

    try {
      this.logger.log('Routing query', {
        query: query.substring(0, 100),
        expertHint,
        userId: context.user.id,
      });

      // Check cache first
      if (this.options.enableCache) {
        const cacheKey = CacheKeyGenerator.generateOrchestratorKey(query, context);
        const cached = await this.cacheService.get<ExpertResponse>(cacheKey);

        if (cached) {
          this.logger.debug('Returning cached orchestrator response', { cacheKey });
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cached: true,
              responseTime: Date.now() - startTime,
            },
          };
        }
      }

      // Determine which expert to use
      const routingResult = await this.selectExpert(query, context, expertHint);

      if (!routingResult) {
        return this.createErrorResponse(
          new Error('No suitable expert found for this query'),
          'NO_EXPERT_FOUND',
        );
      }

      const expert = this.experts.get(routingResult.expertName);

      if (!expert) {
        return this.createErrorResponse(
          new Error(`Expert not found: ${routingResult.expertName}`),
          'EXPERT_NOT_FOUND',
        );
      }

      this.logger.log('Expert selected', {
        expert: routingResult.expertName,
        confidence: routingResult.confidence,
        reason: routingResult.reason,
      });

      // Execute with load balancing
      const response = await this.executeWithLoadBalancing(
        async () => {
          // Update context with query
          const queryContext: ExpertContext = {
            ...context,
            request: {
              ...context.request,
              payload: { query },
            },
          };

          // Determine method based on request type or infer from query
          const method = context.request.type === 'analysis' ? 'analyze' :
                        context.request.type === 'suggestion' ? 'suggest' :
                        context.request.type === 'execution' ? 'execute' :
                        'analyze'; // default

          return await expert.process(method, queryContext);
        },
      );

      // Cache the response
      if (this.options.enableCache && response.success) {
        const cacheKey = CacheKeyGenerator.generateOrchestratorKey(query, context);
        await this.cacheService.set(cacheKey, response, this.options.cacheTTL);
      }

      // Add routing metadata
      response.metadata = {
        ...response.metadata,
        responseTime: Date.now() - startTime,
        routing: routingResult,
      };

      return response;

    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to route query', err.stack, {
        error: err.message,
      });

      return this.createErrorResponse(err, 'ROUTING_ERROR');
    }
  }

  /**
   * Execute a multi-expert coordination
   */
  async coordinateExperts(
    query: string,
    context: ExpertContext,
    expertNames?: string[],
  ): Promise<ExpertResponse> {
    if (!this.options.enableMultiExpert) {
      return this.createErrorResponse(
        new Error('Multi-expert coordination is disabled'),
        'MULTI_EXPERT_DISABLED',
      );
    }

    const startTime = Date.now();

    try {
      this.logger.log('Coordinating multiple experts', {
        query: query.substring(0, 100),
        expertNames,
      });

      // Create coordination plan
      const plan = await this.createCoordinationPlan(query, context, expertNames);

      if (!plan || plan.experts.length === 0) {
        return this.createErrorResponse(
          new Error('Failed to create coordination plan'),
          'PLAN_CREATION_FAILED',
        );
      }

      this.logger.log('Coordination plan created', {
        expertsCount: plan.experts.length,
        strategy: plan.strategy,
      });

      // Execute plan
      const results = await this.executePlan(plan, query, context);

      // Aggregate results
      const aggregatedResponse = this.aggregateResponses(results);

      aggregatedResponse.metadata = {
        ...aggregatedResponse.metadata,
        responseTime: Date.now() - startTime,
        multiExpert: true,
        plan,
      };

      return aggregatedResponse;

    } catch (error) {
      const err = error as Error;
      this.logger.error('Multi-expert coordination failed', err.stack, {
        error: err.message,
      });

      return this.createErrorResponse(err, 'COORDINATION_ERROR');
    }
  }

  /**
   * Select the best expert for a query
   */
  private async selectExpert(
    query: string,
    context: ExpertContext,
    expertHint?: string,
  ): Promise<ExpertRoutingResult | null> {
    // If expert hint provided and exists, use it
    if (expertHint && this.experts.has(expertHint)) {
      return {
        expertName: expertHint,
        confidence: 1.0,
        reason: 'Explicit expert hint provided',
      };
    }

    // Use routing strategy
    switch (this.options.routingStrategy) {
      case 'priority':
        return this.selectByPriority(query, context);

      case 'round-robin':
        return this.selectRoundRobin();

      case 'least-loaded':
        return this.selectLeastLoaded();

      case 'intelligent':
      default:
        return this.selectIntelligently(query, context);
    }
  }

  /**
   * Select expert by priority
   */
  private selectByPriority(query: string, context: ExpertContext): ExpertRoutingResult | null {
    const experts = Array.from(this.experts.values());

    if (experts.length === 0) {
      return null;
    }

    // Sort by priority (higher first)
    experts.sort((a, b) => {
      const priorityA = a.getConfig().priority || 5;
      const priorityB = b.getConfig().priority || 5;
      return priorityB - priorityA;
    });

    const selected = experts[0];

    return {
      expertName: selected.getName(),
      confidence: 0.8,
      reason: 'Selected by priority',
      alternatives: experts.slice(1, 3).map(e => ({
        expertName: e.getName(),
        confidence: 0.6,
      })),
    };
  }

  /**
   * Select expert using round-robin
   */
  private selectRoundRobin(): ExpertRoutingResult | null {
    const experts = Array.from(this.experts.values());

    if (experts.length === 0) {
      return null;
    }

    // Simple round-robin (can be improved with state)
    const index = Math.floor(Math.random() * experts.length);
    const selected = experts[index];

    return {
      expertName: selected.getName(),
      confidence: 0.7,
      reason: 'Selected by round-robin',
    };
  }

  /**
   * Select least loaded expert
   */
  private selectLeastLoaded(): ExpertRoutingResult | null {
    const experts = Array.from(this.experts.values());

    if (experts.length === 0) {
      return null;
    }

    // For now, use round-robin (load tracking would require more state)
    return this.selectRoundRobin();
  }

  /**
   * Intelligently select expert based on query and context
   */
  private async selectIntelligently(
    query: string,
    context: ExpertContext,
  ): Promise<ExpertRoutingResult | null> {
    const experts = Array.from(this.experts.values());

    if (experts.length === 0) {
      return null;
    }

    // Simple keyword matching for now
    // In production, this would use ML or more sophisticated routing
    const queryLower = query.toLowerCase();
    const scores = new Map<string, number>();

    for (const expert of experts) {
      let score = 0;
      const tags = expert.getTags();
      const description = expert.getDescription().toLowerCase();

      // Check tags
      for (const tag of tags) {
        if (queryLower.includes(tag.toLowerCase())) {
          score += 10;
        }
      }

      // Check description
      const descriptionWords = description.split(/\s+/);
      const queryWords = queryLower.split(/\s+/);

      for (const queryWord of queryWords) {
        if (queryWord.length > 3 && descriptionWords.some(w => w.includes(queryWord))) {
          score += 5;
        }
      }

      scores.set(expert.getName(), score);
    }

    // Get top scoring experts
    const sortedExperts = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedExperts.length === 0 || sortedExperts[0][1] === 0) {
      // No good match, use priority
      return this.selectByPriority(query, context);
    }

    const selected = sortedExperts[0];
    const maxScore = selected[1];

    return {
      expertName: selected[0],
      confidence: Math.min(maxScore / 50, 1.0), // Normalize score to 0-1
      reason: 'Selected by intelligent routing',
      alternatives: sortedExperts.slice(1, 3).map(([name, score]) => ({
        expertName: name,
        confidence: Math.min(score / 50, 1.0),
      })),
    };
  }

  /**
   * Create coordination plan for multi-expert execution
   */
  private async createCoordinationPlan(
    query: string,
    context: ExpertContext,
    expertNames?: string[],
  ): Promise<MultiExpertPlan | null> {
    let experts: BaseExpert[];

    if (expertNames && expertNames.length > 0) {
      // Use specified experts
      experts = expertNames
        .map(name => this.experts.get(name))
        .filter((e): e is BaseExpert => e !== undefined);
    } else {
      // Select top experts intelligently
      const routing = await this.selectIntelligently(query, context);
      if (!routing) {
        return null;
      }

      experts = [
        this.experts.get(routing.expertName),
        ...(routing.alternatives || [])
          .map(a => this.experts.get(a.expertName))
          .filter((e): e is BaseExpert => e !== undefined),
      ].filter((e): e is BaseExpert => e !== undefined)
       .slice(0, this.options.maxExperts);
    }

    if (experts.length === 0) {
      return null;
    }

    // Create plan (simple sequential for now)
    return {
      experts: experts.map((expert, index) => ({
        expertName: expert.getName(),
        role: index === 0 ? 'primary' : 'supporting',
        order: index,
      })),
      strategy: 'sequential',
    };
  }

  /**
   * Execute coordination plan
   */
  private async executePlan(
    plan: MultiExpertPlan,
    query: string,
    context: ExpertContext,
  ): Promise<ExpertResponse[]> {
    const results: ExpertResponse[] = [];

    if (plan.strategy === 'sequential') {
      // Execute experts sequentially
      for (const expertPlan of plan.experts) {
        const expert = this.experts.get(expertPlan.expertName);
        if (!expert) {
          continue;
        }

        // Update context with previous results
        const enrichedContext: ExpertContext = {
          ...context,
          sharedContext: {
            ...context.sharedContext,
            expertResponses: results.map((r, i) => ({
              expertName: plan.experts[i].expertName,
              response: r.data,
              timestamp: r.metadata.timestamp,
            })),
          },
          request: {
            ...context.request,
            payload: { query },
          },
        };

        const response = await expert.process('analyze', enrichedContext);
        results.push(response);
      }
    } else if (plan.strategy === 'parallel') {
      // Execute experts in parallel
      const promises = plan.experts.map(expertPlan => {
        const expert = this.experts.get(expertPlan.expertName);
        if (!expert) {
          return Promise.resolve(null);
        }

        const queryContext: ExpertContext = {
          ...context,
          request: {
            ...context.request,
            payload: { query },
          },
        };

        return expert.process('analyze', queryContext);
      });

      const responses = await Promise.all(promises);
      results.push(...responses.filter((r): r is ExpertResponse => r !== null));
    }

    return results;
  }

  /**
   * Aggregate responses from multiple experts
   */
  private aggregateResponses(responses: ExpertResponse[]): ExpertResponse {
    // Filter successful responses
    const successfulResponses = responses.filter(r => r.success);

    if (successfulResponses.length === 0) {
      return {
        success: false,
        error: {
          code: 'ALL_EXPERTS_FAILED',
          message: 'All experts failed to provide responses',
          details: responses.map(r => r.error),
        },
        metadata: {
          expertName: 'orchestrator',
          model: 'multi',
          timestamp: new Date(),
          responseTime: 0,
          cached: false,
        },
      };
    }

    // Aggregate data
    const aggregatedData = {
      responses: successfulResponses.map((r, i) => ({
        expertName: r.metadata.expertName,
        data: r.data,
        confidence: r.confidence,
      })),
      summary: 'Multiple experts consulted',
    };

    return {
      success: true,
      data: aggregatedData,
      metadata: {
        expertName: 'orchestrator',
        model: 'multi',
        timestamp: new Date(),
        responseTime: 0,
        cached: false,
        tokensUsed: {
          input: successfulResponses.reduce((sum, r) => sum + (r.metadata.tokensUsed?.input || 0), 0),
          output: successfulResponses.reduce((sum, r) => sum + (r.metadata.tokensUsed?.output || 0), 0),
          total: successfulResponses.reduce((sum, r) => sum + (r.metadata.tokensUsed?.total || 0), 0),
        },
        cost: successfulResponses.reduce((sum, r) => sum + (r.metadata.cost || 0), 0),
      },
    };
  }

  /**
   * Execute with load balancing
   */
  private async executeWithLoadBalancing<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.options.enableLoadBalancing) {
      return fn();
    }

    const config = this.options.loadBalancing!;

    // Check if we can execute immediately
    if (this.activeRequests < config.maxConcurrentRequests) {
      this.activeRequests++;
      try {
        return await fn();
      } finally {
        this.activeRequests--;
        this.processQueue();
      }
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      if (this.requestQueue.length >= config.requestQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      this.requestQueue.push({ request: fn, resolve, reject });
    });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    if (!this.options.enableLoadBalancing) {
      return;
    }

    const config = this.options.loadBalancing!;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < config.maxConcurrentRequests
    ) {
      const { request, resolve, reject } = this.requestQueue.shift()!;

      this.activeRequests++;

      request()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: Error, code: string): ExpertResponse {
    return {
      success: false,
      error: {
        code,
        message: error.message,
      },
      metadata: {
        expertName: 'orchestrator',
        model: 'none',
        timestamp: new Date(),
        responseTime: 0,
        cached: false,
      },
    };
  }

  /**
   * Get orchestrator statistics
   */
  getStats(): {
    expertsCount: number;
    activeRequests: number;
    queuedRequests: number;
    experts: Array<{ name: string; displayName: string; tags: string[] }>;
  } {
    return {
      expertsCount: this.experts.size,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      experts: Array.from(this.experts.values()).map(e => ({
        name: e.getName(),
        displayName: e.getDisplayName(),
        tags: e.getTags(),
      })),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    expertsHealthy: Record<string, boolean>;
  }> {
    const expertsHealth: Record<string, boolean> = {};

    for (const [name, expert] of this.experts) {
      expertsHealth[name] = await expert.healthCheck();
    }

    const allHealthy = Object.values(expertsHealth).every(h => h);

    return {
      healthy: allHealthy,
      expertsHealthy: expertsHealth,
    };
  }
}
