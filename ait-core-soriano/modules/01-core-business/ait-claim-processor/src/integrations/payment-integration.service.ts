import { Injectable, Logger } from '@nestjs/common';
import { Claim } from '../entities/claim.entity';

/**
 * Resultado de transacción de pago
 */
export interface PaymentTransaction {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  currency: string;
  method: string;
  timestamp: Date;
  failureReason?: string;
}

/**
 * Servicio de integración con pasarelas de pago
 */
@Injectable()
export class PaymentIntegrationService {
  private readonly logger = new Logger(PaymentIntegrationService.name);

  /**
   * Procesa un pago
   */
  async processPayment(
    claim: Claim,
    amount: number,
    method: string = 'BANK_TRANSFER',
  ): Promise<PaymentTransaction> {
    this.logger.log(`Processing payment of €${amount} for claim ${claim.claimNumber}`);

    try {
      // En producción: integrar con Stripe, PayPal, etc.
      // const payment = await stripeClient.paymentIntents.create({...});

      // Simulación
      await this.sleep(2000);

      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        return {
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'COMPLETED',
          amount,
          currency: 'EUR',
          method,
          timestamp: new Date(),
        };
      } else {
        return {
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'FAILED',
          amount,
          currency: 'EUR',
          method,
          timestamp: new Date(),
          failureReason: 'Insufficient funds',
        };
      }
    } catch (error) {
      this.logger.error('Payment processing failed', error);

      return {
        transactionId: `TXN-ERROR-${Date.now()}`,
        status: 'FAILED',
        amount,
        currency: 'EUR',
        method,
        timestamp: new Date(),
        failureReason: 'Payment gateway error',
      };
    }
  }

  /**
   * Verifica el estado de una transacción
   */
  async checkTransactionStatus(transactionId: string): Promise<PaymentTransaction> {
    this.logger.log(`Checking status of transaction ${transactionId}`);

    await this.sleep(300);

    return {
      transactionId,
      status: 'COMPLETED',
      amount: 1000,
      currency: 'EUR',
      method: 'BANK_TRANSFER',
      timestamp: new Date(),
    };
  }

  /**
   * Cancela/revierte un pago
   */
  async refundPayment(transactionId: string, amount: number): Promise<PaymentTransaction> {
    this.logger.log(`Refunding €${amount} for transaction ${transactionId}`);

    await this.sleep(1500);

    return {
      transactionId: `REFUND-${transactionId}`,
      status: 'COMPLETED',
      amount,
      currency: 'EUR',
      method: 'REFUND',
      timestamp: new Date(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
