/**
 * CashManagementService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CashManagementService } from '../src/cash/cash-management.service';
import { PrismaService } from '../src/shared/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CashManagementService', () => {
  let service: CashManagementService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashManagementService,
        {
          provide: PrismaService,
          useValue: {
            cashAccount: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            cashMovement: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CashManagementService>(CashManagementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentPosition', () => {
    it('should return current cash position', async () => {
      const result = await service.getCurrentPosition();

      expect(result).toBeDefined();
      expect(result.totalBalance).toBeGreaterThan(0);
      expect(result.availableBalance).toBeDefined();
      expect(result.accounts).toBeInstanceOf(Array);
      expect(result.currency).toBe('EUR');
    });

    it('should include all active accounts', async () => {
      const result = await service.getCurrentPosition();

      expect(result.accounts.length).toBeGreaterThan(0);
      result.accounts.forEach((account) => {
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('name');
        expect(account).toHaveProperty('balance');
        expect(account.status).toBe('ACTIVE');
      });
    });
  });

  describe('getPositionByDate', () => {
    it('should return historical position for given date', async () => {
      const testDate = new Date('2026-01-15');
      const result = await service.getPositionByDate(testDate);

      expect(result).toBeDefined();
      expect(result.lastUpdate).toEqual(testDate);
    });
  });

  describe('getPositionByAccount', () => {
    it('should return position for specific account', async () => {
      const accountId = 'acc-001';
      const result = await service.getPositionByAccount(accountId);

      expect(result).toBeDefined();
      expect(result.accounts.length).toBe(1);
      expect(result.accounts[0].id).toBe(accountId);
    });

    it('should throw NotFoundException for invalid account', async () => {
      await expect(service.getPositionByAccount('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('recordInflow', () => {
    it('should record cash inflow successfully', async () => {
      const dto = {
        accountId: 'acc-001',
        amount: 5000,
        category: 'PREMIUM_COLLECTION',
        description: 'Premium payment',
        reference: 'REF-001',
        executionDate: new Date(),
      };

      const result = await service.recordInflow(dto);

      expect(result).toBeDefined();
      expect(result.type).toBe('INFLOW');
      expect(result.amount).toBe(dto.amount);
      expect(result.category).toBe(dto.category);
    });

    it('should set correct status for inflow', async () => {
      const dto = {
        accountId: 'acc-001',
        amount: 5000,
        category: 'PREMIUM_COLLECTION',
        description: 'Premium payment',
        reference: 'REF-001',
        executionDate: new Date(),
      };

      const result = await service.recordInflow(dto);

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('recordOutflow', () => {
    it('should record cash outflow successfully', async () => {
      const dto = {
        accountId: 'acc-001',
        amount: 2000,
        category: 'CLAIM_PAYMENT',
        description: 'Claim payment',
        reference: 'CLAIM-001',
        executionDate: new Date(),
      };

      const result = await service.recordOutflow(dto);

      expect(result).toBeDefined();
      expect(result.type).toBe('OUTFLOW');
      expect(result.amount).toBe(dto.amount);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const dto = {
        accountId: 'acc-001',
        amount: 999999999, // Extremely high amount
        category: 'CLAIM_PAYMENT',
        description: 'Claim payment',
        reference: 'CLAIM-001',
        executionDate: new Date(),
      };

      await expect(service.recordOutflow(dto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reconcile', () => {
    it('should perform account reconciliation', async () => {
      const accountId = 'acc-001';
      const date = new Date();

      const result = await service.reconcile(accountId, date);

      expect(result).toBeDefined();
      expect(result.accountId).toBe(accountId);
      expect(result.date).toEqual(date);
      expect(result).toHaveProperty('bookBalance');
      expect(result).toHaveProperty('bankBalance');
      expect(result).toHaveProperty('difference');
    });

    it('should detect reconciliation status', async () => {
      const result = await service.reconcile('acc-001', new Date());

      expect(['RECONCILED', 'PENDING', 'DISCREPANCY']).toContain(result.status);
    });
  });

  describe('matchTransactions', () => {
    it('should match movements with bank statements', async () => {
      const movements = [
        {
          id: 'mov-001',
          accountId: 'acc-001',
          type: 'INFLOW' as const,
          category: 'PREMIUM_COLLECTION' as const,
          amount: 1000,
          currency: 'EUR',
          description: 'Premium',
          reference: 'REF-001',
          executionDate: new Date('2026-01-15'),
          valueDate: new Date('2026-01-15'),
          status: 'COMPLETED' as const,
          createdBy: 'system',
          createdAt: new Date(),
        },
      ];

      const statements = [
        {
          id: 'stmt-001',
          accountId: 'acc-001',
          transactionDate: new Date('2026-01-15'),
          valueDate: new Date('2026-01-15'),
          amount: 1000,
          description: 'Premium',
          reference: 'REF-001',
          balance: 10000,
          matched: false,
        },
      ];

      const results = await service.matchTransactions(movements, statements);

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].matchType).toBe('EXACT');
      expect(results[0].confidence).toBe(1.0);
    });
  });

  describe('checkLowBalance', () => {
    it('should check for low balance alerts', async () => {
      const alerts = await service.checkLowBalance();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should generate alerts for accounts below threshold', async () => {
      const alerts = await service.checkLowBalance();

      alerts.forEach((alert) => {
        expect(alert.type).toBe('LOW_BALANCE');
        expect(['INFO', 'WARNING', 'CRITICAL']).toContain(alert.severity);
      });
    });
  });

  describe('forecastCashShortage', () => {
    it('should forecast cash shortage for given days', async () => {
      const days = 30;
      const shortages = await service.forecastCashShortage(days);

      expect(shortages).toBeDefined();
      expect(Array.isArray(shortages)).toBe(true);
    });

    it('should provide shortage details', async () => {
      const shortages = await service.forecastCashShortage(7);

      shortages.forEach((shortage) => {
        expect(shortage).toHaveProperty('date');
        expect(shortage).toHaveProperty('projectedBalance');
        expect(shortage).toHaveProperty('requiredAmount');
        expect(shortage).toHaveProperty('shortage');
        expect(shortage).toHaveProperty('probability');
        expect(shortage).toHaveProperty('recommendations');
      });
    });
  });
});
