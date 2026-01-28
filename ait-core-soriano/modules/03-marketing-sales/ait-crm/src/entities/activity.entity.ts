import { ApiProperty } from '@nestjs/swagger';

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
  NOTE = 'NOTE',
  SMS = 'SMS',
}

export enum ActivityStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class Activity {
  @ApiProperty({ example: 'act_123456789' })
  id: string;

  @ApiProperty({ enum: ActivityType })
  type: ActivityType;

  @ApiProperty({ enum: ActivityStatus })
  status: ActivityStatus;

  @ApiProperty({ example: 'Follow-up call with prospect' })
  subject: string;

  @ApiProperty({ example: 'Discussed pricing and implementation timeline' })
  description?: string;

  @ApiProperty({ example: 'ld_123' })
  leadId?: string;

  @ApiProperty({ example: 'opp_123' })
  opportunityId?: string;

  @ApiProperty({ example: 'cnt_123' })
  contactId?: string;

  @ApiProperty({ example: 'acc_123' })
  accountId?: string;

  @ApiProperty({ example: 'usr_123' })
  assignedTo: string;

  @ApiProperty()
  scheduledAt?: Date;

  @ApiProperty()
  completedAt?: Date;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  duration?: number;

  @ApiProperty({ example: { outcome: 'positive', nextSteps: 'Send proposal' } })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  tenantId: string;
}
