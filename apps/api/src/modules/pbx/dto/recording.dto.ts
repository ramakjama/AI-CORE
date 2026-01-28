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
import { RecordingStatus } from '../interfaces/recording.interface';

export class StartRecordingDto {
  @ApiProperty({ description: 'ID de la llamada' })
  @IsUUID()
  callId: string;

  @ApiPropertyOptional({ description: 'Formato de grabación', default: 'wav' })
  @IsOptional()
  @IsEnum(['wav', 'mp3', 'ogg'])
  format?: string;

  @ApiPropertyOptional({ description: 'Grabar ambos canales mezclados', default: true })
  @IsOptional()
  @IsBoolean()
  mixMonitor?: boolean;

  @ApiPropertyOptional({ description: 'Reproducir beep al iniciar', default: false })
  @IsOptional()
  @IsBoolean()
  beep?: boolean;
}

export class FilterRecordingsDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID de llamada' })
  @IsOptional()
  @IsUUID()
  callId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: RecordingStatus })
  @IsOptional()
  @IsEnum(RecordingStatus)
  status?: RecordingStatus;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Resultados por página', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetRecordingDto {
  @ApiPropertyOptional({ description: 'Descargar como archivo', default: false })
  @IsOptional()
  @IsBoolean()
  download?: boolean;

  @ApiPropertyOptional({ description: 'Formato de respuesta', enum: ['url', 'stream', 'base64'] })
  @IsOptional()
  @IsEnum(['url', 'stream', 'base64'])
  responseType?: 'url' | 'stream' | 'base64';
}
