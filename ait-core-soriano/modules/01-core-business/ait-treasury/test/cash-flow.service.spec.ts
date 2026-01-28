/**
 * CashFlowService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowService } from '../src/cash-flow/cash-flow.service';
import { PrismaService } from '../src/shared/prisma.service';

describe('CashFlowService', () => {
  let service: CashFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashFlowService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CashFlowService>(CashFlowService);
  });

  describe('generateStatement', () => {
    it('should generate cash flow statement', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      const result = await service.generateStatement(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.period.startDate).toEqual(startDate);
      expect(result.period.endDate).toEqual(endDate);
      expect(result.operatingActivities).toBeDefined();
      expect(result.investingActivities).toBeDefined();
      expect(result.financingActivities).toBeDefined();
    });

    it('should calculate net cash flow correctly', async () => {
      const result = await service.generateStatement(
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      const calculated =
        result.operatingActivities.netOperating +
        result.investingActivities.netInvesting +
        result.financingActivities.netFinancing;

      expect(result.netCashFlow).toBeCloseTo(calculated, 2);
    });
  });

  describe('getMonthlyFlow', () => {
    it('should return 12 monthly statements', async () => {
      const result = await service.getMonthlyFlow(2026);

      expect(result).toBeDefined();
      expect(result.length).toBe(12);
    });
  });

  describe('compareFlows', () => {
    it('should compare two periods successfully', async () => {
      const period1 = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };
      const period2 = {
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-28'),
      };

      const result = await service.compareFlows(period1, period2);

      expect(result).toBeDefined();
      expect(result.variance).toBeDefined();
      expect(result.analysis).toBeDefined();
    });
  });

  describe('calculateBurnRate', () => {
    it('should calculate burn rate for given months', async () => {
      const result = await service.calculateBurnRate(6);

      expect(result).toBeDefined();
      expect(result.monthlyBurnRate).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(['INCREASING', 'STABLE', 'DECREASING']).toContain(result.trend);
    });
  });

  describe('calculateRunway', () => {
    it('should calculate cash runway', async () => {
      const result = await service.calculateRunway();

      expect(result).toBeDefined();
      expect(result.months).toBeGreaterThanOrEqual(0);
      expect(result.currentBalance).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });
  });
});
