import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class SetCacheDto {
  @ApiProperty({ description: 'Cache key' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'Value to cache' })
  value: any;

  @ApiPropertyOptional({ description: 'Time to live in seconds', minimum: 1, maximum: 86400 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  ttl?: number;

  @ApiPropertyOptional({ description: 'Enable compression' })
  @IsOptional()
  @IsBoolean()
  compress?: boolean;

  @ApiPropertyOptional({ description: 'Enable encryption' })
  @IsOptional()
  @IsBoolean()
  encrypt?: boolean;

  @ApiPropertyOptional({ description: 'Cache tags for invalidation' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Cache namespace' })
  @IsOptional()
  @IsString()
  namespace?: string;
}

export class GetCacheDto {
  @ApiProperty({ description: 'Cache key' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Cache namespace' })
  @IsOptional()
  @IsString()
  namespace?: string;
}

export class DeleteCacheDto {
  @ApiProperty({ description: 'Cache key or pattern' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Cache namespace' })
  @IsOptional()
  @IsString()
  namespace?: string;
}

export class InvalidateCacheDto {
  @ApiPropertyOptional({ description: 'Key pattern (supports wildcards)' })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional({ description: 'Tags to invalidate' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Specific keys to invalidate' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @ApiPropertyOptional({ description: 'Namespace to invalidate' })
  @IsOptional()
  @IsString()
  namespace?: string;
}

export class CacheStatsResponseDto {
  @ApiProperty({ description: 'Total cache hits' })
  hits: number;

  @ApiProperty({ description: 'Total cache misses' })
  misses: number;

  @ApiProperty({ description: 'Hit rate percentage' })
  hitRate: number;

  @ApiProperty({ description: 'Total number of keys' })
  keys: number;

  @ApiProperty({ description: 'Memory usage in bytes' })
  memory: number;

  @ApiProperty({ description: 'Total evictions' })
  evictions: number;

  @ApiProperty({ description: 'Stats by layer' })
  layers: Record<string, any>;
}

export class WarmupCacheDto {
  @ApiProperty({ description: 'Warmup strategy names' })
  @IsArray()
  @IsString({ each: true })
  strategies: string[];

  @ApiPropertyOptional({ description: 'Force warmup even if cache exists' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
