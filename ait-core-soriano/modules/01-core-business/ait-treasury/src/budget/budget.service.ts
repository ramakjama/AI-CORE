/**
 * BudgetService
 *
 * Servicio completo de gestión de presupuestos:
 * - CRUD de presupuestos por categoría y período
 * - Tracking de gastos en tiempo real
 * - Alertas de sobre-gasto
 * - Análisis de utilización y tendencias
 * - Reportes y comparaciones
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  Budget,
  BudgetCategory,
  BudgetPeriod,
  BudgetTracking,
  Expense,
  BudgetAlert,
  BudgetStatus,
  BudgetAllocation,
  BudgetReport,
  BudgetTrend,
  BudgetComparison,
  CategoryComparison,
  BudgetForecast,
} from '../interfaces/budget.interface';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  TrackExpenseDto,
} from '../dto/budget.dto';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CRUD DE PRESUPUESTOS
   */

  async create(dto: CreateBudgetDto): Promise<Budget> {
    this.logger.log(`📊 Creating budget: ${dto.name}`);

    try {
      // Validar fechas
      if (dto.endDate <= dto.startDate) {
        throw new BadRequestException('End date must be after start date');
      }

      // TODO: Crear en BD
      // const budget = await this.prisma.budget.create({ data: dto });

      const budget: Budget = {
        id: `budget-${Date.now()}`,
        name: dto.name,
        description: dto.description,
        category: dto.category as BudgetCategory,
        amount: dto.amount,
        currency: dto.currency,
        period: dto.period as BudgetPeriod,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: 'ACTIVE',
        alertThreshold: dto.alertThreshold || 80,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: dto.metadata,
      };

      this.logger.log(`✅ Budget created: ${budget.id}`);
      return budget;
    } catch (error) {
      this.logger.error('Error creating budget', error);
      throw error;
    }
  }

  async findAll(): Promise<Budget[]> {
    this.logger.log('📋 Fetching all budgets');

    try {
      // TODO: Consultar BD
      // return await this.prisma.budget.findMany({
      //   orderBy: { createdAt: 'desc' }
      // });

      return [];
    } catch (error) {
      this.logger.error('Error fetching budgets', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Budget> {
    this.logger.log(`🔍 Fetching budget: ${id}`);

    try {
      // TODO: Consultar BD
      // const budget = await this.prisma.budget.findUnique({
      //   where: { id }
      // });

      // if (!budget) {
      //   throw new NotFoundException(`Budget ${id} not found`);
      // }

      // Mock
      return {
        id,
        name: 'Marketing Q1 2026',
        description: 'Budget for Q1 marketing campaigns',
        category: 'MARKETING',
        amount: 50000,
        currency: 'EUR',
        period: 'QUARTERLY',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        status: 'ACTIVE',
        alertThreshold: 80,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error fetching budget', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateBudgetDto): Promise<Budget> {
    this.logger.log(`✏️ Updating budget: ${id}`);

    try {
      const budget = await this.findOne(id);

      // TODO: Actualizar en BD
      // return await this.prisma.budget.update({
      //   where: { id },
      //   data: dto
      // });

      return {
        ...budget,
        ...dto,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error updating budget', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`🗑️ Deleting budget: ${id}`);

    try {
      await this.findOne(id);

      // TODO: Eliminar de BD (soft delete recomendado)
      // await this.prisma.budget.update({
      //   where: { id },
      //   data: { status: 'DELETED', deletedAt: new Date() }
      // });

      this.logger.log(`✅ Budget deleted: ${id}`);
    } catch (error) {
      this.logger.error('Error deleting budget', error);
      throw error;
    }
  }

  /**
   * TRACKING DE GASTOS
   */

  async trackExpense(dto: TrackExpenseDto): Promise<BudgetTracking> {
    this.logger.log(`💸 Tracking expense: €${dto.amount} for budget ${dto.budgetId}`);

    try {
      const budget = await this.findOne(dto.budgetId);

      // Crear gasto
      // TODO: Guardar en BD
      const expense: Expense = {
        id: `exp-${Date.now()}`,
        budgetId: dto.budgetId,
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        category: dto.category,
        vendor: dto.vendor,
        invoiceNumber: dto.invoiceNumber,
        date: dto.date,
        status: dto.status || 'PENDING',
        metadata: dto.metadata,
      };

      // Obtener tracking actualizado
      const tracking = await this.getTracking(dto.budgetId);

      // Verificar si se alcanzó el threshold
      if (tracking.utilization >= budget.alertThreshold) {
        await this.alertOverspend(dto.budgetId);
      }

      this.logger.log(`✅ Expense tracked: ${expense.id}`);
      return tracking;
    } catch (error) {
      this.logger.error('Error tracking expense', error);
      throw error;
    }
  }

  async getStatus(budgetId: string): Promise<BudgetStatus> {
    this.logger.log(`📊 Getting budget status: ${budgetId}`);

    try {
      const budget = await this.findOne(budgetId);
      const tracking = await this.getTracking(budgetId);

      const now = new Date();
      const totalDays = Math.ceil(
        (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.ceil(
        (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = totalDays - daysElapsed;

      const expectedUtilization = (daysElapsed / totalDays) * 100;
      const variance = tracking.utilization - expectedUtilization;

      const status: 'HEALTHY' | 'WARNING' | 'CRITICAL' =
        tracking.utilization < budget.alertThreshold
          ? 'HEALTHY'
          : tracking.utilization < 100
          ? 'WARNING'
          : 'CRITICAL';

      const recommendations = this.generateRecommendations(
        budget,
        tracking,
        variance
      );

      return {
        budgetId,
        name: budget.name,
        totalBudget: budget.amount,
        spent: tracking.spent,
        remaining: tracking.remaining,
        utilization: tracking.utilization,
        status,
        daysElapsed,
        daysRemaining,
        expectedUtilization,
        variance,
        projectedFinalSpend: tracking.projectedSpend,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Error getting budget status', error);
      throw error;
    }
  }

  async getUtilization(budgetId: string): Promise<number> {
    this.logger.log(`📈 Getting budget utilization: ${budgetId}`);

    const tracking = await this.getTracking(budgetId);
    return tracking.utilization;
  }

  async alertOverspend(budgetId: string): Promise<void> {
    this.logger.log(`⚠️ Generating overspend alert for budget: ${budgetId}`);

    try {
      const budget = await this.findOne(budgetId);
      const tracking = await this.getTracking(budgetId);

      const alert: BudgetAlert = {
        id: `alert-${Date.now()}`,
        budgetId,
        type:
          tracking.utilization >= 100
            ? 'OVERSPEND'
            : tracking.projectedSpend > budget.amount
            ? 'PROJECTED_OVERSPEND'
            : 'THRESHOLD_REACHED',
        severity:
          tracking.utilization >= 100
            ? 'CRITICAL'
            : tracking.utilization >= budget.alertThreshold
            ? 'WARNING'
            : 'INFO',
        message: `Budget "${budget.name}" utilization: ${tracking.utilization.toFixed(1)}%`,
        currentUtilization: tracking.utilization,
        threshold: budget.alertThreshold,
        createdAt: new Date(),
        acknowledged: false,
      };

      // TODO: Guardar alerta en BD
      // TODO: Enviar notificación (email, webhook, etc.)

      this.logger.log(`✅ Alert created: ${alert.id}`);
    } catch (error) {
      this.logger.error('Error creating overspend alert', error);
      throw error;
    }
  }

  /**
   * REPORTES Y ANÁLISIS
   */

  async generateReport(
    startDate: Date,
    endDate: Date,
    categories?: string[]
  ): Promise<BudgetReport> {
    this.logger.log(`📄 Generating budget report: ${startDate} to ${endDate}`);

    try {
      // TODO: Consultar budgets y expenses del período
      const budgets = await this.findAll();

      let totalBudget = 0;
      let totalSpent = 0;
      const byCategory: BudgetAllocation[] = [];
      const topExpenses: Expense[] = [];
      const trends: BudgetTrend[] = [];
      const alerts: BudgetAlert[] = [];

      for (const budget of budgets) {
        if (categories && !categories.includes(budget.category)) {
          continue;
        }

        const tracking = await this.getTracking(budget.id);

        totalBudget += budget.amount;
        totalSpent += tracking.spent;

        byCategory.push({
          category: budget.category,
          allocated: budget.amount,
          spent: tracking.spent,
          remaining: tracking.remaining,
          percentage: (tracking.spent / totalBudget) * 100,
        });
      }

      const totalRemaining = totalBudget - totalSpent;
      const overallUtilization = (totalSpent / totalBudget) * 100;

      return {
        period: { startDate, endDate },
        totalBudget,
        totalSpent,
        totalRemaining,
        overallUtilization,
        byCategory,
        topExpenses,
        trends,
        alerts,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Error generating budget report', error);
      throw error;
    }
  }

  async comparePeriods(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<BudgetComparison> {
    this.logger.log('🔄 Comparing budget periods');

    const currentPeriod = await this.generateReport(currentStart, currentEnd);
    const previousPeriod = await this.generateReport(previousStart, previousEnd);

    const variance = {
      absolute: currentPeriod.totalSpent - previousPeriod.totalSpent,
      percentage:
        ((currentPeriod.totalSpent - previousPeriod.totalSpent) /
          previousPeriod.totalSpent) *
        100,
    };

    const categoryComparison: CategoryComparison[] = [];

    for (const current of currentPeriod.byCategory) {
      const previous = previousPeriod.byCategory.find(
        (p) => p.category === current.category
      );

      if (previous) {
        const change = current.spent - previous.spent;
        const changePercentage = (change / previous.spent) * 100;

        categoryComparison.push({
          category: current.category,
          currentSpend: current.spent,
          previousSpend: previous.spent,
          change,
          changePercentage,
          trend:
            changePercentage > 10
              ? 'INCREASING'
              : changePercentage < -10
              ? 'DECREASING'
              : 'STABLE',
        });
      }
    }

    const insights = this.generateInsights(categoryComparison, variance);

    return {
      currentPeriod,
      previousPeriod,
      variance,
      categoryComparison,
      insights,
    };
  }

  async forecastBudget(budgetId: string): Promise<BudgetForecast> {
    this.logger.log(`🔮 Forecasting budget: ${budgetId}`);

    const budget = await this.findOne(budgetId);
    const tracking = await this.getTracking(budgetId);

    const now = new Date();
    const totalDays = Math.ceil(
      (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysElapsed;

    // Proyección lineal
    const dailyBurn = tracking.spent / daysElapsed;
    const projectedEndUtilization = ((dailyBurn * totalDays) / budget.amount) * 100;
    const projectedOverspend = Math.max(
      0,
      dailyBurn * totalDays - budget.amount
    );

    const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
      projectedEndUtilization < 90
        ? 'LOW'
        : projectedEndUtilization < 100
        ? 'MEDIUM'
        : 'HIGH';

    const recommendations = this.generateForecastRecommendations(
      budget,
      projectedEndUtilization,
      riskLevel
    );

    return {
      budgetId,
      currentUtilization: tracking.utilization,
      projectedEndUtilization,
      projectedOverspend,
      riskLevel,
      recommendations,
      scenarios: {
        optimistic: budget.amount * 0.85,
        realistic: dailyBurn * totalDays,
        pessimistic: budget.amount * 1.15,
      },
    };
  }

  /**
   * MÉTODOS AUXILIARES
   */

  private async getTracking(budgetId: string): Promise<BudgetTracking> {
    const budget = await this.findOne(budgetId);

    // TODO: Obtener expenses reales de BD
    // const expenses = await this.prisma.expense.findMany({
    //   where: { budgetId, status: { in: ['APPROVED', 'PAID'] } }
    // });

    const expenses: Expense[] = [];
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.amount - spent;
    const utilization = (spent / budget.amount) * 100;

    const now = new Date();
    const daysElapsed = Math.ceil(
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysElapsed;

    const dailyBurnRate = spent / Math.max(daysElapsed, 1);
    const projectedSpend = dailyBurnRate * totalDays;

    const expectedUtilization = (daysElapsed / totalDays) * 100;
    const trend: 'ON_TRACK' | 'UNDER_BUDGET' | 'OVER_BUDGET' | 'AT_RISK' =
      utilization < expectedUtilization * 0.9
        ? 'UNDER_BUDGET'
        : utilization > expectedUtilization * 1.1
        ? 'OVER_BUDGET'
        : projectedSpend > budget.amount
        ? 'AT_RISK'
        : 'ON_TRACK';

    return {
      budgetId,
      budget,
      spent,
      remaining,
      utilization,
      trend,
      expenses,
      projectedSpend,
      daysRemaining,
      dailyBurnRate,
      alerts: [],
      lastUpdate: new Date(),
    };
  }

  private generateRecommendations(
    budget: Budget,
    tracking: BudgetTracking,
    variance: number
  ): string[] {
    const recommendations: string[] = [];

    if (tracking.utilization > 90) {
      recommendations.push('URGENT: Budget almost exhausted - freeze non-critical spending');
    } else if (tracking.utilization > budget.alertThreshold) {
      recommendations.push('Review remaining planned expenses');
      recommendations.push('Consider reallocating from under-utilized budgets');
    }

    if (variance > 10) {
      recommendations.push('Spending ahead of schedule - monitor closely');
    } else if (variance < -10) {
      recommendations.push('Spending below schedule - good progress');
    }

    if (tracking.projectedSpend > budget.amount) {
      const shortage = tracking.projectedSpend - budget.amount;
      recommendations.push(
        `Projected overspend: €${shortage.toFixed(2)} - request budget increase or cut expenses`
      );
    }

    return recommendations;
  }

  private generateInsights(
    categoryComparison: CategoryComparison[],
    variance: { absolute: number; percentage: number }
  ): string[] {
    const insights: string[] = [];

    if (variance.percentage > 15) {
      insights.push(
        `Overall spending increased ${variance.percentage.toFixed(1)}% vs previous period`
      );
    } else if (variance.percentage < -15) {
      insights.push(
        `Overall spending decreased ${Math.abs(variance.percentage).toFixed(1)}% vs previous period`
      );
    }

    const increasing = categoryComparison.filter((c) => c.trend === 'INCREASING');
    const decreasing = categoryComparison.filter((c) => c.trend === 'DECREASING');

    if (increasing.length > 0) {
      insights.push(
        `Increasing spend in: ${increasing.map((c) => c.category).join(', ')}`
      );
    }

    if (decreasing.length > 0) {
      insights.push(
        `Decreasing spend in: ${decreasing.map((c) => c.category).join(', ')}`
      );
    }

    return insights;
  }

  private generateForecastRecommendations(
    budget: Budget,
    projectedUtilization: number,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'HIGH':
        recommendations.push('CRITICAL: High risk of budget overrun');
        recommendations.push('Implement immediate cost controls');
        recommendations.push('Request budget increase or defer expenses');
        break;
      case 'MEDIUM':
        recommendations.push('Monitor spending closely');
        recommendations.push('Review upcoming planned expenses');
        recommendations.push('Prepare contingency plan');
        break;
      case 'LOW':
        recommendations.push('Budget on track');
        recommendations.push('Continue current spending pattern');
        break;
    }

    return recommendations;
  }
}
