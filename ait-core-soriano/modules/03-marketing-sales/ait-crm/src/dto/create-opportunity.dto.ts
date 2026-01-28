import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, IsNumber, Min, Max, IsDateString, IsArray } from 'class-validator';
import { OpportunityStage } from '../entities/opportunity.entity';

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Enterprise Deal - Acme Corp' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiProperty({ example: 'acc_123' })
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @ApiProperty({ example: 'cnt_123' })
  @IsNotEmpty()
  @IsString()
  contactId: string;

  @ApiProperty({ enum: OpportunityStage })
  @IsNotEmpty()
  @IsEnum(OpportunityStage)
  stage: OpportunityStage;

  @ApiProperty({ example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability: number;

  @ApiProperty({ example: '2024-12-31' })
  @IsNotEmpty()
  @IsDateString()
  expectedCloseDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitors?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateOpportunityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitors?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
