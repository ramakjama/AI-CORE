/**
 * Stripe Payment Provider
 * Complete implementation for Stripe payment processing
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  IPaymentProvider,
  CreatePaymentOptions,
  CreateSubscriptionOptions,
} from '../../interfaces/payment-provider.interface';
import {
  PaymentResult,
  RefundResult,
  RefundRequest,
  CustomerInfo,
  Subscription,
  SubscriptionPlan,
  WebhookEvent,
  PaymentProvider,
  PaymentStatus,
  Money,
  WebhookEventType,
  SubscriptionStatus,
} from '../../interfaces/payment.types';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private stripe: Stripe;
  private webhookSecret: string;

  readonly name = PaymentProvider.STRIPE;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!apiKey) {
      throw new Error('Stripe API key not configured');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.webhookSecret = webhookSecret;
    this.logger.log('Stripe provider initialized');
  }

  /**
   * Create a one-time payment
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentResult> {
    try {
      this.logger.log(`Creating Stripe payment for ${options.amount.amount} ${options.amount.currency}`);

      // Create or retrieve customer
      let customerId: string;
      if (options.customer.id) {
        customerId = options.customer.id;
      } else {
        const customer = await this.stripe.customers.create({
          email: options.customer.email,
          name: options.customer.name,
          phone: options.customer.phone,
          metadata: options.customer.metadata,
        });
        customerId = customer.id;
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(options.amount.amount * 100), // Convert to cents
        currency: options.amount.currency.toLowerCase(),
        customer: customerId,
        description: options.description,
        metadata: options.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: options.amount,
        providerResponse: paymentIntent,
        message: 'Payment intent created successfully',
        metadata: {
          clientSecret: paymentIntent.client_secret,
          customerId,
        },
      };
    } catch (error) {
      this.logger.error(`Stripe payment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        transactionId: null,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.FAILED,
        amount: options.amount,
        error: error.message,
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase() as any,
        },
        providerResponse: paymentIntent,
      };
    } catch (error) {
      this.logger.error(`Failed to get payment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Capture a previously authorized payment
   */
  async capturePayment(transactionId: string, amount?: Money): Promise<PaymentResult> {
    try {
      const captureAmount = amount ? Math.round(amount.amount * 100) : undefined;

      const paymentIntent = await this.stripe.paymentIntents.capture(transactionId, {
        amount_to_capture: captureAmount,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase() as any,
        },
        providerResponse: paymentIntent,
        message: 'Payment captured successfully',
      };
    } catch (error) {
      this.logger.error(`Payment capture failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel/void a payment
   */
  async cancelPayment(transactionId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(transactionId);

      return {
        success: true,
        transactionId: paymentIntent.id,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.CANCELLED,
        amount: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase() as any,
        },
        providerResponse: paymentIntent,
        message: 'Payment cancelled successfully',
      };
    } catch (error) {
      this.logger.error(`Payment cancellation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refund(request: RefundRequest): Promise<RefundResult> {
    try {
      const refundAmount = request.amount ? Math.round(request.amount.amount * 100) : undefined;

      const refund = await this.stripe.refunds.create({
        payment_intent: request.transactionId,
        amount: refundAmount,
        reason: this.mapRefundReason(request.reason),
        metadata: request.metadata,
      });

      return {
        success: true,
        refundId: refund.id,
        transactionId: request.transactionId,
        amount: {
          amount: refund.amount / 100,
          currency: refund.currency.toUpperCase() as any,
        },
        status: this.mapRefundStatus(refund.status),
        reason: request.reason,
        message: 'Refund created successfully',
      };
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`);
      return {
        success: false,
        refundId: null,
        transactionId: request.transactionId,
        amount: request.amount,
        status: PaymentStatus.FAILED,
        error: error.message,
      };
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(
    customer: CustomerInfo,
  ): Promise<{ customerId: string; providerResponse: any }> {
    try {
      const stripeCustomer = await this.stripe.customers.create({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        metadata: customer.metadata,
      });

      return {
        customerId: stripeCustomer.id,
        providerResponse: stripeCustomer,
      };
    } catch (error) {
      this.logger.error(`Customer creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: string,
    customer: Partial<CustomerInfo>,
  ): Promise<{ customerId: string; providerResponse: any }> {
    try {
      const stripeCustomer = await this.stripe.customers.update(customerId, {
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        metadata: customer.metadata,
      });

      return {
        customerId: stripeCustomer.id,
        providerResponse: stripeCustomer,
      };
    } catch (error) {
      this.logger.error(`Customer update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<CustomerInfo> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address as any,
        metadata: customer.metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<{ success: boolean }> {
    try {
      await this.stripe.customers.del(customerId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Customer deletion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(options: CreateSubscriptionOptions): Promise<Subscription> {
    try {
      // Create or retrieve customer
      let customerId: string;
      if (options.customer.id) {
        customerId = options.customer.id;
      } else {
        const customer = await this.createCustomer(options.customer);
        customerId = customer.customerId;
      }

      // Create or retrieve price
      const price = await this.stripe.prices.create({
        currency: options.plan.amount.currency.toLowerCase(),
        unit_amount: Math.round(options.plan.amount.amount * 100),
        recurring: {
          interval: options.plan.interval,
          interval_count: options.plan.intervalCount,
        },
        product_data: {
          name: options.plan.name,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        trial_period_days: options.trialDays,
        metadata: options.metadata,
      });

      return this.mapSubscription(subscription);
    } catch (error) {
      this.logger.error(`Subscription creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>,
  ): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        metadata: updates.metadata,
        cancel_at: updates.cancelAt ? Math.floor(updates.cancelAt.getTime() / 1000) : undefined,
      });

      return this.mapSubscription(subscription);
    } catch (error) {
      this.logger.error(`Subscription update failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, immediate = false): Promise<Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (immediate) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return this.mapSubscription(subscription);
    } catch (error) {
      this.logger.error(`Subscription cancellation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return this.mapSubscription(subscription);
    } catch (error) {
      this.logger.error(`Failed to get subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * List customer subscriptions
   */
  async listSubscriptions(customerId: string): Promise<Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
      });

      return subscriptions.data.map((sub) => this.mapSubscription(sub));
    } catch (error) {
      this.logger.error(`Failed to list subscriptions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return true;
    } catch (error) {
      this.logger.error(`Webhook verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse webhook event
   */
  async parseWebhook(payload: string | Buffer): Promise<WebhookEvent> {
    const event = JSON.parse(payload.toString());

    return {
      id: event.id,
      type: this.mapWebhookEventType(event.type),
      provider: PaymentProvider.STRIPE,
      data: event.data.object,
      timestamp: new Date(event.created * 1000),
    };
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(event: WebhookEvent): Promise<void> {
    this.logger.log(`Handling Stripe webhook: ${event.type}`);

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
      case WebhookEventType.SUBSCRIPTION_CREATED:
      case WebhookEventType.SUBSCRIPTION_UPDATED:
      case WebhookEventType.SUBSCRIPTION_CANCELLED:
        await this.handleSubscriptionEvent(event.data);
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
      provider: PaymentProvider.STRIPE,
      webhookEndpoint: '/webhooks/stripe',
      supportedCurrencies: ['EUR', 'USD', 'GBP'],
      supportedPaymentMethods: ['card', 'bank_transfer', 'wallet'],
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.stripe.customers.list({ limit: 1 });
      return { healthy: true, message: 'Stripe API is accessible' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  // Private helper methods

  private mapStripeStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.COMPLETED,
      canceled: PaymentStatus.CANCELLED,
      requires_capture: PaymentStatus.PENDING,
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }

  private mapRefundStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.REFUNDED,
      failed: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }

  private mapRefundReason(reason?: string): Stripe.RefundCreateParams.Reason {
    const reasonMap: Record<string, Stripe.RefundCreateParams.Reason> = {
      customer_request: 'requested_by_customer',
      duplicate: 'duplicate',
      fraudulent: 'fraudulent',
    };

    return reasonMap[reason] || 'requested_by_customer';
  }

  private mapSubscription(subscription: Stripe.Subscription): Subscription {
    return {
      id: subscription.id,
      provider: PaymentProvider.STRIPE,
      customerId: subscription.customer as string,
      planId: subscription.items.data[0]?.price.id,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : undefined,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata,
      createdAt: new Date(subscription.created * 1000),
      updatedAt: new Date(),
    };
  }

  private mapSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.UNPAID,
      canceled: SubscriptionStatus.CANCELLED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIALING,
    };

    return statusMap[status] || SubscriptionStatus.CANCELLED;
  }

  private mapWebhookEventType(stripeEventType: string): WebhookEventType {
    const eventMap: Record<string, WebhookEventType> = {
      'payment_intent.succeeded': WebhookEventType.PAYMENT_SUCCEEDED,
      'payment_intent.payment_failed': WebhookEventType.PAYMENT_FAILED,
      'charge.refunded': WebhookEventType.REFUND_CREATED,
      'customer.subscription.created': WebhookEventType.SUBSCRIPTION_CREATED,
      'customer.subscription.updated': WebhookEventType.SUBSCRIPTION_UPDATED,
      'customer.subscription.deleted': WebhookEventType.SUBSCRIPTION_CANCELLED,
      'customer.created': WebhookEventType.CUSTOMER_CREATED,
      'customer.updated': WebhookEventType.CUSTOMER_UPDATED,
    };

    return eventMap[stripeEventType] || (stripeEventType as any);
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    this.logger.log(`Payment succeeded: ${data.id}`);
    // Implement business logic (update database, send notifications, etc.)
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    this.logger.log(`Payment failed: ${data.id}`);
    // Implement business logic
  }

  private async handleRefundCreated(data: any): Promise<void> {
    this.logger.log(`Refund created: ${data.id}`);
    // Implement business logic
  }

  private async handleSubscriptionEvent(data: any): Promise<void> {
    this.logger.log(`Subscription event: ${data.id}`);
    // Implement business logic
  }
}
