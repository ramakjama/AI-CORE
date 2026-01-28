import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum HolderType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company'
}

export class PolicyHolderDto {
  @ApiProperty({ description: 'Tipo de titular', enum: HolderType })
  @IsEnum(HolderType)
  type: HolderType;

  @ApiProperty({ description: 'Nombre completo / Razón social' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'NIF/CIF/Pasaporte' })
  @IsString()
  identificationNumber: string;

  @ApiProperty({ description: 'Email de contacto' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Teléfono', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Dirección completa' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Código postal' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Provincia' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'País', example: 'España' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Fecha de nacimiento (individual)', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @ApiProperty({ description: 'Ocupación (individual)', required: false })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiProperty({ description: 'Actividad empresarial (company)', required: false })
  @IsOptional()
  @IsString()
  businessActivity?: string;
}
