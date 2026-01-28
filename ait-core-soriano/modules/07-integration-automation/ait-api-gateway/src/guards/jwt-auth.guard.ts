import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly redis: Redis;
  private readonly jwtSecret: string;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 0
    });
    
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Check cache first (5 min TTL)
      const cacheKey = `jwt:${token}`;
      const cachedPayload = await this.redis.get(cacheKey);

      if (cachedPayload) {
        request['user'] = JSON.parse(cachedPayload);
        return true;
      }

      // Verify JWT
      const payload = jwt.verify(token, this.jwtSecret) as any;

      // Store in cache
      await this.redis.setex(cacheKey, 300, JSON.stringify(payload));

      // Attach user to request
      request['user'] = payload;

      return true;
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
