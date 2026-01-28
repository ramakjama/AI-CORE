import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';
import { CacheLayer, CacheOptions, CacheStats } from '../interfaces/cache.interface';

@Injectable()
export class MemoryCacheStrategy implements CacheLayer {
  name = 'memory';
  private readonly logger = new Logger(MemoryCacheStrategy.name);
  private cache: LRUCache<string, any>;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(private configService: ConfigService) {
    const config = this.configService.get('cache.inMemory');
    this.cache = new LRUCache({
      max: config.max,
      maxSize: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet,
      updateAgeOnHas: config.updateAgeOnHas,
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      dispose: () => {
        this.stats.evictions++;
      },
    });
    this.logger.log('Memory cache initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      this.logger.debug(`Memory cache HIT: ${key}`);
      return value as T;
    }
    this.stats.misses++;
    this.logger.debug(`Memory cache MISS: ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl ? options.ttl * 1000 : undefined;
    this.cache.set(key, value, { ttl });
    this.logger.debug(`Memory cache SET: ${key}`);
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    this.logger.debug(`Memory cache DELETE: ${key} - ${deleted}`);
    return deleted;
  }

  async clear(pattern?: string): Promise<number> {
    if (pattern) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      let count = 0;
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          count++;
        }
      }
      this.logger.log(`Memory cache CLEAR pattern ${pattern}: ${count} keys`);
      return count;
    }
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Memory cache CLEAR all: ${size} keys`);
    return size;
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async ttl(key: string): Promise<number> {
    const remainingTTL = this.cache.getRemainingTTL(key);
    return remainingTTL > 0 ? Math.floor(remainingTTL / 1000) : 0;
  }

  async stats(): Promise<CacheStats> {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      keys: this.cache.size,
      memory: this.cache.calculatedSize || 0,
      evictions: this.stats.evictions,
    };
  }
}
