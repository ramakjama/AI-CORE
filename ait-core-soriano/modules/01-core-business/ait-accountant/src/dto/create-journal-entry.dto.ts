import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JournalEntryLineDto {
  @ApiProperty({ description: 'Account code from PGC', example: '570' })
  @IsString()
  @IsNotEmpty()
  accountCode: string;

  @ApiPropertyOptional({ description: 'Debit amount', example: 1000.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  debit?: number;

  @ApiPropertyOptional({ description: 'Credit amount', example: 1000.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  credit?: number;

  @ApiPropertyOptional({ description: 'Line description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Entry description', example: 'Cobro factura cliente ABC' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Entry date', example: '2026-01-28' })
  @IsDateString()
  @IsNotEmpty()
  entryDate: string;

  @ApiProperty({ description: 'Entry lines', type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];

  @ApiPropertyOptional({ description: 'Auto-post to ledger' })
  @IsOptional()
  autoPost?: boolean;
}

export class AutoCreateJournalEntryDto {
  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Transaction date' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({ description: 'Auto-post to ledger' })
  @IsOptional()
  autoPost?: boolean;
}
