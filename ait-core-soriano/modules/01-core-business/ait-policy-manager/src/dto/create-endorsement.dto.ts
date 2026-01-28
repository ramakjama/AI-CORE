import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

export enum EndorsementType {
  ADD_COVERAGE = 'ADD_COVERAGE',
  REMOVE_COVERAGE = 'REMOVE_COVERAGE',
  CHANGE_PREMIUM = 'CHANGE_PREMIUM',
  CHANGE_COVERAGE_LIMIT = 'CHANGE_COVERAGE_LIMIT',
  CHANGE_DEDUCTIBLE = 'CHANGE_DEDUCTIBLE',
  CHANGE_BENEFICIARY = 'CHANGE_BENEFICIARY',
  CORRECT_INFO = 'CORRECT_INFO',
}

export class CreateEndorsementDto {
  @ApiProperty({ example: 'policy-uuid', description: 'Policy UUID' })
  @IsUUID()
  @IsNotEmpty()
  policyId: string;

  @ApiProperty({ enum: EndorsementType, example: EndorsementType.ADD_COVERAGE, description: 'Endorsement type' })
  @IsEnum(EndorsementType)
  @IsNotEmpty()
  type: EndorsementType;

  @ApiProperty({ example: 'Adding comprehensive coverage', description: 'Endorsement description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-02-01T00:00:00Z', description: 'Effective date' })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({ example: 150.00, description: 'Premium change (positive or negative)' })
  @IsNumber()
  premiumChange: number;

  @ApiPropertyOptional({ description: 'Additional metadata', example: { coverageId: 'uuid' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
