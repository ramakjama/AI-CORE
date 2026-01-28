import { ApiProperty } from '@nestjs/swagger';

export class Contact {
  @ApiProperty({ example: 'cnt_123456789' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  phone?: string;

  @ApiProperty({ example: 'Director of Sales' })
  title?: string;

  @ApiProperty({ example: 'acc_123' })
  accountId?: string;

  @ApiProperty({ example: 'LinkedIn profile URL' })
  linkedIn?: string;

  @ApiProperty({ example: 'Twitter handle' })
  twitter?: string;

  @ApiProperty({ example: { department: 'Sales', seniority: 'Senior' } })
  customFields?: Record<string, any>;

  @ApiProperty()
  tags?: string[];

  @ApiProperty({ example: 'usr_123' })
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  tenantId: string;
}

export class Account {
  @ApiProperty({ example: 'acc_123456789' })
  id: string;

  @ApiProperty({ example: 'Acme Corporation' })
  name: string;

  @ApiProperty({ example: 'www.acme.com' })
  website?: string;

  @ApiProperty({ example: 'Technology' })
  industry?: string;

  @ApiProperty({ example: '500-1000' })
  employeeCount?: string;

  @ApiProperty({ example: 10000000, description: 'Annual revenue in cents' })
  annualRevenue?: number;

  @ApiProperty({ example: 'New York, NY' })
  location?: string;

  @ApiProperty({ example: { subsidiary: 'Acme EU', parentCompany: 'Global Corp' } })
  customFields?: Record<string, any>;

  @ApiProperty()
  tags?: string[];

  @ApiProperty({ example: 'usr_123' })
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  tenantId: string;
}
