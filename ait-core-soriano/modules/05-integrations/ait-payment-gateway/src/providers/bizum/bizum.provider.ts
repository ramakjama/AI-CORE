/**
 * Bizum Payment Provider
 * Complete implementation for Bizum mobile payments (P2P and e-commerce)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  CreatePaymentOptions,
} from '../../interfaces/payment-provider.interface';
import {
  PaymentResult,
  RefundResult,
  RefundRequest,
  WebhookEvent,
  PaymentProvider,
  PaymentStatus,
  PaymentMethod,
  WebhookEventType,
} from '../../interfaces/payment.types';

interface BizumConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  testMode: boolean;
}

@Injectable()
export class BizumProvider implements IPaymentProvider {
  private readonly logger = new Logger(BizumProvider.name);
  private config: BizumConfig;
  private readonly apiUrl: string;

  readonly name = PaymentProvider.BIZUM;

  constructor(private configService: ConfigService) {
    this.config = {
      merchantId: this.configService.get<string>('BIZUM_MERCHANT_ID'),
      apiKey: this.configService.get<string>('BIZUM_API_KEY'),
      apiSecret: this.configService.get<string>('BIZUM_API_SECRET'),
      testMode: this.configService.get<boolean>('BIZUM_TEST_MODE', true),
    };

    this.apiUrl = this.config.testMode
      ? 'https://api-test.bizum.es/v1'
      : 'https://api.bizum.es/v1';

    this.logger.log('Bizum provider initialized');
  }

  /**
   * Create a Bizum payment
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentResult> {
    try {
      this.logger.log(`Creating Bizum payment for ${options.amount.amount} ${options.amount.currency}`);

      const reference = this.generateReference();

      const paymentData = {
        merchant_id: this.config.merchantId,
        reference,
        amount: options.amount.amount.toFixed(2),
        currency: options.amount.currency,
        description: options.description || 'Payment',
        customer: {
          phone: options.customer.phone,
          email: options.customer.email,
          name: options.customer.name,
        },
        return_url: options.returnUrl,
        cancel_url: options.cancelUrl,
        webhook_url: options.webhookUrl,
        metadata: options.metadata,
      };

      const signature = this.createSignature(paymentData);

      const response = await axios.post(
        `${this.apiUrl}/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
            'X-Signature': signature,
          },
          timeout: 30000,
        },
      );

      if (response.data.status === 'pending' || response.data.status === 'authorized') {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          provider: PaymentProvider.BIZUM,
          status: this.mapBizumStatus(response.data.status),
          amount: options.amount,
          paymentMethod: PaymentMethod.MOBILE_PAYMENT,
          providerResponse: response.data,
          message: 'Bizum payment initiated successfully',
          metadata: {
            reference,
            checkoutUrl: response.data.checkout_url,
            qrCode: response.data.qr_code,
          },
        };
      } else {
        return {
          success: false,
          transactionId: reference,
          provider: PaymentProvider.BIZUM,
          status: PaymentStatus.FAILED,
          amount: options.amount,
          error: response.data.error_message || 'Payment initiation failed',
        };
      }
    } catch (error) {
      this.logger.error(`Bizum payment creation failed: ${error.message}`, error.stack);

      let errorMessage = error.message;
      if (error.response?.data?.error_message) {
        errorMessage = error.response.data.error_message;
      }

      return {
        success: false,
        transactionId: null,
        provider: PaymentProvider.BIZUM,
        status: PaymentStatus.FAILED,
        amount: options.amount,
        error: errorMessage,
      };
    }
  }

  /**
   * Check payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/payments/${transactionId}`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'X-Signature': this.createSignature({ transaction_id: transactionId }),
          },
          timeout: 15000,
        },
      );

      const payment = response.data;

      return {
        success: payment.status === 'completed',
        transactionId: payment.transaction_id,
        provider: PaymentProvider.BIZUM,
        status: this.mapBizumStatus(payment.status),
        amount: {
          amount: parseFloat(payment.amount),
          currency: payment.currency,
        },
        paymentMethod: PaymentMethod.MOBILE_PAYMENT,
        providerResponse: payment,
        metadata: {
          reference: payment.reference,
          customerPhone: payment.customer?.phone,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get Bizum payment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a Bizum payment
   */
  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const refundData = {
        transaction_id: request.transactionId,
        amount: request.amount?.amount.toFixed(2),
        reason: request.reason || 'customer_request',
        metadata: request.metadata,
      };

      const signature = this.createSignature(refundData);

      const response = await axios.post(
        `${this.apiUrl}/refunds`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.config.apiKey,
            'X-Signature': signature,
          },
          timeout: 30000,
        },
      );

      if (response.data.status === 'completed' || response.data.status === 'pending') {
        return {
          success: true,
          refundId: response.data.refund_id,
          transactionId: request.transactionId,
          amount: {
            amount: parseFloat(response.data.amount),
            currency: response.data.currency,
          },
          status: this.mapBizumStatus(response.data.status),
          reason: request.reason,
          message: 'Refund processed successfully',
        };
      } else {
        return {
          success: false,
          refundId: null,
          transactionId: request.transactionId,
          amount: request.amount,
          status: PaymentStatus.FAILED,
          error: response.data.error_message || 'Refund failed',
        };
      }
    } catch (error) {
      this.logger.error(`Bizum refund failed: ${error.message}`);
      return {
        success: false,
        refundId: null,
        transactionId: request.transactionId,
        amount: request.amount,
        status: PaymentStatus.FAILED,
        error: error.response?.data?.error_message || error.message,
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string): boolean {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());
      const expectedSignature = this.createSignature(data);

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  async parseWebhook(payload: string | Buffer): Promise<WebhookEvent> {
    const data = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString());

    return {
      id: data.transaction_id || data.refund_id,
      type: this.mapWebhookEventType(data.event_type),
      provider: PaymentProvider.BIZUM,
      data,
      timestamp: new Date(data.timestamp || Date.now()),
    };
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(event: WebhookEvent): Promise<void> {
    this.logger.log(`Handling Bizum webhook: ${event.type} for transaction ${event.id}`);

    switch (event.type) {
      case WebhookEventType.PAYMENT_SUCCEEDED:
        await this.handlePaymentSucceeded(event.data);
        break;
      case WebhookEventType.PAYMENT_FAILED:
        await this.handlePaymentFailed(event.data);
        break;
      case WebhookEventType.REFUND_CREATED:
        await this.handleRefundCreated(event.data);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Get provider configuration
   */
  getConfig(): any {
    return {
      provider: PaymentProvider.BIZUM,
      merchantId: this.config.merchantId,
      testMode: this.config.testMode,
      webhookEndpoint: '/webhooks/bizum',
      supportedCurrencies: ['EUR'],
      supportedPaymentMethods: ['mobile_payment'],
      features: ['p2p', 'ecommerce', 'qr_code'],
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // Simple ping to check API availability
      const response = await axios.get(
        `${this.apiUrl}/health`,
        {
          headers: { 'X-API-Key': this.config.apiKey },
          timeout: 10000,
        },
      );

      if (response.status === 200) {
        return { healthy: true, message: 'Bizum API is accessible' };
      } else {
        return { healthy: false, message: 'Bizum API returned unexpected status' };
      }
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  // Private helper methods

  /**
   * Generate unique payment reference
   */
  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `BZ-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Create HMAC signature for Bizum requests
   */
  private createSignature(data: any): string {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map((key) => `${key}=${JSON.stringify(data[key])}`)
      .join('&');

    // Create HMAC SHA-256
    const hmac = crypto.createHmac('sha256', this.config.apiSecret);
    hmac.update(signatureString);

    return hmac.digest('hex');
  }

  /**
   * Map Bizum status to internal status
   */
  private mapBizumStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      authorized: PaymentStatus.PROCESSING,
      completed: PaymentStatus.COMPLETED,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      partially_refunded: PaymentStatus.PARTIALLY_REFUNDED,
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }

  /**
   * Map Bizum event type to internal event type
   */
  private mapWebhookEventType(eventType: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'payment.completed': WebhookEventType.PAYMENT_SUCCEEDED,
      'payment.failed': WebhookEventType.PAYMENT_FAILED,
      'payment.cancelled': WebhookEventType.PAYMENT_FAILED,
      'refund.completed': WebhookEventType.REFUND_CREATED,
      'refund.failed': WebhookEventType.REFUND_UPDATED,
    };

    return eventMap[eventType] || (eventType as any);
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    this.logger.log(`Bizum payment succeeded: ${data.transaction_id}`);
    // Implement business logic (update database, send notifications, etc.)
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    this.logger.log(`Bizum payment failed: ${data.transaction_id}`);
    // Implement business logic
  }

  private async handleRefundCreated(data: any): Promise<void> {
    this.logger.log(`Bizum refund created: ${data.refund_id}`);
    // Implement business logic
  }
}
