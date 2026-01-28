import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum DocumentType {
  POLICY_CERTIFICATE = 'policy_certificate',
  ENDORSEMENT = 'endorsement',
  RECEIPT = 'receipt',
  CLAIM_DOCUMENT = 'claim_document',
  CANCELLATION = 'cancellation',
  RENEWAL = 'renewal',
  ID_DOCUMENT = 'id_document',
  INSPECTION_REPORT = 'inspection_report',
  OTHER = 'other'
}

export class PolicyDocumentDto {
  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Nombre del archivo' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Descripción del documento', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL del documento en el storage' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Tamaño del archivo en bytes' })
  fileSize: number;

  @ApiProperty({ description: 'Tipo MIME' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Fecha de subida' })
  @Type(() => Date)
  @IsDate()
  uploadedAt: Date;

  @ApiProperty({ description: 'ID del usuario que subió', required: false })
  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

export class UploadDocumentDto {
  @ApiProperty({ description: 'ID de la póliza' })
  @IsString()
  policyId: string;

  @ApiProperty({ description: 'Tipo de documento', enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
