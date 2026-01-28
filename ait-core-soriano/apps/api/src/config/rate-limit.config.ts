/**
 * Rate Limiting Configuration
 * Protection against brute force and DDoS attacks
 *
 * @module config/rate-limit
 * @description Multi-tier rate limiting with different strategies for various endpoints
 */

import { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Global Rate Limiting Configuration
 * Applied to all routes by default
 */
export const globalRateLimitConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000, // 1 second
      limit: 10, // 10 requests per second
    },
    {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    },
    {
      name: 'long',
      ttl: 3600000, // 1 hour
      limit: 1000, // 1000 requests per hour
    },
  ],
  ignoreUserAgents: [
    /health-check/i,
    /monitoring/i,
  ],
};

/**
 * Authentication Endpoints Rate Limiting
 * Stricter limits to prevent brute force attacks
 */
export const authRateLimitConfig = {
  login: {
    ttl: 900000, // 15 minutes
    limit: 5, // 5 attempts per 15 minutes
  },
  register: {
    ttl: 3600000, // 1 hour
    limit: 3, // 3 registrations per hour per IP
  },
  passwordReset: {
    ttl: 3600000, // 1 hour
    limit: 3, // 3 password reset requests per hour
  },
  verifyEmail: {
    ttl: 600000, // 10 minutes
    limit: 5, // 5 verification attempts per 10 minutes
  },
};

/**
 * API Endpoints Rate Limiting by Category
 */
export const apiRateLimitConfig = {
  public: {
    ttl: 60000, // 1 minute
    limit: 30, // 30 requests per minute (unauthenticated)
  },
  authenticated: {
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute (authenticated)
  },
  premium: {
    ttl: 60000, // 1 minute
    limit: 300, // 300 requests per minute (premium users)
  },
  admin: {
    ttl: 60000, // 1 minute
    limit: 500, // 500 requests per minute (admin users)
  },
};

/**
 * File Upload Rate Limiting
 */
export const uploadRateLimitConfig = {
  ttl: 3600000, // 1 hour
  limit: 50, // 50 uploads per hour
  maxFileSize: 10 * 1024 * 1024, // 10 MB
};

/**
 * Search and Query Rate Limiting
 */
export const searchRateLimitConfig = {
  ttl: 60000, // 1 minute
  limit: 20, // 20 searches per minute
};

/**
 * WebSocket Connection Rate Limiting
 */
export const websocketRateLimitConfig = {
  connection: {
    ttl: 60000, // 1 minute
    limit: 5, // 5 new connections per minute
  },
  message: {
    ttl: 1000, // 1 second
    limit: 10, // 10 messages per second
  },
};

/**
 * Export/Report Generation Rate Limiting
 */
export const exportRateLimitConfig = {
  ttl: 3600000, // 1 hour
  limit: 10, // 10 exports per hour
};

/**
 * Payment Processing Rate Limiting
 */
export const paymentRateLimitConfig = {
  ttl: 300000, // 5 minutes
  limit: 3, // 3 payment attempts per 5 minutes
};

/**
 * Custom Rate Limit Guard Configuration
 * For use with @Throttle() decorator
 */
export const customThrottleConfig = {
  default: { ttl: 60000, limit: 100 },
  strict: { ttl: 60000, limit: 10 },
  relaxed: { ttl: 60000, limit: 200 },
};

/**
 * IP Whitelist Configuration
 * IPs that bypass rate limiting
 */
export const ipWhitelist = [
  '127.0.0.1',
  '::1',
  // Add your internal service IPs here
  // '10.0.0.0/8',
  // '172.16.0.0/12',
  // '192.168.0.0/16',
];

/**
 * IP Blacklist Configuration
 * IPs that are completely blocked
 */
export const ipBlacklist: string[] = [
  // Add malicious IPs here
];

/**
 * Rate Limit Error Messages
 */
export const rateLimitMessages = {
  tooManyRequests: 'Too many requests from this IP, please try again later.',
  tooManyLoginAttempts: 'Too many login attempts. Please try again in 15 minutes.',
  tooManyRegistrations: 'Too many registration attempts. Please try again later.',
  tooManyPasswordResets: 'Too many password reset requests. Please try again in 1 hour.',
  tooManyUploads: 'Upload limit exceeded. Please try again later.',
  tooManySearches: 'Search rate limit exceeded. Please slow down.',
  tooManyExports: 'Export limit exceeded. Please try again later.',
  tooManyPayments: 'Too many payment attempts. Please wait 5 minutes and try again.',
};

/**
 * Rate Limiting Strategy Options
 */
export interface RateLimitStrategy {
  ttl: number; // Time to live in milliseconds
  limit: number; // Maximum number of requests
  blockDuration?: number; // How long to block after limit exceeded
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Get rate limit configuration based on user tier
 */
export function getRateLimitByUserTier(tier: 'free' | 'basic' | 'premium' | 'admin'): RateLimitStrategy {
  const configs = {
    free: { ttl: 60000, limit: 30 },
    basic: { ttl: 60000, limit: 100 },
    premium: { ttl: 60000, limit: 300 },
    admin: { ttl: 60000, limit: 500 },
  };

  return configs[tier] || configs.free;
}

/**
 * Calculate rate limit reset time
 */
export function calculateResetTime(ttl: number): number {
  return Date.now() + ttl;
}

/**
 * Format rate limit headers
 */
export function formatRateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };
}
