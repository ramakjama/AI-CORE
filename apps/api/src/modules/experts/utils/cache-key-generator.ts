/**
 * Cache Key Generator
 * Generates consistent cache keys for expert requests
 */

import * as crypto from 'crypto';

export class CacheKeyGenerator {
  /**
   * Generate a cache key for an expert request
   */
  static generate(
    expertName: string,
    method: string,
    context: any,
    additionalParams?: any,
  ): string {
    const data = {
      expert: expertName,
      method,
      context: this.sanitizeContext(context),
      params: additionalParams,
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    return `expert:${expertName}:${method}:${hash}`;
  }

  /**
   * Generate a cache key for orchestrator requests
   */
  static generateOrchestratorKey(
    query: string,
    context: any,
    options?: any,
  ): string {
    const data = {
      query,
      context: this.sanitizeContext(context),
      options,
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    return `orchestrator:${hash}`;
  }

  /**
   * Sanitize context to remove sensitive data and non-deterministic fields
   */
  private static sanitizeContext(context: any): any {
    if (!context) return null;

    const sanitized = { ...context };

    // Remove timestamps and non-deterministic fields
    delete sanitized.timestamp;
    delete sanitized.requestId;

    // Remove session-specific data
    if (sanitized.session) {
      delete sanitized.session.id;
      delete sanitized.session.startedAt;
    }

    // Remove user-specific sensitive data
    if (sanitized.user) {
      const user = { ...sanitized.user };
      delete user.email;
      delete user.metadata;
      sanitized.user = user;
    }

    return sanitized;
  }

  /**
   * Parse cache key to extract components
   */
  static parse(cacheKey: string): {
    type: string;
    expertName?: string;
    method?: string;
    hash: string;
  } | null {
    const parts = cacheKey.split(':');

    if (parts[0] === 'expert' && parts.length === 4) {
      return {
        type: 'expert',
        expertName: parts[1]!,
        method: parts[2]!,
        hash: parts[3]!,
      };
    }

    if (parts[0] === 'orchestrator' && parts.length === 2) {
      return {
        type: 'orchestrator',
        hash: parts[1]!,
      };
    }

    return null;
  }

  /**
   * Generate a pattern for cache invalidation
   */
  static generatePattern(expertName?: string, method?: string): string {
    if (expertName && method) {
      return `expert:${expertName}:${method}:*`;
    }
    if (expertName) {
      return `expert:${expertName}:*`;
    }
    return 'expert:*';
  }
}
