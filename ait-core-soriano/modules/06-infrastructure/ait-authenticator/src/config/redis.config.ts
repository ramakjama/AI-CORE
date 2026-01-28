import Redis from 'ioredis';
import { logger } from '../utils/logger.utils';

let redisClient: Redis | null = null;

export const initializeRedis = async (): Promise<Redis> => {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false
    };

    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('✓ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.ping();

    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

// Cache helper functions
export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    if (expirySeconds) {
      await client.setex(key, expirySeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  async increment(key: string, by: number = 1): Promise<number> {
    const client = getRedisClient();
    return await client.incrby(key, by);
  },

  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, seconds);
  }
};
