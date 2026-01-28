import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsEnum, IsOptional, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PolicyType {
  AUTO = 'auto',
  HOME = 'home',
  LIFE = 'life',
  HEALTH = 'health',
  BUSINESS = 'business',
  TRAVEL = 'travel',
  LIABILITY = 'liability'
}

export enum PolicyStatus {
  DRAFT = 'draft',
  QUOTED = 'quoted',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export class CoverageDto {
  @ApiProperty({ description: 'Nombre de la cobertura', example: 'Responsabilidad Civil' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Suma asegurada', example: 50000 })
  @IsNumber()
  @Min(0)
  sumInsured: number;

  @ApiProperty({ description: 'Prima anual', example: 350 })
  @IsNumber()
  @Min(0)
  premium: number;

  @ApiProperty({ description: 'Franquicia', example: 300, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePolicyDto {
  @ApiProperty({ description: 'ID del cliente', example: 'cli_123456' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'ID del producto', example: 'prod_auto_basic' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Tipo de póliza', enum: PolicyType, example: PolicyType.AUTO })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty({ description: 'Fecha inicio de vigencia', example: '2026-02-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @ApiProperty({ description: 'Fecha fin de vigencia', example: '2027-02-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  expirationDate: Date;

  @ApiProperty({ description: 'Prima total anual', example: 850 })
  @IsNumber()
  @Min(0)
  @Max(1000000)
  totalPremium: number;

  @ApiProperty({ description: 'Coberturas incluidas', type: [CoverageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageDto)
  coverages: CoverageDto[];

  @ApiProperty({ description: 'ID del agente asignado', example: 'agent_789' })
  @IsString()
  agentId: string;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Datos específicos del riesgo (JSON)', required: false })
  @IsOptional()
  riskData?: Record<string, any>;
}

export class UpdatePolicyDto {
  @ApiProperty({ description: 'Estado de la póliza', enum: PolicyStatus, required: false })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiProperty({ description: 'Prima total anual', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPremium?: number;

  @ApiProperty({ description: 'Coberturas', type: [CoverageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageDto)
  coverages?: CoverageDto[];

  @ApiProperty({ description: 'Notas', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Datos del riesgo', required: false })
  @IsOptional()
  riskData?: Record<string, any>;
}

export class RenewPolicyDto {
  @ApiProperty({ description: 'Nueva fecha inicio', example: '2027-02-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  newEffectiveDate: Date;

  @ApiProperty({ description: 'Nueva fecha fin', example: '2028-02-01T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  newExpirationDate: Date;

  @ApiProperty({ description: 'Nueva prima (si cambia)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newPremium?: number;

  @ApiProperty({ description: 'Mantener coberturas actuales', example: true })
  @IsOptional()
  keepCurrentCoverages?: boolean;
}

export class EndorsePolicyDto {
  @ApiProperty({ description: 'Tipo de endoso', example: 'add_coverage' })
  @IsString()
  endorsementType: string;

  @ApiProperty({ description: 'Fecha efectiva del endoso' })
  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @ApiProperty({ description: 'Descripción del cambio', example: 'Añadir cobertura de cristales' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Cambios en prima (puede ser positivo o negativo)', example: 50 })
  @IsNumber()
  premiumAdjustment: number;

  @ApiProperty({ description: 'Nuevas coberturas a añadir', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageDto)
  newCoverages?: CoverageDto[];

  @ApiProperty({ description: 'IDs de coberturas a eliminar', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removeCoverageIds?: string[];
}

export class CancelPolicyDto {
  @ApiProperty({ description: 'Fecha de cancelación' })
  @Type(() => Date)
  @IsDate()
  cancellationDate: Date;

  @ApiProperty({ description: 'Motivo de cancelación', example: 'Cliente solicitó cancelación' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Reembolso a realizar', example: 150, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
