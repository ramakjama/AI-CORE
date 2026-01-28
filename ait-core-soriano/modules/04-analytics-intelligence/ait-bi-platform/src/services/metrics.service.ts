import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Period,
  KPICollection,
  TimeSeries,
  MetricComparison,
  Trend,
  MetricPoint,
  MetricFilters,
  AggregatedMetric,
} from '../types/metrics.types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format } from 'date-fns';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    // Inject repositories as needed
    // @InjectRepository(Policy) private policyRepo: Repository<Policy>,
    // @InjectRepository(Claim) private claimRepo: Repository<Claim>,
    // @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  /**
   * Get all KPIs for a given period
   */
  async getKPIs(period: Period, filters?: MetricFilters): Promise<KPICollection> {
    this.logger.log(`Calculating KPIs for period: ${period.startDate} to ${period.endDate}`);

    const [
      revenue,
      grossPremium,
      netPremium,
      earnedPremium,
      commissionRevenue,
      investmentIncome,
      policies,
      newPolicies,
      renewedPolicies,
      canceledPolicies,
      activePolicies,
      pendingPolicies,
      claims,
      paidClaims,
      reservedClaims,
      rejectedClaims,
      claimAmount,
      customers,
      newCustomers,
      activeCustomers,
      churnedCustomers,
      quotes,
    ] = await Promise.all([
      this.getTotalRevenue(period, filters),
      this.getGrossPremium(period, filters),
      this.getNetPremium(period, filters),
      this.getEarnedPremium(period, filters),
      this.getCommissionRevenue(period, filters),
      this.getInvestmentIncome(period, filters),
      this.getPolicyCount(period, filters),
      this.getNewPolicies(period, filters),
      this.getRenewedPolicies(period, filters),
      this.getCanceledPolicies(period, filters),
      this.getActivePolicies(period, filters),
      this.getPendingPolicies(period, filters),
      this.getClaimCount(period, filters),
      this.getPaidClaims(period, filters),
      this.getReservedClaims(period, filters),
      this.getRejectedClaims(period, filters),
      this.getTotalClaimAmount(period, filters),
      this.getCustomerCount(period, filters),
      this.getNewCustomers(period, filters),
      this.getActiveCustomers(period, filters),
      this.getChurnedCustomers(period, filters),
      this.getQuoteCount(period, filters),
    ]);

    const averageClaimAmount = claims > 0 ? claimAmount / claims : 0;
    const retention = customers > 0 ? ((customers - churnedCustomers) / customers) * 100 : 0;
    const churn = customers > 0 ? (churnedCustomers / customers) * 100 : 0;
    const conversionRate = quotes > 0 ? (newPolicies / quotes) * 100 : 0;

    // Calculate advanced metrics
    const ltv = await this.getCustomerLTV(period, filters);
    const cac = await this.getCustomerAcquisitionCost(period, filters);
    const lossRatio = await this.getLossRatio(period, filters);
    const expenseRatio = await this.getExpenseRatio(period, filters);
    const combinedRatio = lossRatio + expenseRatio;
    const averageResponseTime = await this.getAverageResponseTime(period, filters);

    return {
      revenue,
      grossPremium,
      netPremium,
      earnedPremium,
      commissionRevenue,
      investmentIncome,
      policies,
      newPolicies,
      renewedPolicies,
      canceledPolicies,
      activePolicies,
      pendingPolicies,
      claims,
      paidClaims,
      reservedClaims,
      rejectedClaims,
      claimAmount,
      averageClaimAmount,
      customers,
      newCustomers,
      activeCustomers,
      churnedCustomers,
      retention,
      churn,
      ltv,
      cac,
      quotes,
      conversionRate,
      averageResponseTime,
      lossRatio,
      expenseRatio,
      combinedRatio,
    };
  }

  /**
   * Get metric time series with specified granularity
   */
  async getMetricTimeSeries(
    metric: string,
    period: Period,
    granularity: 'day' | 'week' | 'month' = 'day',
    filters?: MetricFilters,
  ): Promise<TimeSeries> {
    this.logger.log(`Generating time series for ${metric} with ${granularity} granularity`);

    const intervals = this.generateIntervals(period, granularity);
    const points: MetricPoint[] = [];

    for (const interval of intervals) {
      const value = await this.getMetricValue(metric, interval, filters);
      points.push({
        timestamp: interval.startDate,
        value,
        label: format(interval.startDate, this.getDateFormat(granularity)),
      });
    }

    return {
      metric,
      period,
      granularity,
      points,
      aggregation: 'sum',
    };
  }

  /**
   * Compare metrics between two periods
   */
  async compareMetrics(
    metric: string,
    period1: Period,
    period2: Period,
    filters?: MetricFilters,
  ): Promise<MetricComparison> {
    this.logger.log(`Comparing ${metric} between two periods`);

    const [value1, value2] = await Promise.all([
      this.getMetricValue(metric, period1, filters),
      this.getMetricValue(metric, period2, filters),
    ]);

    const absoluteChange = value2 - value1;
    const percentageChange = value1 !== 0 ? ((value2 - value1) / value1) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentageChange) > 5) {
      trend = percentageChange > 0 ? 'up' : 'down';
    }

    return {
      metric,
      period1,
      period2,
      value1,
      value2,
      absoluteChange,
      percentageChange,
      trend,
    };
  }

  /**
   * Calculate growth rate for a metric
   */
  async getGrowthRate(metric: string, period: Period, filters?: MetricFilters): Promise<number> {
    const duration = differenceInDays(period.endDate, period.startDate);
    const previousPeriod: Period = {
      startDate: new Date(period.startDate.getTime() - duration * 24 * 60 * 60 * 1000),
      endDate: period.startDate,
    };

    const comparison = await this.compareMetrics(metric, previousPeriod, period, filters);
    return comparison.percentageChange;
  }

  /**
   * Analyze trend for a metric across multiple periods
   */
  async getTrend(metric: string, periods: Period[], filters?: MetricFilters): Promise<Trend> {
    this.logger.log(`Analyzing trend for ${metric} across ${periods.length} periods`);

    const values = await Promise.all(
      periods.map(period => this.getMetricValue(metric, period, filters)),
    );

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (rSquared < 0.5) {
      direction = 'volatile';
    } else if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Simple forecast for next 3 periods
    const forecast: MetricPoint[] = [];
    for (let i = 0; i < 3; i++) {
      const forecastValue = slope * (n + i) + intercept;
      forecast.push({
        timestamp: new Date(periods[periods.length - 1].endDate.getTime() + (i + 1) * 30 * 24 * 60 * 60 * 1000),
        value: Math.max(0, forecastValue), // Ensure non-negative
      });
    }

    return {
      metric,
      direction,
      slope,
      confidence: rSquared,
      forecast,
    };
  }

  /**
   * Get aggregated metric with breakdown
   */
  async getAggregatedMetric(
    metric: string,
    period: Period,
    groupBy: 'product' | 'region' | 'channel' | 'agent',
    filters?: MetricFilters,
  ): Promise<AggregatedMetric> {
    this.logger.log(`Aggregating ${metric} by ${groupBy}`);

    // This would query the database and group by the specified dimension
    // Mock implementation
    const value = await this.getMetricValue(metric, period, filters);
    const breakdown: Record<string, number> = {
      'Group A': value * 0.4,
      'Group B': value * 0.35,
      'Group C': value * 0.25,
    };

    return {
      metric,
      value,
      breakdown,
      filters,
    };
  }

  // ==================== INDIVIDUAL METRIC CALCULATIONS ====================

  private async getTotalRevenue(period: Period, filters?: MetricFilters): Promise<number> {
    // Mock: In production, query from database
    return Math.random() * 1000000 + 500000;
  }

  private async getGrossPremium(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.random() * 800000 + 400000;
  }

  private async getNetPremium(period: Period, filters?: MetricFilters): Promise<number> {
    const gross = await this.getGrossPremium(period, filters);
    return gross * 0.85; // 15% commission typically
  }

  private async getEarnedPremium(period: Period, filters?: MetricFilters): Promise<number> {
    const net = await this.getNetPremium(period, filters);
    return net * 0.9; // 90% earned
  }

  private async getCommissionRevenue(period: Period, filters?: MetricFilters): Promise<number> {
    const gross = await this.getGrossPremium(period, filters);
    return gross * 0.15;
  }

  private async getInvestmentIncome(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.random() * 50000 + 10000;
  }

  private async getPolicyCount(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 1000 + 500);
  }

  private async getNewPolicies(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 200 + 100);
  }

  private async getRenewedPolicies(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 150 + 75);
  }

  private async getCanceledPolicies(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 50 + 10);
  }

  private async getActivePolicies(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 800 + 400);
  }

  private async getPendingPolicies(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 50 + 20);
  }

  private async getClaimCount(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 100 + 50);
  }

  private async getPaidClaims(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 60 + 30);
  }

  private async getReservedClaims(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 30 + 15);
  }

  private async getRejectedClaims(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 10 + 5);
  }

  private async getTotalClaimAmount(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.random() * 500000 + 200000;
  }

  private async getCustomerCount(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 5000 + 2000);
  }

  private async getNewCustomers(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 500 + 200);
  }

  private async getActiveCustomers(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 4000 + 1800);
  }

  private async getChurnedCustomers(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 100 + 50);
  }

  private async getQuoteCount(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.floor(Math.random() * 500 + 250);
  }

  private async getCustomerLTV(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.random() * 5000 + 2000;
  }

  private async getCustomerAcquisitionCost(period: Period, filters?: MetricFilters): Promise<number> {
    return Math.random() * 500 + 100;
  }

  private async getLossRatio(period: Period, filters?: MetricFilters): Promise<number> {
    const claims = await this.getTotalClaimAmount(period, filters);
    const earned = await this.getEarnedPremium(period, filters);
    return earned > 0 ? (claims / earned) * 100 : 0;
  }

  private async getExpenseRatio(period: Period, filters?: MetricFilters): Promise<number> {
    // Typically 20-30% of premium
    return Math.random() * 10 + 20;
  }

  private async getAverageResponseTime(period: Period, filters?: MetricFilters): Promise<number> {
    // In hours
    return Math.random() * 24 + 12;
  }

  // ==================== HELPER METHODS ====================

  private async getMetricValue(metric: string, period: Period, filters?: MetricFilters): Promise<number> {
    const methodMap: Record<string, (period: Period, filters?: MetricFilters) => Promise<number>> = {
      revenue: this.getTotalRevenue.bind(this),
      grossPremium: this.getGrossPremium.bind(this),
      netPremium: this.getNetPremium.bind(this),
      earnedPremium: this.getEarnedPremium.bind(this),
      policies: this.getPolicyCount.bind(this),
      newPolicies: this.getNewPolicies.bind(this),
      claims: this.getClaimCount.bind(this),
      claimAmount: this.getTotalClaimAmount.bind(this),
      customers: this.getCustomerCount.bind(this),
      newCustomers: this.getNewCustomers.bind(this),
    };

    const method = methodMap[metric];
    if (!method) {
      throw new Error(`Unknown metric: ${metric}`);
    }

    return method(period, filters);
  }

  private generateIntervals(period: Period, granularity: 'day' | 'week' | 'month'): Period[] {
    const intervals: Period[] = [];

    switch (granularity) {
      case 'day': {
        const days = eachDayOfInterval({ start: period.startDate, end: period.endDate });
        return days.map(day => ({
          startDate: startOfDay(day),
          endDate: endOfDay(day),
        }));
      }
      case 'week': {
        const weeks = eachWeekOfInterval({ start: period.startDate, end: period.endDate });
        return weeks.map(week => ({
          startDate: startOfWeek(week),
          endDate: endOfWeek(week),
        }));
      }
      case 'month': {
        const months = eachMonthOfInterval({ start: period.startDate, end: period.endDate });
        return months.map(month => ({
          startDate: startOfMonth(month),
          endDate: endOfMonth(month),
        }));
      }
      default:
        return intervals;
    }
  }

  private getDateFormat(granularity: 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'day':
        return 'yyyy-MM-dd';
      case 'week':
        return 'yyyy-\'W\'ww';
      case 'month':
        return 'yyyy-MM';
      default:
        return 'yyyy-MM-dd';
    }
  }
}
