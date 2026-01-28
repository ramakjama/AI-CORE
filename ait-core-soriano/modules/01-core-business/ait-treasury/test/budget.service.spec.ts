/**
 * BudgetService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from '../src/budget/budget.service';
import { PrismaService } from '../src/shared/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('BudgetService', () => {
  let service: BudgetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
  });

  describe('create', () => {
    it('should create budget successfully', async () => {
      const dto = {
        name: 'Marketing Q1',
        description: 'Marketing budget',
        category: 'MARKETING',
        amount: 50000,
        currency: 'EUR',
        period: 'QUARTERLY',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.status).toBe('ACTIVE');
    });

    it('should reject invalid date range', async () => {
      const dto = {
        name: 'Test',
        description: 'Test',
        category: 'MARKETING',
        amount: 1000,
        currency: 'EUR',
        period: 'MONTHLY',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-01-01'),
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('trackExpense', () => {
    it('should track expense against budget', async () => {
      const dto = {
        budgetId: 'budget-001',
        amount: 5000,
        currency: 'EUR',
        description: 'Google Ads',
        category: 'MARKETING',
        date: new Date(),
      };

      const result = await service.trackExpense(dto);

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(dto.budgetId);
    });
  });

  describe('getStatus', () => {
    it('should return budget status', async () => {
      const result = await service.getStatus('budget-001');

      expect(result).toBeDefined();
      expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(result.status);
    });
  });

  describe('forecastBudget', () => {
    it('should forecast budget utilization', async () => {
      const result = await service.forecastBudget('budget-001');

      expect(result).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
      expect(result.scenarios).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate budget report', async () => {
      const result = await service.generateReport(
        new Date('2026-01-01'),
        new Date('2026-03-31')
      );

      expect(result).toBeDefined();
      expect(result.totalBudget).toBeGreaterThanOrEqual(0);
      expect(result.byCategory).toBeDefined();
    });
  });
});
