import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.config';
import { oauthConfig } from '../config/oauth.config';

export const rateLimiter = rateLimit({
  windowMs: oauthConfig.rateLimit.windowMs,
  max: oauthConfig.rateLimit.max,
  standardHeaders: oauthConfig.rateLimit.standardHeaders,
  legacyHeaders: oauthConfig.rateLimit.legacyHeaders,
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:'
  }),
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per window
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rl:strict:'
  }),
  message: {
    success: false,
    error: 'Too many attempts, please try again later'
  }
});
