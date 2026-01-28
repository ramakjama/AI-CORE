/**
 * Cache Service
 * Redis-based caching for AI expert responses
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisConfig, defaultRedisConfig, validateRedisConfig } from '../config/redis.config';
import { LoggerService } from '../config/logger.config';
import { CacheError } from '../utils/error-handler';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;
  private logger: LoggerService;
  private config: RedisConfig;
  private isConnected: boolean = false;

  constructor(config?: Partial<RedisConfig>) {
    this.config = { ...defaultRedisConfig, ...config };
    validateRedisConfig(this.config);
    this.logger = new LoggerService('CacheService');
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        enableOfflineQueue: this.config.enableOfflineQueue,
        connectTimeout: this.config.connectTimeout,
        retryStrategy: this.config.retryStrategy,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis', { host: this.config.host, port: this.config.port });
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error', error.stack, { error: error.message });
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      // Wait for connection
      await this.redis.ping();

    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to connect to Redis', err.stack, { error: err.message });
      throw new CacheError('Failed to connect to Redis', { originalError: err.message });
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      this.logger.log('Disconnected from Redis');
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache get', { key });
        return null;
      }

      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value);
      this.logger.debug('Cache hit', { key });

      return parsed as T;

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache get error', err.stack, { key, error: err.message });
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache set', { key });
        return;
      }

      const serialized = JSON.stringify(value);
      const cacheTTL = ttl || this.config.ttl || 3600;

      await this.redis.setex(key, cacheTTL, serialized);

      this.logger.debug('Cache set', { key, ttl: cacheTTL });

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache set error', err.stack, { key, error: err.message });
      // Fail gracefully, don't throw
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache delete', { key });
        return;
      }

      await this.redis.del(key);
      this.logger.debug('Cache delete', { key });

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache delete error', err.stack, { key, error: err.message });
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache delete pattern', { pattern });
        return 0;
      }

      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      this.logger.debug('Cache delete pattern', { pattern, deleted });

      return deleted;

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache delete pattern error', err.stack, { pattern, error: err.message });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const exists = await this.redis.exists(key);
      return exists === 1;

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache exists error', err.stack, { key, error: err.message });
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.redis.ttl(key);

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache TTL error', err.stack, { key, error: err.message });
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.redis.incrby(key, by);

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache increment error', err.stack, { key, error: err.message });
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsed?: string;
    uptime?: number;
  }> {
    try {
      if (!this.isConnected) {
        return { connected: false, keyCount: 0 };
      }

      // const info = await this.redis.info('stats');
      const keyCount = await this.redis.dbsize();

      return {
        connected: this.isConnected,
        keyCount,
      };

    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to get cache stats', err.stack, { error: err.message });
      return { connected: false, keyCount: 0 };
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping cache flush');
        return;
      }

      await this.redis.flushdb();
      this.logger.warn('Cache flushed');

    } catch (error) {
      const err = error as Error;
      this.logger.error('Cache flush error', err.stack, { error: err.message });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      await this.redis.ping();
      return true;

    } catch (error) {
      return false;
    }
  }
}
