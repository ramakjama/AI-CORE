/**
 * AIT-CORE Caching Configuration
 * Redis, in-memory, and edge caching strategies
 */

const redis = require('redis');

// Redis Configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false,
};

// Cache TTL configurations (in seconds)
const ttlConfig = {
  // User data
  userProfile: 3600,        // 1 hour
  userPreferences: 86400,   // 24 hours
  userSession: 3600,        // 1 hour

  // Business data
  policies: 3600,           // 1 hour
  claims: 1800,             // 30 minutes
  quotes: 1800,             // 30 minutes
  customers: 3600,          // 1 hour

  // Static data
  metadata: 86400,          // 24 hours
  configurations: 3600,     // 1 hour
  translations: 86400,      // 24 hours

  // Analytics
  dashboardData: 300,       // 5 minutes
  reports: 1800,            // 30 minutes
  metrics: 60,              // 1 minute

  // API responses
  publicApi: 300,           // 5 minutes
  privateApi: 60,           // 1 minute
  searchResults: 600,       // 10 minutes
};

// Cache key patterns
const keyPatterns = {
  user: (userId) => `user:${userId}`,
  userPrefs: (userId) => `user:${userId}:prefs`,
  userSession: (sessionId) => `session:${sessionId}`,

  policy: (policyId) => `policy:${policyId}`,
  policiesByUser: (userId) => `policies:user:${userId}`,

  claim: (claimId) => `claim:${claimId}`,
  claimsByUser: (userId) => `claims:user:${userId}`,

  quote: (quoteId) => `quote:${quoteId}`,
  quotesByUser: (userId) => `quotes:user:${userId}`,

  customer: (customerId) => `customer:${customerId}`,

  dashboardData: (userId, type) => `dashboard:${userId}:${type}`,
  reportData: (reportId, params) => `report:${reportId}:${JSON.stringify(params)}`,

  apiResponse: (endpoint, params) => `api:${endpoint}:${JSON.stringify(params)}`,
  searchResults: (query, filters) => `search:${query}:${JSON.stringify(filters)}`,
};

// Redis client singleton
let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient(redisConfig);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting');
    });

    redisClient.connect().catch(console.error);
  }

  return redisClient;
}

// Cache Manager Class
class CacheManager {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.memoryCacheMaxSize = 1000;
  }

  async initialize() {
    try {
      this.redis = getRedisClient();
      return true;
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      return false;
    }
  }

  // Get from cache
  async get(key) {
    // Try memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (cached.expiry > Date.now()) {
        return cached.value;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Try Redis
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          // Store in memory cache for faster access
          this.setMemoryCache(key, parsed, 60); // 60 seconds in memory
          return parsed;
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    return null;
  }

  // Set in cache
  async set(key, value, ttl = 3600) {
    // Set in memory cache
    this.setMemoryCache(key, value, Math.min(ttl, 300)); // Max 5 minutes in memory

    // Set in Redis
    if (this.redis) {
      try {
        await this.redis.setEx(key, ttl, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Redis set error:', error);
        return false;
      }
    }

    return true;
  }

  // Delete from cache
  async delete(key) {
    this.memoryCache.delete(key);

    if (this.redis) {
      try {
        await this.redis.del(key);
        return true;
      } catch (error) {
        console.error('Redis delete error:', error);
        return false;
      }
    }

    return true;
  }

  // Delete by pattern
  async deletePattern(pattern) {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
        return true;
      } catch (error) {
        console.error('Redis delete pattern error:', error);
        return false;
      }
    }

    // Clear matching keys from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }

    return true;
  }

  // Memory cache helpers
  setMemoryCache(key, value, ttl) {
    if (this.memoryCache.size >= this.memoryCacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttl * 1000),
    });
  }

  // Clear all cache
  async clear() {
    this.memoryCache.clear();

    if (this.redis) {
      try {
        await this.redis.flushDb();
        return true;
      } catch (error) {
        console.error('Redis clear error:', error);
        return false;
      }
    }

    return true;
  }

  // Get cache stats
  async getStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.memoryCacheMaxSize,
      },
      redis: null,
    };

    if (this.redis) {
      try {
        const info = await this.redis.info('stats');
        stats.redis = {
          connected: true,
          info: info,
        };
      } catch (error) {
        stats.redis = {
          connected: false,
          error: error.message,
        };
      }
    }

    return stats;
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Caching decorator for functions
function cached(ttl, keyGenerator) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : `${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      await cacheManager.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

module.exports = {
  redisConfig,
  ttlConfig,
  keyPatterns,
  cacheManager,
  cached,
  getRedisClient,
};
