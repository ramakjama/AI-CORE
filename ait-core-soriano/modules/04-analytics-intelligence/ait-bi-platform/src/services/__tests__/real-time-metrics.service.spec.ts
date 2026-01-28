import { Test, TestingModule } from '@nestjs/testing';
import { RealTimeMetricsService } from '../real-time-metrics.service';

describe('RealTimeMetricsService', () => {
  let service: RealTimeMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RealTimeMetricsService],
    }).compile();

    service = module.get<RealTimeMetricsService>(RealTimeMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentActive', () => {
    it('should return current active count', async () => {
      const active = await service.getCurrentActive();
      expect(typeof active).toBe('number');
      expect(active).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTodayRevenue', () => {
    it('should return today revenue', async () => {
      const revenue = await service.getTodayRevenue();
      expect(typeof revenue).toBe('number');
      expect(revenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTodayPolicies', () => {
    it('should return today policy count', async () => {
      const policies = await service.getTodayPolicies();
      expect(typeof policies).toBe('number');
      expect(policies).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getLast24Hours', () => {
    it('should return 24 hourly data points', async () => {
      const data = await service.getLast24Hours('revenue', 'hour');
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(24);
    });

    it('should return 96 15-minute data points', async () => {
      const data = await service.getLast24Hours('revenue', '15min');
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(96);
    });

    it('should have correct data point structure', async () => {
      const data = await service.getLast24Hours('revenue');
      data.forEach(point => {
        expect(point.timestamp).toBeDefined();
        expect(point.value).toBeDefined();
        expect(typeof point.value).toBe('number');
      });
    });
  });

  describe('getLastHour', () => {
    it('should return 60 minute data points', async () => {
      const data = await service.getLastHour('revenue');
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(60);
    });
  });

  describe('getCurrentConversionRate', () => {
    it('should calculate conversion rate', async () => {
      const rate = await service.getCurrentConversionRate();
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(rate).toBeLessThanOrEqual(100);
    });
  });

  describe('getLiveDashboard', () => {
    it('should return live dashboard data', async () => {
      const dashboard = await service.getLiveDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.active).toBeDefined();
      expect(dashboard.revenue).toBeDefined();
      expect(dashboard.policies).toBeDefined();
      expect(dashboard.quotes).toBeDefined();
      expect(dashboard.claims).toBeDefined();
      expect(dashboard.conversionRate).toBeDefined();
      expect(dashboard.responseTime).toBeDefined();
      expect(dashboard.trend).toMatch(/up|down|stable/);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health metrics', async () => {
      const health = await service.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.apiResponseTime).toBeGreaterThan(0);
      expect(health.activeConnections).toBeGreaterThan(0);
      expect(health.errorRate).toBeGreaterThanOrEqual(0);
      expect(health.throughput).toBeGreaterThan(0);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return array of alerts', async () => {
      const alerts = await service.getActiveAlerts();

      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert.metric).toBeDefined();
        expect(alert.currentValue).toBeDefined();
        expect(alert.threshold).toBeDefined();
        expect(alert.severity).toMatch(/low|medium|high|critical/);
        expect(alert.message).toBeDefined();
        expect(alert.triggeredAt).toBeDefined();
      });
    });
  });

  describe('getTopPerformers', () => {
    it('should return top agents', async () => {
      const performers = await service.getTopPerformers('agent', 5);

      expect(Array.isArray(performers)).toBe(true);
      expect(performers).toHaveLength(5);

      performers.forEach((performer, index) => {
        expect(performer.id).toBeDefined();
        expect(performer.name).toBeDefined();
        expect(performer.value).toBeGreaterThanOrEqual(0);
        expect(performer.rank).toBe(index + 1);
      });
    });

    it('should return top products', async () => {
      const performers = await service.getTopPerformers('product', 10);

      expect(Array.isArray(performers)).toBe(true);
      expect(performers).toHaveLength(10);
    });
  });

  describe('clearCache', () => {
    it('should clear metrics cache', () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
