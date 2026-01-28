/**
 * Data Transfer Objects for Execution
 */

import { IsString, IsOptional, IsObject, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EngineType } from '../types/engine.types';

export class ExecutionRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  engineId?: string;

  @ApiProperty({ required: false, enum: EngineType })
  @IsOptional()
  @IsEnum(EngineType)
  engineType?: EngineType;

  @ApiProperty()
  @IsString()
  operation: string;

  @ApiProperty()
  @IsObject()
  parameters: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  retryOnFailure?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BatchExecutionRequestDto {
  @ApiProperty({ type: [ExecutionRequestDto] })
  requests: ExecutionRequestDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  failFast?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  timeout?: number;
}

export class ScalingRequestDto {
  @ApiProperty()
  @IsString()
  engineId: string;

  @ApiProperty()
  @IsNumber()
  targetInstances: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
