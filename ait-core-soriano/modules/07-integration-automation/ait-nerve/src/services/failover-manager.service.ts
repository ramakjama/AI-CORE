/**
 * Failover Manager Service
 * Handles engine failover, circuit breaker, and retry logic
 */

import { Injectable, Logger } from '@nestjs/common';
import { EngineOrchestratorService } from './engine-orchestrator.service';
import { RequestRouterService } from './request-router.service';
import {
  ExecutionRequest,
  ExecutionResponse,
  CircuitBreakerState,
  EngineEventType,
} from '../types/engine.types';
import { DEFAULT_FAILOVER_CONFIG } from '../config/engines.config';

@Injectable()
export class FailoverManagerService {
  private readonly logger = new Logger(FailoverManagerService.name);
  private readonly circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private readonly retryQueues: Map<string, ExecutionRequest[]> = new Map();

  constructor(
    private readonly orchestrator: EngineOrchestratorService,
    private readonly router: RequestRouterService
  ) {
    // Initialize circuit breakers for all engines
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for all engines
   */
  private initializeCircuitBreakers(): void {
    const engines = this.orchestrator.getAllEngines();

    for (const engine of engines) {
      this.circuitBreakers.set(engine.id, {
        engineId: engine.id,
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailure: new Date(),
        nextRetry: new Date(),
      });
    }
  }

  /**
   * Execute request with failover support
   */
  async executeWithFailover(request: ExecutionRequest): Promise<ExecutionResponse> {
    if (!DEFAULT_FAILOVER_CONFIG.enabled) {
      return this.router.routeRequest(request);
    }

    const maxRetries = request.retryOnFailure !== false
      ? DEFAULT_FAILOVER_CONFIG.maxRetries
      : 0;

    let lastError: Error | undefined;
    let response: ExecutionResponse | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (request.engineId) {
          const circuitOpen = this.isCircuitOpen(request.engineId);
          if (circuitOpen && attempt < maxRetries) {
            this.logger.warn(
              `Circuit breaker open for ${request.engineId}, attempting failover...`
            );

            // Try fallback engine
            const fallbackEngine = this.findFallbackEngine(request.engineId);
            if (fallbackEngine) {
              request.engineId = fallbackEngine;
              this.logger.log(`Failing over to ${fallbackEngine}`);
            } else {
              throw new Error('No fallback engine available');
            }
          }
        }

        // Execute request
        response = await this.router.routeRequest(request);

        if (response.status === 'success') {
          // Record success
          if (request.engineId) {
            this.recordSuccess(request.engineId);
          }
          return response;
        } else {
          throw new Error(response.error || 'Request failed');
        }
      } catch (error) {
        lastError = error;

        // Record failure
        if (request.engineId) {
          this.recordFailure(request.engineId);
        }

        this.logger.warn(
          `Request attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`
        );

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const executionTime = 0;
    return {
      requestId: this.generateRequestId(),
      engineId: request.engineId || 'unknown',
      engineInstance: 'unknown',
      status: 'error',
      error: lastError?.message || 'All retry attempts failed',
      executionTime,
      timestamp: new Date(),
      metadata: request.metadata,
    };
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(engineId: string): boolean {
    const breaker = this.circuitBreakers.get(engineId);
    if (!breaker) return false;

    if (breaker.state === 'open') {
      // Check if we should try half-open
      if (Date.now() >= breaker.nextRetry.getTime()) {
        breaker.state = 'half-open';
        this.logger.log(`Circuit breaker for ${engineId} entering half-open state`);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Record successful request
   */
  private recordSuccess(engineId: string): void {
    const breaker = this.circuitBreakers.get(engineId);
    if (!breaker) return;

    breaker.successCount++;
    breaker.failureCount = 0;

    if (breaker.state === 'half-open') {
      // Close the circuit after successful request in half-open state
      breaker.state = 'closed';
      this.logger.log(`Circuit breaker for ${engineId} closed after successful request`);

      this.orchestrator.onEvent(
        EngineEventType.CIRCUIT_BREAKER_CLOSED,
        () => {}
      );
    }
  }

  /**
   * Record failed request
   */
  private recordFailure(engineId: string): void {
    const breaker = this.circuitBreakers.get(engineId);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailure = new Date();

    // Open circuit if threshold exceeded
    if (
      breaker.failureCount >= DEFAULT_FAILOVER_CONFIG.circuitBreakerThreshold &&
      breaker.state === 'closed'
    ) {
      breaker.state = 'open';
      breaker.nextRetry = new Date(
        Date.now() + DEFAULT_FAILOVER_CONFIG.circuitBreakerTimeout
      );

      this.logger.error(
        `Circuit breaker opened for ${engineId} after ${breaker.failureCount} failures`
      );

      this.orchestrator.onEvent(
        EngineEventType.CIRCUIT_BREAKER_OPENED,
        () => {}
      );

      // Trigger failover event
      this.orchestrator.onEvent(
        EngineEventType.FAILOVER_TRIGGERED,
        () => {}
      );
    }

    if (breaker.state === 'half-open') {
      // Reopen circuit on failure in half-open state
      breaker.state = 'open';
      breaker.nextRetry = new Date(
        Date.now() + DEFAULT_FAILOVER_CONFIG.circuitBreakerTimeout
      );

      this.logger.error(
        `Circuit breaker reopened for ${engineId} after failure in half-open state`
      );
    }
  }

  /**
   * Find fallback engine
   */
  private findFallbackEngine(engineId: string): string | undefined {
    const engine = this.orchestrator.getEngine(engineId);
    if (!engine) return undefined;

    // Try configured fallback engines
    const fallbackEngines = DEFAULT_FAILOVER_CONFIG.fallbackEngines;
    for (const fallbackId of fallbackEngines) {
      const fallback = this.orchestrator.getEngine(fallbackId);
      if (fallback && fallback.enabled && !this.isCircuitOpen(fallbackId)) {
        const instances = this.orchestrator.getAllHealthyInstances(fallbackId);
        if (instances.length > 0) {
          return fallbackId;
        }
      }
    }

    // Try to find engine of same type
    const engines = this.orchestrator.getAllEngines();
    for (const candidate of engines) {
      if (
        candidate.id !== engineId &&
        candidate.type === engine.type &&
        candidate.enabled &&
        !this.isCircuitOpen(candidate.id)
      ) {
        const instances = this.orchestrator.getAllHealthyInstances(candidate.id);
        if (instances.length > 0) {
          return candidate.id;
        }
      }
    }

    return undefined;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = DEFAULT_FAILOVER_CONFIG.retryDelay;
    const multiplier = DEFAULT_FAILOVER_CONFIG.backoffMultiplier;
    const delay = baseDelay * Math.pow(multiplier, attempt);

    // Add jitter (random ±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);

    return Math.floor(delay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(engineId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(engineId);
  }

  /**
   * Get all circuit breaker states
   */
  getAllCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values());
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(engineId: string): void {
    const breaker = this.circuitBreakers.get(engineId);
    if (!breaker) return;

    breaker.state = 'closed';
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.lastFailure = new Date();
    breaker.nextRetry = new Date();

    this.logger.log(`Circuit breaker for ${engineId} manually reset`);
  }

  /**
   * Get failover statistics
   */
  getFailoverStats(): {
    totalFailovers: number;
    circuitBreakersOpen: number;
    circuitBreakersClosed: number;
    circuitBreakersHalfOpen: number;
    engineFailures: Record<string, number>;
  } {
    let totalFailovers = 0;
    let circuitBreakersOpen = 0;
    let circuitBreakersClosed = 0;
    let circuitBreakersHalfOpen = 0;
    const engineFailures: Record<string, number> = {};

    for (const breaker of this.circuitBreakers.values()) {
      totalFailovers += breaker.failureCount;
      engineFailures[breaker.engineId] = breaker.failureCount;

      switch (breaker.state) {
        case 'open':
          circuitBreakersOpen++;
          break;
        case 'closed':
          circuitBreakersClosed++;
          break;
        case 'half-open':
          circuitBreakersHalfOpen++;
          break;
      }
    }

    return {
      totalFailovers,
      circuitBreakersOpen,
      circuitBreakersClosed,
      circuitBreakersHalfOpen,
      engineFailures,
    };
  }
}
