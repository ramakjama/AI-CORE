/**
 * Fraud Detection Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FraudDetectionService } from './fraud-detection.service';
import { Currency } from '../interfaces/payment.types';

describe('FraudDetectionService', () => {
  let service: FraudDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudDetectionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                FRAUD_MAX_RISK_SCORE: 70,
              };
              return config[key] !== undefined ? config[key] : defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FraudDetectionService>(FraudDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPayment', () => {
    it('should pass for normal payment', async () => {
      const context = {
        customer: {
          email: 'normal@example.com',
          name: 'John Doe',
          phone: '+34123456789',
        },
        amount: {
          amount: 50,
          currency: Currency.EUR,
        },
        timestamp: new Date(),
      };

      const result = await service.checkPayment(context);
      expect(result.passed).toBe(true);
      expect(result.riskScore).toBeLessThan(70);
    });

    it('should flag blacklisted email', async () => {
      service.blacklistEmail('fraud@example.com');

      const context = {
        customer: {
          email: 'fraud@example.com',
          name: 'John Doe',
        },
        amount: {
          amount: 50,
          currency: Currency.EUR,
        },
        timestamp: new Date(),
      };

      const result = await service.checkPayment(context);
      expect(result.passed).toBe(false);
      expect(result.flags).toContain('Email address is blacklisted');
    });

    it('should flag high amount transactions', async () => {
      const context = {
        customer: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        amount: {
          amount: 60000,
          currency: Currency.EUR,
        },
        timestamp: new Date(),
      };

      const result = await service.checkPayment(context);
      expect(result.flags.length).toBeGreaterThan(0);
    });

    it('should flag suspicious email patterns', async () => {
      const context = {
        customer: {
          email: 'test12345@example.com',
          name: 'Test User',
        },
        amount: {
          amount: 100,
          currency: Currency.EUR,
        },
        timestamp: new Date(),
      };

      const result = await service.checkPayment(context);
      expect(result.flags).toContain('Suspicious email pattern detected');
    });

    it('should flag transactions at unusual hours', async () => {
      const unusualTime = new Date();
      unusualTime.setHours(3, 0, 0); // 3 AM

      const context = {
        customer: {
          email: 'test@example.com',
          name: 'John Doe',
        },
        amount: {
          amount: 100,
          currency: Currency.EUR,
        },
        timestamp: unusualTime,
      };

      const result = await service.checkPayment(context);
      expect(result.flags).toContain('Transaction at unusual hour');
    });
  });

  describe('recordTransaction', () => {
    it('should record successful transaction', () => {
      service.recordTransaction('customer123', 100, true);
      const history = service.getCustomerHistory('customer123');
      expect(history).toBeDefined();
      expect(history.count).toBe(1);
      expect(history.totalAmount).toBe(100);
    });

    it('should track failed attempts', () => {
      service.recordTransaction('customer123', 100, false);
      service.recordTransaction('customer123', 100, false);
      const history = service.getCustomerHistory('customer123');
      expect(history.failedAttempts).toBe(2);
    });

    it('should reset failed attempts on success', () => {
      service.recordTransaction('customer123', 100, false);
      service.recordTransaction('customer123', 100, false);
      service.recordTransaction('customer123', 100, true);
      const history = service.getCustomerHistory('customer123');
      expect(history.failedAttempts).toBe(0);
    });
  });

  describe('blacklist management', () => {
    it('should add and remove IP from blacklist', () => {
      const ip = '192.168.1.1';
      service.blacklistIP(ip);

      const context = {
        customer: { email: 'test@example.com', name: 'Test' },
        amount: { amount: 50, currency: Currency.EUR },
        ipAddress: ip,
        timestamp: new Date(),
      };

      service.checkPayment(context).then((result) => {
        expect(result.flags).toContain('IP address is blacklisted');
      });

      service.whitelistIP(ip);
    });

    it('should add and remove email from blacklist', () => {
      const email = 'fraud@example.com';
      service.blacklistEmail(email);
      service.whitelistEmail(email);

      const context = {
        customer: { email, name: 'Test' },
        amount: { amount: 50, currency: Currency.EUR },
        timestamp: new Date(),
      };

      service.checkPayment(context).then((result) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('clearHistory', () => {
    it('should clear all transaction history', () => {
      service.recordTransaction('customer1', 100, true);
      service.recordTransaction('customer2', 200, true);
      service.clearHistory();

      expect(service.getCustomerHistory('customer1')).toBeUndefined();
      expect(service.getCustomerHistory('customer2')).toBeUndefined();
    });
  });
});
