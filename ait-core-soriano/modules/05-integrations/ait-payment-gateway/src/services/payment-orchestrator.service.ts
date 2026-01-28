/**
 * Payment Orchestrator Service
 * Multi-provider payment orchestration with automatic failover
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  CreatePaymentOptions,
  CreateSubscriptionOptions,
} from '../interfaces/payment-provider.interface';
import {
  PaymentResult,
  RefundResult,
  RefundRequest,
  PaymentProvider,
  PaymentStatus,
  Subscription,
  CustomerInfo,
} from '../interfaces/payment.types';
import { StripeProvider } from '../providers/stripe/stripe.provider';
import { RedsysProvider } from '../providers/redsys/redsys.provider';
import { BizumProvider } from '../providers/bizum/bizum.provider';

interface ProviderPriority {
  provider: PaymentProvider;
  priority: number;
  enabled: boolean;
}

@Injectable()
export class PaymentOrchestratorService {
  private readonly logger = new Logger(PaymentOrchestratorService.name);
  private providers: Map<PaymentProvider, IPaymentProvider>;
  private providerPriorities: ProviderPriority[];
  private enableFailover: boolean;
  private maxRetries: number;

  constructor(
    private configService: ConfigService,
    private stripeProvider: StripeProvider,
    private redsysProvider: RedsysProvider,
    private bizumProvider: BizumProvider,
  ) {
    this.providers = new Map();
    this.providers.set(PaymentProvider.STRIPE, stripeProvider);
    this.providers.set(PaymentProvider.REDSYS, redsysProvider);
    this.providers.set(PaymentProvider.BIZUM, bizumProvider);

    this.enableFailover = this.configService.get<boolean>('PAYMENT_ENABLE_FAILOVER', true);
    this.maxRetries = this.configService.get<number>('PAYMENT_MAX_RETRIES', 3);

    this.initializeProviderPriorities();
    this.logger.log('Payment Orchestrator initialized with failover support');
  }

  /**
   * Create a payment with automatic provider selection and failover
   */
  async createPayment(
    options: CreatePaymentOptions,
    preferredProvider?: PaymentProvider,
  ): Promise<PaymentResult> {
    const providers = this.getProvidersByPriority(preferredProvider);

    for (const providerName of providers) {
      try {
        const provider = this.providers.get(providerName);
        if (!provider) {
          this.logger.warn(`Provider ${providerName} not found`);
          continue;
        }

        this.logger.log(`Attempting payment with provider: ${providerName}`);
        const result = await provider.createPayment(options);

        if (result.success) {
          this.logger.log(`Payment successful with provider: ${providerName}`);
          return result;
        }

        this.logger.warn(`Payment failed with provider ${providerName}: ${result.error}`);

        // If failover is disabled or this was the last provider, return the result
        if (!this.enableFailover || providers.indexOf(providerName) === providers.length - 1) {
          return result;
        }

        // Continue to next provider
      } catch (error) {
        this.logger.error(`Error with provider ${providerName}: ${error.message}`, error.stack);

        if (!this.enableFailover || providers.indexOf(providerName) === providers.length - 1) {
          return {
            success: false,
            transactionId: null,
            provider: providerName,
            status: PaymentStatus.FAILED,
            amount: options.amount,
            error: error.message,
          };
        }

        // Continue to next provider
      }
    }

    // All providers failed
    return {
      success: false,
      transactionId: null,
      provider: providers[0],
      status: PaymentStatus.FAILED,
      amount: options.amount,
      error: 'All payment providers failed',
    };
  }

  /**
   * Get payment status from specific provider
   */
  async getPaymentStatus(
    transactionId: string,
    provider: PaymentProvider,
  ): Promise<PaymentResult> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider) {
      throw new Error(`Provider ${provider} not found`);
    }

    return paymentProvider.getPaymentStatus(transactionId);
  }

  /**
   * Refund a payment
   */
  async refund(request: RefundRequest, provider: PaymentProvider): Promise<RefundResult> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider) {
      throw new Error(`Provider ${provider} not found`);
    }

    return paymentProvider.refund(request);
  }

  /**
   * Create a customer
   */
  async createCustomer(
    customer: CustomerInfo,
    provider: PaymentProvider,
  ): Promise<{ customerId: string; providerResponse: any }> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.createCustomer) {
      throw new Error(`Provider ${provider} does not support customer creation`);
    }

    return paymentProvider.createCustomer(customer);
  }

  /**
   * Update a customer
   */
  async updateCustomer(
    customerId: string,
    customer: Partial<CustomerInfo>,
    provider: PaymentProvider,
  ): Promise<{ customerId: string; providerResponse: any }> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.updateCustomer) {
      throw new Error(`Provider ${provider} does not support customer updates`);
    }

    return paymentProvider.updateCustomer(customerId, customer);
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string, provider: PaymentProvider): Promise<CustomerInfo> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.getCustomer) {
      throw new Error(`Provider ${provider} does not support customer retrieval`);
    }

    return paymentProvider.getCustomer(customerId);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(
    customerId: string,
    provider: PaymentProvider,
  ): Promise<{ success: boolean }> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.deleteCustomer) {
      throw new Error(`Provider ${provider} does not support customer deletion`);
    }

    return paymentProvider.deleteCustomer(customerId);
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    options: CreateSubscriptionOptions,
    provider: PaymentProvider,
  ): Promise<Subscription> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.createSubscription) {
      throw new Error(`Provider ${provider} does not support subscriptions`);
    }

    return paymentProvider.createSubscription(options);
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>,
    provider: PaymentProvider,
  ): Promise<Subscription> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.updateSubscription) {
      throw new Error(`Provider ${provider} does not support subscription updates`);
    }

    return paymentProvider.updateSubscription(subscriptionId, updates);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    provider: PaymentProvider,
    immediate = false,
  ): Promise<Subscription> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.cancelSubscription) {
      throw new Error(`Provider ${provider} does not support subscription cancellation`);
    }

    return paymentProvider.cancelSubscription(subscriptionId, immediate);
  }

  /**
   * Get subscription details
   */
  async getSubscription(
    subscriptionId: string,
    provider: PaymentProvider,
  ): Promise<Subscription> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.getSubscription) {
      throw new Error(`Provider ${provider} does not support subscription retrieval`);
    }

    return paymentProvider.getSubscription(subscriptionId);
  }

  /**
   * List customer subscriptions
   */
  async listSubscriptions(customerId: string, provider: PaymentProvider): Promise<Subscription[]> {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider || !paymentProvider.listSubscriptions) {
      throw new Error(`Provider ${provider} does not support subscription listing`);
    }

    return paymentProvider.listSubscriptions(customerId);
  }

  /**
   * Get provider by name
   */
  getProvider(provider: PaymentProvider): IPaymentProvider {
    const paymentProvider = this.providers.get(provider);
    if (!paymentProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    return paymentProvider;
  }

  /**
   * Get all available providers
   */
  getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Health check for all providers
   */
  async healthCheckAll(): Promise<Record<string, { healthy: boolean; message?: string }>> {
    const results: Record<string, { healthy: boolean; message?: string }> = {};

    for (const [providerName, provider] of this.providers) {
      try {
        results[providerName] = await provider.healthCheck();
      } catch (error) {
        results[providerName] = {
          healthy: false,
          message: error.message,
        };
      }
    }

    return results;
  }

  /**
   * Update provider priority
   */
  updateProviderPriority(provider: PaymentProvider, priority: number, enabled: boolean): void {
    const providerPriority = this.providerPriorities.find((p) => p.provider === provider);
    if (providerPriority) {
      providerPriority.priority = priority;
      providerPriority.enabled = enabled;
      this.sortProviderPriorities();
      this.logger.log(`Updated priority for ${provider}: ${priority} (enabled: ${enabled})`);
    }
  }

  // Private helper methods

  private initializeProviderPriorities(): void {
    this.providerPriorities = [
      {
        provider: PaymentProvider.STRIPE,
        priority: this.configService.get<number>('STRIPE_PRIORITY', 1),
        enabled: this.configService.get<boolean>('STRIPE_ENABLED', true),
      },
      {
        provider: PaymentProvider.REDSYS,
        priority: this.configService.get<number>('REDSYS_PRIORITY', 2),
        enabled: this.configService.get<boolean>('REDSYS_ENABLED', true),
      },
      {
        provider: PaymentProvider.BIZUM,
        priority: this.configService.get<number>('BIZUM_PRIORITY', 3),
        enabled: this.configService.get<boolean>('BIZUM_ENABLED', true),
      },
    ];

    this.sortProviderPriorities();
  }

  private sortProviderPriorities(): void {
    this.providerPriorities.sort((a, b) => a.priority - b.priority);
  }

  private getProvidersByPriority(preferredProvider?: PaymentProvider): PaymentProvider[] {
    // If preferred provider is specified and enabled, use it first
    if (preferredProvider) {
      const preferred = this.providerPriorities.find(
        (p) => p.provider === preferredProvider && p.enabled,
      );
      if (preferred) {
        const others = this.providerPriorities
          .filter((p) => p.provider !== preferredProvider && p.enabled)
          .map((p) => p.provider);
        return [preferredProvider, ...others];
      }
    }

    // Otherwise, use priority order
    return this.providerPriorities.filter((p) => p.enabled).map((p) => p.provider);
  }
}
