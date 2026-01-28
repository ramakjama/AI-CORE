/**
 * Cash Flow Interfaces
 */

export interface CashFlowStatement {
  period: Period;
  operatingActivities: OperatingActivities;
  investingActivities: InvestingActivities;
  financingActivities: FinancingActivities;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  generatedAt: Date;
}

export interface Period {
  startDate: Date;
  endDate: Date;
  label?: string;
}

export interface OperatingActivities {
  receiptsFromCustomers: number;
  premiumCollections: number;
  commissionReceived: number;
  paymentsToSuppliers: number;
  claimPayments: number;
  salaryPayments: number;
  taxPayments: number;
  socialSecurityPayments: number;
  rentPayments: number;
  utilitiesPayments: number;
  insurancePayments: number;
  otherOperating: number;
  netOperating: number;
}

export interface InvestingActivities {
  purchaseOfAssets: number;
  saleOfAssets: number;
  purchaseOfInvestments: number;
  saleOfInvestments: number;
  interestReceived: number;
  dividendsReceived: number;
  netInvesting: number;
}

export interface FinancingActivities {
  loansReceived: number;
  loanRepayments: number;
  interestPaid: number;
  dividendsPaid: number;
  capitalContributions: number;
  capitalWithdrawals: number;
  netFinancing: number;
}

export interface CashFlowComparison {
  period1: Period;
  period2: Period;
  statement1: CashFlowStatement;
  statement2: CashFlowStatement;
  variance: CashFlowVariance;
  analysis: ComparisonAnalysis;
}

export interface CashFlowVariance {
  operatingActivities: {
    absolute: number;
    percentage: number;
    breakdown: Record<string, { absolute: number; percentage: number }>;
  };
  investingActivities: {
    absolute: number;
    percentage: number;
  };
  financingActivities: {
    absolute: number;
    percentage: number;
  };
  netCashFlow: {
    absolute: number;
    percentage: number;
  };
}

export interface ComparisonAnalysis {
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  keyChanges: KeyChange[];
  recommendations: string[];
  alerts: string[];
}

export interface KeyChange {
  category: string;
  description: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  amount: number;
  percentage: number;
}

export interface CashFlowProjection {
  month: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  endingBalance: number;
}

export interface BurnRate {
  monthlyBurnRate: number;
  averageMonthlyBurn: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  months: MonthlyBurn[];
}

export interface MonthlyBurn {
  month: string;
  operatingExpenses: number;
  revenue: number;
  netBurn: number;
}

export interface Runway {
  months: number;
  exhaustionDate: Date;
  currentBalance: number;
  monthlyBurn: number;
  scenario: 'OPTIMISTIC' | 'REALISTIC' | 'PESSIMISTIC';
  assumptions: string[];
  recommendations: string[];
}
