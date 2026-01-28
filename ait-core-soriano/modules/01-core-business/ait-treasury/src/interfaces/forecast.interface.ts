/**
 * Cash Forecast Interfaces
 */

export interface CashForecast {
  method: ForecastMethod;
  horizon: number;
  startDate: Date;
  endDate: Date;
  projections: MonthlyProjection[];
  scenarios: ScenarioAnalysis;
  confidence: ConfidenceMetrics;
  assumptions: string[];
  generatedAt: Date;
}

export type ForecastMethod = 'SIMPLE' | 'WEIGHTED' | 'REGRESSION' | 'ML';

export interface MonthlyProjection {
  month: string;
  date: Date;
  expectedInflow: number;
  inflowBreakdown: InflowBreakdown;
  expectedOutflow: number;
  outflowBreakdown: OutflowBreakdown;
  netCashFlow: number;
  projectedBalance: number;
  confidence: number;
  factors: ProjectionFactor[];
}

export interface InflowBreakdown {
  premiums: number;
  renewals: number;
  newPolicies: number;
  commissions: number;
  investments: number;
  other: number;
}

export interface OutflowBreakdown {
  claims: number;
  salaries: number;
  suppliers: number;
  taxes: number;
  socialSecurity: number;
  rent: number;
  utilities: number;
  marketing: number;
  technology: number;
  other: number;
}

export interface ProjectionFactor {
  name: string;
  impact: number;
  weight: number;
  description: string;
}

export interface ScenarioAnalysis {
  optimistic: ScenarioProjection;
  realistic: ScenarioProjection;
  pessimistic: ScenarioProjection;
}

export interface ScenarioProjection {
  finalBalance: number;
  averageMonthlyFlow: number;
  lowestBalance: number;
  lowestBalanceMonth: string;
  probability: number;
  keyAssumptions: string[];
}

export interface ConfidenceMetrics {
  overall: number;
  shortTerm: number; // 1-3 months
  mediumTerm: number; // 4-6 months
  longTerm: number; // 7-12 months
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  impact: 'POSITIVE' | 'NEGATIVE';
  weight: number;
  description: string;
}

export interface CategoryForecast {
  category: string;
  type: 'INFLOW' | 'OUTFLOW';
  projections: MonthlyProjection[];
  historicalAverage: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  seasonality: SeasonalityPattern;
}

export interface SeasonalityPattern {
  detected: boolean;
  pattern: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'NONE';
  peakMonths: number[];
  lowMonths: number[];
  factor: number;
}

export interface Variance {
  period: Period;
  forecast: CashForecast;
  actual: ActualCashFlow;
  totalVariance: number;
  variancePercentage: number;
  byCategory: CategoryVariance[];
  analysis: VarianceAnalysis;
}

export interface ActualCashFlow {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  endingBalance: number;
  breakdown: {
    inflow: InflowBreakdown;
    outflow: OutflowBreakdown;
  };
}

export interface CategoryVariance {
  category: string;
  forecast: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  reason?: string;
}

export interface VarianceAnalysis {
  accuracy: number;
  trend: 'OVER_FORECAST' | 'UNDER_FORECAST' | 'ACCURATE';
  majorDiscrepancies: CategoryVariance[];
  improvements: string[];
  alerts: string[];
}

export interface Period {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface ForecastRequest {
  months: number;
  method?: ForecastMethod;
  includeScenarios?: boolean;
  includeSeasonality?: boolean;
  confidenceLevel?: number;
}
