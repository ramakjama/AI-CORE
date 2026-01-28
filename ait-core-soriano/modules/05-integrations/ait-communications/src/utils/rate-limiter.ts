/**
 * @fileoverview Rate Limiter Utility
 * @module @ait-core/communications/utils
 * @description Rate limiting for communication channels
 */

import { Redis } from 'ioredis';
import { CommunicationChannel } from '../interfaces/message.types';

export class RateLimiter {
  private redis: Redis;
  private limits: Map<CommunicationChannel, number>;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.limits = new Map([
      ['EMAIL', parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100')],
      ['SMS', parseInt(process.env.SMS_RATE_LIMIT_PER_HOUR || '50')],
      ['WHATSAPP', parseInt(process.env.WHATSAPP_RATE_LIMIT_PER_HOUR || '50')]
    ]);
  }

  /**
   * Check rate limit
   */
  async checkLimit(channel: CommunicationChannel): Promise<boolean> {
    const key = `rate_limit:${channel}`;
    const limit = this.limits.get(channel) || 100;

    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, 3600); // 1 hour
    }

    if (count > limit) {
      throw new Error(
        `Rate limit exceeded for ${channel}: ${count}/${limit} per hour`
      );
    }

    return true;
  }

  /**
   * Get remaining quota
   */
  async getRemaining(channel: CommunicationChannel): Promise<number> {
    const key = `rate_limit:${channel}`;
    const limit = this.limits.get(channel) || 100;

    const count = parseInt((await this.redis.get(key)) || '0');
    return Math.max(0, limit - count);
  }

  /**
   * Reset quota
   */
  async reset(channel: CommunicationChannel): Promise<void> {
    const key = `rate_limit:${channel}`;
    await this.redis.del(key);
  }
}
