import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  throw new Error('REDIS_URL is not defined');
};

class RedisClient {
  private static instance: Redis | null = null;

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      RedisClient.instance.on('connect', () => {
        console.log('✅ Redis connected');
      });

      RedisClient.instance.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });
    }

    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();

// Pub/Sub for event bus
export class EventBus {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = redis;
    this.subscriber = redis.duplicate();
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(msg);
          callback(parsed);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }
}

// Cache helpers
export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }

  static async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  }

  static async flush(): Promise<void> {
    await redis.flushdb();
  }
}

export default redis;
