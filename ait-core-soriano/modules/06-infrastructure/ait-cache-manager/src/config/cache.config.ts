import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'ait:cache:',
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    enableOfflineQueue: true,
  },
  inMemory: {
    max: parseInt(process.env.MEMORY_CACHE_MAX_ITEMS, 10) || 1000,
    maxSize: parseInt(process.env.MEMORY_CACHE_MAX_SIZE, 10) || 100 * 1024 * 1024, // 100MB
    ttl: parseInt(process.env.MEMORY_CACHE_TTL, 10) || 300000, // 5 minutes
    updateAgeOnGet: true,
    updateAgeOnHas: false,
  },
  cdn: {
    provider: process.env.CDN_PROVIDER || 'cloudflare',
    apiKey: process.env.CDN_API_KEY,
    zoneId: process.env.CDN_ZONE_ID,
    enabled: process.env.CDN_ENABLED === 'true',
  },
  compression: {
    enabled: process.env.CACHE_COMPRESSION_ENABLED !== 'false',
    threshold: parseInt(process.env.CACHE_COMPRESSION_THRESHOLD, 10) || 1024, // 1KB
    algorithm: process.env.CACHE_COMPRESSION_ALGORITHM || 'gzip',
  },
  encryption: {
    enabled: process.env.CACHE_ENCRYPTION_ENABLED === 'true',
    algorithm: process.env.CACHE_ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    key: process.env.CACHE_ENCRYPTION_KEY,
  },
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 3600, // 1 hour
  maxTTL: parseInt(process.env.CACHE_MAX_TTL, 10) || 86400, // 24 hours
  warmup: {
    enabled: process.env.CACHE_WARMUP_ENABLED === 'true',
    strategies: ['popular', 'critical'],
  },
  analytics: {
    enabled: process.env.CACHE_ANALYTICS_ENABLED !== 'false',
    sampleRate: parseFloat(process.env.CACHE_ANALYTICS_SAMPLE_RATE) || 0.1,
  },
}));
