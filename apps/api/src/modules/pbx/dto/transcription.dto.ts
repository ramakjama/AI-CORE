import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranscriptionStatus } from '../interfaces/transcription.interface';

export class TranscribeCallDto {
  @ApiProperty({ description: 'ID de la llamada' })
  @IsUUID()
  callId: string;

  @ApiPropertyOptional({ description: 'Idioma (ISO 639-1)', example: 'es' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Modelo de Whisper', default: 'whisper-1' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Temperatura (0-1)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Prompt para contexto' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Identificar speakers', default: true })
  @IsOptional()
  @IsBoolean()
  identifySpeakers?: boolean;
}

export class GetTranscriptionDto {
  @ApiPropertyOptional({ description: 'Formato de respuesta', enum: ['json', 'text', 'srt', 'vtt'] })
  @IsOptional()
  @IsEnum(['json', 'text', 'srt', 'vtt'])
  format?: 'json' | 'text' | 'srt' | 'vtt';

  @ApiPropertyOptional({ description: 'Incluir timestamps', default: true })
  @IsOptional()
  @IsBoolean()
  includeTimestamps?: boolean;

  @ApiPropertyOptional({ description: 'Incluir speakers', default: true })
  @IsOptional()
  @IsBoolean()
  includeSpeakers?: boolean;
}

export class FilterTranscriptionsDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de llamada' })
  @IsOptional()
  @IsUUID()
  callId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: TranscriptionStatus })
  @IsOptional()
  @IsEnum(TranscriptionStatus)
  status?: TranscriptionStatus;

  @ApiPropertyOptional({ description: 'Filtrar por idioma' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Búsqueda de texto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
