/**
 * Payment Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentOrchestratorService } from '../services/payment-orchestrator.service';
import { PaymentReconciliationService } from '../services/payment-reconciliation.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { PaymentProvider, Currency, PaymentStatus } from '../interfaces/payment.types';

describe('PaymentController', () => {
  let controller: PaymentController;
  let orchestratorService: PaymentOrchestratorService;
  let fraudDetectionService: FraudDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentOrchestratorService,
          useValue: {
            createPayment: jest.fn(),
            getPaymentStatus: jest.fn(),
            refund: jest.fn(),
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            getSubscription: jest.fn(),
            healthCheckAll: jest.fn(),
          },
        },
        {
          provide: PaymentReconciliationService,
          useValue: {
            logTransaction: jest.fn(),
            getPaymentStatistics: jest.fn(),
          },
        },
        {
          provide: FraudDetectionService,
          useValue: {
            checkPayment: jest.fn(),
            recordTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    orchestratorService = module.get<PaymentOrchestratorService>(PaymentOrchestratorService);
    fraudDetectionService = module.get<FraudDetectionService>(FraudDetectionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const dto = {
        amount: { amount: 100, currency: Currency.EUR },
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const fraudCheckResult = {
        riskScore: 10,
        passed: true,
        flags: [],
        recommendations: [],
      };

      const paymentResult = {
        success: true,
        transactionId: 'test_123',
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: dto.amount,
      };

      jest.spyOn(fraudDetectionService, 'checkPayment').mockResolvedValue(fraudCheckResult);
      jest.spyOn(orchestratorService, 'createPayment').mockResolvedValue(paymentResult);

      const result = await controller.createPayment(dto);

      expect(result.statusCode).toBe(201);
      expect(result.data.success).toBe(true);
      expect(fraudDetectionService.checkPayment).toHaveBeenCalled();
      expect(orchestratorService.createPayment).toHaveBeenCalled();
    });

    it('should reject payment with high fraud score', async () => {
      const dto = {
        amount: { amount: 100, currency: Currency.EUR },
        customer: {
          email: 'fraud@example.com',
          name: 'Fraud User',
        },
      };

      const fraudCheckResult = {
        riskScore: 90,
        passed: false,
        flags: ['Email address is blacklisted'],
        recommendations: ['Block transaction immediately'],
      };

      jest.spyOn(fraudDetectionService, 'checkPayment').mockResolvedValue(fraudCheckResult);

      await expect(controller.createPayment(dto)).rejects.toThrow(HttpException);
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status', async () => {
      const paymentResult = {
        success: true,
        transactionId: 'test_123',
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
      };

      jest.spyOn(orchestratorService, 'getPaymentStatus').mockResolvedValue(paymentResult);

      const result = await controller.getPaymentStatus('test_123', PaymentProvider.STRIPE);

      expect(result.statusCode).toBe(200);
      expect(result.data.transactionId).toBe('test_123');
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const dto = {
        transactionId: 'test_123',
        provider: PaymentProvider.STRIPE,
        amount: { amount: 100, currency: Currency.EUR },
      };

      const refundResult = {
        success: true,
        refundId: 'refund_123',
        transactionId: 'test_123',
        amount: dto.amount,
        status: PaymentStatus.REFUNDED,
      };

      jest.spyOn(orchestratorService, 'refund').mockResolvedValue(refundResult);

      const result = await controller.refundPayment(dto);

      expect(result.statusCode).toBe(200);
      expect(result.data.success).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return health status of all providers', async () => {
      const healthResults = {
        [PaymentProvider.STRIPE]: { healthy: true, message: 'OK' },
        [PaymentProvider.REDSYS]: { healthy: true, message: 'OK' },
        [PaymentProvider.BIZUM]: { healthy: true, message: 'OK' },
      };

      jest.spyOn(orchestratorService, 'healthCheckAll').mockResolvedValue(healthResults);

      const result = await controller.healthCheck();

      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveProperty(PaymentProvider.STRIPE);
    });
  });
});
