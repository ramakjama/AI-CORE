import { ApiProperty } from '@nestjs/swagger';

export enum OpportunityStage {
  PROSPECTING = 'PROSPECTING',
  QUALIFICATION = 'QUALIFICATION',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
}

export class Opportunity {
  @ApiProperty({ example: 'opp_123456789' })
  id: string;

  @ApiProperty({ example: 'Enterprise Deal - Acme Corp' })
  name: string;

  @ApiProperty({ example: 'ld_123' })
  leadId?: string;

  @ApiProperty({ example: 'acc_123' })
  accountId: string;

  @ApiProperty({ example: 'cnt_123' })
  contactId: string;

  @ApiProperty({ enum: OpportunityStage })
  stage: OpportunityStage;

  @ApiProperty({ example: 50000, description: 'Deal value in cents' })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 75, description: 'Win probability percentage' })
  probability: number;

  @ApiProperty({ example: '2024-12-31' })
  expectedCloseDate: Date;

  @ApiProperty({ example: 'usr_123' })
  ownerId: string;

  @ApiProperty({ example: { product: 'Enterprise', seats: 100 } })
  customFields?: Record<string, any>;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  competitors?: string[];

  @ApiProperty()
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  closedAt?: Date;

  @ApiProperty({ required: false })
  lostReason?: string;

  @ApiProperty()
  tenantId: string;
}
