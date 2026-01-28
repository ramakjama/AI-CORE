import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { PolicyType } from './create-policy.dto';
import { PolicyStatus } from './update-policy.dto';

export class PolicyFilterDto {
  @ApiPropertyOptional({ example: 'POL-2024-001', description: 'Policy number filter' })
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @ApiPropertyOptional({ enum: PolicyType, description: 'Policy type filter' })
  @IsOptional()
  @IsEnum(PolicyType)
  type?: PolicyType;

  @ApiPropertyOptional({ enum: PolicyStatus, description: 'Policy status filter' })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiPropertyOptional({ example: 'customer-uuid', description: 'Customer ID filter' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 'agent-uuid', description: 'Agent ID filter' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z', description: 'Start date from' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z', description: 'Start date to' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
