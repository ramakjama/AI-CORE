/**
 * Cash Management DTOs
 */

import { IsString, IsNumber, IsEnum, IsDate, IsOptional, Min, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordInflowDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 5000.50 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['PREMIUM_COLLECTION', 'COMMISSION', 'INVESTMENT', 'OTHER'] })
  @IsEnum(['PREMIUM_COLLECTION', 'COMMISSION', 'INVESTMENT', 'OTHER'])
  category: string;

  @ApiProperty({ example: 'Premium payment for policy #12345' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'REF-2026-001' })
  @IsString()
  reference: string;

  @ApiProperty({ example: '2026-01-28' })
  @Type(() => Date)
  @IsDate()
  executionDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RecordOutflowDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['CLAIM_PAYMENT', 'SUPPLIER_PAYMENT', 'SALARY', 'TAX', 'BANK_FEE', 'OTHER'] })
  @IsEnum(['CLAIM_PAYMENT', 'SUPPLIER_PAYMENT', 'SALARY', 'TAX', 'BANK_FEE', 'OTHER'])
  category: string;

  @ApiProperty({ example: 'Claim payment for policy #67890' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'CLAIM-2026-001' })
  @IsString()
  reference: string;

  @ApiProperty({ example: '2026-01-28' })
  @Type(() => Date)
  @IsDate()
  executionDate: Date;

  @ApiProperty({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  creditorName?: string;

  @ApiProperty({ example: 'ES1234567890123456789012' })
  @IsOptional()
  @IsString()
  creditorIban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FilterMovementsDto {
  @ApiPropertyOptional({ example: 'bank-001' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ enum: ['INFLOW', 'OUTFLOW'] })
  @IsOptional()
  @IsEnum(['INFLOW', 'OUTFLOW'])
  type?: 'INFLOW' | 'OUTFLOW';

  @ApiPropertyOptional({ example: 'PREMIUM_COLLECTION' })
  @IsOptional()
  @IsString()
  category?: string;

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

  @ApiPropertyOptional({ enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'])
  status?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;
}

export class ImportBankStatementDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ enum: ['CSV', 'OFX', 'MT940', 'EXCEL'] })
  @IsEnum(['CSV', 'OFX', 'MT940', 'EXCEL'])
  format: string;

  @ApiPropertyOptional({ example: 'utf-8', default: 'utf-8' })
  @IsOptional()
  @IsString()
  encoding?: string;

  @ApiPropertyOptional({ example: ';', default: ',' })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  skipDuplicates?: boolean;
}

export class ReconcileAccountDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: '2026-01-31' })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiPropertyOptional({ example: 125000.50 })
  @IsOptional()
  @IsNumber()
  statementBalance?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  autoMatch?: boolean;
}

export class CreateAlertDto {
  @ApiProperty({ enum: ['LOW_BALANCE', 'OVERDRAFT', 'CASH_SHORTAGE', 'UNUSUAL_MOVEMENT'] })
  @IsEnum(['LOW_BALANCE', 'OVERDRAFT', 'CASH_SHORTAGE', 'UNUSUAL_MOVEMENT'])
  type: string;

  @ApiProperty({ enum: ['INFO', 'WARNING', 'CRITICAL'] })
  @IsEnum(['INFO', 'WARNING', 'CRITICAL'])
  severity: string;

  @ApiProperty({ example: 'Cash balance below minimum threshold' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'bank-001' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  threshold?: number;
}
