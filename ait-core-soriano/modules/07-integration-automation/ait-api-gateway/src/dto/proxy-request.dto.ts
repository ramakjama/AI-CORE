import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class ProxyRequestDto {
  @ApiProperty({ description: 'Request path' })
  @IsString()
  path: string;

  @ApiProperty({ description: 'HTTP method' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Request headers', type: 'object' })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Request body', type: 'object' })
  @IsObject()
  @IsOptional()
  body?: any;

  @ApiPropertyOptional({ description: 'Query parameters', type: 'object' })
  @IsObject()
  @IsOptional()
  query?: Record<string, string>;
}
