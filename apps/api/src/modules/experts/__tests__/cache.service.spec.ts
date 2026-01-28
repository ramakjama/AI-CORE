/**
 * Cache Service Unit Tests
 */

import { CacheService } from '../services/cache.service';
import { RedisConfig } from '../config/redis.config';

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: any;

  const mockConfig: Partial<RedisConfig> = {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'test:',
    ttl: 3600,
  };

  beforeEach(() => {
    // Mock Redis client
    mockRedis = {
      on: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      incrby: jest.fn(),
      info: jest.fn(),
      dbsize: jest.fn(),
      flushdb: jest.fn(),
      quit: jest.fn(),
    };

    cacheService = new CacheService(mockConfig);
    (cacheService as any).redis = mockRedis;
    (cacheService as any).isConnected = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from cache', async () => {
      const testData = { foo: 'bar' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));

      const result = await cacheService.get('test-key');

      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null if key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value in cache with TTL', async () => {
      const testData = { foo: 'bar' };

      await cacheService.set('test-key', testData, 1800);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        1800,
        JSON.stringify(testData),
      );
    });

    it('should use default TTL if not provided', async () => {
      const testData = { foo: 'bar' };

      await cacheService.set('test-key', testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify(testData),
      );
    });

    it('should not throw on error', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      await expect(cacheService.set('test-key', {})).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      await cacheService.delete('test-key');

      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2', 'key3']);
      mockRedis.del.mockResolvedValue(3);

      const deleted = await cacheService.deletePattern('test:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
      expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      expect(deleted).toBe(3);
    });

    it('should return 0 if no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const deleted = await cacheService.deletePattern('test:*');

      expect(deleted).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('exists', () => {
    it('should return true if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const exists = await cacheService.exists('test-key');

      expect(exists).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const exists = await cacheService.exists('test-key');

      expect(exists).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return remaining TTL', async () => {
      mockRedis.ttl.mockResolvedValue(1800);

      const ttl = await cacheService.ttl('test-key');

      expect(ttl).toBe(1800);
    });
  });

  describe('increment', () => {
    it('should increment counter', async () => {
      mockRedis.incrby.mockResolvedValue(5);

      const result = await cacheService.increment('counter', 1);

      expect(mockRedis.incrby).toHaveBeenCalledWith('counter', 1);
      expect(result).toBe(5);
    });
  });

  describe('healthCheck', () => {
    it('should return true if Redis is healthy', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const healthy = await cacheService.healthCheck();

      expect(healthy).toBe(true);
    });

    it('should return false if Redis is unhealthy', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const healthy = await cacheService.healthCheck();

      expect(healthy).toBe(false);
    });
  });
});
