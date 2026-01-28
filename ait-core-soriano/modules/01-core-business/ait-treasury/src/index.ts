import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TreasuryController } from './controllers/treasury.controller';
import { CashFlowController } from './controllers/cash-flow.controller';
import { PaymentController } from './controllers/payment.controller';
import { TreasuryService } from './services/treasury.service';
import { CashFlowService } from './services/cash-flow.service';
import { PaymentService } from './services/payment.service';
import { LiquidityService } from './services/liquidity.service';
import { ForecastService } from './services/forecast.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    TreasuryController,
    CashFlowController,
    PaymentController,
  ],
  providers: [
    TreasuryService,
    CashFlowService,
    PaymentService,
    LiquidityService,
    ForecastService,
  ],
  exports: [
    TreasuryService,
    CashFlowService,
    PaymentService,
    LiquidityService,
    ForecastService,
  ],
})
export class AiTreasuryModule {}

export * from './controllers/treasury.controller';
export * from './controllers/cash-flow.controller';
export * from './controllers/payment.controller';
export * from './services/treasury.service';
export * from './services/cash-flow.service';
export * from './services/payment.service';
export * from './services/liquidity.service';
export * from './services/forecast.service';
export * from './dto';
export * from './entities';
export * from './interfaces';
