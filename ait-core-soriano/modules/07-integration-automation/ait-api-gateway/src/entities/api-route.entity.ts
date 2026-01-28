import { ApiProperty } from '@nestjs/swagger';

export enum RouteMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  ALL = 'ALL'
}

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE'
}

export class ApiRoute {
  @ApiProperty({ description: 'Route unique identifier' })
  id: string;

  @ApiProperty({ description: 'Route path pattern' })
  path: string;

  @ApiProperty({ enum: RouteMethod, description: 'HTTP method' })
  method: RouteMethod;

  @ApiProperty({ description: 'Target service URL' })
  targetUrl: string;

  @ApiProperty({ enum: RouteStatus, description: 'Route status' })
  status: RouteStatus;

  @ApiProperty({ description: 'Route priority (higher = first match)', default: 0 })
  priority: number;

  @ApiProperty({ description: 'Enable authentication', default: true })
  requiresAuth: boolean;

  @ApiProperty({ description: 'Required roles', type: [String], nullable: true })
  requiredRoles?: string[];

  @ApiProperty({ description: 'Rate limit per minute', nullable: true })
  rateLimitPerMinute?: number;

  @ApiProperty({ description: 'Cache TTL in seconds', nullable: true })
  cacheTTL?: number;

  @ApiProperty({ description: 'Timeout in milliseconds', default: 30000 })
  timeout: number;

  @ApiProperty({ description: 'Retry count on failure', default: 0 })
  retries: number;

  @ApiProperty({ description: 'Circuit breaker enabled', default: false })
  circuitBreakerEnabled: boolean;

  @ApiProperty({ description: 'Request transformation rules', type: 'object', nullable: true })
  requestTransform?: Record<string, any>;

  @ApiProperty({ description: 'Response transformation rules', type: 'object', nullable: true })
  responseTransform?: Record<string, any>;

  @ApiProperty({ description: 'Route metadata', type: 'object' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;
}
