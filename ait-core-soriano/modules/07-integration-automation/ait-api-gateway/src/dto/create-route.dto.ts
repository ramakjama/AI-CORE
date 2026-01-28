import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsNumber, IsOptional, IsArray, IsObject, Min, Max } from 'class-validator';
import { RouteMethod, RouteStatus } from '../entities';

export class CreateRouteDto {
  @ApiProperty({ description: 'Route path pattern', example: '/api/v1/users/:id' })
  @IsString()
  path: string;

  @ApiProperty({ enum: RouteMethod, description: 'HTTP method', example: RouteMethod.GET })
  @IsEnum(RouteMethod)
  method: RouteMethod;

  @ApiProperty({ description: 'Target service URL', example: 'http://user-service:3000' })
  @IsString()
  targetUrl: string;

  @ApiPropertyOptional({ enum: RouteStatus, description: 'Route status', default: RouteStatus.ACTIVE })
  @IsEnum(RouteStatus)
  @IsOptional()
  status?: RouteStatus;

  @ApiPropertyOptional({ description: 'Route priority', default: 0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Require authentication', default: true })
  @IsBoolean()
  @IsOptional()
  requiresAuth?: boolean;

  @ApiPropertyOptional({ description: 'Required roles', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredRoles?: string[];

  @ApiPropertyOptional({ description: 'Rate limit per minute', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  rateLimitPerMinute?: number;

  @ApiPropertyOptional({ description: 'Cache TTL in seconds', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cacheTTL?: number;

  @ApiPropertyOptional({ description: 'Timeout in milliseconds', default: 30000, minimum: 1000 })
  @IsNumber()
  @Min(1000)
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ description: 'Retry count on failure', default: 0, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  retries?: number;

  @ApiPropertyOptional({ description: 'Enable circuit breaker', default: false })
  @IsBoolean()
  @IsOptional()
  circuitBreakerEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Request transformation rules', type: 'object' })
  @IsObject()
  @IsOptional()
  requestTransform?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Response transformation rules', type: 'object' })
  @IsObject()
  @IsOptional()
  responseTransform?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Route metadata', type: 'object' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
