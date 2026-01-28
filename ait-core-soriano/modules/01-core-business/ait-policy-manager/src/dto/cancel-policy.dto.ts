import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum CancellationReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  NON_PAYMENT = 'NON_PAYMENT',
  FRAUD = 'FRAUD',
  POLICY_EXPIRED = 'POLICY_EXPIRED',
  REPLACED_BY_NEW_POLICY = 'REPLACED_BY_NEW_POLICY',
  INSURED_ASSET_SOLD = 'INSURED_ASSET_SOLD',
  OTHER = 'OTHER',
}

export class CancelPolicyDto {
  @ApiProperty({ enum: CancellationReason, example: CancellationReason.CUSTOMER_REQUEST, description: 'Cancellation reason' })
  @IsEnum(CancellationReason)
  @IsNotEmpty()
  reason: CancellationReason;

  @ApiProperty({ example: '2024-06-30T00:00:00Z', description: 'Cancellation effective date' })
  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;

  @ApiPropertyOptional({ example: 'Customer moving abroad', description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Calculate pro-rata refund', default: true })
  @IsBoolean()
  @IsOptional()
  calculateRefund?: boolean = true;

  @ApiPropertyOptional({ example: false, description: 'Immediate cancellation', default: false })
  @IsBoolean()
  @IsOptional()
  immediate?: boolean = false;
}
