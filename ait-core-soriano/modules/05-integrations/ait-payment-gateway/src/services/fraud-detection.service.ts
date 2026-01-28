/**
 * Fraud Detection Service
 * Basic fraud detection for payment transactions
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FraudCheckResult,
  CustomerInfo,
  Money,
  PaymentMethod,
} from '../interfaces/payment.types';

interface FraudRule {
  name: string;
  weight: number;
  check: (context: FraudCheckContext) => boolean;
  message: string;
}

interface FraudCheckContext {
  customer: CustomerInfo;
  amount: Money;
  paymentMethod?: PaymentMethod;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  timestamp: Date;
}

interface TransactionHistory {
  customerId: string;
  count: number;
  totalAmount: number;
  lastTransaction: Date;
  failedAttempts: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);
  private fraudRules: FraudRule[];
  private transactionHistory: Map<string, TransactionHistory>;
  private blacklistedIPs: Set<string>;
  private blacklistedEmails: Set<string>;
  private maxRiskScore: number;

  constructor(private configService: ConfigService) {
    this.transactionHistory = new Map();
    this.blacklistedIPs = new Set();
    this.blacklistedEmails = new Set();
    this.maxRiskScore = this.configService.get<number>('FRAUD_MAX_RISK_SCORE', 70);

    this.initializeFraudRules();
    this.logger.log('Fraud Detection Service initialized');
  }

  /**
   * Perform fraud check on payment
   */
  async checkPayment(context: FraudCheckContext): Promise<FraudCheckResult> {
    this.logger.log(`Performing fraud check for customer: ${context.customer.email}`);

    const flags: string[] = [];
    let riskScore = 0;

    // Run all fraud rules
    for (const rule of this.fraudRules) {
      try {
        if (rule.check(context)) {
          riskScore += rule.weight;
          flags.push(rule.message);
          this.logger.warn(`Fraud rule triggered: ${rule.name}`);
        }
      } catch (error) {
        this.logger.error(`Error checking fraud rule ${rule.name}: ${error.message}`);
      }
    }

    // Normalize risk score (0-100)
    riskScore = Math.min(100, riskScore);

    const passed = riskScore < this.maxRiskScore;
    const recommendations = this.getRecommendations(riskScore, flags);

    const result: FraudCheckResult = {
      riskScore,
      passed,
      flags,
      recommendations,
    };

    this.logger.log(
      `Fraud check completed: Score=${riskScore}, Passed=${passed}, Flags=${flags.length}`,
    );

    return result;
  }

  /**
   * Record transaction for fraud analysis
   */
  recordTransaction(
    customerId: string,
    amount: number,
    success: boolean,
  ): void {
    let history = this.transactionHistory.get(customerId);

    if (!history) {
      history = {
        customerId,
        count: 0,
        totalAmount: 0,
        lastTransaction: new Date(),
        failedAttempts: 0,
      };
      this.transactionHistory.set(customerId, history);
    }

    history.count++;
    history.totalAmount += amount;
    history.lastTransaction = new Date();

    if (!success) {
      history.failedAttempts++;
    } else {
      // Reset failed attempts on success
      history.failedAttempts = 0;
    }
  }

  /**
   * Add IP to blacklist
   */
  blacklistIP(ip: string): void {
    this.blacklistedIPs.add(ip);
    this.logger.warn(`IP blacklisted: ${ip}`);
  }

  /**
   * Remove IP from blacklist
   */
  whitelistIP(ip: string): void {
    this.blacklistedIPs.delete(ip);
    this.logger.log(`IP whitelisted: ${ip}`);
  }

  /**
   * Add email to blacklist
   */
  blacklistEmail(email: string): void {
    this.blacklistedEmails.add(email.toLowerCase());
    this.logger.warn(`Email blacklisted: ${email}`);
  }

  /**
   * Remove email from blacklist
   */
  whitelistEmail(email: string): void {
    this.blacklistedEmails.delete(email.toLowerCase());
    this.logger.log(`Email whitelisted: ${email}`);
  }

  /**
   * Get customer transaction history
   */
  getCustomerHistory(customerId: string): TransactionHistory | undefined {
    return this.transactionHistory.get(customerId);
  }

  /**
   * Clear transaction history (for testing)
   */
  clearHistory(): void {
    this.transactionHistory.clear();
    this.logger.log('Transaction history cleared');
  }

  // Private helper methods

  private initializeFraudRules(): void {
    this.fraudRules = [
      // Blacklist checks
      {
        name: 'blacklisted_ip',
        weight: 100,
        check: (ctx) => !!(ctx.ipAddress && this.blacklistedIPs.has(ctx.ipAddress)),
        message: 'IP address is blacklisted',
      },
      {
        name: 'blacklisted_email',
        weight: 100,
        check: (ctx) => this.blacklistedEmails.has(ctx.customer.email.toLowerCase()),
        message: 'Email address is blacklisted',
      },

      // Amount checks
      {
        name: 'high_amount',
        weight: 30,
        check: (ctx) => ctx.amount.amount > 10000,
        message: 'Unusually high transaction amount',
      },
      {
        name: 'very_high_amount',
        weight: 50,
        check: (ctx) => ctx.amount.amount > 50000,
        message: 'Extremely high transaction amount',
      },

      // Velocity checks
      {
        name: 'rapid_transactions',
        weight: 40,
        check: (ctx) => {
          const history = this.transactionHistory.get(ctx.customer.id || ctx.customer.email);
          if (!history) return false;

          const timeSinceLastTransaction =
            ctx.timestamp.getTime() - history.lastTransaction.getTime();
          const minutesSinceLastTransaction = timeSinceLastTransaction / 1000 / 60;

          return minutesSinceLastTransaction < 1; // Less than 1 minute
        },
        message: 'Multiple transactions in short time period',
      },
      {
        name: 'high_transaction_count',
        weight: 30,
        check: (ctx) => {
          const history = this.transactionHistory.get(ctx.customer.id || ctx.customer.email);
          if (!history) return false;

          const timeSinceLastTransaction =
            ctx.timestamp.getTime() - history.lastTransaction.getTime();
          const hoursSinceLastTransaction = timeSinceLastTransaction / 1000 / 60 / 60;

          return history.count > 10 && hoursSinceLastTransaction < 1; // More than 10 in 1 hour
        },
        message: 'High number of transactions in short period',
      },

      // Failed attempts
      {
        name: 'multiple_failed_attempts',
        weight: 50,
        check: (ctx) => {
          const history = this.transactionHistory.get(ctx.customer.id || ctx.customer.email);
          return !!(history && history.failedAttempts > 3);
        },
        message: 'Multiple failed payment attempts',
      },

      // Data validation
      {
        name: 'missing_customer_info',
        weight: 20,
        check: (ctx) =>
          !ctx.customer.name ||
          !ctx.customer.email ||
          ctx.customer.name.length < 3 ||
          !this.isValidEmail(ctx.customer.email),
        message: 'Incomplete or invalid customer information',
      },
      {
        name: 'suspicious_email_pattern',
        weight: 25,
        check: (ctx) => {
          const email = ctx.customer.email.toLowerCase();
          return (
            email.includes('test') ||
            email.includes('fake') ||
            email.includes('temp') ||
            email.match(/\d{5,}/) !== null // 5+ consecutive digits
          );
        },
        message: 'Suspicious email pattern detected',
      },

      // Geographic checks
      {
        name: 'mismatched_country',
        weight: 20,
        check: (ctx) => {
          // This would integrate with IP geolocation service
          // For now, just a placeholder
          return false;
        },
        message: 'Country mismatch between IP and billing address',
      },

      // Time-based checks
      {
        name: 'unusual_hour',
        weight: 10,
        check: (ctx) => {
          const hour = ctx.timestamp.getHours();
          return hour >= 2 && hour <= 5; // 2 AM - 5 AM
        },
        message: 'Transaction at unusual hour',
      },
    ];

    this.logger.log(`Initialized ${this.fraudRules.length} fraud detection rules`);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getRecommendations(riskScore: number, flags: string[]): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 70) {
      recommendations.push('Block transaction immediately');
      recommendations.push('Review customer account for suspicious activity');
      recommendations.push('Contact customer to verify transaction');
    } else if (riskScore >= 50) {
      recommendations.push('Require additional verification (3D Secure, OTP)');
      recommendations.push('Manual review recommended');
      recommendations.push('Monitor customer for future transactions');
    } else if (riskScore >= 30) {
      recommendations.push('Enhanced monitoring recommended');
      recommendations.push('Consider additional verification');
    } else {
      recommendations.push('Transaction appears legitimate');
      recommendations.push('Standard processing recommended');
    }

    // Specific recommendations based on flags
    if (flags.some((f) => f.includes('blacklist'))) {
      recommendations.push('Contact compliance team immediately');
    }

    if (flags.some((f) => f.includes('failed attempts'))) {
      recommendations.push('Implement temporary account restriction');
      recommendations.push('Send security alert to customer');
    }

    if (flags.some((f) => f.includes('high amount'))) {
      recommendations.push('Verify transaction with customer via phone');
      recommendations.push('Consider splitting into smaller transactions');
    }

    return recommendations;
  }
}
