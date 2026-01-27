/**
 * Cache Middleware
 * Redis-based caching with TTL, invalidation, and compression
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';
import {
  CacheConfig,
  GraphQLContext,
  CacheService,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  tags: string[];
  compressed: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  invalidations: number;
}

interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[];
  compress?: boolean;
  skipCache?: boolean;
}

// ============================================================================
// Compression Utilities
// ============================================================================

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

const COMPRESSION_THRESHOLD = 1024; // Only compress if larger than 1KB

async function compressData(data: string): Promise<Buffer> {
  return gzipAsync(Buffer.from(data, 'utf-8'));
}

async function decompressData(data: Buffer): Promise<string> {
  const buffer = await gunzipAsync(data);
  return buffer.toString('utf-8');
}

// ============================================================================
// Redis Client Management
// ============================================================================

let redisClient: Redis | null = null;
let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  invalidations: 0,
};

/**
 * Initialize cache with Redis client
 */
export function initializeCache(redis: Redis): void {
  redisClient = redis;
  resetStats();
}

/**
 * Get Redis client
 */
function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Cache not initialized. Call initializeCache first.');
  }
  return redisClient;
}

/**
 * Reset cache statistics
 */
export function resetStats(): void {
  cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    invalidations: 0,
  };
}

/**
 * Get cache statistics
 */
export function getStats(): CacheStats {
  return { ...cacheStats };
}

// ============================================================================
// Key Generation
// ============================================================================

const DEFAULT_KEY_PREFIX = 'cache:';

/**
 * Generate cache key from components
 */
export function generateCacheKey(
  prefix: string,
  ...components: (string | number | object)[]
): string {
  const parts = components.map(c => {
    if (typeof c === 'object') {
      return createHash('sha256')
        .update(JSON.stringify(c))
        .digest('hex')
        .substring(0, 16);
    }
    return String(c);
  });

  return `${DEFAULT_KEY_PREFIX}${prefix}:${parts.join(':')}`;
}

/**
 * Generate cache key for GraphQL query
 */
export function generateQueryCacheKey(
  operationName: string | undefined,
  variables: Record<string, unknown> | undefined,
  userId?: string
): string {
  const parts = [operationName || 'anonymous'];

  if (variables) {
    const varsHash = createHash('sha256')
      .update(JSON.stringify(variables))
      .digest('hex')
      .substring(0, 16);
    parts.push(varsHash);
  }

  if (userId) {
    parts.push(`user:${userId}`);
  }

  return generateCacheKey('query', ...parts);
}

// ============================================================================
// Core Cache Operations
// ============================================================================

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();

  try {
    const raw = await redis.getBuffer(key);

    if (!raw) {
      cacheStats.misses++;
      return null;
    }

    // Try to parse as JSON first (uncompressed)
    let entryStr: string;
    try {
      entryStr = raw.toString('utf-8');
      const entry = JSON.parse(entryStr) as CacheEntry<T>;

      // Check if expired
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        await redis.del(key);
        cacheStats.misses++;
        return null;
      }

      // Handle compressed data
      if (entry.compressed) {
        const decompressed = await decompressData(Buffer.from(entry.data as unknown as string, 'base64'));
        cacheStats.hits++;
        return JSON.parse(decompressed) as T;
      }

      cacheStats.hits++;
      return entry.data;
    } catch {
      // If JSON parse fails, might be raw compressed data
      try {
        const decompressed = await decompressData(raw);
        cacheStats.hits++;
        return JSON.parse(decompressed) as T;
      } catch {
        cacheStats.misses++;
        return null;
      }
    }
  } catch (error) {
    console.error('Cache get error:', error);
    cacheStats.misses++;
    return null;
  }
}

