import { IsString, IsEnum, IsNumber, IsUUID, IsOptional, IsBoolean, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UnderwritingType } from '../entities/underwriting-case.entity';

export class RiskFactorsDto {
  @ApiPropertyOptional({ description: 'Edad del asegurado' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ description: 'Ocupación del asegurado' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ description: 'Historial de siniestros' })
  @IsOptional()
  @IsObject()
  claimsHistory?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ubicación geográfica' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Estilo de vida (fumador, deportes de riesgo, etc)' })
  @IsOptional()
  @IsObject()
  lifestyle?: Record<string, any>;
}

export class MedicalInfoDto {
  @ApiPropertyOptional({ description: 'Altura en cm' })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({ description: 'Peso en kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Condiciones médicas preexistentes' })
  @IsOptional()
  @IsObject()
  preExistingConditions?: Record<string, any>;

  @ApiPropertyOptional({ description: '¿Fumador?' })
  @IsOptional()
  @IsBoolean()
  isSmoker?: boolean;

  @ApiPropertyOptional({ description: 'Historial médico familiar' })
  @IsOptional()
  @IsObject()
  familyHistory?: Record<string, any>;
}

export class FinancialInfoDto {
  @ApiPropertyOptional({ description: 'Ingresos anuales' })
  @IsOptional()
  @IsNumber()
  annualIncome?: number;

  @ApiPropertyOptional({ description: 'Patrimonio neto' })
  @IsOptional()
  @IsNumber()
  netWorth?: number;

  @ApiPropertyOptional({ description: 'Score crediticio' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  creditScore?: number;

  @ApiPropertyOptional({ description: 'Información de empleo' })
  @IsOptional()
  @IsObject()
  employmentInfo?: Record<string, any>;
}

export class CreateUnderwritingCaseDto {
  @ApiProperty({ description: 'ID de la aplicación/solicitud', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({ description: 'ID del solicitante', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  applicantId: string;

  @ApiProperty({ enum: UnderwritingType, description: 'Tipo de suscripción' })
  @IsEnum(UnderwritingType)
  type: UnderwritingType;

  @ApiProperty({ description: 'Tipo de producto de seguro', example: 'VIDA_TEMPORAL' })
  @IsString()
  productType: string;

  @ApiProperty({ description: 'Suma asegurada solicitada', example: 250000 })
  @IsNumber()
  @Min(0)
  requestedSumInsured: number;

  @ApiProperty({ description: 'Prima solicitada', example: 850 })
  @IsNumber()
  @Min(0)
  requestedPremium: number;

  @ApiPropertyOptional({ description: 'Factores de riesgo', type: RiskFactorsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RiskFactorsDto)
  riskFactors?: RiskFactorsDto;

  @ApiPropertyOptional({ description: 'Información médica', type: MedicalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalInfoDto)
  medicalInfo?: MedicalInfoDto;

  @ApiPropertyOptional({ description: 'Información financiera', type: FinancialInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => FinancialInfoDto)
  financialInfo?: FinancialInfoDto;

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
