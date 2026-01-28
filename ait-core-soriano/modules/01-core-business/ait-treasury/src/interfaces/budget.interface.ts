/**
 * Budget Management Interfaces
 */

export interface Budget {
  id: string;
  name: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'EXCEEDED';
  alertThreshold: number; // percentage
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export type BudgetCategory =
  | 'MARKETING'
  | 'TECHNOLOGY'
  | 'OPERATIONS'
  | 'SALARIES'
  | 'RENT'
  | 'UTILITIES'
  | 'TRAVEL'
  | 'TRAINING'
  | 'LEGAL'
  | 'ACCOUNTING'
  | 'INSURANCE'
  | 'OTHER';

export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface BudgetTracking {
  budgetId: string;
  budget: Budget;
  spent: number;
  remaining: number;
  utilization: number; // percentage
  trend: 'ON_TRACK' | 'UNDER_BUDGET' | 'OVER_BUDGET' | 'AT_RISK';
  expenses: Expense[];
  projectedSpend: number;
  daysRemaining: number;
  dailyBurnRate: number;
  alerts: BudgetAlert[];
  lastUpdate: Date;
}

export interface Expense {
  id: string;
  budgetId: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  vendor?: string;
  invoiceNumber?: string;
  date: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  metadata?: Record<string, any>;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'THRESHOLD_REACHED' | 'OVERSPEND' | 'PROJECTED_OVERSPEND' | 'UNDERSPEND';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  currentUtilization: number;
  threshold: number;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface BudgetStatus {
  budgetId: string;
  name: string;
  totalBudget: number;
  spent: number;
  remaining: number;
  utilization: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  daysElapsed: number;
  daysRemaining: number;
  expectedUtilization: number;
  variance: number;
  projectedFinalSpend: number;
  recommendations: string[];
}

export interface BudgetAllocation {
  category: BudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface BudgetReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallUtilization: number;
  byCategory: BudgetAllocation[];
  topExpenses: Expense[];
  trends: BudgetTrend[];
  alerts: BudgetAlert[];
  generatedAt: Date;
}

export interface BudgetTrend {
  month: string;
  budgeted: number;
  spent: number;
  variance: number;
  utilizationRate: number;
}

export interface BudgetComparison {
  currentPeriod: BudgetReport;
  previousPeriod: BudgetReport;
  variance: {
    absolute: number;
    percentage: number;
  };
  categoryComparison: CategoryComparison[];
  insights: string[];
}

export interface CategoryComparison {
  category: BudgetCategory;
  currentSpend: number;
  previousSpend: number;
  change: number;
  changePercentage: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface BudgetForecast {
  budgetId: string;
  currentUtilization: number;
  projectedEndUtilization: number;
  projectedOverspend: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}
