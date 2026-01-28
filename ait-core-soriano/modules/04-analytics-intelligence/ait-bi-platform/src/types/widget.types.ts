export enum WidgetType {
  NUMBER_CARD = 'NUMBER_CARD',
  LINE_CHART = 'LINE_CHART',
  BAR_CHART = 'BAR_CHART',
  PIE_CHART = 'PIE_CHART',
  AREA_CHART = 'AREA_CHART',
  FUNNEL_CHART = 'FUNNEL_CHART',
  GAUGE_CHART = 'GAUGE_CHART',
  HEATMAP = 'HEATMAP',
  TABLE = 'TABLE',
  LEADERBOARD = 'LEADERBOARD',
  SPARKLINE = 'SPARKLINE',
  PROGRESS_BAR = 'PROGRESS_BAR',
  MAP = 'MAP',
  TIMELINE = 'TIMELINE',
  CUSTOM = 'CUSTOM',
}

export interface WidgetConfig {
  type: WidgetType;
  title: string;
  description?: string;
  dataSource: string;
  query?: any;
  refreshInterval?: number;
  filters?: any;
  options?: WidgetOptions;
}

export interface WidgetOptions {
  // Chart options
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  colors?: string[];

  // Number card options
  prefix?: string;
  suffix?: string;
  decimals?: number;
  showTrend?: boolean;
  comparisonPeriod?: string;

  // Table options
  columns?: ColumnConfig[];
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;

  // Gauge options
  min?: number;
  max?: number;
  thresholds?: Threshold[];

  // Map options
  zoom?: number;
  center?: [number, number];
  markers?: boolean;

  // Generic options
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
}

export interface ColumnConfig {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  format?: string;
}

export interface Threshold {
  value: number;
  color: string;
  label?: string;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  metadata?: {
    lastUpdated: Date;
    source: string;
    recordCount?: number;
  };
}

export interface AddWidgetDto {
  config: WidgetConfig;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UpdateWidgetDto {
  config?: Partial<WidgetConfig>;
  position?: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}