/**
 * Set cached value
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = 300,
  options: Omit<CacheOptions, 'ttlSeconds'> = {}
): Promise<void> {
  const redis = getRedis();
  const now = Date.now();
  const { tags = [], compress = true } = options;

  try {
    const dataStr = JSON.stringify(data);
    const shouldCompress = compress && dataStr.length > COMPRESSION_THRESHOLD;

    let entry: CacheEntry<T | string>;

    if (shouldCompress) {
      const compressed = await compressData(dataStr);
      entry = {
        data: compressed.toString('base64'),
        createdAt: now,
        expiresAt: now + ttlSeconds * 1000,
        tags,
        compressed: true,
      };
    } else {
      entry = {
        data,
        createdAt: now,
        expiresAt: now + ttlSeconds * 1000,
        tags,
        compressed: false,
      };
    }

    // Store the cache entry
    await redis.setex(key, ttlSeconds, JSON.stringify(entry));

    // Store tag associations for invalidation
    if (tags.length > 0) {
      const pipeline = redis.pipeline();
      for (const tag of tags) {
        const tagKey = `${DEFAULT_KEY_PREFIX}tag:${tag}`;
        pipeline.sadd(tagKey, key);
        pipeline.expire(tagKey, ttlSeconds + 60); // Tag expires slightly after cache
      }
      await pipeline.exec();
    }

    cacheStats.sets++;
  } catch (error) {
    console.error('Cache set error:', error);
    throw error;
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<boolean> {
  const redis = getRedis();

  try {
    const result = await redis.del(key);
    if (result > 0) {
      cacheStats.deletes++;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Check if key exists in cache
 */
export async function existsInCache(key: string): Promise<boolean> {
  const redis = getRedis();

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Cache exists error:', error);
    return false;
  }
}

// ============================================================================
// Invalidation
// ============================================================================

/**
 * Invalidate cache entries matching a pattern
 */
