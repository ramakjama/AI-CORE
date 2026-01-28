import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsOptional, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType } from './create-policy.dto';
import { CreateCoverageDto } from './create-coverage.dto';

export class PolicyQuoteDto {
  @ApiProperty({ description: 'ID del cliente', example: 'cli_123456' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Tipo de póliza', enum: PolicyType })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty({ description: 'Coberturas solicitadas', type: [CreateCoverageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCoverageDto)
  coverages: CreateCoverageDto[];

  @ApiProperty({ description: 'Datos del riesgo a asegurar' })
  riskData: Record<string, any>;

  @ApiProperty({ description: 'Duración en meses', example: 12, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMonths?: number;

  @ApiProperty({ description: 'ID del agente', required: false })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ description: 'Descuentos aplicables', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  discountCodes?: string[];
}

export class QuoteResultDto {
  @ApiProperty({ description: 'ID de la cotización' })
  quoteId: string;

  @ApiProperty({ description: 'Prima total calculada' })
  totalPremium: number;

  @ApiProperty({ description: 'Desglose por cobertura' })
  coverageBreakdown: Array<{
    coverageCode: string;
    name: string;
    premium: number;
    sumInsured: number;
  }>;

  @ApiProperty({ description: 'Descuentos aplicados' })
  discounts: Array<{
    code: string;
    description: string;
    amount: number;
  }>;

  @ApiProperty({ description: 'Prima base antes de descuentos' })
  basePremium: number;

  @ApiProperty({ description: 'Total descuentos' })
  totalDiscounts: number;

  @ApiProperty({ description: 'Recargos aplicados' })
  surcharges: Array<{
    code: string;
    description: string;
    amount: number;
  }>;

  @ApiProperty({ description: 'Validez de la cotización (días)' })
  validityDays: number;

  @ApiProperty({ description: 'Fecha de expiración' })
  expiresAt: Date;

  @ApiProperty({ description: 'Notas y condiciones' })
  notes?: string;
}
