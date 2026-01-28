import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsDate, IsObject } from 'class-validator';

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  TASK = 'TASK',
  DEMO = 'DEMO',
  PROPOSAL = 'PROPOSAL',
  DOCUMENT = 'DOCUMENT',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGNMENT = 'ASSIGNMENT',
  REASSIGNMENT = 'REASSIGNMENT',
  CONVERSION = 'CONVERSION'
}

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, example: ActivityType.CALL })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ example: 'Called to discuss insurance needs' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'opp_123', required: false })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiProperty({ example: 'cust_123', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ example: { duration: 30, outcome: 'Interested' }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ example: '2026-02-01T10:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  scheduledFor?: Date;
}

export class UpdateActivityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  scheduledFor?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FilterActivityDto {
  @ApiProperty({ enum: ActivityType, required: false })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

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
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  dateFrom?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  dateTo?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: number;
}

export class LogCallDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Discussed insurance options' })
  @IsString()
  description: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsOptional()
  duration?: number;

  @ApiProperty({ example: 'Interested in auto insurance' })
  @IsOptional()
  @IsString()
  outcome?: string;
}

export class LogEmailDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Sent proposal' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Detailed proposal attached' })
  @IsString()
  body: string;

  @ApiProperty({ example: 'sent' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class LogMeetingDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Product demo meeting' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  @IsDate()
  scheduledFor: Date;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  duration?: number;

  @ApiProperty({ example: 'Office', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

export class LogNoteDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Client expressed interest in premium coverage' })
  @IsString()
  content: string;
}

export class LogTaskDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Send follow-up email' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2026-02-10T00:00:00Z' })
  @IsDate()
  dueDate: Date;

  @ApiProperty({ example: 'high', required: false })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class LogDemoDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Product demo completed' })
  @IsString()
  description: string;

  @ApiProperty({ example: 45, description: 'Duration in minutes' })
  @IsOptional()
  duration?: number;

  @ApiProperty({ example: 'Very interested, asked about pricing' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class LogProposalDto {
  @ApiProperty({ example: 'opp_123', required: false })
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @ApiProperty({ example: 'Enterprise Insurance Proposal' })
  @IsString()
  title: string;

  @ApiProperty({ example: 50000 })
  @IsOptional()
  value?: number;

  @ApiProperty({ example: 'https://example.com/proposal.pdf', required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class LogDocumentDto {
  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'Contract signed' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'contract' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'https://example.com/contract.pdf' })
  @IsString()
  documentUrl: string;
}

export class ActivitySummary {
  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  byType: Record<ActivityType, number>;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  pendingTasks: number;

  @ApiProperty()
  upcomingMeetings: number;
}
