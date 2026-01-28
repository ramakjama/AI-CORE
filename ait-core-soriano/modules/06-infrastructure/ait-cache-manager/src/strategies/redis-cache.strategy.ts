import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheLayer, CacheOptions, CacheStats } from '../interfaces/cache.interface';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class RedisCacheStrategy implements CacheLayer, OnModuleDestroy {
  name = 'redis';
  private readonly logger = new Logger(RedisCacheStrategy.name);
  private client: Redis;
  private statsKey = 'cache:stats';

  constructor(private configService: ConfigService) {
    const config = this.configService.get('cache.redis');
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryStrategy: config.retryStrategy,
      enableReadyCheck: config.enableReadyCheck,
      enableOfflineQueue: config.enableOfflineQueue,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis cache connected');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis cache error: ${err.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        await this.incrementStat('misses');
        this.logger.debug(`Redis cache MISS: ${key}`);
        return null;
      }

      await this.incrementStat('hits');
      this.logger.debug(`Redis cache HIT: ${key}`);

      if (value.startsWith('GZIP:')) {
        const compressed = Buffer.from(value.slice(5), 'base64');
        const decompressed = await gunzip(compressed);
        return JSON.parse(decompressed.toString()) as T;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      let dataToStore = JSON.stringify(value);
      const compressionConfig = this.configService.get('cache.compression');

      if (
        (options?.compress || compressionConfig.enabled) &&
        dataToStore.length > compressionConfig.threshold
      ) {
        const compressed = await gzip(Buffer.from(dataToStore));
        dataToStore = 'GZIP:' + compressed.toString('base64');
        this.logger.debug(`Compressed cache entry for ${key}`);
      }

      const ttl = options?.ttl || this.configService.get('cache.defaultTTL');

      if (ttl) {
        await this.client.setex(key, ttl, dataToStore);
      } else {
        await this.client.set(key, dataToStore);
      }

      if (options?.tags && options.tags.length > 0) {
        const tagKey = `tags:${options.tags.join(':')}`;
        await this.client.sadd(tagKey, key);
        await this.client.expire(tagKey, ttl || 86400);
      }

      this.logger.debug(`Redis cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      this.logger.debug(`Redis cache DELETE: ${key} - ${result > 0}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Redis delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async clear(pattern?: string): Promise<number> {
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length === 0) return 0;
        const result = await this.client.del(...keys);
        this.logger.log(`Redis cache CLEAR pattern ${pattern}: ${result} keys`);
        return result;
      }
      await this.client.flushdb();
      this.logger.log('Redis cache CLEAR all');
      return 0;
    } catch (error) {
      this.logger.error(`Redis clear error: ${error.message}`);
      return 0;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Redis exists error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key ${key}: ${error.message}`);
      return -1;
    }
  }

  async stats(): Promise<CacheStats> {
    try {
      const hits = parseInt(await this.client.get(`${this.statsKey}:hits`) || '0', 10);
      const misses = parseInt(await this.client.get(`${this.statsKey}:misses`) || '0', 10);
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbsize();

      const hitRate = hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0;

      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memory = memoryMatch ? parseInt(memoryMatch[1], 10) : 0;

      const evictionsMatch = info.match(/evicted_keys:(\d+)/);
      const evictions = evictionsMatch ? parseInt(evictionsMatch[1], 10) : 0;

      return { hits, misses, hitRate, keys: dbSize, memory, evictions };
    } catch (error) {
      this.logger.error(`Redis stats error: ${error.message}`);
      return { hits: 0, misses: 0, hitRate: 0, keys: 0, memory: 0, evictions: 0 };
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;
    for (const tag of tags) {
      const tagKey = `tags:${tag}`;
      const keys = await this.client.smembers(tagKey);
      if (keys.length > 0) {
        totalDeleted += await this.client.del(...keys);
      }
      await this.client.del(tagKey);
    }
    this.logger.log(`Invalidated ${totalDeleted} keys by tags: ${tags.join(', ')}`);
    return totalDeleted;
  }

  private async incrementStat(stat: string): Promise<void> {
    try {
      await this.client.incr(`${this.statsKey}:${stat}`);
    } catch (error) {
      // Silently fail for stats
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis cache disconnected');
  }
}
