/**
 * CashForecastService Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CashForecastService } from '../src/forecasting/cash-forecast.service';
import { PrismaService } from '../src/shared/prisma.service';

describe('CashForecastService', () => {
  let service: CashForecastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashForecastService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<CashForecastService>(CashForecastService);
  });

  describe('forecast', () => {
    it('should generate 12-month forecast', async () => {
      const result = await service.forecast(12, 'WEIGHTED');

      expect(result.projections.length).toBe(12);
      expect(result.scenarios).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should support different forecast methods', async () => {
      const methods = ['SIMPLE', 'WEIGHTED', 'REGRESSION', 'ML'] as const;

      for (const method of methods) {
        const result = await service.forecast(6, method);
        expect(result.method).toBe(method);
      }
    });
  });

  describe('forecastByCategory', () => {
    it('should generate forecasts for all categories', async () => {
      const result = await service.forecastByCategory(12);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((forecast) => {
        expect(forecast.projections.length).toBe(12);
        expect(['INFLOW', 'OUTFLOW']).toContain(forecast.type);
      });
    });
  });

  describe('projectPremiums', () => {
    it('should project premium income', async () => {
      const result = await service.projectPremiums(12);

      expect(result.length).toBe(12);
      result.forEach((projection) => {
        expect(projection.expectedInflow).toBeGreaterThan(0);
      });
    });
  });

  describe('bestCaseScenario', () => {
    it('should generate optimistic scenario', async () => {
      const result = await service.bestCaseScenario(12);

      expect(result).toBeDefined();
      expect(result.projections.length).toBe(12);
    });
  });

  describe('worstCaseScenario', () => {
    it('should generate pessimistic scenario', async () => {
      const result = await service.worstCaseScenario(12);

      expect(result).toBeDefined();
      expect(result.projections.length).toBe(12);
    });
  });

  describe('compareToForecast', () => {
    it('should calculate variance analysis', async () => {
      const forecast = await service.forecast(1, 'WEIGHTED');
      const actual = {
        totalInflow: 95000,
        totalOutflow: 75000,
        netCashFlow: 20000,
        endingBalance: 140000,
        breakdown: {
          inflow: {
            premiums: 65000,
            renewals: 20000,
            newPolicies: 5000,
            commissions: 5000,
            investments: 0,
            other: 0,
          },
          outflow: {
            claims: 40000,
            salaries: 18000,
            suppliers: 10000,
            taxes: 4000,
            socialSecurity: 3000,
            rent: 0,
            utilities: 0,
            marketing: 0,
            technology: 0,
            other: 0,
          },
        },
      };

      const result = await service.compareToForecast(actual, forecast);

      expect(result).toBeDefined();
      expect(result.totalVariance).toBeDefined();
      expect(result.analysis).toBeDefined();
    });
  });
});
