import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../metrics.service';
import { Period } from '../../types/metrics.types';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKPIs', () => {
    it('should return all KPIs for a period', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const kpis = await service.getKPIs(period);

      expect(kpis).toBeDefined();
      expect(kpis.revenue).toBeDefined();
      expect(kpis.policies).toBeDefined();
      expect(kpis.claims).toBeDefined();
      expect(kpis.customers).toBeDefined();
      expect(kpis.retention).toBeDefined();
      expect(kpis.churn).toBeDefined();
      expect(kpis.ltv).toBeDefined();
      expect(kpis.cac).toBeDefined();
    });

    it('should calculate retention rate correctly', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const kpis = await service.getKPIs(period);

      expect(kpis.retention).toBeGreaterThanOrEqual(0);
      expect(kpis.retention).toBeLessThanOrEqual(100);
    });

    it('should calculate churn rate correctly', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const kpis = await service.getKPIs(period);

      expect(kpis.churn).toBeGreaterThanOrEqual(0);
      expect(kpis.churn).toBeLessThanOrEqual(100);
    });
  });

  describe('getMetricTimeSeries', () => {
    it('should return time series data with correct granularity', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const timeSeries = await service.getMetricTimeSeries('revenue', period, 'day');

      expect(timeSeries).toBeDefined();
      expect(timeSeries.metric).toBe('revenue');
      expect(timeSeries.granularity).toBe('day');
      expect(timeSeries.points).toBeDefined();
      expect(Array.isArray(timeSeries.points)).toBe(true);
    });

    it('should return correct number of points for week granularity', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const timeSeries = await service.getMetricTimeSeries('revenue', period, 'week');

      expect(timeSeries.points.length).toBeGreaterThan(0);
    });
  });

  describe('compareMetrics', () => {
    it('should compare metrics between two periods', async () => {
      const period1: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const period2: Period = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      };

      const comparison = await service.compareMetrics('revenue', period1, period2);

      expect(comparison).toBeDefined();
      expect(comparison.metric).toBe('revenue');
      expect(comparison.value1).toBeDefined();
      expect(comparison.value2).toBeDefined();
      expect(comparison.absoluteChange).toBeDefined();
      expect(comparison.percentageChange).toBeDefined();
      expect(comparison.trend).toMatch(/up|down|stable/);
    });

    it('should calculate percentage change correctly', async () => {
      const period1: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const period2: Period = {
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-29'),
      };

      const comparison = await service.compareMetrics('revenue', period1, period2);

      const expectedChange = ((comparison.value2 - comparison.value1) / comparison.value1) * 100;
      expect(Math.abs(comparison.percentageChange - expectedChange)).toBeLessThan(0.01);
    });
  });

  describe('getGrowthRate', () => {
    it('should calculate growth rate', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const growthRate = await service.getGrowthRate('revenue', period);

      expect(typeof growthRate).toBe('number');
    });
  });

  describe('getTrend', () => {
    it('should analyze trend across multiple periods', async () => {
      const periods: Period[] = [
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
        },
        {
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
      ];

      const trend = await service.getTrend('revenue', periods);

      expect(trend).toBeDefined();
      expect(trend.metric).toBe('revenue');
      expect(trend.direction).toMatch(/increasing|decreasing|stable|volatile/);
      expect(trend.slope).toBeDefined();
      expect(trend.confidence).toBeGreaterThanOrEqual(0);
      expect(trend.confidence).toBeLessThanOrEqual(1);
      expect(trend.forecast).toBeDefined();
      expect(Array.isArray(trend.forecast)).toBe(true);
    });

    it('should provide forecast data', async () => {
      const periods: Period[] = [
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-29'),
        },
      ];

      const trend = await service.getTrend('revenue', periods);

      expect(trend.forecast).toHaveLength(3);
      trend.forecast.forEach(point => {
        expect(point.timestamp).toBeDefined();
        expect(point.value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getAggregatedMetric', () => {
    it('should aggregate metric by product', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const aggregated = await service.getAggregatedMetric('revenue', period, 'product');

      expect(aggregated).toBeDefined();
      expect(aggregated.metric).toBe('revenue');
      expect(aggregated.value).toBeDefined();
      expect(aggregated.breakdown).toBeDefined();
      expect(typeof aggregated.breakdown).toBe('object');
    });

    it('should return breakdown for each category', async () => {
      const period: Period = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const aggregated = await service.getAggregatedMetric('revenue', period, 'region');

      const breakdownKeys = Object.keys(aggregated.breakdown);
      expect(breakdownKeys.length).toBeGreaterThan(0);

      breakdownKeys.forEach(key => {
        expect(aggregated.breakdown[key]).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
