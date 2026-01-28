/**
 * Payment Provider Interface
 * Abstract interface that all payment providers must implement
 */

import {
  PaymentResult,
  RefundResult,
  RefundRequest,
  CustomerInfo,
  Subscription,
  SubscriptionPlan,
  WebhookEvent,
  Money,
  PaymentMethod,
} from './payment.types';

export interface CreatePaymentOptions {
  amount: Money;
  customer: CustomerInfo;
  paymentMethod?: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface CreateSubscriptionOptions {
  customer: CustomerInfo;
  plan: SubscriptionPlan;
  paymentMethod?: PaymentMethod;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface IPaymentProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Create a one-time payment
   */
  createPayment(options: CreatePaymentOptions): Promise<PaymentResult>;

  /**
   * Get payment status
   */
  getPaymentStatus(transactionId: string): Promise<PaymentResult>;

  /**
   * Capture a previously authorized payment
   */
  capturePayment?(transactionId: string, amount?: Money): Promise<PaymentResult>;

  /**
   * Cancel/void a payment
   */
  cancelPayment?(transactionId: string): Promise<PaymentResult>;

  /**
   * Refund a payment
   */
  refund(request: RefundRequest): Promise<RefundResult>;

  /**
   * Create a customer
   */
  createCustomer?(customer: CustomerInfo): Promise<{ customerId: string; providerResponse: any }>;

  /**
   * Update a customer
   */
  updateCustomer?(
    customerId: string,
    customer: Partial<CustomerInfo>,
  ): Promise<{ customerId: string; providerResponse: any }>;

  /**
   * Get customer details
   */
  getCustomer?(customerId: string): Promise<CustomerInfo>;

  /**
   * Delete a customer
   */
  deleteCustomer?(customerId: string): Promise<{ success: boolean }>;

  /**
   * Create a subscription
   */
  createSubscription?(options: CreateSubscriptionOptions): Promise<Subscription>;

  /**
   * Update a subscription
   */
  updateSubscription?(
    subscriptionId: string,
    updates: Partial<Subscription>,
  ): Promise<Subscription>;

  /**
   * Cancel a subscription
   */
  cancelSubscription?(subscriptionId: string, immediate?: boolean): Promise<Subscription>;

  /**
   * Get subscription details
   */
  getSubscription?(subscriptionId: string): Promise<Subscription>;

  /**
   * List customer subscriptions
   */
  listSubscriptions?(customerId: string): Promise<Subscription[]>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string | Buffer, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhook(payload: string | Buffer): Promise<WebhookEvent>;

  /**
   * Handle webhook event
   */
  handleWebhook(event: WebhookEvent): Promise<void>;

  /**
   * Get provider-specific configuration
   */
  getConfig(): any;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
