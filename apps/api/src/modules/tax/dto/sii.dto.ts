import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceType {
  ISSUED = 'ISSUED', // Factura emitida
  RECEIVED = 'RECEIVED', // Factura recibida
}

export enum SIIOperationType {
  F1 = 'F1', // Factura
  R1 = 'R1', // Factura Rectificativa (Error fundado en derecho)
  R2 = 'R2', // Factura Rectificativa (Art. 80.1, 80.2 y 80.6 LIVA)
  R3 = 'R3', // Factura Rectificativa (Art. 80.3 y 80.4 LIVA)
  R4 = 'R4', // Factura Rectificativa (Resto)
  R5 = 'R5', // Factura Rectificativa en facturas simplificadas
}

export class SIIInvoiceDto {
  @ApiProperty({ description: 'Tipo de factura', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({ description: 'Número de factura' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Fecha de la factura' })
  @IsDate()
  @Type(() => Date)
  invoiceDate: Date;

  @ApiProperty({ description: 'Tipo de operación', enum: SIIOperationType })
  @IsEnum(SIIOperationType)
  operationType: SIIOperationType;

  @ApiProperty({ description: 'NIF del tercero (cliente o proveedor)' })
  @IsString()
  @IsNotEmpty()
  thirdPartyNif: string;

  @ApiProperty({ description: 'Nombre del tercero' })
  @IsString()
  @IsNotEmpty()
  thirdPartyName: string;

  @ApiProperty({ description: 'Base imponible' })
  @IsNumber()
  baseAmount: number;

  @ApiProperty({ description: 'Tipo de IVA (%)' })
  @IsNumber()
  ivaPercentage: number;

  @ApiProperty({ description: 'Cuota de IVA' })
  @IsNumber()
  ivaAmount: number;

  @ApiProperty({ description: 'Total factura' })
  @IsNumber()
  totalAmount: number;

  @ApiProperty({ description: 'Descripción de la operación' })
  @IsString()
  @IsOptional()
  description?: string;

  // Campos específicos para facturas rectificativas
  @ApiProperty({ description: 'Número de factura rectificada', required: false })
  @IsString()
  @IsOptional()
  correctedInvoiceNumber?: string;

  @ApiProperty({ description: 'Fecha de factura rectificada', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  correctedInvoiceDate?: Date;
}

export class SendSIIInvoicesDto {
  @ApiProperty({ description: 'ID del certificado a usar' })
  @IsString()
  @IsNotEmpty()
  certificateId: string;

  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Facturas a enviar', type: [SIIInvoiceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SIIInvoiceDto)
  invoices: SIIInvoiceDto[];
}

export class SIIResponseDto {
  @ApiProperty({ description: 'ID de la respuesta' })
  id: string;

  @ApiProperty({ description: 'Estado de envío' })
  status: string;

  @ApiProperty({ description: 'CSV de la presentación', required: false })
  csv?: string;

  @ApiProperty({ description: 'Facturas aceptadas' })
  acceptedCount: number;

  @ApiProperty({ description: 'Facturas con errores' })
  errorCount: number;

  @ApiProperty({ description: 'Detalles por factura' })
  invoiceResults: Array<{
    invoiceNumber: string;
    status: 'ACCEPTED' | 'REJECTED';
    errors?: string[];
  }>;

  @ApiProperty({ description: 'Respuesta completa de AEAT' })
  aeatResponse: any;

  @ApiProperty({ description: 'Fecha de envío' })
  submittedAt: Date;
}

export class QuerySIIStatusDto {
  @ApiProperty({ description: 'ID de la empresa' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'ID del certificado a usar' })
  @IsString()
  @IsNotEmpty()
  certificateId: string;

  @ApiProperty({ description: 'Ejercicio fiscal' })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiProperty({ description: 'Periodo' })
  @IsString()
  @IsNotEmpty()
  period: string;

  @ApiProperty({ description: 'Tipo de factura', enum: InvoiceType })
  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;
}
