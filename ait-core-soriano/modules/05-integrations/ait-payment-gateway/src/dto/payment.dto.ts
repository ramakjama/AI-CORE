/**
 * Payment DTOs
 * Data Transfer Objects for payment operations
 */

import { IsString, IsNumber, IsEnum, IsOptional, IsEmail, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, Currency, PaymentMethod, RefundReason } from '../interfaces/payment.types';

export class MoneyDto {
  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: Currency, example: Currency.EUR })
  @IsEnum(Currency)
  currency: Currency;
}

export class AddressDto {
  @ApiProperty()
  @IsString()
  line1: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty()
  @IsString()
  postalCode: string;

  @ApiProperty()
  @IsString()
  country: string;
}

export class CustomerInfoDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreatePaymentDto {
  @ApiProperty({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;

  @ApiProperty({ type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  returnUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  @IsOptional()
  preferredProvider?: PaymentProvider;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class RefundPaymentDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  @IsOptional()
  amount?: MoneyDto;

  @ApiPropertyOptional({ enum: RefundReason })
  @IsEnum(RefundReason)
  @IsOptional()
  reason?: RefundReason;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetPaymentStatusDto {
  @ApiProperty()
  @IsString()
  transactionId: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;
}

export class SubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  amount: MoneyDto;

  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  @IsEnum(['day', 'week', 'month', 'year'])
  interval: 'day' | 'week' | 'month' | 'year';

  @ApiProperty()
  @IsNumber()
  @Min(1)
  intervalCount: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateSubscriptionDto {
  @ApiProperty({ type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiProperty({ type: SubscriptionPlanDto })
  @ValidateNested()
  @Type(() => SubscriptionPlanDto)
  plan: SubscriptionPlanDto;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  trialDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  subscriptionId: string;

  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional()
  @IsOptional()
  immediate?: boolean;
}
