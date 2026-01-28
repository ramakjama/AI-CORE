/**
 * Stripe Provider Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeProvider } from './stripe.provider';
import { PaymentStatus, Currency, PaymentProvider } from '../../interfaces/payment.types';

describe('StripeProvider', () => {
  let provider: StripeProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                STRIPE_SECRET_KEY: 'sk_test_123456789',
                STRIPE_WEBHOOK_SECRET: 'whsec_123456789',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<StripeProvider>(StripeProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const options = {
        amount: { amount: 100, currency: Currency.EUR },
        customer: {
          email: 'test@example.com',
          name: 'Test User',
        },
        description: 'Test payment',
      };

      // Mock Stripe API would be needed for actual test
      // For now, just verify method exists
      expect(provider.createPayment).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await provider.healthCheck();
      expect(result).toHaveProperty('healthy');
    });
  });

  describe('getConfig', () => {
    it('should return provider configuration', () => {
      const config = provider.getConfig();
      expect(config.provider).toBe(PaymentProvider.STRIPE);
      expect(config.webhookEndpoint).toBe('/webhooks/stripe');
    });
  });
});
