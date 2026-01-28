/**
 * Rate Limiter
 * Token bucket implementation for rate limiting expert requests
 */

export interface RateLimiterOptions {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  maxTokens?: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerInterval: number;
  private readonly interval: number;
  private readonly maxTokens: number;

  constructor(options: RateLimiterOptions) {
    this.tokensPerInterval = options.tokensPerInterval;
    this.interval = options.interval;
    this.maxTokens = options.maxTokens || options.tokensPerInterval;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   * @param tokens Number of tokens to consume (default: 1)
   * @returns true if tokens were consumed, false otherwise
   */
  async tryConsume(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Consume tokens or wait until available
   * @param tokens Number of tokens to consume (default: 1)
   */
  async consume(tokens: number = 1): Promise<void> {
    while (!(await this.tryConsume(tokens))) {
      const timeToWait = this.getTimeUntilTokensAvailable(tokens);
      await this.sleep(timeToWait);
    }
  }

  /**
   * Get remaining tokens
   */
  getRemainingTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get time until specified number of tokens are available
   */
  getTimeUntilTokensAvailable(tokens: number): number {
    this.refill();

    if (this.tokens >= tokens) {
      return 0;
    }

    const tokensNeeded = tokens - this.tokens;
    const tokensPerMs = this.tokensPerInterval / this.interval;
    return Math.ceil(tokensNeeded / tokensPerMs);
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed > 0) {
      const tokensToAdd = (timePassed / this.interval) * this.tokensPerInterval;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter manager for multiple experts
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Create or get rate limiter for an expert
   */
  getOrCreateLimiter(expertName: string, options: RateLimiterOptions): RateLimiter {
    if (!this.limiters.has(expertName)) {
      this.limiters.set(expertName, new RateLimiter(options));
    }
    return this.limiters.get(expertName)!;
  }

  /**
   * Remove rate limiter for an expert
   */
  removeLimiter(expertName: string): void {
    this.limiters.delete(expertName);
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }

  /**
   * Get all rate limiter stats
   */
  getStats(): Record<string, { remainingTokens: number }> {
    const stats: Record<string, { remainingTokens: number }> = {};

    this.limiters.forEach((limiter, expertName) => {
      stats[expertName] = {
        remainingTokens: limiter.getRemainingTokens(),
      };
    });

    return stats;
  }
}
