/**
 * Rate Limiter
 * Token bucket and sliding window rate limiting
 */

import PQueue from 'p-queue';

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Key for identifying the rate limit group */
  key?: string;
  /** Strategy: 'sliding' for sliding window, 'fixed' for fixed window */
  strategy?: 'sliding' | 'fixed';
}

export interface TokenBucketConfig {
  /** Maximum tokens in the bucket */
  maxTokens: number;
  /** Tokens added per interval */
  refillRate: number;
  /** Refill interval in milliseconds */
  refillInterval: number;
  /** Initial tokens (defaults to maxTokens) */
  initialTokens?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // milliseconds
}

/**
 * Sliding Window Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      key: config.key || 'default',
      strategy: config.strategy || 'sliding'
    };
  }

  /**
   * Check if request is allowed
   */
  check(key?: string): RateLimitResult {
    const k = key || this.config.key;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests and filter out expired ones
    let timestamps = this.requests.get(k) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);
    this.requests.set(k, timestamps);

    const remaining = Math.max(0, this.config.maxRequests - timestamps.length);
    const resetAt = new Date(now + this.config.windowMs);

    if (timestamps.length >= this.config.maxRequests) {
      const oldestInWindow = Math.min(...timestamps);
      const retryAfter = oldestInWindow + this.config.windowMs - now;

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(0, retryAfter)
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt
    };
  }

  /**
   * Record a request
   */
  hit(key?: string): RateLimitResult {
    const result = this.check(key);

    if (result.allowed) {
      const k = key || this.config.key;
      const timestamps = this.requests.get(k) || [];
      timestamps.push(Date.now());
      this.requests.set(k, timestamps);
    }

    return result;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key?: string): void {
    this.requests.delete(key || this.config.key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Get current state
   */
  getState(key?: string): { count: number; remaining: number } {
    const k = key || this.config.key;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const timestamps = (this.requests.get(k) || []).filter(ts => ts > windowStart);
    return {
      count: timestamps.length,
      remaining: Math.max(0, this.config.maxRequests - timestamps.length)
    };
  }
}

/**
 * Token Bucket Rate Limiter
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private config: Required<TokenBucketConfig>;
  private refillTimer?: NodeJS.Timeout;

  constructor(config: TokenBucketConfig) {
    this.config = {
      maxTokens: config.maxTokens,
      refillRate: config.refillRate,
      refillInterval: config.refillInterval,
      initialTokens: config.initialTokens ?? config.maxTokens
    };
  }

  /**
   * Get or create bucket for key
   */
  private getBucket(key: string): { tokens: number; lastRefill: number } {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.config.initialTokens,
        lastRefill: Date.now()
      });
    }
    return this.buckets.get(key)!;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(key: string): void {
    const bucket = this.getBucket(key);
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const intervalsElapsed = Math.floor(elapsed / this.config.refillInterval);

    if (intervalsElapsed > 0) {
      const tokensToAdd = intervalsElapsed * this.config.refillRate;
      bucket.tokens = Math.min(this.config.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  /**
   * Try to consume tokens
   */
  consume(tokens: number = 1, key: string = 'default'): RateLimitResult {
    this.refill(key);
    const bucket = this.getBucket(key);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetAt: new Date(Date.now() + this.config.refillInterval)
      };
    }

    const tokensNeeded = tokens - bucket.tokens;
    const intervalsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
    const retryAfter = intervalsNeeded * this.config.refillInterval;

    return {
      allowed: false,
      remaining: bucket.tokens,
      resetAt: new Date(Date.now() + retryAfter),
      retryAfter
    };
  }

  /**
   * Check without consuming
   */
  check(tokens: number = 1, key: string = 'default'): RateLimitResult {
    this.refill(key);
    const bucket = this.getBucket(key);

    const allowed = bucket.tokens >= tokens;
    const resetAt = new Date(Date.now() + this.config.refillInterval);

    if (!allowed) {
      const tokensNeeded = tokens - bucket.tokens;
      const intervalsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
      const retryAfter = intervalsNeeded * this.config.refillInterval;

      return {
        allowed: false,
        remaining: bucket.tokens,
        resetAt,
        retryAfter
      };
    }

    return {
      allowed: true,
      remaining: bucket.tokens,
      resetAt
    };
  }

  /**
   * Get current token count
   */
  getTokens(key: string = 'default'): number {
    this.refill(key);
    return this.getBucket(key).tokens;
  }

  /**
   * Reset bucket
   */
  reset(key: string = 'default'): void {
    this.buckets.set(key, {
      tokens: this.config.initialTokens,
      lastRefill: Date.now()
    });
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.buckets.clear();
  }
}

/**
 * Distributed Rate Limiter (in-memory implementation)
 * For production, extend with Redis or similar
 */
export class DistributedRateLimiter {
  private slidingWindow: SlidingWindowRateLimiter;
  private tokenBucket: TokenBucketRateLimiter;
  private dailyCounts: Map<string, { count: number; date: string }> = new Map();
  private dailyLimit: number;

