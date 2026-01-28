import { IsString, IsEnum, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UnderwritingStatus, RiskLevel } from '../entities/underwriting-case.entity';

export class ConditionDto {
  @ApiPropertyOptional({ description: 'Tipo de condición' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ description: 'Descripción de la condición' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Impacto de la condición' })
  @IsString()
  impact: string;
}

export class UpdateUnderwritingCaseDto {
  @ApiPropertyOptional({ enum: UnderwritingStatus, description: 'Estado de la suscripción' })
  @IsOptional()
  @IsEnum(UnderwritingStatus)
  status?: UnderwritingStatus;

  @ApiPropertyOptional({ enum: RiskLevel, description: 'Nivel de riesgo evaluado' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ description: 'Score de riesgo (0-1)', example: 0.75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  riskScore?: number;

  @ApiPropertyOptional({ description: 'Notas del suscriptor' })
  @IsOptional()
  @IsString()
  underwriterNotes?: string;

  @ApiPropertyOptional({ description: 'Razón de la decisión' })
  @IsOptional()
  @IsString()
  decisionReason?: string;

  @ApiPropertyOptional({ description: 'Suma asegurada aprobada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedSumInsured?: number;

  @ApiPropertyOptional({ description: 'Prima aprobada' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedPremium?: number;

  @ApiPropertyOptional({ description: 'Porcentaje de recargo', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  loadingPercentage?: number;

  @ApiPropertyOptional({ description: 'Condiciones especiales', type: [ConditionDto] })
  @IsOptional()
  conditions?: ConditionDto[];

  @ApiPropertyOptional({ description: 'Metadata adicional' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
