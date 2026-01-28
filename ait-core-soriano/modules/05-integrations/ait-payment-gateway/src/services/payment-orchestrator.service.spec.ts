/**
 * Payment Orchestrator Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentOrchestratorService } from './payment-orchestrator.service';
import { StripeProvider } from '../providers/stripe/stripe.provider';
import { RedsysProvider } from '../providers/redsys/redsys.provider';
import { BizumProvider } from '../providers/bizum/bizum.provider';
import { PaymentProvider, Currency, PaymentStatus } from '../interfaces/payment.types';

describe('PaymentOrchestratorService', () => {
  let service: PaymentOrchestratorService;
  let stripeProvider: StripeProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentOrchestratorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                PAYMENT_ENABLE_FAILOVER: true,
                PAYMENT_MAX_RETRIES: 3,
                STRIPE_PRIORITY: 1,
                STRIPE_ENABLED: true,
                REDSYS_PRIORITY: 2,
                REDSYS_ENABLED: true,
                BIZUM_PRIORITY: 3,
                BIZUM_ENABLED: true,
              };
              return config[key] !== undefined ? config[key] : defaultValue;
            }),
          },
        },
        {
          provide: StripeProvider,
          useValue: {
            name: PaymentProvider.STRIPE,
            createPayment: jest.fn(),
            healthCheck: jest.fn(),
          },
        },
        {
          provide: RedsysProvider,
          useValue: {
            name: PaymentProvider.REDSYS,
            createPayment: jest.fn(),
            healthCheck: jest.fn(),
          },
        },
        {
          provide: BizumProvider,
          useValue: {
            name: PaymentProvider.BIZUM,
            createPayment: jest.fn(),
            healthCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentOrchestratorService>(PaymentOrchestratorService);
    stripeProvider = module.get<StripeProvider>(StripeProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create payment with default provider', async () => {
      const mockResult = {
        success: true,
        transactionId: 'test_123',
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.COMPLETED,
        amount: { amount: 100, currency: Currency.EUR },
      };

      jest.spyOn(stripeProvider, 'createPayment').mockResolvedValue(mockResult);

      const options = {
        amount: { amount: 100, currency: Currency.EUR },
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      const result = await service.createPayment(options);
      expect(result.success).toBe(true);
      expect(result.provider).toBe(PaymentProvider.STRIPE);
    });

    it('should failover to next provider on failure', async () => {
      const failedResult = {
        success: false,
        transactionId: null,
        provider: PaymentProvider.STRIPE,
        status: PaymentStatus.FAILED,
        amount: { amount: 100, currency: Currency.EUR },
        error: 'Payment failed',
      };

      jest.spyOn(stripeProvider, 'createPayment').mockResolvedValue(failedResult);

      const options = {
        amount: { amount: 100, currency: Currency.EUR },
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      await service.createPayment(options);
      expect(stripeProvider.createPayment).toHaveBeenCalled();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all available providers', () => {
      const providers = service.getAvailableProviders();
      expect(providers).toContain(PaymentProvider.STRIPE);
      expect(providers).toContain(PaymentProvider.REDSYS);
      expect(providers).toContain(PaymentProvider.BIZUM);
    });
  });

  describe('healthCheckAll', () => {
    it('should check health of all providers', async () => {
      jest.spyOn(stripeProvider, 'healthCheck').mockResolvedValue({
        healthy: true,
        message: 'OK',
      });

      const results = await service.healthCheckAll();
      expect(results).toHaveProperty(PaymentProvider.STRIPE);
    });
  });
});
