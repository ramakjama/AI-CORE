# AIT Payment Gateway - Integration Guide

Complete guide for integrating the Payment Gateway with other AIT Core modules.

## Table of Contents

1. [Integration with AIT Policy Manager](#integration-with-ait-policy-manager)
2. [Integration with AIT Claim Processor](#integration-with-ait-claim-processor)
3. [Integration with AIT Treasury](#integration-with-ait-treasury)
4. [Custom Integration Examples](#custom-integration-examples)
5. [Event-Driven Integration](#event-driven-integration)

---

## Integration with AIT Policy Manager

### Use Case: Premium Payments

Process insurance premium payments when policies are created or renewed.

```typescript
import {
  PaymentOrchestratorService,
  Currency,
  PaymentProvider
} from '@ait-core/payment-gateway';

@Injectable()
export class PolicyPaymentService {
  constructor(
    private paymentOrchestrator: PaymentOrchestratorService,
    private policyManager: PolicyManagerService,
  ) {}

  /**
   * Process premium payment for a policy
   */
  async payPremium(policyId: string, customerId: string): Promise<PaymentResult> {
    // Get policy details
    const policy = await this.policyManager.getPolicy(policyId);
    const customer = await this.policyManager.getCustomer(customerId);

    // Calculate premium amount
    const premiumAmount = policy.premiumAmount;

    // Create payment
    const paymentResult = await this.paymentOrchestrator.createPayment({
      amount: {
        amount: premiumAmount,
        currency: Currency.EUR,
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: customer.billingAddress,
      },
      description: `Premium payment for policy ${policy.policyNumber}`,
      metadata: {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        type: 'premium',
        period: policy.currentPeriod,
      },
      returnUrl: `${process.env.APP_URL}/policies/${policyId}/payment/success`,
      cancelUrl: `${process.env.APP_URL}/policies/${policyId}/payment/cancel`,
    });

    // Update policy payment status
    if (paymentResult.success) {
      await this.policyManager.recordPremiumPayment({
        policyId,
        transactionId: paymentResult.transactionId,
        amount: premiumAmount,
        provider: paymentResult.provider,
        paidAt: new Date(),
      });
    }

    return paymentResult;
  }

  /**
   * Set up recurring premium payments
   */
  async setupRecurringPremium(policyId: string, customerId: string): Promise<Subscription> {
    const policy = await this.policyManager.getPolicy(policyId);
    const customer = await this.policyManager.getCustomer(customerId);

    // Create subscription for recurring payments
    const subscription = await this.paymentOrchestrator.createSubscription(
      {
        customer: {
          id: customer.id,
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
        },
        plan: {
          id: `policy_${policyId}`,
          name: `Premium for Policy ${policy.policyNumber}`,
          amount: {
            amount: policy.premiumAmount,
            currency: Currency.EUR,
          },
          interval: policy.billingInterval, // 'month', 'year', etc.
          intervalCount: 1,
        },
        metadata: {
          policyId: policy.id,
          policyNumber: policy.policyNumber,
        },
      },
      PaymentProvider.STRIPE, // Use Stripe for subscriptions
    );

    // Link subscription to policy
    await this.policyManager.updatePolicy(policyId, {
      subscriptionId: subscription.id,
      subscriptionProvider: subscription.provider,
    });

    return subscription;
  }

  /**
   * Handle premium payment webhook
   */
  async handlePremiumPaymentWebhook(event: WebhookEvent): Promise<void> {
    if (event.type === WebhookEventType.PAYMENT_SUCCEEDED) {
      const metadata = event.data.metadata;

      if (metadata?.type === 'premium') {
        await this.policyManager.markPremiumAsPaid({
          policyId: metadata.policyId,
          transactionId: event.id,
          paidAt: event.timestamp,
        });

        // Update policy status if needed
        await this.policyManager.activatePolicy(metadata.policyId);
      }
    }
  }
}
```

---

## Integration with AIT Claim Processor

### Use Case: Claim Settlements

Process claim settlement payments to customers.

```typescript
import {
  PaymentOrchestratorService,
  Currency,
  TransactionType
} from '@ait-core/payment-gateway';

@Injectable()
export class ClaimPaymentService {
  constructor(
    private paymentOrchestrator: PaymentOrchestratorService,
    private claimProcessor: ClaimProcessorService,
  ) {}

  /**
   * Process claim settlement payment
   */
  async settleClaimPayment(claimId: string): Promise<PaymentResult> {
    // Get claim details
    const claim = await this.claimProcessor.getClaim(claimId);

    if (claim.status !== 'approved') {
      throw new Error('Claim must be approved before settlement');
    }

    const customer = await this.claimProcessor.getClaimant(claim.claimantId);

    // Create payout payment
    const paymentResult = await this.paymentOrchestrator.createPayment({
      amount: {
        amount: claim.approvedAmount,
        currency: Currency.EUR,
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.fullName,
        phone: customer.phone,
      },
      description: `Claim settlement for ${claim.claimNumber}`,
      metadata: {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        policyId: claim.policyId,
        type: 'settlement',
        incidentDate: claim.incidentDate,
      },
    });

    // Update claim with settlement information
    if (paymentResult.success) {
      await this.claimProcessor.recordSettlement({
        claimId,
        transactionId: paymentResult.transactionId,
        amount: claim.approvedAmount,
        provider: paymentResult.provider,
        settledAt: new Date(),
        status: 'settled',
      });

      // Send notification to claimant
      await this.notificationService.sendClaimSettlementConfirmation({
        claimId,
        customerId: customer.id,
        amount: claim.approvedAmount,
      });
    }

    return paymentResult;
  }

  /**
   * Process partial claim payment
   */
  async processPartialPayment(
    claimId: string,
    amount: number,
    reason: string,
  ): Promise<PaymentResult> {
    const claim = await this.claimProcessor.getClaim(claimId);
    const customer = await this.claimProcessor.getClaimant(claim.claimantId);

    const paymentResult = await this.paymentOrchestrator.createPayment({
      amount: {
        amount,
        currency: Currency.EUR,
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.fullName,
      },
      description: `Partial payment for claim ${claim.claimNumber} - ${reason}`,
      metadata: {
        claimId: claim.id,
        type: 'partial_settlement',
        reason,
      },
    });

    if (paymentResult.success) {
      await this.claimProcessor.recordPartialPayment({
        claimId,
        transactionId: paymentResult.transactionId,
        amount,
        reason,
      });
    }

    return paymentResult;
  }

  /**
   * Refund claim overpayment
   */
  async refundClaimOverpayment(
    claimId: string,
    originalTransactionId: string,
    refundAmount: number,
  ): Promise<RefundResult> {
    const claim = await this.claimProcessor.getClaim(claimId);

    const refundResult = await this.paymentOrchestrator.refund(
      {
        transactionId: originalTransactionId,
        amount: {
          amount: refundAmount,
          currency: Currency.EUR,
        },
        reason: 'error',
        metadata: {
          claimId: claim.id,
          type: 'claim_overpayment_correction',
        },
      },
      claim.settlementProvider,
    );

    if (refundResult.success) {
      await this.claimProcessor.recordRefund({
        claimId,
        refundId: refundResult.refundId,
        amount: refundAmount,
        reason: 'Overpayment correction',
      });
    }

    return refundResult;
  }
}
```

---

## Integration with AIT Treasury

### Use Case: Cash Management & Reconciliation

Integrate payment data with treasury and cash management systems.

```typescript
import {
  PaymentReconciliationService,
  PaymentProvider,
} from '@ait-core/payment-gateway';

@Injectable()
export class TreasuryIntegrationService {
  constructor(
    private reconciliationService: PaymentReconciliationService,
    private treasuryService: TreasuryService,
  ) {}

  /**
   * Sync payment data with treasury system
   */
  async syncPaymentsToTreasury(startDate: Date, endDate: Date): Promise<void> {
    // Get payment statistics
    const stats = this.reconciliationService.getPaymentStatistics(startDate, endDate);

    // Export data for each provider
    for (const provider of Object.keys(stats.byProvider)) {
      const exportData = this.reconciliationService.exportReconciliationData(
        provider as PaymentProvider,
        startDate,
        endDate,
      );

      // Send to treasury system
      await this.treasuryService.importPaymentData({
        provider,
        period: { startDate, endDate },
        transactions: exportData.transactions,
        summary: exportData.summary,
      });
    }
  }

  /**
   * Daily cash reconciliation
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async performDailyCashReconciliation(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run reconciliation for all providers
    const reports = await this.reconciliationService.reconcileAll(yesterday, today);

    // Send reports to treasury
    for (const report of reports) {
      await this.treasuryService.recordReconciliationReport({
        date: report.date,
        provider: report.provider,
        totalTransactions: report.totalTransactions,
        successfulTransactions: report.successfulTransactions,
        totalAmount: report.totalAmount,
        discrepancies: report.discrepancies,
      });

      // Alert on discrepancies
      if (report.discrepancies.length > 0) {
        await this.alertService.sendReconciliationAlert({
          provider: report.provider,
          discrepancyCount: report.discrepancies.length,
          highSeverityCount: report.discrepancies.filter(d => d.severity === 'high').length,
        });
      }
    }
  }

  /**
   * Generate financial reports
   */
  async generateFinancialReport(month: number, year: number): Promise<FinancialReport> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const stats = this.reconciliationService.getPaymentStatistics(startDate, endDate);

    return {
      period: { month, year },
      totalRevenue: stats.totalAmount,
      paymentsByProvider: stats.byProvider,
      successRate: (stats.successfulPayments / stats.totalPayments) * 100,
      failureRate: (stats.failedPayments / stats.totalPayments) * 100,
      transactions: {
        total: stats.totalPayments,
        successful: stats.successfulPayments,
        failed: stats.failedPayments,
      },
    };
  }
}
```

---

## Custom Integration Examples

### Example 1: Multi-Policy Bundle Payment

```typescript
async payMultiPolicyBundle(
  customerId: string,
  policyIds: string[],
): Promise<PaymentResult> {
  // Calculate total amount
  const policies = await Promise.all(
    policyIds.map(id => this.policyManager.getPolicy(id))
  );

  const totalAmount = policies.reduce((sum, p) => sum + p.premiumAmount, 0);
  const customer = await this.policyManager.getCustomer(customerId);

  // Create single payment for multiple policies
  const paymentResult = await this.paymentOrchestrator.createPayment({
    amount: {
      amount: totalAmount,
      currency: Currency.EUR,
    },
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.fullName,
    },
    description: `Bundle payment for ${policyIds.length} policies`,
    metadata: {
      type: 'bundle',
      policyIds,
      policyCount: policyIds.length,
    },
  });

  // Update all policies if successful
  if (paymentResult.success) {
    await Promise.all(
      policyIds.map(policyId =>
        this.policyManager.recordPremiumPayment({
          policyId,
          transactionId: paymentResult.transactionId,
          amount: totalAmount / policyIds.length, // Split evenly
          bundlePayment: true,
        })
      )
    );
  }

  return paymentResult;
}
```

### Example 2: Installment Payment Plan

```typescript
async setupInstallmentPlan(
  policyId: string,
  totalAmount: number,
  installments: number,
): Promise<InstallmentPlan> {
  const installmentAmount = totalAmount / installments;
  const customer = await this.getCustomer(policyId);

  // Create subscription for installments
  const subscription = await this.paymentOrchestrator.createSubscription(
    {
      customer,
      plan: {
        id: `installment_${policyId}`,
        name: `Installment Plan - Policy ${policyId}`,
        amount: {
          amount: installmentAmount,
          currency: Currency.EUR,
        },
        interval: 'month',
        intervalCount: 1,
      },
      metadata: {
        policyId,
        installmentPlan: true,
        totalInstallments: installments,
        currentInstallment: 1,
      },
    },
    PaymentProvider.STRIPE,
  );

  return {
    subscriptionId: subscription.id,
    totalAmount,
    installmentAmount,
    installments,
    nextPaymentDate: subscription.currentPeriodEnd,
  };
}
```

### Example 3: Split Payment (Multiple Recipients)

```typescript
async processSplitPayment(
  claimId: string,
  recipients: { customerId: string; percentage: number }[],
): Promise<PaymentResult[]> {
  const claim = await this.claimProcessor.getClaim(claimId);
  const totalAmount = claim.approvedAmount;

  const results = await Promise.all(
    recipients.map(async recipient => {
      const amount = (totalAmount * recipient.percentage) / 100;
      const customer = await this.getCustomer(recipient.customerId);

      return this.paymentOrchestrator.createPayment({
        amount: { amount, currency: Currency.EUR },
        customer,
        description: `Split payment from claim ${claim.claimNumber}`,
        metadata: {
          claimId: claim.id,
          splitPayment: true,
          percentage: recipient.percentage,
        },
      });
    })
  );

  return results;
}
```

---

## Event-Driven Integration

### Setting Up Event Listeners

```typescript
import { OnEvent } from '@nestjs/event-emitter';
import { WebhookEventType } from '@ait-core/payment-gateway';

@Injectable()
export class PaymentEventListener {
  @OnEvent('payment.succeeded')
  async handlePaymentSucceeded(event: PaymentEvent) {
    console.log('Payment succeeded:', event.transactionId);

    // Update related records
    if (event.metadata?.policyId) {
      await this.policyManager.markPremiumAsPaid(event.metadata.policyId);
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentEvent) {
    console.log('Payment failed:', event.transactionId);

    // Send notification to customer
    await this.notificationService.sendPaymentFailedNotification(
      event.customerId,
      event.error,
    );
  }

  @OnEvent('refund.created')
  async handleRefundCreated(event: RefundEvent) {
    console.log('Refund created:', event.refundId);

    // Update claim or policy records
    if (event.metadata?.claimId) {
      await this.claimProcessor.recordRefund(event.metadata.claimId, event.refundId);
    }
  }

  @OnEvent('subscription.cancelled')
  async handleSubscriptionCancelled(event: SubscriptionEvent) {
    console.log('Subscription cancelled:', event.subscriptionId);

    // Update policy status
    await this.policyManager.handleSubscriptionCancellation(
      event.metadata?.policyId,
      event.cancelledAt,
    );
  }
}
```

---

## Best Practices

### 1. Idempotency

Always include idempotency keys for critical operations:

```typescript
const paymentResult = await this.paymentOrchestrator.createPayment({
  ...paymentData,
  metadata: {
    ...paymentData.metadata,
    idempotencyKey: `premium_${policyId}_${Date.now()}`,
  },
});
```

### 2. Error Handling

```typescript
try {
  const result = await this.paymentOrchestrator.createPayment(paymentData);

  if (!result.success) {
    // Handle payment failure
    await this.handlePaymentFailure(result);
  }
} catch (error) {
  // Handle system error
  this.logger.error('Payment system error:', error);
  await this.notifyAdmin(error);
  throw error;
}
```

### 3. Retry Logic

```typescript
async createPaymentWithRetry(
  paymentData: CreatePaymentOptions,
  maxRetries = 3,
): Promise<PaymentResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.paymentOrchestrator.createPayment(paymentData);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await this.delay(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### 4. Webhook Handling

```typescript
@Post('webhooks/payment')
async handleWebhook(@Body() body: any, @Headers('signature') signature: string) {
  // Always verify signature first
  const isValid = await this.verifyWebhookSignature(body, signature);
  if (!isValid) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  // Process webhook asynchronously
  await this.queue.add('process-webhook', body);

  // Return immediately
  return { received: true };
}
```

---

## Troubleshooting

### Common Integration Issues

1. **Webhook not received**: Check firewall, verify URL configuration
2. **Payment status mismatch**: Implement reconciliation checks
3. **Duplicate payments**: Use idempotency keys
4. **Refund failures**: Verify original transaction exists and is refundable

---

## Support

For integration support:
- Technical Docs: https://docs.ait-core.com/payment-gateway
- Integration Examples: https://github.com/ait-core/examples
- Support Email: integration@ait-core.com
