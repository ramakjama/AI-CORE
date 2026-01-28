import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';
import { ActivityType, ActivityStatus } from '../entities/activity.entity';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsNotEmpty()
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ enum: ActivityStatus, default: ActivityStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiProperty({ example: 'Follow-up call with prospect' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiProperty({ required: false, example: 30 })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateActivityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
