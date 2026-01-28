import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsBoolean,
} from 'class-validator';

export class RenewPolicyDto {
  @ApiProperty({ example: '2025-01-01T00:00:00Z', description: 'New policy start date' })
  @IsDateString()
  @IsNotEmpty()
  newStartDate: string;

  @ApiProperty({ example: '2026-01-01T00:00:00Z', description: 'New policy end date' })
  @IsDateString()
  @IsNotEmpty()
  newEndDate: string;

  @ApiPropertyOptional({ example: 1250.00, description: 'New premium (if changed)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  newPremium?: number;

  @ApiPropertyOptional({ example: 105000.00, description: 'New sum insured (if changed)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  newSumInsured?: number;

  @ApiPropertyOptional({ example: true, description: 'Auto-approve renewal', default: false })
  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean = false;

  @ApiPropertyOptional({ description: 'Additional renewal notes' })
  @IsOptional()
  notes?: string;
}
