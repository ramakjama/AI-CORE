/**
 * Budget Management DTOs
 */

import { IsString, IsNumber, IsEnum, IsDate, IsOptional, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ example: 'Marketing Q1 2026' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Budget for digital marketing campaigns' })
  @IsString()
  description: string;

  @ApiProperty({ enum: ['MARKETING', 'TECHNOLOGY', 'OPERATIONS', 'SALARIES', 'RENT', 'UTILITIES', 'TRAVEL', 'TRAINING', 'LEGAL', 'ACCOUNTING', 'INSURANCE', 'OTHER'] })
  @IsEnum(['MARKETING', 'TECHNOLOGY', 'OPERATIONS', 'SALARIES', 'RENT', 'UTILITIES', 'TRAVEL', 'TRAINING', 'LEGAL', 'ACCOUNTING', 'INSURANCE', 'OTHER'])
  category: string;

  @ApiProperty({ example: 50000.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] })
  @IsEnum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'])
  period: string;

  @ApiProperty({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-03-31' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: 80, default: 80, description: 'Alert when budget reaches this % utilization' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ example: 'Marketing Q1 2026 - Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated budget description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 60000.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  alertThreshold?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TrackExpenseDto {
  @ApiProperty({ example: 'budget-001' })
  @IsString()
  budgetId: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'Google Ads campaign - January' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'MARKETING' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'Google Ireland Ltd.' })
  @IsOptional()
  @IsString()
  vendor?: string;

  @ApiPropertyOptional({ example: 'INV-2026-001' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ example: '2026-01-28' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'], default: 'PENDING' })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'PAID'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ApproveExpenseDto {
  @ApiProperty({ example: 'expense-001' })
  @IsString()
  expenseId: string;

  @ApiProperty({ example: 'user-001' })
  @IsString()
  approvedBy: string;

  @ApiPropertyOptional({ example: 'Approved as per budget allocation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FilterBudgetsDto {
  @ApiPropertyOptional({ example: 'MARKETING' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'COMPLETED', 'EXCEEDED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'COMPLETED', 'EXCEEDED'])
  status?: string;

  @ApiPropertyOptional({ enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] })
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'])
  period?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class GenerateBudgetReportDto {
  @ApiProperty({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ example: '2026-03-31' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ example: ['MARKETING', 'TECHNOLOGY'] })
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  includeTrends?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  includeAlerts?: boolean;
}
