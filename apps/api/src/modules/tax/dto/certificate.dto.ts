import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsEnum } from 'class-validator';

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  INVALID = 'INVALID',
}

export class UploadCertificateDto {
  @ApiProperty({ description: 'Certificado digital en formato PKCS#12 (base64)', example: 'MIIKCAIBAzCCCc4G...' })
  @IsString()
  @IsNotEmpty()
  certificateData: string;

  @ApiProperty({ description: 'Contraseña del certificado', example: 'mySecurePassword123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'ID de la empresa', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Alias descriptivo del certificado', example: 'Certificado FNMT 2024', required: false })
  @IsString()
  @IsOptional()
  alias?: string;
}

export class CertificateInfoDto {
  @ApiProperty({ description: 'ID del certificado' })
  id: string;

  @ApiProperty({ description: 'NIF del titular' })
  nif: string;

  @ApiProperty({ description: 'Nombre del titular' })
  commonName: string;

  @ApiProperty({ description: 'Organización' })
  organization: string;

  @ApiProperty({ description: 'País' })
  country: string;

  @ApiProperty({ description: 'Fecha de emisión' })
  validFrom: Date;

  @ApiProperty({ description: 'Fecha de expiración' })
  validTo: Date;

  @ApiProperty({ description: 'Días hasta expiración' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'Estado del certificado', enum: CertificateStatus })
  status: CertificateStatus;

  @ApiProperty({ description: 'Número de serie' })
  serialNumber: string;

  @ApiProperty({ description: 'Emisor del certificado' })
  issuer: string;

  @ApiProperty({ description: 'Huella digital (SHA-256)' })
  fingerprint: string;

  @ApiProperty({ description: 'Alias del certificado', required: false })
  alias?: string;

  @ApiProperty({ description: 'ID de la empresa' })
  companyId: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;
}

export class CertificateExpirationDto {
  @ApiProperty({ description: 'Días hasta expiración' })
  daysUntilExpiration: number;

  @ApiProperty({ description: 'Está expirado' })
  isExpired: boolean;

  @ApiProperty({ description: 'Requiere renovación (< 30 días)' })
  requiresRenewal: boolean;

  @ApiProperty({ description: 'Fecha de expiración' })
  expirationDate: Date;
}
