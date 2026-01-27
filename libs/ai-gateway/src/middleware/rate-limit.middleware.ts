/**
 * Rate Limiting Middleware
 * Redis-based sliding window rate limiting
 */

import Redis from 'ioredis';
import {
  RateLimitConfig,
  GraphQLContext,
  RateLimitError,
  User,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface SlidingWindowEntry {
  timestamp: number;
  count: number;
}

interface RateLimitInfo {
  key: string;
  limit: number;
  remaining: number;
  resetAt: Date;
  windowMs: number;
}

// ============================================================================
// Redis Client Management
// ============================================================================

let redisClient: Redis | null = null;

/**
 * Initialize Redis client for rate limiting
 */
export function initializeRateLimiter(redis: Redis): void {
  redisClient = redis;
}

/**
 * Get Redis client
 */
function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Rate limiter not initialized. Call initializeRateLimiter first.');
  }
  return redisClient;
}

// ============================================================================
// Configuration Defaults
// ============================================================================

const DEFAULT_CONFIG: Partial<RateLimitConfig> = {
  keyPrefix: 'ratelimit:',
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
};

/**
 * Parse window string to milliseconds
 * Supports: s (seconds), m (minutes), h (hours), d (days)
 */
export function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid window format: ${window}. Use format like "1m", "1h", "1d"`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

// ============================================================================
// Key Generation
// ============================================================================

/**
 * Default key generator based on IP or user ID
 */
function defaultKeyGenerator(context: GraphQLContext, prefix: string): string {
  // Try to get user ID from context
  const authContext = context as GraphQLContext & { user?: User };
  if (authContext.user?.id) {
    return `${prefix}user:${authContext.user.id}`;
  }

  // Fall back to IP address
  const ip = getClientIp(context);
  return `${prefix}ip:${ip}`;
}

/**
 * Extract client IP from request
 */
function getClientIp(context: GraphQLContext): string {
  const req = context.req;

  // Check common proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to socket address
  return req.socket?.remoteAddress || 'unknown';
}

// ============================================================================
// Sliding Window Algorithm
// ============================================================================

/**
 * Sliding window rate limit check using Redis sorted sets
 * This provides more accurate rate limiting than fixed windows
 */
async function slidingWindowCheck(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis pipeline for atomic operations
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);

  // Count current entries in window
  pipeline.zcard(key);

  // Add current request with timestamp as score
  pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`);

  // Set expiry on the key
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();

  if (!results) {
    throw new Error('Redis pipeline execution failed');
  }

  // Get current count (before adding new request)
  const currentCount = (results[1]?.[1] as number) || 0;

  const allowed = currentCount < maxRequests;
  const remaining = Math.max(0, maxRequests - currentCount - 1);
  const resetAt = new Date(now + windowMs);

  if (!allowed) {
    // Remove the request we just added since it's not allowed
    await redis.zrem(key, `${now}:${Math.random()}`);

    // Calculate retry after
    const oldestEntry = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldestEntry.length > 1 ? parseInt(oldestEntry[1], 10) : now;
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Fixed window rate limit check (simpler, less Redis operations)
 */
async function fixedWindowCheck(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Date.now();

  // Use window-aligned key for fixed window
  const windowKey = `${key}:${Math.floor(now / windowMs)}`;

  const pipeline = redis.pipeline();
  pipeline.incr(windowKey);
  pipeline.pttl(windowKey);

  const results = await pipeline.exec();

  if (!results) {
    throw new Error('Redis pipeline execution failed');
  }

  const count = (results[0]?.[1] as number) || 0;
  let ttl = (results[1]?.[1] as number) || -1;

  // Set expiry if new key
  if (ttl === -1) {
    await redis.pexpire(windowKey, windowMs);
    ttl = windowMs;
  }

  const allowed = count <= maxRequests;
  const remaining = Math.max(0, maxRequests - count);
  const resetAt = new Date(now + ttl);

  if (!allowed) {
    // Decrement since we're not allowing this request
    await redis.decr(windowKey);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil(ttl / 1000),
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check rate limit for a given configuration
 */
export async function checkLimit(
  context: GraphQLContext,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate key
  const key = mergedConfig.keyGenerator
    ? mergedConfig.keyGenerator(context)
    : defaultKeyGenerator(context, mergedConfig.keyPrefix!);

  // Parse window to milliseconds
  const windowMs = parseWindow(config.windowMs.toString() + 'ms') || config.windowMs;

  // Perform rate limit check
  const result = await slidingWindowCheck(key, config.maxRequests, windowMs);

  // Call callback if limit reached
  if (!result.allowed && mergedConfig.onLimitReached) {
    mergedConfig.onLimitReached(context, key);
  }

  return result;
}

/**
 * Check rate limit with numeric window in milliseconds
 */
export async function checkLimitMs(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  return slidingWindowCheck(key, maxRequests, windowMs);
}

/**
 * Check rate limit and throw if exceeded
 */
export async function enforceLimit(
  context: GraphQLContext,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const key = mergedConfig.keyGenerator
    ? mergedConfig.keyGenerator(context)
    : defaultKeyGenerator(context, mergedConfig.keyPrefix!);

  const windowMs = parseWindow(config.windowMs.toString());
  const result = await slidingWindowCheck(key, config.maxRequests, windowMs);

  if (!result.allowed) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      result.retryAfter
    );
  }

  return {
    key,
    limit: config.maxRequests,
    remaining: result.remaining,
    resetAt: result.resetAt,
    windowMs,
  };
}

/**
 * Increment counter for a key (for manual rate limiting)
 */
export async function incrementCounter(
  key: string,
  windowMs: number
): Promise<number> {
  const redis = getRedis();
  const now = Date.now();

  // Add entry to sorted set
  await redis.zadd(key, now.toString(), `${now}:${Math.random()}`);
  await redis.pexpire(key, windowMs);

  // Return current count
  return redis.zcard(key);
}

/**
 * Get remaining requests for a key
 */
export async function getRemaining(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ remaining: number; resetAt: Date }> {
  const redis = getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean old entries and count
  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);

  return {
    remaining: Math.max(0, maxRequests - count),
    resetAt: new Date(now + windowMs),
  };
}

