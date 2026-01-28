import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateCoverageDto {
  @ApiProperty({ description: 'Nombre de la cobertura', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Suma asegurada', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sumInsured?: number;

  @ApiProperty({ description: 'Prima anual', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  premium?: number;

  @ApiProperty({ description: 'Franquicia/Deducible', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cobertura activa', required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ description: 'Datos adicionales', required: false })
  @IsOptional()
  additionalData?: Record<string, any>;
}
