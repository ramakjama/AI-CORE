import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDate, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum TaxModelType {
  MODEL_303 = '303', // IVA
  MODEL_111 = '111', // Retenciones IRPF
  MODEL_115 = '115', // Retenciones alquileres
  MODEL_130 = '130', // Pagos fraccionados autónomos
  MODEL_190 = '190', // Resumen anual IRPF
  MODEL_202 = '202', // Pagos fraccionados IS
  MODEL_347 = '347', // Operaciones con terceros
}

export enum TaxModelPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum TaxModelStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum ResultType {
  TO_PAY = 'I', // A Ingresar
  TO_RETURN = 'D', // A Devolver
  TO_COMPENSATE = 'C', // A Compensar
  NEGATIVE = 'N', // Negativo
}

// ==================== MODEL 303 - IVA ====================

export class IVALineDto {
  @ApiProperty({ description: 'Base imponible', example: 10000.00 })
  @IsNumber()
  baseImponible: number;

  @ApiProperty({ description: 'Porcentaje de IVA', example: 21 })
  @IsNumber()
  percentage: number;

  @ApiProperty({ description: 'Cuota de IVA', example: 2100.00 })
  @IsNumber()
  cuota: number;
}

export class Model303DataDto {
  @ApiProperty({ description: 'Ejercicio fiscal', example: 2024 })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiProperty({ description: 'Periodo (1T, 2T, 3T, 4T, 01-12)', example: '1T' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({ description: 'NIF del declarante', example: 'B12345678' })
  @IsString()
  @IsNotEmpty()
  nif: string;

  @ApiProperty({ description: 'Razón social', example: 'MI EMPRESA SL' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  // IVA Repercutido (ventas)
  @ApiProperty({ description: 'IVA repercutido al 21%', type: IVALineDto })
  @ValidateNested()
  @Type(() => IVALineDto)
  @IsOptional()
  ivaRepercutido21?: IVALineDto;

  @ApiProperty({ description: 'IVA repercutido al 10%', type: IVALineDto })
  @ValidateNested()
  @Type(() => IVALineDto)
  @IsOptional()
  ivaRepercutido10?: IVALineDto;

  @ApiProperty({ description: 'IVA repercutido al 4%', type: IVALineDto })
  @ValidateNested()
  @Type(() => IVALineDto)
  @IsOptional()
  ivaRepercutido4?: IVALineDto;

  // IVA Soportado (compras)
  @ApiProperty({ description: 'IVA soportado deducible', type: IVALineDto })
  @ValidateNested()
  @Type(() => IVALineDto)
  @IsOptional()
  ivaSoportadoDeducible?: IVALineDto;

  @ApiProperty({ description: 'IVA soportado no deducible', type: IVALineDto })
  @ValidateNested()
  @Type(() => IVALineDto)
  @IsOptional()
  ivaSoportadoNoDeducible?: IVALineDto;

  // Resultados
  @ApiProperty({ description: 'Cuotas a compensar de periodos anteriores', example: 0 })
  @IsNumber()
  @IsOptional()
  cuotasCompensarPeriodosAnteriores?: number;

  @ApiProperty({ description: 'Tipo de resultado', enum: ResultType })
  @IsEnum(ResultType)
  @IsOptional()
  resultType?: ResultType;

  @ApiProperty({ description: 'Importe del resultado', example: 1050.00 })
  @IsNumber()
  @IsOptional()
  resultAmount?: number;

  // Prorrata
  @ApiProperty({ description: 'Porcentaje de prorrata', example: 100 })
  @IsNumber()
  @IsOptional()
  prorrataPercentage?: number;

  @ApiProperty({ description: 'Es declaración complementaria', example: false })
  @IsBoolean()
  @IsOptional()
  isComplementary?: boolean;

  @ApiProperty({ description: 'Número de justificante anterior (si es complementaria)' })
  @IsString()
  @IsOptional()
  previousSubmissionNumber?: string;
}

// ==================== MODEL 111 - IRPF ====================

export class RetentionLineDto {
  @ApiProperty({ description: 'NIF del perceptor' })
  @IsString()
  nif: string;

  @ApiProperty({ description: 'Nombre del perceptor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Base de retención' })
  @IsNumber()
  base: number;

  @ApiProperty({ description: 'Porcentaje de retención' })
  @IsNumber()
  percentage: number;

  @ApiProperty({ description: 'Importe retenido' })
  @IsNumber()
  amount: number;
}

export class Model111DataDto {
  @ApiProperty({ description: 'Ejercicio fiscal', example: 2024 })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiProperty({ description: 'Periodo (1T, 2T, 3T, 4T)', example: '1T' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({ description: 'NIF del declarante', example: 'B12345678' })
  @IsString()
  @IsNotEmpty()
  nif: string;

  @ApiProperty({ description: 'Razón social', example: 'MI EMPRESA SL' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Número de perceptores' })
  @IsNumber()
  numberOfRecipients: number;

  @ApiProperty({ description: 'Base total de retenciones' })
  @IsNumber()
  totalBase: number;

  @ApiProperty({ description: 'Total retenido' })
  @IsNumber()
  totalRetained: number;

  @ApiProperty({ description: 'Detalle de retenciones', type: [RetentionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetentionLineDto)
  retentions: RetentionLineDto[];

  @ApiProperty({ description: 'Es declaración complementaria', example: false })
  @IsBoolean()
  @IsOptional()
  isComplementary?: boolean;
}

// ==================== MODEL 190 - RESUMEN ANUAL IRPF ====================

export class AnnualRetentionDto {
  @ApiProperty({ description: 'NIF del perceptor' })
  @IsString()
  nif: string;

  @ApiProperty({ description: 'Nombre del perceptor' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Domicilio' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Base total del año' })
  @IsNumber()
  totalBase: number;

  @ApiProperty({ description: 'Total retenido en el año' })
  @IsNumber()
  totalRetained: number;

  @ApiProperty({ description: 'Detalle trimestral', type: [RetentionLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RetentionLineDto)
  quarterlyDetail: RetentionLineDto[];
}

export class Model190DataDto {
  @ApiProperty({ description: 'Ejercicio fiscal', example: 2024 })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiProperty({ description: 'NIF del declarante', example: 'B12345678' })
  @IsString()
  @IsNotEmpty()
  nif: string;

  @ApiProperty({ description: 'Razón social', example: 'MI EMPRESA SL' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Número total de perceptores' })
  @IsNumber()
  totalRecipients: number;

  @ApiProperty({ description: 'Base total del año' })
  @IsNumber()
  totalBase: number;

  @ApiProperty({ description: 'Total retenido en el año' })
  @IsNumber()
  totalRetained: number;

  @ApiProperty({ description: 'Detalle por perceptor', type: [AnnualRetentionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnualRetentionDto)
  recipients: AnnualRetentionDto[];
}

// ==================== MODEL 347 - OPERACIONES CON TERCEROS ====================

export class ThirdPartyOperationDto {
  @ApiProperty({ description: 'NIF del tercero' })
  @IsString()
  nif: string;

  @ApiProperty({ description: 'Nombre del tercero' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Importe de compras' })
  @IsNumber()
  purchaseAmount: number;

  @ApiProperty({ description: 'Importe de ventas' })
  @IsNumber()
  salesAmount: number;

  @ApiProperty({ description: 'Importe total de operaciones' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Número de facturas' })
  @IsNumber()
  invoiceCount: number;
}

export class Model347DataDto {
  @ApiProperty({ description: 'Ejercicio fiscal', example: 2024 })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiProperty({ description: 'NIF del declarante', example: 'B12345678' })
  @IsString()
  @IsNotEmpty()
  nif: string;

  @ApiProperty({ description: 'Razón social', example: 'MI EMPRESA SL' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Número de terceros' })
  @IsNumber()
  numberOfThirdParties: number;

  @ApiProperty({ description: 'Importe total declarado' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Operaciones con terceros', type: [ThirdPartyOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThirdPartyOperationDto)
  operations: ThirdPartyOperationDto[];

  @ApiProperty({ description: 'Es declaración complementaria', example: false })
  @IsBoolean()
  @IsOptional()
  isComplementary?: boolean;
}

// ==================== GENERAL ====================

export class GenerateTaxModelDto {
  @ApiProperty({ description: 'Tipo de modelo', enum: TaxModelType })
  @IsEnum(TaxModelType)
  @IsNotEmpty()
  modelType: TaxModelType;

  @ApiProperty({ description: 'Datos del modelo (varía según tipo)' })
  @IsNotEmpty()
  data: Model303DataDto | Model111DataDto | Model190DataDto | Model347DataDto;
}

export class TaxModelResponseDto {
  @ApiProperty({ description: 'ID del modelo generado' })
  id: string;

  @ApiProperty({ description: 'Tipo de modelo', enum: TaxModelType })
  modelType: TaxModelType;

  @ApiProperty({ description: 'Estado', enum: TaxModelStatus })
  status: TaxModelStatus;

  @ApiProperty({ description: 'Ejercicio fiscal' })
  fiscalYear: number;

  @ApiProperty({ description: 'Periodo' })
  period: string;

  @ApiProperty({ description: 'NIF del declarante' })
  nif: string;

  @ApiProperty({ description: 'Razón social' })
  companyName: string;

  @ApiProperty({ description: 'XML generado' })
  xmlContent: string;

  @ApiProperty({ description: 'Datos del modelo' })
  modelData: any;

  @ApiProperty({ description: 'Errores de validación', required: false })
  validationErrors?: string[];

  @ApiProperty({ description: 'ID de presentación', required: false })
  submissionId?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class ValidateTaxModelDto {
  @ApiProperty({ description: 'ID del modelo a validar' })
  @IsString()
  @IsNotEmpty()
  modelId: string;
}

export class ValidationResultDto {
  @ApiProperty({ description: 'Es válido' })
  isValid: boolean;

  @ApiProperty({ description: 'Errores encontrados' })
  errors: string[];

  @ApiProperty({ description: 'Advertencias' })
  warnings: string[];

  @ApiProperty({ description: 'Detalles de validación' })
  details: {
    xmlValidation: boolean;
    schemaValidation: boolean;
    businessRulesValidation: boolean;
    calculationsValidation: boolean;
  };
}
