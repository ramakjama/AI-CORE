/**
 * Payment Gateway Module
 * Main module for payment gateway functionality
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Providers
import { StripeProvider } from './providers/stripe/stripe.provider';
import { RedsysProvider } from './providers/redsys/redsys.provider';
import { BizumProvider } from './providers/bizum/bizum.provider';

// Services
import { PaymentOrchestratorService } from './services/payment-orchestrator.service';
import { PaymentReconciliationService } from './services/payment-reconciliation.service';
import { FraudDetectionService } from './services/fraud-detection.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { WebhookController } from './webhooks/webhook.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    // Payment Providers
    StripeProvider,
    RedsysProvider,
    BizumProvider,

    // Services
    PaymentOrchestratorService,
    PaymentReconciliationService,
    FraudDetectionService,
  ],
  controllers: [PaymentController, WebhookController],
  exports: [
    PaymentOrchestratorService,
    PaymentReconciliationService,
    FraudDetectionService,
    StripeProvider,
    RedsysProvider,
    BizumProvider,
  ],
})
export class PaymentGatewayModule {}
