import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, Min, IsDate, IsBoolean } from 'class-validator';

export enum PipelineStage {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Enterprise Insurance Deal' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'lead_123', required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'cust_123', required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ enum: PipelineStage, example: PipelineStage.QUALIFIED })
  @IsEnum(PipelineStage)
  stage: PipelineStage;

  @ApiProperty({ example: 50000, description: 'Estimated value in EUR' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: 50, description: 'Win probability 0-100' })
  @IsNumber()
  @Min(0)
  probability: number;

  @ApiProperty({ example: '2026-03-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDate()
  expectedCloseDate?: Date;

  @ApiProperty({ example: 'agent_123', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ example: 'High-value enterprise client', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOpportunityDto {
  @ApiProperty({ example: 'Enterprise Insurance Deal', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: PipelineStage, required: false })
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @ApiProperty({ example: 50000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  probability?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  expectedCloseDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FilterOpportunityDto {
  @ApiProperty({ enum: PipelineStage, required: false })
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CloseWonDto {
  @ApiProperty({ example: 55000, description: 'Actual closed value' })
  @IsNumber()
  @Min(0)
  actualValue: number;

  @ApiProperty({ example: 'Signed contract', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseLostDto {
  @ApiProperty({ example: 'Chose competitor' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleFollowUpDto {
  @ApiProperty({ example: '2026-02-15T10:00:00Z' })
  @IsDate()
  scheduledFor: Date;

  @ApiProperty({ example: 'Follow up on proposal' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'CALL', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}

export class PipelineView {
  @ApiProperty()
  stages: Record<PipelineStage, { count: number; value: number; opportunities: any[] }>;

  @ApiProperty()
  totalValue: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  averageValue: number;
}

export class RevenueForest {
  @ApiProperty()
  period: string;

  @ApiProperty()
  predictedRevenue: number;

  @ApiProperty()
  weightedRevenue: number;

  @ApiProperty()
  opportunities: number;
}

export class WinLossAnalysis {
  @ApiProperty()
  won: number;

  @ApiProperty()
  lost: number;

  @ApiProperty()
  winRate: number;

  @ApiProperty()
  averageWinValue: number;

  @ApiProperty()
  topLossReasons: Array<{ reason: string; count: number }>;
}
