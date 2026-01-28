/**
 * Payment Reconciliation Service
 * Automatic reconciliation of payments across providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionLog,
  TransactionType,
  Money,
} from '../interfaces/payment.types';
import { PaymentOrchestratorService } from './payment-orchestrator.service';

interface ReconciliationReport {
  date: Date;
  provider: PaymentProvider;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: Money;
  discrepancies: ReconciliationDiscrepancy[];
}

interface ReconciliationDiscrepancy {
  transactionId: string;
  type: 'missing' | 'status_mismatch' | 'amount_mismatch';
  expected: any;
  actual: any;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class PaymentReconciliationService {
  private readonly logger = new Logger(PaymentReconciliationService.name);
  private transactionLogs: Map<string, TransactionLog>;
  private reconciliationReports: ReconciliationReport[];

  constructor(private orchestratorService: PaymentOrchestratorService) {
    this.transactionLogs = new Map();
    this.reconciliationReports = [];
    this.logger.log('Payment Reconciliation Service initialized');
  }

  /**
   * Log a transaction
   */
  async logTransaction(log: Omit<TransactionLog, 'id' | 'createdAt'>): Promise<TransactionLog> {
    const transactionLog: TransactionLog = {
      id: this.generateLogId(),
      ...log,
      createdAt: new Date(),
    };

    this.transactionLogs.set(transactionLog.id, transactionLog);
    this.logger.log(`Transaction logged: ${transactionLog.transactionId} (${transactionLog.type})`);

    return transactionLog;
  }

  /**
   * Get transaction log
   */
  getTransactionLog(transactionId: string): TransactionLog | undefined {
    return Array.from(this.transactionLogs.values()).find(
      (log) => log.transactionId === transactionId,
    );
  }

  /**
   * Get all transaction logs for a provider
   */
  getTransactionLogsByProvider(provider: PaymentProvider): TransactionLog[] {
    return Array.from(this.transactionLogs.values()).filter((log) => log.provider === provider);
  }

  /**
   * Get transaction logs by date range
   */
  getTransactionLogsByDateRange(startDate: Date, endDate: Date): TransactionLog[] {
    return Array.from(this.transactionLogs.values()).filter(
      (log) => log.createdAt >= startDate && log.createdAt <= endDate,
    );
  }

  /**
   * Get transaction logs by customer
   */
  getTransactionLogsByCustomer(customerId: string): TransactionLog[] {
    return Array.from(this.transactionLogs.values()).filter(
      (log) => log.customerId === customerId,
    );
  }

  /**
   * Reconcile transactions for a specific provider
   */
  async reconcileProvider(
    provider: PaymentProvider,
    startDate: Date,
    endDate: Date,
  ): Promise<ReconciliationReport> {
    this.logger.log(`Starting reconciliation for ${provider} from ${startDate} to ${endDate}`);

    const logs = this.getTransactionLogsByDateRange(startDate, endDate).filter(
      (log) => log.provider === provider,
    );

    const report: ReconciliationReport = {
      date: new Date(),
      provider,
      totalTransactions: logs.length,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalAmount: { amount: 0, currency: 'EUR' },
      discrepancies: [],
    };

    for (const log of logs) {
      try {
        // Get current status from provider
        const currentStatus = await this.orchestratorService.getPaymentStatus(
          log.transactionId,
          provider,
        );

        // Check for discrepancies
        if (log.status !== currentStatus.status) {
          report.discrepancies.push({
            transactionId: log.transactionId,
            type: 'status_mismatch',
            expected: log.status,
            actual: currentStatus.status,
            severity: this.getDiscrepancySeverity('status_mismatch', log.status, currentStatus.status),
          });
        }

        if (Math.abs(log.amount.amount - currentStatus.amount.amount) > 0.01) {
          report.discrepancies.push({
            transactionId: log.transactionId,
            type: 'amount_mismatch',
            expected: log.amount.amount,
            actual: currentStatus.amount.amount,
            severity: 'high',
          });
        }

        // Update counters
        if (currentStatus.status === PaymentStatus.COMPLETED) {
          report.successfulTransactions++;
          report.totalAmount.amount += currentStatus.amount.amount;
        } else if (
          currentStatus.status === PaymentStatus.FAILED ||
          currentStatus.status === PaymentStatus.CANCELLED
        ) {
          report.failedTransactions++;
        }
      } catch (error) {
        this.logger.error(`Error reconciling transaction ${log.transactionId}: ${error.message}`);
        report.discrepancies.push({
          transactionId: log.transactionId,
          type: 'missing',
          expected: 'transaction exists',
          actual: 'not found',
          severity: 'high',
        });
      }
    }

    this.reconciliationReports.push(report);
    this.logger.log(
      `Reconciliation completed for ${provider}: ${report.discrepancies.length} discrepancies found`,
    );

    return report;
  }

  /**
   * Reconcile all providers
   */
  async reconcileAll(startDate: Date, endDate: Date): Promise<ReconciliationReport[]> {
    const providers = this.orchestratorService.getAvailableProviders();
    const reports: ReconciliationReport[] = [];

    for (const provider of providers) {
      try {
        const report = await this.reconcileProvider(provider, startDate, endDate);
        reports.push(report);
      } catch (error) {
        this.logger.error(`Error reconciling provider ${provider}: ${error.message}`);
      }
    }

    return reports;
  }

  /**
   * Get reconciliation report
   */
  getReconciliationReport(provider: PaymentProvider, date?: Date): ReconciliationReport | undefined {
    if (date) {
      return this.reconciliationReports.find(
        (r) =>
          r.provider === provider &&
          r.date.toDateString() === date.toDateString(),
      );
    }
    return this.reconciliationReports
      .filter((r) => r.provider === provider)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  }

  /**
   * Get all reconciliation reports
   */
  getAllReconciliationReports(): ReconciliationReport[] {
    return [...this.reconciliationReports].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }

  /**
   * Get payment statistics
   */
  getPaymentStatistics(startDate: Date, endDate: Date): {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: Money;
    byProvider: Record<PaymentProvider, { count: number; amount: Money }>;
  } {
    const logs = this.getTransactionLogsByDateRange(startDate, endDate).filter(
      (log) => log.type === TransactionType.PAYMENT,
    );

    const stats = {
      totalPayments: logs.length,
      successfulPayments: 0,
      failedPayments: 0,
      totalAmount: { amount: 0, currency: 'EUR' },
      byProvider: {} as Record<PaymentProvider, { count: number; amount: Money }>,
    };

    for (const log of logs) {
      if (log.status === PaymentStatus.COMPLETED) {
        stats.successfulPayments++;
        stats.totalAmount.amount += log.amount.amount;
      } else if (log.status === PaymentStatus.FAILED || log.status === PaymentStatus.CANCELLED) {
        stats.failedPayments++;
      }

      if (!stats.byProvider[log.provider]) {
        stats.byProvider[log.provider] = {
          count: 0,
          amount: { amount: 0, currency: log.amount.currency },
        };
      }

      stats.byProvider[log.provider].count++;
      if (log.status === PaymentStatus.COMPLETED) {
        stats.byProvider[log.provider].amount.amount += log.amount.amount;
      }
    }

    return stats;
  }

  /**
   * Automatic daily reconciliation (runs at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async performDailyReconciliation(): Promise<void> {
    this.logger.log('Starting daily reconciliation');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    try {
      const reports = await this.reconcileAll(startDate, endDate);

      const totalDiscrepancies = reports.reduce((sum, r) => sum + r.discrepancies.length, 0);

      if (totalDiscrepancies > 0) {
        this.logger.warn(
          `Daily reconciliation found ${totalDiscrepancies} discrepancies`,
        );
        // Send notification to admin
        await this.sendReconciliationAlert(reports);
      } else {
        this.logger.log('Daily reconciliation completed successfully with no discrepancies');
      }
    } catch (error) {
      this.logger.error(`Daily reconciliation failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Export reconciliation data
   */
  exportReconciliationData(
    provider: PaymentProvider,
    startDate: Date,
    endDate: Date,
  ): {
    transactions: TransactionLog[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      totalAmount: Money;
    };
  } {
    const logs = this.getTransactionLogsByDateRange(startDate, endDate).filter(
      (log) => log.provider === provider,
    );

    const summary = {
      total: logs.length,
      successful: logs.filter((l) => l.status === PaymentStatus.COMPLETED).length,
      failed: logs.filter(
        (l) => l.status === PaymentStatus.FAILED || l.status === PaymentStatus.CANCELLED,
      ).length,
      totalAmount: {
        amount: logs
          .filter((l) => l.status === PaymentStatus.COMPLETED)
          .reduce((sum, l) => sum + l.amount.amount, 0),
        currency: 'EUR',
      },
    };

    return { transactions: logs, summary };
  }

  // Private helper methods

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private getDiscrepancySeverity(
    type: string,
    expected: any,
    actual: any,
  ): 'low' | 'medium' | 'high' {
    if (type === 'status_mismatch') {
      // High severity if status changed from completed to failed or vice versa
      if (
        (expected === PaymentStatus.COMPLETED && actual === PaymentStatus.FAILED) ||
        (expected === PaymentStatus.FAILED && actual === PaymentStatus.COMPLETED)
      ) {
        return 'high';
      }
      // Medium severity for other status changes
      return 'medium';
    }

    if (type === 'amount_mismatch') {
      return 'high';
    }

    return 'low';
  }

  private async sendReconciliationAlert(reports: ReconciliationReport[]): Promise<void> {
    // Implementation would integrate with notification service
    this.logger.warn('Reconciliation alert triggered - implement notification integration');
  }
}
