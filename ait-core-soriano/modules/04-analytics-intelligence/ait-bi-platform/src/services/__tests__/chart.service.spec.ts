import { Test, TestingModule } from '@nestjs/testing';
import { ChartService, ChartConfig } from '../chart.service';

describe('ChartService', () => {
  let service: ChartService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChartService],
    }).compile();

    service = module.get<ChartService>(ChartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateChart', () => {
    it('should generate line chart', async () => {
      const config: ChartConfig = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ label: 'Sales', data: [100, 200, 150] }],
        },
      };

      const chart = await service.generateChart(config);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('line');
      expect(chart.config).toBeDefined();
    });

    it('should throw error for invalid config', async () => {
      const config: ChartConfig = {
        type: 'invalid' as any,
        data: {},
      };

      await expect(service.generateChart(config)).rejects.toThrow();
    });
  });

  describe('getSupportedChartTypes', () => {
    it('should return list of supported chart types', async () => {
      const types = await service.getSupportedChartTypes();

      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('line');
      expect(types).toContain('bar');
      expect(types).toContain('pie');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', async () => {
      const config: ChartConfig = {
        type: 'line',
        data: { labels: [], datasets: [] },
      };

      const validation = await service.validateConfig(config);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing type', async () => {
      const config: ChartConfig = {
        type: null as any,
        data: {},
      };

      const validation = await service.validateConfig(config);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing data', async () => {
      const config: ChartConfig = {
        type: 'line',
        data: null as any,
      };

      const validation = await service.validateConfig(config);

      expect(validation.isValid).toBe(false);
    });
  });

  describe('lineChart', () => {
    it('should create line chart', async () => {
      const data = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Revenue', data: [1000, 1500, 1200] }],
      };

      const chart = await service.lineChart(data);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('line');
    });
  });

  describe('barChart', () => {
    it('should create bar chart', async () => {
      const data = {
        categories: ['A', 'B', 'C'],
        values: [10, 20, 15],
      };

      const chart = await service.barChart(data);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('bar');
    });
  });

  describe('pieChart', () => {
    it('should create pie chart', async () => {
      const data = {
        labels: ['Auto', 'Home', 'Life'],
        values: [40, 35, 25],
      };

      const chart = await service.pieChart(data);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('pie');
    });
  });

  describe('scatterChart', () => {
    it('should create scatter chart', async () => {
      const data = {
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 3 },
        ],
      };

      const chart = await service.scatterChart(data);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('scatter');
    });
  });

  describe('heatmap', () => {
    it('should create heatmap', async () => {
      const data = {
        rows: ['Mon', 'Tue', 'Wed'],
        columns: ['9AM', '12PM', '3PM'],
        values: [
          [10, 20, 15],
          [15, 25, 20],
          [20, 30, 25],
        ],
      };

      const chart = await service.heatmap(data);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('heatmap');
    });
  });

  describe('gaugeChart', () => {
    it('should create gauge chart', async () => {
      const chart = await service.gaugeChart(75, 0, 100);

      expect(chart).toBeDefined();
      expect(chart.type).toBe('gauge');
    });
  });

  describe('convertDataFormat', () => {
    it('should convert to Chart.js format', () => {
      const data = {
        labels: ['A', 'B'],
        datasets: [{ label: 'Test', data: [1, 2] }],
      };

      const converted = service.convertDataFormat(data, 'chartjs');

      expect(converted).toBeDefined();
    });

    it('should convert to Recharts format', () => {
      const data = {
        labels: ['A', 'B'],
        datasets: [{ label: 'Test', data: [1, 2] }],
      };

      const converted = service.convertDataFormat(data, 'recharts');

      expect(Array.isArray(converted)).toBe(true);
    });

    it('should convert to ECharts format', () => {
      const data = {
        labels: ['A', 'B'],
        datasets: [{ label: 'Test', data: [1, 2] }],
      };

      const converted = service.convertDataFormat(data, 'echarts');

      expect(converted).toBeDefined();
      expect(converted.xAxis).toBeDefined();
      expect(converted.yAxis).toBeDefined();
    });
  });

  describe('getRecommendedChartType', () => {
    it('should recommend line chart for time series', () => {
      const data = {
        labels: ['2024-01', '2024-02'],
        datasets: [{ label: 'Sales', data: [100, 200] }],
      };

      const type = service.getRecommendedChartType(data);

      expect(type).toBe('line');
    });

    it('should recommend pie chart for proportions', () => {
      const data = {
        labels: ['A', 'B', 'C'],
        values: [30, 40, 30],
      };

      const type = service.getRecommendedChartType(data);

      expect(type).toBe('pie');
    });
  });

  describe('applyTheme', () => {
    it('should apply dark theme', () => {
      const config: ChartConfig = {
        type: 'line',
        data: {},
      };

      const themed = service.applyTheme(config, 'dark');

      expect(themed.options).toBeDefined();
      expect(themed.options.colors).toBeDefined();
    });

    it('should apply light theme', () => {
      const config: ChartConfig = {
        type: 'line',
        data: {},
      };

      const themed = service.applyTheme(config, 'light');

      expect(themed.options).toBeDefined();
    });
  });

  describe('makeResponsive', () => {
    it('should make chart responsive', () => {
      const config: ChartConfig = {
        type: 'line',
        data: {},
      };

      const responsive = service.makeResponsive(config);

      expect(responsive.options.responsive).toBe(true);
      expect(responsive.options.maintainAspectRatio).toBe(true);
    });
  });

  describe('exportChartAsImage', () => {
    it('should export chart as PNG', async () => {
      const buffer = await service.exportChartAsImage('chart-123', 'png');

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should export chart as SVG', async () => {
      const buffer = await service.exportChartAsImage('chart-123', 'svg');

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });
});
