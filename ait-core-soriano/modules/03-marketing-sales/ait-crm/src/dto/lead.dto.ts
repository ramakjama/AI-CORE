import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min, Max, IsArray, IsObject } from 'class-validator';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
  CONVERTED = 'converted',
  LOST = 'lost'
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  PARTNER = 'partner',
  IMPORT = 'import',
  API = 'api',
  MANUAL = 'manual'
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+34612345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Empresa XYZ', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'CEO', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ enum: LeadSource, example: LeadSource.WEBSITE })
  @IsEnum(LeadSource)
  source: LeadSource;

  @ApiProperty({ example: 'Interesado en seguro de auto', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 50, description: 'Score 0-100', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiProperty({ example: 'agent_123', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: ['hot-lead', 'enterprise'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ example: { industry: 'Technology', employees: '50-100' }, required: false })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class UpdateLeadDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Pérez', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'juan.perez@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+34612345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Empresa XYZ', required: false })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'CEO', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ enum: LeadStatus, required: false })
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
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: ['hot-lead', 'enterprise'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ example: { industry: 'Technology' }, required: false })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class FilterLeadDto {
  @ApiProperty({ enum: LeadStatus, required: false })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiProperty({ enum: LeadSource, required: false })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false, example: 70 })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: ['hot-lead'] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class ConvertLeadDto {
  @ApiProperty({ example: 'cust_123', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: 'Converted successfully', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  createOpportunity?: boolean;

  @ApiProperty({ example: 5000, required: false })
  @IsOptional()
  @IsNumber()
  estimatedValue?: number;
}

export class PaginatedResult<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ImportResult {
  @ApiProperty()
  total: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  errors: Array<{ row: number; error: string }>;
}

export class BulkUpdateResult {
  @ApiProperty()
  updated: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  errors: Array<{ leadId: string; error: string }>;
}
