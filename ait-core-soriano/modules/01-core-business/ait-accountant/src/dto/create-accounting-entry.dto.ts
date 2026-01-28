import { IsString, IsNumber, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AccountingLineDto {
  @ApiProperty({ description: 'Account ID' })
  @IsString()
  accountId: string;

  @ApiProperty({ description: 'Debit amount', required: false })
  @IsOptional()
  @IsNumber()
  debit?: number;

  @ApiProperty({ description: 'Credit amount', required: false })
  @IsOptional()
  @IsNumber()
  credit?: number;

  @ApiProperty({ description: 'Line description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateAccountingEntryDto {
  @ApiProperty({ description: 'Entry description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Entry date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Reference number', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Entry lines', type: [AccountingLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingLineDto)
  lines: AccountingLineDto[];

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
