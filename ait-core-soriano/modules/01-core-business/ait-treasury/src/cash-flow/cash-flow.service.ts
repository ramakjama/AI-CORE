/**
 * CashFlowService
 *
 * Servicio completo de análisis de flujo de caja:
 * - Generación de estados de flujo de caja
 * - Análisis por actividades (operativas, inversión, financiación)
 * - Comparación entre períodos
 * - Burn rate y runway calculation
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  CashFlowStatement,
  Period,
  OperatingActivities,
  InvestingActivities,
  FinancingActivities,
  CashFlowComparison,
  CashFlowVariance,
  ComparisonAnalysis,
  KeyChange,
  BurnRate,
  MonthlyBurn,
  Runway,
} from '../interfaces/cash-flow.interface';

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GENERACIÓN DE ESTADOS DE FLUJO
   */

  async generateStatement(
    startDate: Date,
    endDate: Date
  ): Promise<CashFlowStatement> {
    this.logger.log(
      `📊 Generating cash flow statement: ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    try {
      const period: Period = { startDate, endDate };

      // Actividades operativas
      const receiptsFromCustomers = await this.getReceipts(startDate, endDate);
      const premiumCollections = await this.getPremiumCollections(startDate, endDate);
      const commissionsReceived = await this.getCommissions(startDate, endDate);
      const paymentsToSuppliers = await this.getSupplierPayments(startDate, endDate);
      const claimPayments = await this.getClaimPayments(startDate, endDate);
      const salaryPayments = await this.getSalaryPayments(startDate, endDate);
      const taxPayments = await this.getTaxPayments(startDate, endDate);
      const socialSecurityPayments = await this.getSocialSecurityPayments(
        startDate,
        endDate
      );
      const otherOperating = await this.getOtherOperating(startDate, endDate);

      const operatingActivities: OperatingActivities = {
        receiptsFromCustomers,
        premiumCollections,
        commissionReceived: commissionsReceived,
        paymentsToSuppliers,
        claimPayments,
        salaryPayments,
        taxPayments,
        socialSecurityPayments,
        rentPayments: await this.getRentPayments(startDate, endDate),
        utilitiesPayments: await this.getUtilitiesPayments(startDate, endDate),
        insurancePayments: await this.getInsurancePayments(startDate, endDate),
        otherOperating,
        netOperating:
          receiptsFromCustomers +
          premiumCollections +
          commissionsReceived -
          paymentsToSuppliers -
          claimPayments -
          salaryPayments -
          taxPayments -
          socialSecurityPayments -
          otherOperating,
      };

      // Actividades de inversión
      const purchaseOfAssets = await this.getAssetPurchases(startDate, endDate);
      const saleOfAssets = await this.getAssetSales(startDate, endDate);
      const purchaseOfInvestments = await this.getInvestmentPurchases(
        startDate,
        endDate
      );
      const saleOfInvestments = await this.getInvestmentSales(startDate, endDate);
      const interestReceived = await this.getInterestReceived(startDate, endDate);
      const dividendsReceived = await this.getDividendsReceived(startDate, endDate);

      const investingActivities: InvestingActivities = {
        purchaseOfAssets,
        saleOfAssets,
        purchaseOfInvestments,
        saleOfInvestments,
        interestReceived,
        dividendsReceived,
        netInvesting:
          saleOfAssets +
          saleOfInvestments +
          interestReceived +
          dividendsReceived -
          purchaseOfAssets -
          purchaseOfInvestments,
      };

      // Actividades de financiación
      const loansReceived = await this.getLoansReceived(startDate, endDate);
      const loanRepayments = await this.getLoanRepayments(startDate, endDate);
      const interestPaid = await this.getInterestPaid(startDate, endDate);
      const dividendsPaid = await this.getDividendsPaid(startDate, endDate);
      const capitalContributions = await this.getCapitalContributions(
        startDate,
        endDate
      );
      const capitalWithdrawals = await this.getCapitalWithdrawals(startDate, endDate);

      const financingActivities: FinancingActivities = {
        loansReceived,
        loanRepayments,
        interestPaid,
        dividendsPaid,
        capitalContributions,
        capitalWithdrawals,
        netFinancing:
          loansReceived +
          capitalContributions -
          loanRepayments -
          interestPaid -
          dividendsPaid -
          capitalWithdrawals,
      };

      const netCashFlow =
        operatingActivities.netOperating +
        investingActivities.netInvesting +
        financingActivities.netFinancing;

      const openingBalance = await this.getOpeningBalance(startDate);
      const closingBalance = openingBalance + netCashFlow;

      return {
        period,
        operatingActivities,
        investingActivities,
        financingActivities,
        netCashFlow,
        openingBalance,
        closingBalance,
        currency: 'EUR',
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error generating cash flow statement', error);
      throw error;
    }
  }

  async getMonthlyFlow(year: number): Promise<CashFlowStatement[]> {
    this.logger.log(`📅 Generating monthly cash flow for year ${year}`);

    const statements: CashFlowStatement[] = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const statement = await this.generateStatement(startDate, endDate);
      statements.push(statement);
    }

    return statements;
  }

  async compareFlows(
    period1: Period,
    period2: Period
  ): Promise<CashFlowComparison> {
    this.logger.log('🔄 Comparing cash flows between periods');

    const statement1 = await this.generateStatement(
      period1.startDate,
      period1.endDate
    );
    const statement2 = await this.generateStatement(
      period2.startDate,
      period2.endDate
    );

    // Calcular variaciones
    const operatingVariance =
      statement2.operatingActivities.netOperating -
      statement1.operatingActivities.netOperating;
    const investingVariance =
      statement2.investingActivities.netInvesting -
      statement1.investingActivities.netInvesting;
    const financingVariance =
      statement2.financingActivities.netFinancing -
      statement1.financingActivities.netFinancing;
    const netVariance = statement2.netCashFlow - statement1.netCashFlow;

    const variance: CashFlowVariance = {
      operatingActivities: {
        absolute: operatingVariance,
        percentage: this.calculatePercentage(
          operatingVariance,
          statement1.operatingActivities.netOperating
        ),
        breakdown: this.calculateOperatingBreakdown(
          statement1.operatingActivities,
          statement2.operatingActivities
        ),
      },
      investingActivities: {
        absolute: investingVariance,
        percentage: this.calculatePercentage(
          investingVariance,
          statement1.investingActivities.netInvesting
        ),
      },
      financingActivities: {
        absolute: financingVariance,
        percentage: this.calculatePercentage(
          financingVariance,
          statement1.financingActivities.netFinancing
        ),
      },
      netCashFlow: {
        absolute: netVariance,
        percentage: this.calculatePercentage(netVariance, statement1.netCashFlow),
      },
    };

    // Análisis
    const keyChanges = this.identifyKeyChanges(statement1, statement2);
    const trend = this.determineTrend(variance);
    const recommendations = this.generateRecommendations(variance, keyChanges);
    const alerts = this.generateAlerts(variance, keyChanges);

    const analysis: ComparisonAnalysis = {
      trend,
      keyChanges,
      recommendations,
      alerts,
    };

    return {
      period1,
      period2,
      statement1,
      statement2,
      variance,
      analysis,
    };
  }

  /**
   * BURN RATE Y RUNWAY
   */

  async calculateBurnRate(months: number): Promise<BurnRate> {
    this.logger.log(`🔥 Calculating burn rate for last ${months} months`);

    const monthlyBurns: MonthlyBurn[] = [];
    const endDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);

      const monthEnd = new Date(startDate);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const statement = await this.generateStatement(startDate, monthEnd);

      monthlyBurns.push({
        month: startDate.toISOString().slice(0, 7),
        operatingExpenses: Math.abs(
          statement.operatingActivities.paymentsToSuppliers +
            statement.operatingActivities.salaryPayments +
            statement.operatingActivities.taxPayments
        ),
        revenue:
          statement.operatingActivities.receiptsFromCustomers +
          statement.operatingActivities.premiumCollections,
        netBurn: -statement.netCashFlow,
      });
    }

    const totalBurn = monthlyBurns.reduce((sum, m) => sum + m.netBurn, 0);
    const averageMonthlyBurn = totalBurn / months;

    // Determinar tendencia
    const firstHalf = monthlyBurns.slice(0, Math.floor(months / 2));
    const secondHalf = monthlyBurns.slice(Math.floor(months / 2));
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.netBurn, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, m) => sum + m.netBurn, 0) / secondHalf.length;

    const trend =
      secondAvg > firstAvg * 1.1
        ? 'INCREASING'
        : secondAvg < firstAvg * 0.9
        ? 'DECREASING'
        : 'STABLE';

    return {
      monthlyBurnRate: averageMonthlyBurn,
      averageMonthlyBurn,
      trend,
      months: monthlyBurns,
    };
  }

  async calculateRunway(): Promise<Runway> {
    this.logger.log('🛫 Calculating cash runway');

    // Obtener balance actual
    const currentBalance = 125000; // TODO: Get from CashManagementService

    // Calcular burn rate
    const burnRate = await this.calculateBurnRate(6);

    // Calcular meses de runway
    const months =
      burnRate.monthlyBurnRate > 0
        ? Math.floor(currentBalance / burnRate.monthlyBurnRate)
        : Infinity;

    const exhaustionDate = new Date();
    if (months !== Infinity) {
      exhaustionDate.setMonth(exhaustionDate.getMonth() + months);
    }

    return {
      months: months === Infinity ? 999 : months,
      exhaustionDate: months === Infinity ? new Date('2099-12-31') : exhaustionDate,
      currentBalance,
      monthlyBurn: burnRate.monthlyBurnRate,
      scenario: 'REALISTIC',
      assumptions: [
        'Current burn rate remains constant',
        'No additional funding received',
        'Revenue growth follows historical trend',
      ],
      recommendations:
        months < 6
          ? [
              'CRITICAL: Runway below 6 months',
              'Reduce non-essential expenses immediately',
              'Accelerate revenue collection',
              'Consider fundraising or credit line',
            ]
          : months < 12
          ? [
              'Monitor burn rate closely',
              'Optimize operational efficiency',
              'Plan for fundraising in next 3-6 months',
            ]
          : ['Maintain current trajectory', 'Focus on sustainable growth'],
    };
  }

  /**
   * MÉTODOS AUXILIARES PARA OBTENER DATOS
   */

  private async getReceipts(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Consultar movimientos de tipo INFLOW categoría PREMIUM_COLLECTION
    return 85000 + Math.random() * 10000;
  }

  private async getPremiumCollections(startDate: Date, endDate: Date): Promise<number> {
    return 75000 + Math.random() * 8000;
  }

  private async getCommissions(startDate: Date, endDate: Date): Promise<number> {
    return 12000 + Math.random() * 2000;
  }

  private async getSupplierPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(25000 + Math.random() * 5000);
  }

  private async getClaimPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(45000 + Math.random() * 8000);
  }

  private async getSalaryPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(18000 + Math.random() * 1000);
  }

  private async getTaxPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(8000 + Math.random() * 2000);
  }

  private async getSocialSecurityPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(4500 + Math.random() * 500);
  }

  private async getRentPayments(startDate: Date, endDate: Date): Promise<number> {
    return -2500;
  }

  private async getUtilitiesPayments(startDate: Date, endDate: Date): Promise<number> {
    return -(800 + Math.random() * 200);
  }

  private async getInsurancePayments(startDate: Date, endDate: Date): Promise<number> {
    return -(1200 + Math.random() * 300);
  }

  private async getOtherOperating(startDate: Date, endDate: Date): Promise<number> {
    return -(3000 + Math.random() * 1000);
  }

  private async getAssetPurchases(startDate: Date, endDate: Date): Promise<number> {
    return -(5000 + Math.random() * 2000);
  }

  private async getAssetSales(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getInvestmentPurchases(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getInvestmentSales(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getInterestReceived(startDate: Date, endDate: Date): Promise<number> {
    return 150 + Math.random() * 50;
  }

  private async getDividendsReceived(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getLoansReceived(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getLoanRepayments(startDate: Date, endDate: Date): Promise<number> {
    return -(2000 + Math.random() * 500);
  }

  private async getInterestPaid(startDate: Date, endDate: Date): Promise<number> {
    return -(450 + Math.random() * 100);
  }

  private async getDividendsPaid(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getCapitalContributions(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getCapitalWithdrawals(startDate: Date, endDate: Date): Promise<number> {
    return 0;
  }

  private async getOpeningBalance(date: Date): Promise<number> {
    // TODO: Consultar balance real
    return 120000;
  }

  private async getClosingBalance(date: Date): Promise<number> {
    // TODO: Consultar balance real
    return 125000;
  }

  /**
   * HELPERS
   */

  private calculatePercentage(change: number, base: number): number {
    if (base === 0) return 0;
    return (change / Math.abs(base)) * 100;
  }

  private calculateOperatingBreakdown(
    op1: OperatingActivities,
    op2: OperatingActivities
  ): Record<string, { absolute: number; percentage: number }> {
    return {
      receipts: {
        absolute: op2.receiptsFromCustomers - op1.receiptsFromCustomers,
        percentage: this.calculatePercentage(
          op2.receiptsFromCustomers - op1.receiptsFromCustomers,
          op1.receiptsFromCustomers
        ),
      },
      premiums: {
        absolute: op2.premiumCollections - op1.premiumCollections,
        percentage: this.calculatePercentage(
          op2.premiumCollections - op1.premiumCollections,
          op1.premiumCollections
        ),
      },
      claims: {
        absolute: op2.claimPayments - op1.claimPayments,
        percentage: this.calculatePercentage(
          op2.claimPayments - op1.claimPayments,
          op1.claimPayments
        ),
      },
      salaries: {
        absolute: op2.salaryPayments - op1.salaryPayments,
        percentage: this.calculatePercentage(
          op2.salaryPayments - op1.salaryPayments,
          op1.salaryPayments
        ),
      },
    };
  }

  private identifyKeyChanges(
    s1: CashFlowStatement,
    s2: CashFlowStatement
  ): KeyChange[] {
    const changes: KeyChange[] = [];
    const threshold = 0.1; // 10% change

    const categories = [
      {
        name: 'Premium Collections',
        amount1: s1.operatingActivities.premiumCollections,
        amount2: s2.operatingActivities.premiumCollections,
      },
      {
        name: 'Claim Payments',
        amount1: s1.operatingActivities.claimPayments,
        amount2: s2.operatingActivities.claimPayments,
      },
      {
        name: 'Salary Payments',
        amount1: s1.operatingActivities.salaryPayments,
        amount2: s2.operatingActivities.salaryPayments,
      },
    ];

    for (const cat of categories) {
      const change = cat.amount2 - cat.amount1;
      const percentage = this.calculatePercentage(change, cat.amount1);

      if (Math.abs(percentage) > threshold * 100) {
        changes.push({
          category: cat.name,
          description: `${cat.name} ${change > 0 ? 'increased' : 'decreased'} by €${Math.abs(change).toFixed(2)}`,
          impact: change > 0 ? 'POSITIVE' : 'NEGATIVE',
          amount: change,
          percentage,
        });
      }
    }

    return changes;
  }

  private determineTrend(variance: CashFlowVariance): 'IMPROVING' | 'STABLE' | 'DECLINING' {
    const netChange = variance.netCashFlow.percentage;

    if (netChange > 10) return 'IMPROVING';
    if (netChange < -10) return 'DECLINING';
    return 'STABLE';
  }

  private generateRecommendations(
    variance: CashFlowVariance,
    keyChanges: KeyChange[]
  ): string[] {
    const recommendations: string[] = [];

    if (variance.netCashFlow.absolute < 0) {
      recommendations.push('Focus on improving cash generation');
      recommendations.push('Review and optimize operational expenses');
    }

    if (variance.operatingActivities.absolute < 0) {
      recommendations.push('Strengthen core business operations');
    }

    return recommendations;
  }

  private generateAlerts(
    variance: CashFlowVariance,
    keyChanges: KeyChange[]
  ): string[] {
    const alerts: string[] = [];

    if (variance.netCashFlow.percentage < -20) {
      alerts.push('CRITICAL: Net cash flow declined significantly');
    }

    return alerts;
  }
}
