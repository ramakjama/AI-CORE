/**
 * Payment Gateway Types
 * Comprehensive type definitions for multi-provider payment processing
 */

export enum PaymentProvider {
  STRIPE = 'stripe',
  REDSYS = 'redsys',
  BIZUM = 'bizum',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIRECT_DEBIT = 'direct_debit',
  MOBILE_PAYMENT = 'mobile_payment',
  WALLET = 'wallet',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  SUBSCRIPTION = 'subscription',
  PAYOUT = 'payout',
}

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'customer_request',
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  ERROR = 'error',
  OTHER = 'other',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  CANCELLED = 'cancelled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
}

export enum WebhookEventType {
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_CREATED = 'refund.created',
  REFUND_UPDATED = 'refund.updated',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
}

export interface Money {
  amount: number;
  currency: Currency;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CustomerInfo {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, any>;
}

export interface CardInfo {
  number?: string;
  expMonth?: number;
  expYear?: number;
  cvc?: string;
  token?: string;
  last4?: string;
  brand?: string;
}

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  amount: Money;
  status: PaymentStatus;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: Money;
  paymentMethod?: PaymentMethod;
  providerResponse?: any;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RefundRequest {
  transactionId: string;
  amount?: Money;
  reason?: RefundReason;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  transactionId: string;
  amount: Money;
  status: PaymentStatus;
  reason?: RefundReason;
  message?: string;
  error?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: Money;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  provider: PaymentProvider;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  provider: PaymentProvider;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface FraudCheckResult {
  riskScore: number;
  passed: boolean;
  flags: string[];
  recommendations: string[];
}

export interface TransactionLog {
  id: string;
  transactionId: string;
  type: TransactionType;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: Money;
  customerId: string;
  metadata?: Record<string, any>;
  request?: any;
  response?: any;
  error?: string;
  createdAt: Date;
}

export interface ProviderConfig {
  enabled: boolean;
  priority: number;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  webhookSecret?: string;
  testMode?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface PaymentGatewayConfig {
  providers: {
    [PaymentProvider.STRIPE]?: ProviderConfig;
    [PaymentProvider.REDSYS]?: ProviderConfig;
    [PaymentProvider.BIZUM]?: ProviderConfig;
  };
  defaultProvider: PaymentProvider;
  enableFailover: boolean;
  enableFraudDetection: boolean;
  enableReconciliation: boolean;
  webhookEndpoint: string;
}
