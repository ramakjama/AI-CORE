import { ApiProperty } from '@nestjs/swagger';

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  CAMPAIGN = 'CAMPAIGN',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  API = 'API',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  UNQUALIFIED = 'UNQUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export class Lead {
  @ApiProperty({ example: 'ld_123456789', description: 'Lead unique identifier' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Lead full name' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number', required: false })
  phone?: string;

  @ApiProperty({ example: 'Acme Corp', description: 'Company name', required: false })
  company?: string;

  @ApiProperty({ example: 'CEO', description: 'Job title', required: false })
  jobTitle?: string;

  @ApiProperty({ enum: LeadSource, example: LeadSource.WEBSITE })
  source: LeadSource;

  @ApiProperty({ enum: LeadStatus, example: LeadStatus.NEW })
  status: LeadStatus;

  @ApiProperty({ example: 85, description: 'Lead score (0-100)' })
  score: number;

  @ApiProperty({ example: { industry: 'Technology', employees: '50-100' } })
  customFields?: Record<string, any>;

  @ApiProperty({ example: 'Interested in Enterprise plan' })
  notes?: string;

  @ApiProperty({ example: 'usr_123', description: 'Assigned sales rep ID' })
  assignedTo?: string;

  @ApiProperty({ example: ['enterprise', 'hot-lead'] })
  tags?: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  convertedAt?: Date;

  @ApiProperty({ required: false, description: 'Converted opportunity ID' })
  opportunityId?: string;

  @ApiProperty({ example: 'tenant_123' })
  tenantId: string;
}
