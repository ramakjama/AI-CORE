import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum BeneficiaryType {
  PRIMARY = 'primary',
  CONTINGENT = 'contingent',
  IRREVOCABLE = 'irrevocable'
}

export enum RelationshipType {
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  OTHER = 'other'
}

export class BeneficiaryDto {
  @ApiProperty({ description: 'Nombre completo del beneficiario' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'NIF/Pasaporte' })
  @IsString()
  identificationNumber: string;

  @ApiProperty({ description: 'Tipo de beneficiario', enum: BeneficiaryType })
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType;

  @ApiProperty({ description: 'Relación con el asegurado', enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationship: RelationshipType;

  @ApiProperty({ description: 'Porcentaje de beneficio', example: 100, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({ description: 'Fecha de nacimiento' })
  @Type(() => Date)
  @IsDate()
  birthDate: Date;

  @ApiProperty({ description: 'Email de contacto', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Teléfono', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Dirección', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddBeneficiaryDto extends BeneficiaryDto {
  @ApiProperty({ description: 'ID de la póliza' })
  @IsString()
  policyId: string;
}
