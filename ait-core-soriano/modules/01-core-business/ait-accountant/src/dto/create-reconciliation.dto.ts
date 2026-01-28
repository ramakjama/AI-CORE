import { IsString, IsDateString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReconciliationDto {
  @ApiProperty({ description: 'Account ID to reconcile' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Reconciliation date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Statement ending balance' })
  statementBalance: number;

  @ApiProperty({ description: 'Bank statement transactions', required: false })
  @IsOptional()
  @IsArray()
  bankTransactions?: any[];
}
