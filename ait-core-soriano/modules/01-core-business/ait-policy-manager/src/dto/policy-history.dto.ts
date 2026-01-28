import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum HistoryEventType {
  CREATED = 'created',
  UPDATED = 'updated',
  ACTIVATED = 'activated',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
  RENEWED = 'renewed',
  ENDORSED = 'endorsed',
  DOCUMENT_ADDED = 'document_added',
  CLAIM_FILED = 'claim_filed',
  PAYMENT_RECEIVED = 'payment_received',
  PREMIUM_ADJUSTED = 'premium_adjusted',
  COVERAGE_ADDED = 'coverage_added',
  COVERAGE_REMOVED = 'coverage_removed',
  BENEFICIARY_ADDED = 'beneficiary_added',
  BENEFICIARY_REMOVED = 'beneficiary_removed'
}

export class PolicyHistoryDto {
  @ApiProperty({ description: 'ID del evento' })
  id: string;

  @ApiProperty({ description: 'ID de la póliza' })
  policyId: string;

  @ApiProperty({ description: 'Tipo de evento', enum: HistoryEventType })
  @IsEnum(HistoryEventType)
  eventType: HistoryEventType;

  @ApiProperty({ description: 'Descripción del cambio' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Datos anteriores (JSON)', required: false })
  @IsOptional()
  previousData?: Record<string, any>;

  @ApiProperty({ description: 'Datos nuevos (JSON)', required: false })
  @IsOptional()
  newData?: Record<string, any>;

  @ApiProperty({ description: 'ID del usuario que realizó el cambio' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @IsString()
  userName: string;

  @ApiProperty({ description: 'Fecha del evento' })
  @Type(() => Date)
  @IsDate()
  eventDate: Date;

  @ApiProperty({ description: 'IP desde donde se realizó el cambio', required: false })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'Notas adicionales', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
