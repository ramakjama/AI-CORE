import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QueueStrategy } from '../interfaces/queue.interface';

export class CreateQueueDto {
  @ApiProperty({ description: 'Nombre de la cola', example: 'Atención al Cliente' })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({ description: 'Extensión', example: '2000' })
  @IsString()
  @Length(3, 10)
  extension: string;

  @ApiPropertyOptional({
    description: 'Estrategia de distribución',
    enum: QueueStrategy,
    default: QueueStrategy.RING_ALL,
  })
  @IsOptional()
  @IsEnum(QueueStrategy)
  strategy?: QueueStrategy;

  @ApiPropertyOptional({ description: 'Tiempo máximo de espera en segundos', default: 300 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1800)
  maxWaitTime?: number;

  @ApiPropertyOptional({ description: 'Máximo de llamadas en cola', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxCallers?: number;

  @ApiPropertyOptional({ description: 'Frecuencia de anuncios en segundos', default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  announceFrequency?: number;

  @ApiPropertyOptional({ description: 'Anunciar tiempo de espera', default: true })
  @IsOptional()
  @IsBoolean()
  announceHoldTime?: boolean;

  @ApiPropertyOptional({ description: 'Música en espera', default: 'default' })
  @IsOptional()
  @IsString()
  musicOnHold?: string;

  @ApiPropertyOptional({ description: 'Prioridad de la cola (1-10)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Habilidades requeridas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Nivel de servicio objetivo (%)', default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceLevel?: number;
}

export class UpdateQueueDto {
  @ApiPropertyOptional({ description: 'Nombre de la cola' })
  @IsOptional()
  @IsString()
  @Length(3, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Estrategia de distribución', enum: QueueStrategy })
  @IsOptional()
  @IsEnum(QueueStrategy)
  strategy?: QueueStrategy;

  @ApiPropertyOptional({ description: 'Tiempo máximo de espera en segundos' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(1800)
  maxWaitTime?: number;

  @ApiPropertyOptional({ description: 'Máximo de llamadas en cola' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  maxCallers?: number;

  @ApiPropertyOptional({ description: 'Frecuencia de anuncios en segundos' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  announceFrequency?: number;

  @ApiPropertyOptional({ description: 'Anunciar tiempo de espera' })
  @IsOptional()
  @IsBoolean()
  announceHoldTime?: boolean;

  @ApiPropertyOptional({ description: 'Música en espera' })
  @IsOptional()
  @IsString()
  musicOnHold?: string;

  @ApiPropertyOptional({ description: 'Prioridad de la cola' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Habilidades requeridas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Nivel de servicio objetivo (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  serviceLevel?: number;

  @ApiPropertyOptional({ description: 'Cola activa' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class QueueStatsDto {
  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Intervalo de tiempo', enum: ['realtime', 'hour', 'day'] })
  @IsOptional()
  @IsEnum(['realtime', 'hour', 'day'])
  interval?: 'realtime' | 'hour' | 'day';
}