  constructor(options: {
    perSecond?: number;
    perMinute?: number;
    perHour?: number;
    perDay?: number;
    burstSize?: number;
  }) {
    // Per-second/minute/hour limits using sliding window
    const windowMs = options.perSecond ? 1000 :
                     options.perMinute ? 60 * 1000 :
                     options.perHour ? 60 * 60 * 1000 : 60 * 1000;

    const maxRequests = options.perSecond || options.perMinute || options.perHour || 100;

    this.slidingWindow = new SlidingWindowRateLimiter({
      maxRequests,
      windowMs
    });

    // Burst limit using token bucket
    this.tokenBucket = new TokenBucketRateLimiter({
      maxTokens: options.burstSize || maxRequests * 2,
      refillRate: Math.ceil(maxRequests / 10),
      refillInterval: Math.ceil(windowMs / 10)
    });

    this.dailyLimit = options.perDay || 10000;
  }

  /**
   * Check all limits
   */
  async checkAll(key: string = 'default'): Promise<{
    allowed: boolean;
    limits: {
      window: RateLimitResult;
      burst: RateLimitResult;
      daily: RateLimitResult;
    };
    retryAfter?: number;
  }> {
    const windowResult = this.slidingWindow.check(key);
    const burstResult = this.tokenBucket.check(1, key);
    const dailyResult = this.checkDaily(key);

    const allowed = windowResult.allowed && burstResult.allowed && dailyResult.allowed;
    const retryAfter = Math.max(
      windowResult.retryAfter || 0,
      burstResult.retryAfter || 0,
      dailyResult.retryAfter || 0
    );

    return {
      allowed,
      limits: {
        window: windowResult,
        burst: burstResult,
        daily: dailyResult
      },
      retryAfter: allowed ? undefined : retryAfter
    };
  }

  /**
   * Record a request
   */
  async hit(key: string = 'default'): Promise<{
    allowed: boolean;
    limits: {
      window: RateLimitResult;
      burst: RateLimitResult;
      daily: RateLimitResult;
    };
    retryAfter?: number;
  }> {
    const checkResult = await this.checkAll(key);

    if (checkResult.allowed) {
      this.slidingWindow.hit(key);
      this.tokenBucket.consume(1, key);
      this.hitDaily(key);
    }

    return checkResult;
  }

  /**
   * Check daily limit
   */
  private checkDaily(key: string): RateLimitResult {
    const today = new Date().toISOString().split('T')[0];
    const data = this.dailyCounts.get(key);

    if (!data || data.date !== today) {
      return {
        allowed: true,
        remaining: this.dailyLimit,
        resetAt: this.getEndOfDay()
      };
    }

    const remaining = this.dailyLimit - data.count;
    const allowed = remaining > 0;

    return {
      allowed,
      remaining: Math.max(0, remaining - (allowed ? 1 : 0)),
      resetAt: this.getEndOfDay(),
      retryAfter: allowed ? undefined : this.getMsUntilEndOfDay()
    };
  }

  /**
   * Record daily hit
   */
  private hitDaily(key: string): void {
    const today = new Date().toISOString().split('T')[0];
    const data = this.dailyCounts.get(key);

    if (!data || data.date !== today) {
      this.dailyCounts.set(key, { count: 1, date: today });
    } else {
      data.count++;
    }
  }

  private getEndOfDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  }

  private getMsUntilEndOfDay(): number {
    return this.getEndOfDay().getTime() - Date.now();
  }

  /**
   * Reset all limits for a key
   */
  reset(key: string = 'default'): void {
    this.slidingWindow.reset(key);
    this.tokenBucket.reset(key);
    this.dailyCounts.delete(key);
  }
}

/**
 * Request Queue with Rate Limiting
 */
export class RateLimitedQueue {
  private queue: PQueue;
  private rateLimiter: SlidingWindowRateLimiter;

  constructor(options: {
    concurrency?: number;
    maxRequestsPerSecond?: number;
    maxRequestsPerMinute?: number;
  }) {
    const {
      concurrency = 1,
      maxRequestsPerSecond,
      maxRequestsPerMinute = 60
    } = options;

    this.queue = new PQueue({
      concurrency,
      interval: maxRequestsPerSecond ? 1000 : 60000,
      intervalCap: maxRequestsPerSecond || maxRequestsPerMinute
    });

    this.rateLimiter = new SlidingWindowRateLimiter({
      maxRequests: maxRequestsPerSecond || maxRequestsPerMinute,
      windowMs: maxRequestsPerSecond ? 1000 : 60000
    });
  }

  /**
   * Add a task to the queue
   */
  async add<T>(fn: () => Promise<T>, key?: string): Promise<T> {
    return this.queue.add(async () => {
      // Check rate limit
      let result = this.rateLimiter.check(key);

      // Wait if rate limited
      while (!result.allowed && result.retryAfter) {
        await this.delay(result.retryAfter);
        result = this.rateLimiter.check(key);
      }

      this.rateLimiter.hit(key);
      return fn();
    }) as Promise<T>;
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * Get number of pending tasks
   */
  get pending(): number {
    return this.queue.pending;
  }

  /**
   * Check if queue is idle
   */
  get isIdle(): boolean {
    return this.queue.size === 0 && this.queue.pending === 0;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Pause the queue
   */
  pause(): void {
    this.queue.pause();
  }

  /**
   * Resume the queue
   */
  start(): void {
    this.queue.start();
  }

  /**
   * Wait for queue to be empty
   */
  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default instances
export const defaultRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 100,
  windowMs: 60000 // 100 requests per minute
});

export const defaultQueue = new RateLimitedQueue({
  concurrency: 5,
  maxRequestsPerSecond: 10
});
