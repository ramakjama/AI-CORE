import { IsEnum, IsString, IsOptional, IsNumber, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditCategory, AuditSeverity } from '../entities/audit-log.entity';
import { Type } from 'class-transformer';

export class SearchAuditLogDto {
  @ApiPropertyOptional({ description: 'User ID filter' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Username filter' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ enum: AuditAction, description: 'Action filter' })
  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @ApiPropertyOptional({ enum: AuditCategory, description: 'Category filter' })
  @IsEnum(AuditCategory)
  @IsOptional()
  category?: AuditCategory;

  @ApiPropertyOptional({ enum: AuditSeverity, description: 'Severity filter' })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiPropertyOptional({ description: 'Resource type filter' })
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Resource ID filter' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Module filter' })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ description: 'IP address filter' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Compliance tags filter', type: [String] })
  @IsArray()
  @IsOptional()
  complianceTags?: string[];

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Sort field', default: 'timestamp' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
