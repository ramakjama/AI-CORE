import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResolutionStatus } from '../interfaces/summary.interface';

export class GenerateSummaryDto {
  @ApiProperty({ description: 'ID de la llamada' })
  @IsUUID()
  callId: string;

  @ApiPropertyOptional({ description: 'ID de la transcripción (opcional si ya existe)' })
  @IsOptional()
  @IsUUID()
  transcriptionId?: string;

  @ApiPropertyOptional({ description: 'Incluir action items', default: true })
  @IsOptional()
  @IsBoolean()
  includeActionItems?: boolean;

  @ApiPropertyOptional({ description: 'Incluir próximos pasos', default: true })
  @IsOptional()
  @IsBoolean()
  includeNextSteps?: boolean;

  @ApiPropertyOptional({ description: 'Incluir temas tratados', default: true })
  @IsOptional()
  @IsBoolean()
  includeTopics?: boolean;

  @ApiPropertyOptional({ description: 'Longitud máxima del resumen (palabras)' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Idioma del resumen', default: 'es' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class FilterSummariesDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado de resolución', enum: ResolutionStatus })
  @IsOptional()
  @IsEnum(ResolutionStatus)
  resolutionStatus?: ResolutionStatus;

  @ApiPropertyOptional({ description: 'Búsqueda de texto en resumen' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tema' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Solo con action items pendientes' })
  @IsOptional()
  @IsBoolean()
  hasPendingActions?: boolean;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  endDate?: string;
}

export class UpdateActionItemDto {
  @ApiProperty({ description: 'Estado del action item' })
  @IsEnum(['pending', 'in_progress', 'completed'])
  status: 'pending' | 'in_progress' | 'completed';

  @ApiPropertyOptional({ description: 'Asignado a (ID de usuario)' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
