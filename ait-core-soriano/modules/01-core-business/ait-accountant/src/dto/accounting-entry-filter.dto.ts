import { IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EntryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class AccountingEntryFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, enum: EntryStatus })
  @IsOptional()
  @IsEnum(EntryStatus)
  status?: EntryStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
