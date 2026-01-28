/**
 * Bank Integration DTOs
 */

import { IsString, IsNumber, IsEnum, IsDate, IsOptional, Min, IsObject, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectBankDto {
  @ApiProperty({ example: 'BBVA_BBVAESMM' })
  @IsString()
  bankId: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @ApiPropertyOptional({ example: 'https://app.ait.com/callback' })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class InitiatePaymentDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  creditorName: string;

  @ApiProperty({ example: 'ES1234567890123456789012' })
  @IsString()
  creditorIban: string;

  @ApiPropertyOptional({ example: 'BBVAESMM' })
  @IsOptional()
  @IsString()
  creditorBic?: string;

  @ApiProperty({ example: 5000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'EUR', default: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 'Invoice #12345 payment' })
  @IsString()
  reference: string;

  @ApiProperty({ example: '2026-01-28' })
  @Type(() => Date)
  @IsDate()
  executionDate: Date;

  @ApiPropertyOptional({ enum: ['SEPA_CREDIT', 'SEPA_INSTANT', 'DOMESTIC', 'INTERNATIONAL'], default: 'SEPA_CREDIT' })
  @IsOptional()
  @IsEnum(['SEPA_CREDIT', 'SEPA_INSTANT', 'DOMESTIC', 'INTERNATIONAL'])
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreatePaymentBatchDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ type: [InitiatePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InitiatePaymentDto)
  payments: InitiatePaymentDto[];

  @ApiProperty({ example: '2026-01-28' })
  @Type(() => Date)
  @IsDate()
  executionDate: Date;

  @ApiPropertyOptional({ example: 'Monthly supplier payments' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SyncTransactionsDto {
  @ApiProperty({ example: 'conn-001' })
  @IsString()
  connectionId: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  forceSync?: boolean;
}

export class CreateStandingOrderDto {
  @ApiProperty({ example: 'bank-001' })
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'Rent Payment' })
  @IsString()
  creditorName: string;

  @ApiProperty({ example: 'ES1234567890123456789012' })
  @IsString()
  creditorIban: string;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency: string;

  @ApiProperty({ example: '2026-02-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ example: '2027-02-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ example: 'Monthly rent payment' })
  @IsString()
  reference: string;
}

export class FilterTransactionsDto {
  @ApiPropertyOptional({ example: 'acc-001' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-01-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ enum: ['CREDIT', 'DEBIT'] })
  @IsOptional()
  @IsEnum(['CREDIT', 'DEBIT'])
  type?: string;

  @ApiPropertyOptional({ enum: ['BOOKED', 'PENDING'] })
  @IsOptional()
  @IsEnum(['BOOKED', 'PENDING'])
  status?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 50;
}
