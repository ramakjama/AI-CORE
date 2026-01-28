import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateCoverageDto {
  @ApiProperty({ description: 'Nombre de la cobertura', example: 'Responsabilidad Civil' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Código de la cobertura', example: 'RC_AUTO' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Suma asegurada', example: 50000 })
  @IsNumber()
  @Min(0)
  sumInsured: number;

  @ApiProperty({ description: 'Prima anual', example: 350 })
  @IsNumber()
  @Min(0)
  premium: number;

  @ApiProperty({ description: 'Franquicia/Deducible', example: 300, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiProperty({ description: 'Descripción detallada', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Cobertura obligatoria', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;

  @ApiProperty({ description: 'Límite de reclamación', example: 100000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  claimLimit?: number;

  @ApiProperty({ description: 'Datos adicionales (JSON)', required: false })
  @IsOptional()
  additionalData?: Record<string, any>;
}
