import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly memoryCache: LRUCache<string, any>;
  
  private hits = 0;
  private misses = 0;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.memoryCache = new LRUCache({
      max: 1000,
      ttl: 60000,
      updateAgeOnGet: true
    });

    this.logger.log('CacheService initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memValue = this.memoryCache.get(key);
    if (memValue !== undefined) {
      this.hits++;
      this.logger.debug(`Cache HIT (memory): ${key}`);
      return memValue as T;
    }

    // Level 2: Redis cache
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        this.hits++;
        const parsed = JSON.parse(redisValue);
        this.memoryCache.set(key, parsed);
        this.logger.debug(`Cache HIT (redis): ${key}`);
        return parsed as T;
      }
    } catch (error) {
      this.logger.error(`Redis get error: ${error.message}`);
    }

    this.misses++;
    this.logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300;
    
    try {
      const serialized = JSON.stringify(value);
      
      // Set in memory cache
      this.memoryCache.set(key, value);
      
      // Set in Redis
      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    try {
      await this.redis.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        keys.forEach(key => this.memoryCache.delete(key));
        this.logger.log(`Deleted ${keys.length} keys matching ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Delete by pattern error: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      await this.redis.flushdb();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, options);
    return value;
  }

  getMetrics() {
    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? (this.hits / total * 100).toFixed(2) : '0.00';
    
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRatio: `${hitRatio}%`,
      memorySize: this.memoryCache.size,
      memoryMax: this.memoryCache.max
    };
  }

  resetMetrics() {
    this.hits = 0;
    this.misses = 0;
  }
}
