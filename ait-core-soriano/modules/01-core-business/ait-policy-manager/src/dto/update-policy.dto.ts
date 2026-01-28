import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePolicyDto, PaymentFrequency } from './create-policy.dto';
import { IsEnum, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {
  @ApiPropertyOptional({ enum: PolicyStatus, example: PolicyStatus.ACTIVE, description: 'Policy status' })
  @IsEnum(PolicyStatus)
  @IsOptional()
  status?: PolicyStatus;

  @ApiPropertyOptional({ example: 1300.00, description: 'Updated premium amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  premium?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z', description: 'Updated end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: PaymentFrequency, example: PaymentFrequency.QUARTERLY })
  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @ApiPropertyOptional({ example: 600.00, description: 'Updated deductible' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deductible?: number;
}
