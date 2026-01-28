/**
 * Redis Configuration
 * Configuration for Redis cache
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
  maxRetriesPerRequest?: number;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  retryStrategy?: (times: number) => number | void;
}

/**
 * Default Redis configuration
 */
export const defaultRedisConfig: RedisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
  password: process.env['REDIS_PASSWORD'],
  db: parseInt(process.env['REDIS_DB'] || '0', 10),
  keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'experts:',
  ttl: parseInt(process.env['REDIS_TTL'] || '3600', 10),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

/**
 * Validate Redis configuration
 */
export function validateRedisConfig(config: RedisConfig): void {
  if (!config.host) {
    throw new Error('Redis host is required');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('Redis port must be between 1 and 65535');
  }

  if (config.db !== undefined && (config.db < 0 || config.db > 15)) {
    throw new Error('Redis DB must be between 0 and 15');
  }

  if (config.ttl !== undefined && config.ttl < 0) {
    throw new Error('Redis TTL must be positive');
  }
}

/**
 * Get Redis connection URL
 */
export function getRedisUrl(config: RedisConfig): string {
  let url = 'redis://';

  if (config.password) {
    url += `:${config.password}@`;
  }

  url += `${config.host}:${config.port}`;

  if (config.db) {
    url += `/${config.db}`;
  }

  return url;
}
