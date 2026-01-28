import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PolicyType, PolicyStatus } from './create-policy.dto';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export enum SortField {
  POLICY_NUMBER = 'policyNumber',
  CREATED_AT = 'createdAt',
  EFFECTIVE_DATE = 'effectiveDate',
  EXPIRATION_DATE = 'expirationDate',
  PREMIUM = 'totalPremium',
  STATUS = 'status'
}

export class PolicySearchDto {
  @ApiProperty({ description: 'Texto de búsqueda (número, cliente, agente)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Tipo de póliza', enum: PolicyType, required: false })
  @IsOptional()
  @IsEnum(PolicyType)
  type?: PolicyType;

  @ApiProperty({ description: 'Estado', enum: PolicyStatus, required: false })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiProperty({ description: 'ID del cliente', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'ID del agente', required: false })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiProperty({ description: 'ID de la aseguradora', required: false })
  @IsOptional()
  @IsString()
  insurerId?: string;

  @ApiProperty({ description: 'Fecha inicio desde', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDateFrom?: Date;

  @ApiProperty({ description: 'Fecha inicio hasta', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDateTo?: Date;

  @ApiProperty({ description: 'Fecha vencimiento desde', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDateFrom?: Date;

  @ApiProperty({ description: 'Fecha vencimiento hasta', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expirationDateTo?: Date;

  @ApiProperty({ description: 'Prima mínima', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPremium?: number;

  @ApiProperty({ description: 'Prima máxima', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPremium?: number;

  @ApiProperty({ description: 'Campo de ordenamiento', enum: SortField, required: false })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField;

  @ApiProperty({ description: 'Orden', enum: SortOrder, required: false })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiProperty({ description: 'Página', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Resultados por página', example: 20, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class PaginatedPolicyResult<T> {
  @ApiProperty({ description: 'Lista de pólizas' })
  data: T[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Resultados por página' })
  limit: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ description: 'Tiene página anterior' })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Tiene página siguiente' })
  hasNextPage: boolean;
}
