/**
 * Payment Reconciliation Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { PaymentOrchestratorService } from './payment-orchestrator.service';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionType,
  Currency,
} from '../interfaces/payment.types';

describe('PaymentReconciliationService', () => {
  let service: PaymentReconciliationService;
  let orchestratorService: PaymentOrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentReconciliationService,
        {
          provide: PaymentOrchestratorService,
          useValue: {
            getPaymentStatus: jest.fn(),
            getAvailableProviders: jest.fn().mockReturnValue([
              PaymentProvider.STRIPE,
              PaymentProvider.REDSYS,
              PaymentProvider.BIZUM,
            ]),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentReconciliationService>(PaymentReconciliationService);
    orchestratorService = module.get<PaymentOrchestratorService>(PaymentOrchestratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logTransaction', () => {
    it('should log a transaction', async () => {
      const log = await service.logTransaction({
        transactionId: 'test_123',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId: 'customer_123',
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.transactionId).toBe('test_123');
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve logged transaction', async () => {
      await service.logTransaction({
        transactionId: 'test_456',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 200, currency: Currency.EUR },
        customerId: 'customer_456',
      });

      const retrieved = service.getTransactionLog('test_456');
      expect(retrieved).toBeDefined();
      expect(retrieved.transactionId).toBe('test_456');
    });
  });

  describe('getTransactionLogsByProvider', () => {
    it('should filter transactions by provider', async () => {
      await service.logTransaction({
        transactionId: 'stripe_1',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId: 'customer_1',
      });

      await service.logTransaction({
        transactionId: 'redsys_1',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.REDSYS,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 200, currency: Currency.EUR },
        customerId: 'customer_2',
      });

      const stripeLogs = service.getTransactionLogsByProvider(PaymentProvider.STRIPE);
      expect(stripeLogs.length).toBeGreaterThan(0);
      expect(stripeLogs.every((log) => log.provider === PaymentProvider.STRIPE)).toBe(true);
    });
  });

  describe('getTransactionLogsByDateRange', () => {
    it('should filter transactions by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await service.logTransaction({
        transactionId: 'test_date',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId: 'customer_1',
      });

      const logs = service.getTransactionLogsByDateRange(yesterday, tomorrow);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('getTransactionLogsByCustomer', () => {
    it('should filter transactions by customer', async () => {
      const customerId = 'customer_test';

      await service.logTransaction({
        transactionId: 'test_1',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId,
      });

      await service.logTransaction({
        transactionId: 'test_2',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 200, currency: Currency.EUR },
        customerId,
      });

      const customerLogs = service.getTransactionLogsByCustomer(customerId);
      expect(customerLogs.length).toBe(2);
      expect(customerLogs.every((log) => log.customerId === customerId)).toBe(true);
    });
  });

  describe('getPaymentStatistics', () => {
    it('should calculate payment statistics', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      await service.logTransaction({
        transactionId: 'stat_1',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId: 'customer_1',
      });

      await service.logTransaction({
        transactionId: 'stat_2',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 200, currency: Currency.EUR },
        customerId: 'customer_2',
      });

      await service.logTransaction({
        transactionId: 'stat_3',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.FAILED,
        amount: { amount: 150, currency: Currency.EUR },
        customerId: 'customer_3',
      });

      const stats = service.getPaymentStatistics(startDate, endDate);
      expect(stats.totalPayments).toBeGreaterThanOrEqual(3);
      expect(stats.successfulPayments).toBeGreaterThanOrEqual(2);
      expect(stats.failedPayments).toBeGreaterThanOrEqual(1);
      expect(stats.totalAmount.amount).toBeGreaterThanOrEqual(300);
    });
  });

  describe('exportReconciliationData', () => {
    it('should export reconciliation data', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      await service.logTransaction({
        transactionId: 'export_1',
        type: TransactionType.PAYMENT,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
        customerId: 'customer_1',
      });

      const exportData = service.exportReconciliationData(
        PaymentProvider.STRIPE,
        startDate,
        endDate,
      );

      expect(exportData).toHaveProperty('transactions');
      expect(exportData).toHaveProperty('summary');
      expect(Array.isArray(exportData.transactions)).toBe(true);
    });
  });
});