/**
 * Reset rate limit for a key
 */
export async function resetLimit(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

/**
 * Get all rate limit keys matching a pattern
 */
export async function getLimitKeys(pattern: string): Promise<string[]> {
  const redis = getRedis();
  return redis.keys(pattern);
}

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * Rate limit directive implementation
 */
export function createRateLimitDirective() {
  return {
    async rateLimit(
      resolve: Function,
      source: unknown,
      args: unknown,
      context: GraphQLContext,
      info: { fieldName: string; parentType: { name: string } },
      { max, window, key: customKey }: { max: number; window: string; key?: string }
    ) {
      const fieldKey = `${info.parentType.name}.${info.fieldName}`;
      const keyPrefix = `ratelimit:${customKey || fieldKey}:`;

      await enforceLimit(context, {
        maxRequests: max,
        windowMs: parseWindow(window),
        keyPrefix,
      });

      return resolve(source, args, context, info);
    },
  };
}

// ============================================================================
// Middleware for Express
// ============================================================================

/**
 * Create Express middleware for global rate limiting
 */
export function createRateLimitMiddleware(config: {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
  skip?: (req: Express.Request) => boolean;
  handler?: (req: Express.Request, res: Express.Response) => void;
}) {
  return async (
    req: Express.Request,
    res: Express.Response,
    next: Function
  ) => {
    // Skip if configured
    if (config.skip?.(req)) {
      return next();
    }

    // Generate key
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
      : req.socket?.remoteAddress || 'unknown';

    const key = `${config.keyPrefix || 'ratelimit:global:'}${ip}`;

    try {
      const result = await slidingWindowCheck(
        key,
        config.maxRequests,
        config.windowMs
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        res.setHeader('Retry-After', (result.retryAfter || 60).toString());

        if (config.handler) {
          return config.handler(req, res);
        }

        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      // If Redis fails, allow the request but log the error
      console.error('Rate limit check failed:', error);
      next();
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create composite rate limiter with multiple rules
 */
export function createCompositeRateLimiter(
  rules: Array<{
    name: string;
    maxRequests: number;
    window: string;
    keyGenerator?: (context: GraphQLContext) => string;
  }>
) {
  return async (context: GraphQLContext): Promise<void> => {
    for (const rule of rules) {
      const key = rule.keyGenerator
        ? rule.keyGenerator(context)
        : defaultKeyGenerator(context, `ratelimit:${rule.name}:`);

      const windowMs = parseWindow(rule.window);
      const result = await slidingWindowCheck(key, rule.maxRequests, windowMs);

      if (!result.allowed) {
        throw new RateLimitError(
          `Rate limit '${rule.name}' exceeded. Try again in ${result.retryAfter} seconds.`,
          result.retryAfter
        );
      }
    }
  };
}

/**
 * Create tiered rate limiter based on user role
 */
export function createTieredRateLimiter(
  tiers: Record<string, { maxRequests: number; window: string }>
) {
  return async (context: GraphQLContext): Promise<RateLimitInfo> => {
    const authContext = context as GraphQLContext & { user?: User };
    const role = authContext.user?.role || 'anonymous';
    const tier = tiers[role] || tiers.default || { maxRequests: 10, window: '1m' };

    return enforceLimit(context, {
      maxRequests: tier.maxRequests,
      windowMs: parseWindow(tier.window),
      keyPrefix: `ratelimit:tiered:${role}:`,
    });
  };
}

export default {
  initializeRateLimiter,
  parseWindow,
  checkLimit,
  checkLimitMs,
  enforceLimit,
  incrementCounter,
  getRemaining,
  resetLimit,
  getLimitKeys,
  createRateLimitDirective,
  createRateLimitMiddleware,
  createCompositeRateLimiter,
  createTieredRateLimiter,
};
