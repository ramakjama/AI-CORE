import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SentimentScore } from '../interfaces/sentiment.interface';

export class AnalyzeSentimentDto {
  @ApiProperty({ description: 'ID de la transcripción' })
  @IsUUID()
  transcriptionId: string;

  @ApiPropertyOptional({ description: 'Incluir timeline detallado', default: true })
  @IsOptional()
  @IsBoolean()
  includeTimeline?: boolean;

  @ApiPropertyOptional({ description: 'Detectar emociones', default: true })
  @IsOptional()
  @IsBoolean()
  detectEmotions?: boolean;

  @ApiPropertyOptional({ description: 'Extraer frases clave', default: true })
  @IsOptional()
  @IsBoolean()
  extractKeyPhrases?: boolean;
}

export class FilterSentimentAnalysesDto {
  @ApiPropertyOptional({ description: 'Filtrar por sentimiento', enum: SentimentScore })
  @IsOptional()
  @IsEnum(SentimentScore)
  sentiment?: SentimentScore;

  @ApiPropertyOptional({ description: 'Solo con escalación requerida' })
  @IsOptional()
  @IsBoolean()
  escalationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Nivel mínimo de frustración (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minFrustration?: number;

  @ApiPropertyOptional({ description: 'Nivel mínimo de urgencia (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minUrgency?: number;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  endDate?: string;
}
