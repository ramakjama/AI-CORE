import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max, IsArray } from 'class-validator';
import { LeadSource, LeadStatus } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'CEO', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ enum: LeadSource, example: LeadSource.WEBSITE })
  @IsNotEmpty()
  @IsEnum(LeadSource)
  source: LeadSource;

  @ApiProperty({ enum: LeadStatus, example: LeadStatus.NEW, required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ example: 50, required: false, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateLeadDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class QueryLeadsDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
