import { ApiProperty } from '@nestjs/swagger';

export enum RateLimitType {
  IP = 'IP',
  USER = 'USER',
  API_KEY = 'API_KEY',
  GLOBAL = 'GLOBAL'
}

export class RateLimit {
  @ApiProperty({ description: 'Rate limit unique identifier' })
  id: string;

  @ApiProperty({ enum: RateLimitType, description: 'Rate limit type' })
  type: RateLimitType;

  @ApiProperty({ description: 'Identifier (IP, userId, apiKey)', nullable: true })
  identifier?: string;

  @ApiProperty({ description: 'Route pattern', nullable: true })
  routePattern?: string;

  @ApiProperty({ description: 'Max requests per window' })
  maxRequests: number;

  @ApiProperty({ description: 'Time window in seconds' })
  windowSeconds: number;

  @ApiProperty({ description: 'Current request count' })
  currentCount: number;

  @ApiProperty({ description: 'Window start timestamp' })
  windowStart: Date;

  @ApiProperty({ description: 'Window end timestamp' })
  windowEnd: Date;

  @ApiProperty({ description: 'Is blocked', default: false })
  isBlocked: boolean;

  @ApiProperty({ description: 'Block until timestamp', nullable: true })
  blockedUntil?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
