import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate } from 'class-validator';

export enum SubmissionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ERROR = 'ERROR',
}

export class SubmitModelDto {
  @ApiProperty({ description: 'ID del modelo a presentar' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ description: 'ID del certificado a usar' })
  @IsString()
  @IsNotEmpty()
  certificateId: string;

  @ApiProperty({ description: 'Domiciliación bancaria', required: false })
  @IsString()
  @IsOptional()
  iban?: string;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsString()
  @IsOptional()
  observations?: string;
}

export class SubmissionResponseDto {
  @ApiProperty({ description: 'ID de la presentación' })
  id: string;

  @ApiProperty({ description: 'ID del modelo presentado' })
  modelId: string;

  @ApiProperty({ description: 'Estado de la presentación', enum: SubmissionStatus })
  status: SubmissionStatus;

  @ApiProperty({ description: 'CSV - Código Seguro de Verificación', required: false })
  csv?: string;

  @ApiProperty({ description: 'Número de justificante', required: false })
  receiptNumber?: string;

  @ApiProperty({ description: 'Fecha de presentación', required: false })
  submissionDate?: Date;

  @ApiProperty({ description: 'Respuesta de AEAT' })
  aeatResponse?: any;

  @ApiProperty({ description: 'Errores', required: false })
  errors?: string[];

  @ApiProperty({ description: 'URL del justificante PDF', required: false })
  receiptUrl?: string;

  @ApiProperty({ description: 'Usuario que realizó la presentación' })
  submittedBy: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class SubmissionStatusDto {
  @ApiProperty({ description: 'ID de la presentación' })
  id: string;

  @ApiProperty({ description: 'Estado actual', enum: SubmissionStatus })
  status: SubmissionStatus;

  @ApiProperty({ description: 'CSV', required: false })
  csv?: string;

  @ApiProperty({ description: 'Número de justificante', required: false })
  receiptNumber?: string;

  @ApiProperty({ description: 'Puede descargar justificante' })
  canDownloadReceipt: boolean;

  @ApiProperty({ description: 'Última verificación con AEAT' })
  lastCheckedAt: Date;

  @ApiProperty({ description: 'Detalles adicionales' })
  details?: any;
}

export class AEATErrorDto {
  @ApiProperty({ description: 'Código de error' })
  code: string;

  @ApiProperty({ description: 'Descripción del error' })
  description: string;

  @ApiProperty({ description: 'Campo afectado', required: false })
  field?: string;

  @ApiProperty({ description: 'Severidad (ERROR, WARNING)' })
  severity: string;
}
