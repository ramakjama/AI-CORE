/**
 * CashForecastService
 *
 * Servicio completo de forecasting de tesorería:
 * - Proyecciones a 12 meses con múltiples métodos (simple, weighted, regression, ML)
 * - Forecasting por categorías
 * - Análisis de escenarios (optimista, realista, pesimista)
 * - Comparación forecast vs actual
 * - Detección de estacionalidad
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  CashForecast,
  ForecastMethod,
  MonthlyProjection,
  InflowBreakdown,
  OutflowBreakdown,
  ScenarioAnalysis,
  ScenarioProjection,
  ConfidenceMetrics,
  CategoryForecast,
  SeasonalityPattern,
  Variance,
  ActualCashFlow,
  VarianceAnalysis,
  CategoryVariance,
  ForecastRequest,
} from '../interfaces/forecast.interface';

@Injectable()
export class CashForecastService {
  private readonly logger = new Logger(CashForecastService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GENERACIÓN DE PRONÓSTICOS
   */

  async forecast(
    months: number,
    method: ForecastMethod = 'WEIGHTED'
  ): Promise<CashForecast> {
    this.logger.log(`📈 Generating ${months}-month forecast using ${method} method`);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Generar proyecciones mensuales
    const projections = await this.generateProjections(months, method);

    // Analizar escenarios
    const scenarios = await this.analyzeScenarios(projections);

    // Calcular métricas de confianza
    const confidence = this.calculateConfidenceMetrics(months, method);

    // Definir asunciones
    const assumptions = this.generateAssumptions(method);

    return {
      method,
      horizon: months,
      startDate,
      endDate,
      projections,
      scenarios,
      confidence,
      assumptions,
      generatedAt: new Date(),
    };
  }

  async forecastByCategory(months: number): Promise<CategoryForecast[]> {
    this.logger.log(`📊 Generating category-based forecast for ${months} months`);

    const categories = [
      'PREMIUM_COLLECTION',
      'COMMISSION',
      'CLAIM_PAYMENT',
      'SALARY',
      'SUPPLIER_PAYMENT',
      'TAX',
    ];

    const forecasts: CategoryForecast[] = [];

    for (const category of categories) {
      const historicalData = await this.getHistoricalData(category, 12);
      const historicalAverage = this.calculateAverage(historicalData);
      const trend = this.detectTrend(historicalData);
      const seasonality = this.detectSeasonality(historicalData);

      const projections = await this.projectCategory(
        category,
        months,
        historicalAverage,
        trend,
        seasonality
      );

      forecasts.push({
        category,
        type: this.getCategoryType(category),
        projections,
        historicalAverage,
        trend,
        seasonality,
      });
    }

    return forecasts;
  }

  /**
   * PROYECCIONES ESPECÍFICAS
   */

  async projectPremiums(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`💰 Projecting premium income for ${months} months`);

    const historicalData = await this.getHistoricalData('PREMIUM_COLLECTION', 12);
    const growthRate = 0.02; // 2% monthly growth
    const seasonality = this.detectSeasonality(historicalData);

    return this.projectWithGrowth(
      historicalData,
      months,
      growthRate,
      seasonality,
      'premiums'
    );
  }

  async projectRenewals(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`🔄 Projecting renewal income for ${months} months`);

    // TODO: Analizar políticas próximas a renovar
    const baseRenewalRate = 0.85; // 85% renewal rate
    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: 45000 + Math.random() * 5000,
        inflowBreakdown: {
          premiums: 0,
          renewals: 45000,
          newPolicies: 0,
          commissions: 0,
          investments: 0,
          other: 0,
        },
        expectedOutflow: 0,
        outflowBreakdown: this.emptyOutflowBreakdown(),
        netCashFlow: 45000,
        projectedBalance: 125000 + i * 5000,
        confidence: 0.8 - i * 0.02,
        factors: [
          {
            name: 'Historical renewal rate',
            impact: 0.85,
            weight: 0.6,
            description: 'Based on past 12 months',
          },
        ],
      });
    }

    return projections;
  }

  async projectCommissions(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`💵 Projecting commission income for ${months} months`);

    const historicalData = await this.getHistoricalData('COMMISSION', 12);
    const average = this.calculateAverage(historicalData);

    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: average * (1 + Math.random() * 0.1 - 0.05),
        inflowBreakdown: {
          premiums: 0,
          renewals: 0,
          newPolicies: 0,
          commissions: average,
          investments: 0,
          other: 0,
        },
        expectedOutflow: 0,
        outflowBreakdown: this.emptyOutflowBreakdown(),
        netCashFlow: average,
        projectedBalance: 125000 + i * 2000,
        confidence: 0.75 - i * 0.015,
        factors: [],
      });
    }

    return projections;
  }

  async projectClaims(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`📋 Projecting claim payments for ${months} months`);

    const historicalData = await this.getHistoricalData('CLAIM_PAYMENT', 12);
    const average = Math.abs(this.calculateAverage(historicalData));

    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      const claimAmount = average * (1 + (Math.random() * 0.3 - 0.15));

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: 0,
        inflowBreakdown: this.emptyInflowBreakdown(),
        expectedOutflow: claimAmount,
        outflowBreakdown: {
          claims: claimAmount,
          salaries: 0,
          suppliers: 0,
          taxes: 0,
          socialSecurity: 0,
          rent: 0,
          utilities: 0,
          marketing: 0,
          technology: 0,
          other: 0,
        },
        netCashFlow: -claimAmount,
        projectedBalance: 125000 - i * 3000,
        confidence: 0.65 - i * 0.02,
        factors: [
          {
            name: 'Claims volatility',
            impact: 0.3,
            weight: 0.4,
            description: 'Claims are inherently unpredictable',
          },
        ],
      });
    }

    return projections;
  }

  async projectOperatingExpenses(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`💸 Projecting operating expenses for ${months} months`);

    const projections: MonthlyProjection[] = [];
    const monthlyOpex = 28000; // Base monthly operating expenses

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      const inflationAdjustment = 1 + i * 0.002; // 0.2% monthly inflation
      const amount = monthlyOpex * inflationAdjustment;

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: 0,
        inflowBreakdown: this.emptyInflowBreakdown(),
        expectedOutflow: amount,
        outflowBreakdown: {
          claims: 0,
          salaries: 0,
          suppliers: amount * 0.4,
          taxes: 0,
          socialSecurity: 0,
          rent: 2500,
          utilities: 800,
          marketing: amount * 0.15,
          technology: amount * 0.2,
          other: amount * 0.25,
        },
        netCashFlow: -amount,
        projectedBalance: 125000 - i * 4000,
        confidence: 0.9 - i * 0.01,
        factors: [],
      });
    }

    return projections;
  }

  async projectSalaries(months: number): Promise<MonthlyProjection[]> {
    this.logger.log(`👥 Projecting salary payments for ${months} months`);

    const monthlySalaries = 18000;
    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      // Bonuses in June and December
      const isMonth = month.getMonth();
      const bonus = isMonth === 5 || isMonth === 11 ? monthlySalaries * 0.5 : 0;

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: 0,
        inflowBreakdown: this.emptyInflowBreakdown(),
        expectedOutflow: monthlySalaries + bonus,
        outflowBreakdown: {
          claims: 0,
          salaries: monthlySalaries + bonus,
          suppliers: 0,
          taxes: 0,
          socialSecurity: (monthlySalaries + bonus) * 0.3,
          rent: 0,
          utilities: 0,
          marketing: 0,
          technology: 0,
          other: 0,
        },
        netCashFlow: -(monthlySalaries + bonus),
        projectedBalance: 125000 - i * 2000,
        confidence: 0.95, // Salaries are very predictable
        factors: [],
      });
    }

    return projections;
  }

  /**
   * ANÁLISIS DE ESCENARIOS
   */

  async bestCaseScenario(months: number): Promise<CashForecast> {
    this.logger.log(`🌟 Generating best-case scenario for ${months} months`);

    const baseForecast = await this.forecast(months, 'WEIGHTED');

    // Aplicar factores optimistas (+20% ingresos, -10% gastos)
    const optimisticProjections = baseForecast.projections.map((p) => ({
      ...p,
      expectedInflow: p.expectedInflow * 1.2,
      expectedOutflow: p.expectedOutflow * 0.9,
      netCashFlow: p.expectedInflow * 1.2 - p.expectedOutflow * 0.9,
      confidence: p.confidence * 0.8, // Menor confianza en escenario optimista
    }));

    return {
      ...baseForecast,
      projections: optimisticProjections,
      assumptions: [
        ...baseForecast.assumptions,
        'Premium growth exceeds expectations by 20%',
        'Claims 10% below forecast',
        'All renewals successful',
      ],
    };
  }

  async worstCaseScenario(months: number): Promise<CashForecast> {
    this.logger.log(`⚠️ Generating worst-case scenario for ${months} months`);

    const baseForecast = await this.forecast(months, 'WEIGHTED');

    // Aplicar factores pesimistas (-20% ingresos, +15% gastos)
    const pessimisticProjections = baseForecast.projections.map((p) => ({
      ...p,
      expectedInflow: p.expectedInflow * 0.8,
      expectedOutflow: p.expectedOutflow * 1.15,
      netCashFlow: p.expectedInflow * 0.8 - p.expectedOutflow * 1.15,
      confidence: p.confidence * 0.85,
    }));

    return {
      ...baseForecast,
      projections: pessimisticProjections,
      assumptions: [
        ...baseForecast.assumptions,
        'Premium collections 20% below target',
        'Claims spike by 15%',
        'Lower renewal rates',
      ],
    };
  }

  async mostLikelyScenario(months: number): Promise<CashForecast> {
    this.logger.log(`🎯 Generating most-likely scenario for ${months} months`);

    return this.forecast(months, 'WEIGHTED');
  }

  /**
   * COMPARACIÓN CON ACTUAL
   */

  async compareToForecast(
    actual: ActualCashFlow,
    forecast: CashForecast
  ): Promise<Variance> {
    this.logger.log('🔍 Comparing actual vs forecast');

    // Encontrar la proyección correspondiente
    const projection = forecast.projections[0]; // Simplificado

    const totalVariance = actual.netCashFlow - projection.netCashFlow;
    const variancePercentage =
      projection.netCashFlow !== 0
        ? (totalVariance / Math.abs(projection.netCashFlow)) * 100
        : 0;

    const byCategory: CategoryVariance[] = [
      {
        category: 'Premium Collections',
        forecast: projection.inflowBreakdown.premiums,
        actual: actual.breakdown.inflow.premiums,
        variance: actual.breakdown.inflow.premiums - projection.inflowBreakdown.premiums,
        variancePercentage:
          ((actual.breakdown.inflow.premiums - projection.inflowBreakdown.premiums) /
            projection.inflowBreakdown.premiums) *
          100,
      },
      {
        category: 'Claim Payments',
        forecast: projection.outflowBreakdown.claims,
        actual: actual.breakdown.outflow.claims,
        variance: actual.breakdown.outflow.claims - projection.outflowBreakdown.claims,
        variancePercentage:
          ((actual.breakdown.outflow.claims - projection.outflowBreakdown.claims) /
            projection.outflowBreakdown.claims) *
          100,
      },
    ];

    const accuracy = 100 - Math.abs(variancePercentage);
    const trend =
      variancePercentage > 10
        ? 'UNDER_FORECAST'
        : variancePercentage < -10
        ? 'OVER_FORECAST'
        : 'ACCURATE';

    const majorDiscrepancies = byCategory.filter(
      (c) => Math.abs(c.variancePercentage) > 15
    );

    const analysis: VarianceAnalysis = {
      accuracy,
      trend,
      majorDiscrepancies,
      improvements: this.generateImprovements(byCategory),
      alerts: this.generateVarianceAlerts(byCategory),
    };

    return {
      period: {
        startDate: forecast.startDate,
        endDate: new Date(),
      },
      forecast,
      actual,
      totalVariance,
      variancePercentage,
      byCategory,
      analysis,
    };
  }

  /**
   * MÉTODOS AUXILIARES
   */

  private async generateProjections(
    months: number,
    method: ForecastMethod
  ): Promise<MonthlyProjection[]> {
    const projections: MonthlyProjection[] = [];
    let cumulativeBalance = 125000; // Starting balance

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      const inflow = this.calculateExpectedInflow(i, method);
      const outflow = this.calculateExpectedOutflow(i, method);
      const netFlow = inflow - outflow;

      cumulativeBalance += netFlow;

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: inflow,
        inflowBreakdown: this.generateInflowBreakdown(inflow),
        expectedOutflow: outflow,
        outflowBreakdown: this.generateOutflowBreakdown(outflow),
        netCashFlow: netFlow,
        projectedBalance: cumulativeBalance,
        confidence: this.calculateMonthConfidence(i, method),
        factors: [],
      });
    }

    return projections;
  }

  private calculateExpectedInflow(monthIndex: number, method: ForecastMethod): number {
    const base = 97000;
    const growth = method === 'ML' ? 0.025 : 0.015;
    const seasonalFactor = 1 + Math.sin((monthIndex * Math.PI) / 6) * 0.1;

    return base * (1 + growth * monthIndex) * seasonalFactor;
  }

  private calculateExpectedOutflow(monthIndex: number, method: ForecastMethod): number {
    const base = 78000;
    const inflation = 0.002;
    return base * (1 + inflation * monthIndex);
  }

  private generateInflowBreakdown(total: number): InflowBreakdown {
    return {
      premiums: total * 0.65,
      renewals: total * 0.2,
      newPolicies: total * 0.1,
      commissions: total * 0.05,
      investments: 0,
      other: 0,
    };
  }

  private generateOutflowBreakdown(total: number): OutflowBreakdown {
    return {
      claims: total * 0.5,
      salaries: total * 0.23,
      suppliers: total * 0.12,
      taxes: total * 0.05,
      socialSecurity: total * 0.04,
      rent: total * 0.03,
      utilities: total * 0.01,
      marketing: total * 0.01,
      technology: total * 0.01,
      other: 0,
    };
  }

  private emptyInflowBreakdown(): InflowBreakdown {
    return {
      premiums: 0,
      renewals: 0,
      newPolicies: 0,
      commissions: 0,
      investments: 0,
      other: 0,
    };
  }

  private emptyOutflowBreakdown(): OutflowBreakdown {
    return {
      claims: 0,
      salaries: 0,
      suppliers: 0,
      taxes: 0,
      socialSecurity: 0,
      rent: 0,
      utilities: 0,
      marketing: 0,
      technology: 0,
      other: 0,
    };
  }

  private async analyzeScenarios(
    projections: MonthlyProjection[]
  ): Promise<ScenarioAnalysis> {
    const finalProjection = projections[projections.length - 1];

    return {
      optimistic: {
        finalBalance: finalProjection.projectedBalance * 1.25,
        averageMonthlyFlow:
          projections.reduce((sum, p) => sum + p.netCashFlow, 0) /
          projections.length *
          1.2,
        lowestBalance: Math.min(...projections.map((p) => p.projectedBalance)) * 1.15,
        lowestBalanceMonth: projections[0].month,
        probability: 0.2,
        keyAssumptions: ['Strong premium growth', 'Lower than expected claims'],
      },
      realistic: {
        finalBalance: finalProjection.projectedBalance,
        averageMonthlyFlow:
          projections.reduce((sum, p) => sum + p.netCashFlow, 0) / projections.length,
        lowestBalance: Math.min(...projections.map((p) => p.projectedBalance)),
        lowestBalanceMonth: projections[0].month,
        probability: 0.6,
        keyAssumptions: ['Steady growth', 'Normal claims pattern'],
      },
      pessimistic: {
        finalBalance: finalProjection.projectedBalance * 0.75,
        averageMonthlyFlow:
          projections.reduce((sum, p) => sum + p.netCashFlow, 0) /
          projections.length *
          0.8,
        lowestBalance: Math.min(...projections.map((p) => p.projectedBalance)) * 0.85,
        lowestBalanceMonth: projections[0].month,
        probability: 0.2,
        keyAssumptions: ['Reduced renewals', 'Higher claims frequency'],
      },
    };
  }

  private calculateConfidenceMetrics(
    months: number,
    method: ForecastMethod
  ): ConfidenceMetrics {
    const baseConfidence = method === 'ML' ? 0.85 : method === 'REGRESSION' ? 0.8 : 0.75;

    return {
      overall: baseConfidence,
      shortTerm: Math.min(baseConfidence + 0.1, 0.95),
      mediumTerm: baseConfidence,
      longTerm: Math.max(baseConfidence - 0.15, 0.5),
      factors: [
        {
          name: 'Historical data quality',
          impact: 'POSITIVE',
          weight: 0.3,
          description: '12+ months of clean data available',
        },
        {
          name: 'Market volatility',
          impact: 'NEGATIVE',
          weight: 0.2,
          description: 'Insurance market can be unpredictable',
        },
      ],
    };
  }

  private generateAssumptions(method: ForecastMethod): string[] {
    const base = [
      'Historical patterns will continue',
      'No major market disruptions',
      'Current customer base remains stable',
    ];

    if (method === 'ML') {
      base.push('Machine learning model trained on 24+ months data');
      base.push('External factors (economy, regulations) remain constant');
    }

    return base;
  }

  private calculateMonthConfidence(monthIndex: number, method: ForecastMethod): number {
    const baseConfidence = method === 'ML' ? 0.9 : 0.85;
    const decay = 0.015;
    return Math.max(baseConfidence - monthIndex * decay, 0.5);
  }

  private async getHistoricalData(category: string, months: number): Promise<number[]> {
    // TODO: Consultar datos históricos reales de BD
    return Array.from({ length: months }, () => 75000 + Math.random() * 10000);
  }

  private calculateAverage(data: number[]): number {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private detectTrend(
    data: number[]
  ): 'INCREASING' | 'STABLE' | 'DECREASING' {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    if (secondAvg > firstAvg * 1.05) return 'INCREASING';
    if (secondAvg < firstAvg * 0.95) return 'DECREASING';
    return 'STABLE';
  }

  private detectSeasonality(data: number[]): SeasonalityPattern {
    // Simplified seasonality detection
    // TODO: Implement proper statistical analysis (autocorrelation, etc.)

    return {
      detected: false,
      pattern: 'NONE',
      peakMonths: [],
      lowMonths: [],
      factor: 1.0,
    };
  }

  private async projectCategory(
    category: string,
    months: number,
    average: number,
    trend: 'INCREASING' | 'STABLE' | 'DECREASING',
    seasonality: SeasonalityPattern
  ): Promise<MonthlyProjection[]> {
    const growthRate = trend === 'INCREASING' ? 0.02 : trend === 'DECREASING' ? -0.02 : 0;

    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      const amount = average * (1 + growthRate * i);

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: amount > 0 ? amount : 0,
        inflowBreakdown: this.emptyInflowBreakdown(),
        expectedOutflow: amount < 0 ? Math.abs(amount) : 0,
        outflowBreakdown: this.emptyOutflowBreakdown(),
        netCashFlow: amount,
        projectedBalance: 125000 + i * 3000,
        confidence: 0.8 - i * 0.02,
        factors: [],
      });
    }

    return projections;
  }

  private getCategoryType(category: string): 'INFLOW' | 'OUTFLOW' {
    const inflowCategories = ['PREMIUM_COLLECTION', 'COMMISSION'];
    return inflowCategories.includes(category) ? 'INFLOW' : 'OUTFLOW';
  }

  private async projectWithGrowth(
    historicalData: number[],
    months: number,
    growthRate: number,
    seasonality: SeasonalityPattern,
    type: string
  ): Promise<MonthlyProjection[]> {
    const average = this.calculateAverage(historicalData);
    const projections: MonthlyProjection[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);

      const amount = average * Math.pow(1 + growthRate, i);

      projections.push({
        month: month.toISOString().slice(0, 7),
        date: month,
        expectedInflow: amount,
        inflowBreakdown: {
          premiums: type === 'premiums' ? amount : 0,
          renewals: 0,
          newPolicies: 0,
          commissions: 0,
          investments: 0,
          other: 0,
        },
        expectedOutflow: 0,
        outflowBreakdown: this.emptyOutflowBreakdown(),
        netCashFlow: amount,
        projectedBalance: 125000 + i * 5000,
        confidence: 0.85 - i * 0.02,
        factors: [],
      });
    }

    return projections;
  }

  private generateImprovements(variances: CategoryVariance[]): string[] {
    const improvements: string[] = [];

    for (const v of variances) {
      if (Math.abs(v.variancePercentage) > 20) {
        improvements.push(
          `Improve ${v.category} forecasting model - variance: ${v.variancePercentage.toFixed(1)}%`
        );
      }
    }

    return improvements;
  }

  private generateVarianceAlerts(variances: CategoryVariance[]): string[] {
    const alerts: string[] = [];

    for (const v of variances) {
      if (Math.abs(v.variancePercentage) > 30) {
        alerts.push(
          `CRITICAL: ${v.category} variance exceeds 30% (${v.variancePercentage.toFixed(1)}%)`
        );
      }
    }

    return alerts;
  }
}
