import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, IsDate, IsBoolean, IsNumber } from 'class-validator';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

export class CreateCampaignDto {
  @ApiProperty({ example: 'Q1 2026 Promotion' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Special insurance offer for Q1' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'tpl_123' })
  @IsString()
  templateId: string;

  @ApiProperty({ example: ['seg_leads', 'seg_customers'] })
  @IsArray()
  segmentIds: string[];

  @ApiProperty({ example: '2026-02-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  scheduledDate?: Date;

  @ApiProperty({ example: { companyName: 'Soriano Mediadores' }, required: false })
  @IsOptional()
  variables?: Record<string, any>;
}

export class UpdateCampaignDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  segmentIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  scheduledDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  variables?: Record<string, any>;
}

export class FilterCampaignDto {
  @ApiProperty({ enum: CampaignStatus, required: false })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class CreateSegmentDto {
  @ApiProperty({ example: 'Hot Leads Q1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'All leads with score > 70' })
  @IsString()
  description: string;

  @ApiProperty({ example: { minScore: 70, status: 'NEW' } })
  @IsOptional()
  criteria?: Record<string, any>;

  @ApiProperty({ example: ['lead_123', 'lead_456'], required: false })
  @IsOptional()
  @IsArray()
  contactIds?: string[];
}

export class CreateTemplateDto {
  @ApiProperty({ example: 'Welcome Email' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Welcome to our insurance services' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<html>...</html>' })
  @IsString()
  htmlContent: string;

  @ApiProperty({ example: 'Plain text version', required: false })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiProperty({ example: ['customerName', 'companyName'], required: false })
  @IsOptional()
  @IsArray()
  variables?: string[];
}

export class CampaignResult {
  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  totalRecipients: number;

  @ApiProperty()
  sent: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  completedAt?: Date;
}

export class CampaignStatistics {
  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  totalSent: number;

  @ApiProperty()
  delivered: number;

  @ApiProperty()
  opened: number;

  @ApiProperty()
  clicked: number;

  @ApiProperty()
  bounced: number;

  @ApiProperty()
  unsubscribed: number;

  @ApiProperty()
  conversions: number;

  @ApiProperty()
  openRate: number;

  @ApiProperty()
  clickRate: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  bounceRate: number;

  @ApiProperty()
  unsubscribeRate: number;
}

export class QueuedCampaign {
  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  scheduledDate: Date;

  @ApiProperty()
  recipientCount: number;
}

export class EmailTemplate {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  htmlContent: string;

  @ApiProperty()
  textContent?: string;

  @ApiProperty()
  variables?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class Segment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  criteria?: Record<string, any>;

  @ApiProperty()
  contactCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class Contact {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;

  @ApiProperty()
  customFields?: Record<string, any>;
}

export class EmailEngagement {
  @ApiProperty()
  period: string;

  @ApiProperty()
  totalEmails: number;

  @ApiProperty()
  averageOpenRate: number;

  @ApiProperty()
  averageClickRate: number;

  @ApiProperty()
  topPerformingCampaigns: Array<{ name: string; openRate: number }>;
}
