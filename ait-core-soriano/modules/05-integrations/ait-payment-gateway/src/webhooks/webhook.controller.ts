/**
 * Webhook Controller
 * Handles webhook events from all payment providers
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentOrchestratorService } from '../services/payment-orchestrator.service';
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';
import { PaymentProvider, WebhookEventType, TransactionType } from '../interfaces/payment.types';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private orchestratorService: PaymentOrchestratorService,
    private reconciliationService: PaymentReconciliationService,
  ) {}

  /**
   * Stripe webhook handler
   */
  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const payload = req.rawBody || req.body;
      const provider = this.orchestratorService.getProvider(PaymentProvider.STRIPE);

      // Verify webhook signature
      const isValid = provider.verifyWebhook(payload, signature);
      if (!isValid) {
        this.logger.warn('Invalid Stripe webhook signature');
        throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
      }

      // Parse webhook event
      const event = await provider.parseWebhook(payload);
      this.logger.log(`Received Stripe webhook: ${event.type}`);

      // Handle webhook
      await provider.handleWebhook(event);

      // Log webhook event
      await this.logWebhookEvent(event);

      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Webhook processing failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Redsys webhook handler
   */
  @Post('redsys')
  @ApiOperation({ summary: 'Handle Redsys webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleRedsysWebhook(@Body() body: any) {
    try {
      const provider = this.orchestratorService.getProvider(PaymentProvider.REDSYS);
      const payload = JSON.stringify(body);

      // Verify webhook signature
      const signature = body.Ds_Signature;
      const isValid = provider.verifyWebhook(payload, signature);
      if (!isValid) {
        this.logger.warn('Invalid Redsys webhook signature');
        throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
      }

      // Parse webhook event
      const event = await provider.parseWebhook(payload);
      this.logger.log(`Received Redsys webhook: ${event.type}`);

      // Handle webhook
      await provider.handleWebhook(event);

      // Log webhook event
      await this.logWebhookEvent(event);

      return { received: true };
    } catch (error) {
      this.logger.error(`Redsys webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Webhook processing failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Bizum webhook handler
   */
  @Post('bizum')
  @ApiOperation({ summary: 'Handle Bizum webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleBizumWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
  ) {
    try {
      const provider = this.orchestratorService.getProvider(PaymentProvider.BIZUM);
      const payload = JSON.stringify(body);

      // Verify webhook signature
      const isValid = provider.verifyWebhook(payload, signature);
      if (!isValid) {
        this.logger.warn('Invalid Bizum webhook signature');
        throw new HttpException('Invalid webhook signature', HttpStatus.BAD_REQUEST);
      }

      // Parse webhook event
      const event = await provider.parseWebhook(payload);
      this.logger.log(`Received Bizum webhook: ${event.type}`);

      // Handle webhook
      await provider.handleWebhook(event);

      // Log webhook event
      await this.logWebhookEvent(event);

      return { received: true };
    } catch (error) {
      this.logger.error(`Bizum webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Webhook processing failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generic webhook test endpoint
   */
  @Post('test')
  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test webhook received' })
  async handleTestWebhook(@Body() body: any) {
    this.logger.log('Received test webhook');
    this.logger.debug('Webhook payload:', body);

    return {
      received: true,
      timestamp: new Date().toISOString(),
      payload: body,
    };
  }

  // Private helper methods

  private async logWebhookEvent(event: any): Promise<void> {
    try {
      // Determine transaction type from event type
      let transactionType = TransactionType.PAYMENT;
      if (event.type.includes('refund')) {
        transactionType = TransactionType.REFUND;
      } else if (event.type.includes('subscription')) {
        transactionType = TransactionType.SUBSCRIPTION;
      }

      // Extract relevant data
      const transactionId = event.id || event.data?.id || 'unknown';
      const customerId = event.data?.customer || event.data?.customer_id || 'unknown';

      // Log the webhook event
      await this.reconciliationService.logTransaction({
        transactionId,
        type: transactionType,
        provider: event.provider,
        status: this.mapEventTypeToStatus(event.type),
        amount: {
          amount: event.data?.amount || 0,
          currency: event.data?.currency || 'EUR',
        },
        customerId,
        metadata: {
          webhookEvent: event.type,
          webhookTimestamp: event.timestamp,
        },
        response: event.data,
      });
    } catch (error) {
      this.logger.error(`Failed to log webhook event: ${error.message}`);
      // Don't throw - webhook logging failure shouldn't fail the webhook
    }
  }

  private mapEventTypeToStatus(eventType: WebhookEventType): any {
    const mapping = {
      [WebhookEventType.PAYMENT_SUCCEEDED]: 'completed',
      [WebhookEventType.PAYMENT_FAILED]: 'failed',
      [WebhookEventType.REFUND_CREATED]: 'refunded',
      [WebhookEventType.REFUND_UPDATED]: 'refunded',
      [WebhookEventType.SUBSCRIPTION_CREATED]: 'active',
      [WebhookEventType.SUBSCRIPTION_UPDATED]: 'active',
      [WebhookEventType.SUBSCRIPTION_CANCELLED]: 'cancelled',
    };

    return mapping[eventType] || 'pending';
  }
}
