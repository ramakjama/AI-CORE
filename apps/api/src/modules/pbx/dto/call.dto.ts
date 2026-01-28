import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsPhoneNumber,
  IsObject,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CallStatus, CallDirection } from '../interfaces/call.interface';

export class MakeCallDto {
  @ApiProperty({ description: 'Número de origen' })
  @IsString()
  @IsPhoneNumber()
  from: string;

  @ApiProperty({ description: 'Número de destino' })
  @IsString()
  @IsPhoneNumber()
  to: string;

  @ApiPropertyOptional({ description: 'ID del agente' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ description: 'ID del cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Variables personalizadas' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Timeout en segundos', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  timeout?: number;
}

export class TransferCallDto {
  @ApiProperty({ description: 'Destino de la transferencia' })
  @IsString()
  target: string;

  @ApiPropertyOptional({
    description: 'Tipo de transferencia',
    enum: ['blind', 'attended'],
    default: 'blind',
  })
  @IsOptional()
  @IsEnum(['blind', 'attended'])
  type?: 'blind' | 'attended';

  @ApiPropertyOptional({ description: 'ID del agente destino' })
  @IsOptional()
  @IsUUID()
  targetAgentId?: string;
}

export class HoldCallDto {
  @ApiProperty({ description: 'Poner en espera (true) o retomar (false)' })
  @IsBoolean()
  hold: boolean;
}

export class FilterCallsDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(CallStatus)
  status?: CallStatus;

  @ApiPropertyOptional({ description: 'Filtrar por dirección' })
  @IsOptional()
  @IsEnum(CallDirection)
  direction?: CallDirection;

  @ApiPropertyOptional({ description: 'Filtrar por agente' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por cola' })
  @IsOptional()
  @IsUUID()
  queueId?: string;

  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsDateString()
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

export class CallStatsDto {
  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Agrupar por', enum: ['hour', 'day', 'week', 'month'] })
  @IsOptional()
  @IsEnum(['hour', 'day', 'week', 'month'])
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}
