import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface ChartConfig {
  type: ChartType;
  title?: string;
  data: any;
  options?: ChartOptions;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'area'
  | 'radar'
  | 'polarArea'
  | 'bubble'
  | 'heatmap'
  | 'funnel'
  | 'gauge'
  | 'waterfall'
  | 'sankey'
  | 'treemap';

export interface ChartOptions {
  width?: number;
  height?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  legend?: LegendOptions;
  tooltip?: TooltipOptions;
  colors?: string[];
  theme?: 'light' | 'dark';
  animation?: boolean;
  xAxis?: AxisOptions;
  yAxis?: AxisOptions;
  grid?: GridOptions;
  stacked?: boolean;
  fill?: boolean;
}

export interface LegendOptions {
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export interface TooltipOptions {
  enabled?: boolean;
  mode?: 'point' | 'nearest' | 'index' | 'dataset';
  intersect?: boolean;
}

export interface AxisOptions {
  display?: boolean;
  title?: string;
  min?: number;
  max?: number;
  grid?: boolean;
  ticks?: {
    stepSize?: number;
    callback?: string;
  };
}

export interface GridOptions {
  display?: boolean;
  color?: string;
  lineWidth?: number;
}

export interface ChartData {
  type: ChartType;
  config: any;
  image?: string; // Base64 encoded image
}

export interface TimeSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

export interface CategoricalData {
  categories: string[];
  values: number[];
  series?: Array<{
    name: string;
    data: number[];
  }>;
}

export interface ProportionData {
  labels: string[];
  values: number[];
}

export interface XYData {
  points: Array<{
    x: number;
    y: number;
    label?: string;
  }>;
  series?: Array<{
    name: string;
    points: Array<{ x: number; y: number }>;
  }>;
}

export interface MatrixData {
  rows: string[];
  columns: string[];
  values: number[][];
}

export interface LineChart extends ChartData {
  type: 'line';
}

export interface BarChart extends ChartData {
  type: 'bar';
}

export interface PieChart extends ChartData {
  type: 'pie';
}

export interface ScatterChart extends ChartData {
  type: 'scatter';
}

export interface Heatmap extends ChartData {
  type: 'heatmap';
}

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);

  private readonly DEFAULT_COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  /**
   * Generate chart from configuration
   */
  async generateChart(config: ChartConfig): Promise<ChartData> {
    this.logger.log(`Generating ${config.type} chart`);

    const validation = await this.validateConfig(config);
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid chart config: ${validation.errors.join(', ')}`);
    }

    const chartData = this.buildChartData(config);

    return {
      type: config.type,
      config: chartData,
    };
  }

  /**
   * Get supported chart types
   */
  async getSupportedChartTypes(): Promise<ChartType[]> {
    return [
      'line',
      'bar',
      'pie',
      'doughnut',
      'scatter',
      'area',
      'radar',
      'polarArea',
      'bubble',
      'heatmap',
      'funnel',
      'gauge',
      'waterfall',
      'sankey',
      'treemap',
    ];
  }

  /**
   * Validate chart configuration
   */
  async validateConfig(config: ChartConfig): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Chart type is required');
    }

    const supportedTypes = await this.getSupportedChartTypes();
    if (!supportedTypes.includes(config.type)) {
      errors.push(`Unsupported chart type: ${config.type}`);
    }

    if (!config.data) {
      errors.push('Chart data is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== SPECIFIC CHART TYPES ====================

  /**
   * Create line chart (trends over time)
   */
  async lineChart(data: TimeSeriesData, options: ChartOptions = {}): Promise<LineChart> {
    this.logger.log('Creating line chart');

    const config: ChartConfig = {
      type: 'line',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
        fill: options.fill ?? false,
      },
    };

    const chart = await this.generateChart(config);
    return chart as LineChart;
  }

  /**
   * Create bar chart (comparisons)
   */
  async barChart(data: CategoricalData, options: ChartOptions = {}): Promise<BarChart> {
    this.logger.log('Creating bar chart');

    const config: ChartConfig = {
      type: 'bar',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    const chart = await this.generateChart(config);
    return chart as BarChart;
  }

  /**
   * Create pie chart (proportions)
   */
  async pieChart(data: ProportionData, options: ChartOptions = {}): Promise<PieChart> {
    this.logger.log('Creating pie chart');

    const config: ChartConfig = {
      type: 'pie',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    const chart = await this.generateChart(config);
    return chart as PieChart;
  }

  /**
   * Create scatter chart (correlations)
   */
  async scatterChart(data: XYData, options: ChartOptions = {}): Promise<ScatterChart> {
    this.logger.log('Creating scatter chart');

    const config: ChartConfig = {
      type: 'scatter',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    const chart = await this.generateChart(config);
    return chart as ScatterChart;
  }

  /**
   * Create heatmap (patterns across dimensions)
   */
  async heatmap(data: MatrixData, options: ChartOptions = {}): Promise<Heatmap> {
    this.logger.log('Creating heatmap');

    const config: ChartConfig = {
      type: 'heatmap',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    const chart = await this.generateChart(config);
    return chart as Heatmap;
  }

  /**
   * Create area chart (volume over time)
   */
  async areaChart(data: TimeSeriesData, options: ChartOptions = {}): Promise<ChartData> {
    this.logger.log('Creating area chart');

    const config: ChartConfig = {
      type: 'area',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
        fill: true,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create funnel chart (conversion rates)
   */
  async funnelChart(data: CategoricalData, options: ChartOptions = {}): Promise<ChartData> {
    this.logger.log('Creating funnel chart');

    const config: ChartConfig = {
      type: 'funnel',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create gauge chart (single metric with target)
   */
  async gaugeChart(
    value: number,
    min: number,
    max: number,
    options: ChartOptions = {},
  ): Promise<ChartData> {
    this.logger.log('Creating gauge chart');

    const config: ChartConfig = {
      type: 'gauge',
      data: { value, min, max },
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create waterfall chart (cumulative changes)
   */
  async waterfallChart(data: CategoricalData, options: ChartOptions = {}): Promise<ChartData> {
    this.logger.log('Creating waterfall chart');

    const config: ChartConfig = {
      type: 'waterfall',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create sankey diagram (flow between categories)
   */
  async sankeyChart(
    data: {
      nodes: Array<{ id: string; label: string }>;
      links: Array<{ source: string; target: string; value: number }>;
    },
    options: ChartOptions = {},
  ): Promise<ChartData> {
    this.logger.log('Creating sankey diagram');

    const config: ChartConfig = {
      type: 'sankey',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create treemap (hierarchical data)
   */
  async treemapChart(
    data: {
      name: string;
      value?: number;
      children?: any[];
    },
    options: ChartOptions = {},
  ): Promise<ChartData> {
    this.logger.log('Creating treemap');

    const config: ChartConfig = {
      type: 'treemap',
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  /**
   * Create combo chart (multiple chart types)
   */
  async comboChart(
    data: {
      labels: string[];
      datasets: Array<{
        type: ChartType;
        label: string;
        data: number[];
      }>;
    },
    options: ChartOptions = {},
  ): Promise<ChartData> {
    this.logger.log('Creating combo chart');

    const config: ChartConfig = {
      type: 'line', // Base type
      data,
      options: {
        ...this.getDefaultOptions(),
        ...options,
      },
    };

    return this.generateChart(config);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Convert data format for different chart libraries
   */
  convertDataFormat(data: any, targetLibrary: 'chartjs' | 'recharts' | 'echarts'): any {
    switch (targetLibrary) {
      case 'chartjs':
        return this.toChartJsFormat(data);
      case 'recharts':
        return this.toRechartsFormat(data);
      case 'echarts':
        return this.toEchartsFormat(data);
      default:
        return data;
    }
  }

  /**
   * Get recommended chart type for data
   */
  getRecommendedChartType(data: any): ChartType {
    if (this.isTimeSeriesData(data)) {
      return 'line';
    }
    if (this.isCategoricalData(data)) {
      return 'bar';
    }
    if (this.isProportionData(data)) {
      return 'pie';
    }
    if (this.isXYData(data)) {
      return 'scatter';
    }
    return 'bar'; // Default
  }

  /**
   * Apply theme to chart
   */
  applyTheme(config: ChartConfig, theme: 'light' | 'dark'): ChartConfig {
    const themed = { ...config };

    if (theme === 'dark') {
      themed.options = {
        ...themed.options,
        colors: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
        grid: {
          color: '#374151',
        },
      };
    } else {
      themed.options = {
        ...themed.options,
        colors: this.DEFAULT_COLORS,
        grid: {
          color: '#e5e7eb',
        },
      };
    }

    return themed;
  }

  /**
   * Export chart as image (PNG/SVG)
   */
  async exportChartAsImage(
    chartId: string,
    format: 'png' | 'svg' = 'png',
  ): Promise<Buffer> {
    this.logger.log(`Exporting chart ${chartId} as ${format}`);

    // In production, use puppeteer or canvas to render chart
    // Mock implementation
    return Buffer.from(`Chart ${chartId} exported as ${format}`);
  }

  /**
   * Generate responsive chart configuration
   */
  makeResponsive(config: ChartConfig): ChartConfig {
    return {
      ...config,
      options: {
        ...config.options,
        responsive: true,
        maintainAspectRatio: true,
      },
    };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private buildChartData(config: ChartConfig): any {
    const baseConfig = {
      type: config.type,
      data: this.formatDataForChart(config.type, config.data),
      options: this.mergeOptions(config.options),
    };

    return baseConfig;
  }

  private formatDataForChart(type: ChartType, data: any): any {
    switch (type) {
      case 'line':
      case 'bar':
      case 'area':
        return this.formatTimeSeriesData(data);
      case 'pie':
      case 'doughnut':
        return this.formatProportionData(data);
      case 'scatter':
      case 'bubble':
        return this.formatXYData(data);
      case 'heatmap':
        return this.formatMatrixData(data);
      default:
        return data;
    }
  }

  private formatTimeSeriesData(data: TimeSeriesData): any {
    return {
      labels: data.labels,
      datasets: data.datasets.map((dataset, index) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: this.DEFAULT_COLORS[index % this.DEFAULT_COLORS.length],
        backgroundColor: this.addAlpha(
          this.DEFAULT_COLORS[index % this.DEFAULT_COLORS.length],
          0.2,
        ),
      })),
    };
  }

  private formatProportionData(data: ProportionData): any {
    return {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: this.DEFAULT_COLORS.slice(0, data.labels.length),
        },
      ],
    };
  }

  private formatXYData(data: XYData): any {
    if (data.series) {
      return {
        datasets: data.series.map((series, index) => ({
          label: series.name,
          data: series.points,
          backgroundColor: this.DEFAULT_COLORS[index % this.DEFAULT_COLORS.length],
        })),
      };
    }

    return {
      datasets: [
        {
          label: 'Data Points',
          data: data.points,
          backgroundColor: this.DEFAULT_COLORS[0],
        },
      ],
    };
  }

  private formatMatrixData(data: MatrixData): any {
    return {
      xLabels: data.columns,
      yLabels: data.rows,
      data: data.values,
    };
  }

  private mergeOptions(options?: ChartOptions): any {
    return {
      ...this.getDefaultOptions(),
      ...options,
    };
  }

  private getDefaultOptions(): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
      animation: true,
      colors: this.DEFAULT_COLORS,
    };
  }

  private addAlpha(color: string, alpha: number): string {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private isTimeSeriesData(data: any): boolean {
    return data.labels && Array.isArray(data.labels) && data.datasets;
  }

  private isCategoricalData(data: any): boolean {
    return data.categories && data.values;
  }

  private isProportionData(data: any): boolean {
    return data.labels && data.values && !data.datasets;
  }

  private isXYData(data: any): boolean {
    return data.points && Array.isArray(data.points) && data.points[0]?.x !== undefined;
  }

  private toChartJsFormat(data: any): any {
    // Already in Chart.js format
    return data;
  }

  private toRechartsFormat(data: any): any {
    // Convert to Recharts format
    if (data.labels && data.datasets) {
      return data.labels.map((label: string, index: number) => {
        const point: any = { name: label };
        data.datasets.forEach((dataset: any) => {
          point[dataset.label] = dataset.data[index];
        });
        return point;
      });
    }
    return data;
  }

  private toEchartsFormat(data: any): any {
    // Convert to ECharts format
    return {
      xAxis: {
        type: 'category',
        data: data.labels,
      },
      yAxis: {
        type: 'value',
      },
      series: data.datasets?.map((dataset: any) => ({
        name: dataset.label,
        type: 'line',
        data: dataset.data,
      })),
    };
  }
}
