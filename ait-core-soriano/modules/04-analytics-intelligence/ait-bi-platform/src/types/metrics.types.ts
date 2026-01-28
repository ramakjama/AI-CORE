export interface Period {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface KPICollection {
  // Revenue & Financial
  revenue: number;
  grossPremium: number;
  netPremium: number;
  earnedPremium: number;
  commissionRevenue: number;
  investmentIncome: number;

  // Policy Metrics
  policies: number;
  newPolicies: number;
  renewedPolicies: number;
  canceledPolicies: number;
  activePolicies: number;
  pendingPolicies: number;

  // Claims Metrics
  claims: number;
  paidClaims: number;
  reservedClaims: number;
  rejectedClaims: number;
  claimAmount: number;
  averageClaimAmount: number;

  // Customer Metrics
  customers: number;
  newCustomers: number;
  activeCustomers: number;
  churnedCustomers: number;
  retention: number;
  churn: number;
  ltv: number;
  cac: number;

  // Operational Metrics
  quotes: number;
  conversionRate: number;
  averageResponseTime: number;

  // Ratios
  lossRatio: number;
  expenseRatio: number;
  combinedRatio: number;
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TimeSeries {
  metric: string;
  period: Period;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  points: MetricPoint[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface MetricComparison {
  metric: string;
  period1: Period;
  period2: Period;
  value1: number;
  value2: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Trend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  confidence: number;
  forecast?: MetricPoint[];
}

export interface MetricFilters {
  productType?: string[];
  region?: string[];
  channel?: string[];
  agentId?: string[];
  customerId?: string[];
  status?: string[];
}

export interface AggregatedMetric {
  metric: string;
  value: number;
  breakdown: Record<string, number>;
  filters?: MetricFilters;
}
