import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '../interfaces/agent.interface';

export class AgentSkillDto {
  @ApiProperty({ description: 'Nombre de la habilidad' })
  @IsString()
  skill: string;

  @ApiProperty({ description: 'Nivel de la habilidad (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;
}

export class CreateAgentDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Extensión telefónica', example: '1001' })
  @IsString()
  @Length(3, 10)
  extension: string;

  @ApiProperty({ description: 'Usuario SIP', example: 'agent1001' })
  @IsString()
  @Length(3, 50)
  sipUser: string;

  @ApiPropertyOptional({ description: 'Habilidades del agente', type: [AgentSkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentSkillDto)
  skills?: AgentSkillDto[];

  @ApiPropertyOptional({ description: 'Idiomas', example: ['es', 'en'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Máximo de llamadas concurrentes', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxConcurrentCalls?: number;

  @ApiPropertyOptional({ description: 'Prioridad del agente (1-10)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Habilidades del agente', type: [AgentSkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentSkillDto)
  skills?: AgentSkillDto[];

  @ApiPropertyOptional({ description: 'Idiomas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Máximo de llamadas concurrentes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxConcurrentCalls?: number;

  @ApiPropertyOptional({ description: 'Prioridad del agente' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Estado online' })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;
}

export class UpdateAgentStatusDto {
  @ApiProperty({ description: 'Nuevo estado del agente', enum: AgentStatus })
  @IsEnum(AgentStatus)
  status: AgentStatus;

  @ApiPropertyOptional({ description: 'Razón del cambio de estado' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FilterAgentsDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado', enum: AgentStatus })
  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Filtrar por habilidad' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ description: 'Filtrar por idioma' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Solo agentes online' })
  @IsOptional()
  @IsBoolean()
  onlineOnly?: boolean;

  @ApiPropertyOptional({ description: 'Solo agentes disponibles' })
  @IsOptional()
  @IsBoolean()
  availableOnly?: boolean;
}

export class AgentPerformanceDto {
  @ApiPropertyOptional({ description: 'Fecha inicio' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha fin' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Incluir detalles de llamadas' })
  @IsOptional()
  @IsBoolean()
  includeCallDetails?: boolean;
}
