import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
    const redisDb = this.configService.get<number>('REDIS_DB', 0);

    try {
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      } else {
        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          db: redisDb,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      await this.client.ping();
      this.logger.log('Redis connection verified');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Set a key-value pair with optional expiration
   */
  async set(key: string, value: string, expirationMode?: 'EX' | 'PX', time?: number): Promise<void> {
    try {
      if (expirationMode && time) {
        await this.client.set(key, value, expirationMode, time);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set a key-value pair with JSON serialization
   */
  async setJson<T>(key: string, value: T, expirationSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (expirationSeconds) {
        await this.client.setex(key, expirationSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting JSON key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value with JSON deserialization
   */
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting JSON key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    try {
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting keys:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking key existence ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiration on key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get TTL (time to live) for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Decrement a counter
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.del(...keys);
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Hash set field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      this.logger.error(`Error setting hash field ${key}:${field}:`, error);
      throw error;
    }
  }

  /**
   * Hash get field
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Error getting hash field ${key}:${field}:`, error);
      throw error;
    }
  }

  /**
   * Hash get all fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields ${key}:`, error);
      throw error;
    }
  }

  /**
   * Hash delete field
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      return await this.client.hdel(key, ...fields);
    } catch (error) {
      this.logger.error(`Error deleting hash fields ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get the underlying Redis client for advanced operations
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  /**
   * Flush all data from current database (USE WITH CAUTION!)
   */
  async flushdb(): Promise<string> {
    try {
      return await this.client.flushdb();
    } catch (error) {
      this.logger.error('Error flushing database:', error);
      throw error;
    }
  }
}