export async function invalidate(pattern: string): Promise<number> {
  const redis = getRedis();

  try {
    // Use SCAN to find matching keys (safer than KEYS for large datasets)
    let cursor = '0';
    let totalDeleted = 0;
    const batchSize = 100;

    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${DEFAULT_KEY_PREFIX}${pattern}`,
        'COUNT',
        batchSize.toString()
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        totalDeleted += deleted;
      }
    } while (cursor !== '0');

    cacheStats.invalidations += totalDeleted;
    return totalDeleted;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate cache entries by tag
 */
export async function invalidateByTag(tag: string): Promise<number> {
  const redis = getRedis();
  const tagKey = `${DEFAULT_KEY_PREFIX}tag:${tag}`;

  try {
    // Get all keys with this tag
    const keys = await redis.smembers(tagKey);

    if (keys.length === 0) {
      return 0;
    }

    // Delete all keys and the tag set
    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.del(key);
    }
    pipeline.del(tagKey);

    await pipeline.exec();

    cacheStats.invalidations += keys.length;
    return keys.length;
  } catch (error) {
    console.error('Cache tag invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate multiple tags
 */
export async function invalidateByTags(tags: string[]): Promise<number> {
  let total = 0;
  for (const tag of tags) {
    total += await invalidateByTag(tag);
  }
  return total;
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<number> {
  return invalidate('*');
}

// ============================================================================
// Cache Service Implementation
// ============================================================================

/**
 * Create a CacheService instance
 */
export function createCacheService(): CacheService {
  return {
    async get<T>(key: string): Promise<T | null> {
      return getCached<T>(generateCacheKey('', key));
    },

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      await setCache(generateCacheKey('', key), value, ttlSeconds);
    },

    async delete(key: string): Promise<void> {
      await deleteCache(generateCacheKey('', key));
    },

    async invalidatePattern(pattern: string): Promise<number> {
      return invalidate(pattern);
    },

    async exists(key: string): Promise<boolean> {
      return existsInCache(generateCacheKey('', key));
    },
  };
}

// ============================================================================
// Cache Directive Implementation
// ============================================================================

/**
 * Cache directive implementation
 */
export function createCacheDirective() {
  return {
    async cache(
      resolve: Function,
      source: unknown,
      args: Record<string, unknown>,
      context: GraphQLContext,
      info: { fieldName: string; parentType: { name: string } },
      { maxAge, scope, tags }: { maxAge: number; scope?: string; tags?: string[] }
    ) {
      // Generate cache key based on field, args, and optionally user
      const authContext = context as GraphQLContext & { user?: { id: string } };
      const userId = scope === 'PRIVATE' ? authContext.user?.id : undefined;

      const cacheKey = generateCacheKey(
        `field:${info.parentType.name}.${info.fieldName}`,
        args,
        userId || ''
      );

      // Try to get from cache
      const cached = await getCached(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute resolver
      const result = await resolve(source, args, context, info);

      // Cache the result
      if (result !== undefined && result !== null) {
        await setCache(cacheKey, result, maxAge, { tags });
      }

      return result;
    },
  };
}

// ============================================================================
// Memoization / Request-Level Caching
// ============================================================================

/**
 * Create a request-scoped cache (useful for avoiding duplicate fetches within a single request)
 */
export function createRequestCache(): Map<string, unknown> {
  return new Map();
}

/**
 * Memoize a function with cache key
 */
export function memoize<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  requestCache: Map<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);

    if (requestCache.has(key)) {
      return requestCache.get(key);
    }

    const result = await fn(...args);
    requestCache.set(key, result);
    return result;
  }) as T;
}

// ============================================================================
// Cache Warming
// ============================================================================

/**
 * Warm cache with predefined data
 */
export async function warmCache(
  entries: Array<{
    key: string;
    data: unknown;
    ttlSeconds?: number;
    tags?: string[];
  }>
): Promise<void> {
  for (const entry of entries) {
    await setCache(
      generateCacheKey('warm', entry.key),
      entry.data,
      entry.ttlSeconds || 3600,
      { tags: entry.tags }
    );
  }
}

/**
 * Cache warming function type
 */
type CacheWarmer = () => Promise<Array<{
  key: string;
  data: unknown;
  ttlSeconds?: number;
  tags?: string[];
}>>;

/**
 * Register cache warmer to run periodically
 */
export function registerCacheWarmer(
  warmer: CacheWarmer,
  intervalMs: number
): NodeJS.Timer {
  // Run immediately
  warmer().then(entries => warmCache(entries)).catch(console.error);

  // Schedule periodic runs
  return setInterval(async () => {
    try {
      const entries = await warmer();
      await warmCache(entries);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }, intervalMs);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get or set cache (convenience function)
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = 300,
  options: CacheOptions = {}
): Promise<T> {
  if (options.skipCache) {
    return factory();
  }

  const cacheKey = generateCacheKey('getOrSet', key);
  const cached = await getCached<T>(cacheKey);

  if (cached !== null) {
    return cached;
  }

  const data = await factory();

  if (data !== undefined && data !== null) {
    await setCache(cacheKey, data, options.ttlSeconds || ttlSeconds, {
      tags: options.tags,
      compress: options.compress,
    });
  }

  return data;
}

/**
 * Cache aside pattern with stale-while-revalidate
 */
export async function cacheAside<T>(
  key: string,
  factory: () => Promise<T>,
  options: {
    ttlSeconds: number;
    staleTtlSeconds?: number;
    tags?: string[];
  }
): Promise<T> {
  const redis = getRedis();
  const cacheKey = generateCacheKey('aside', key);

  // Try to get from cache
  const raw = await redis.get(cacheKey);

  if (raw) {
    try {
      const entry = JSON.parse(raw) as CacheEntry<T> & { staleAt?: number };

      // If not stale, return immediately
      if (!entry.staleAt || entry.staleAt > Date.now()) {
        cacheStats.hits++;
        return entry.data;
      }

      // If stale but not expired, return stale data and refresh in background
      if (entry.expiresAt > Date.now()) {
        cacheStats.hits++;

        // Refresh in background
        factory()
          .then(data => setCache(cacheKey, data, options.ttlSeconds, { tags: options.tags }))
          .catch(console.error);

        return entry.data;
      }
    } catch {
      // Invalid cache entry, fetch fresh
    }
  }

  cacheStats.misses++;

  // Fetch fresh data
  const data = await factory();

  // Store with stale time
  const staleTtl = options.staleTtlSeconds || Math.floor(options.ttlSeconds * 0.8);
  const entry = {
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + options.ttlSeconds * 1000,
    staleAt: Date.now() + staleTtl * 1000,
    tags: options.tags || [],
    compressed: false,
  };

  await redis.setex(cacheKey, options.ttlSeconds, JSON.stringify(entry));
  cacheStats.sets++;

  return data;
}

/**
 * Get TTL for a cache key
 */
export async function getCacheTTL(key: string): Promise<number> {
  const redis = getRedis();
  return redis.ttl(key);
}

export default {
  initializeCache,
  resetStats,
  getStats,
  generateCacheKey,
  generateQueryCacheKey,
  getCached,
  setCache,
  deleteCache,
  existsInCache,
  invalidate,
  invalidateByTag,
  invalidateByTags,
  clearCache,
  createCacheService,
  createCacheDirective,
  createRequestCache,
  memoize,
  warmCache,
  registerCacheWarmer,
  getOrSet,
  cacheAside,
  getCacheTTL,
};
