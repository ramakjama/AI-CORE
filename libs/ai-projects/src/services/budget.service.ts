/**
 * Budget Service
 * Budget management and financial operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Budget,
  BudgetLine,
  Expense,
  BudgetCategory,
  BudgetVsActual,
  EVMMetrics
} from '../types';

// In-memory storage (replace with actual database in production)
const budgets: Map<string, Budget> = new Map();
const expenses: Map<string, Expense> = new Map();

/**
 * Budget Service - Manages project budgets, expenses, and financial analysis
 */
export class BudgetService {

  // ===========================================================================
  // BUDGET CRUD
  // ===========================================================================

  /**
   * Create a new budget for a project
   */
  async createBudget(
    projectId: string,
    lines: Omit<BudgetLine, 'id' | 'budgetId' | 'createdAt' | 'updatedAt'>[],
    options?: {
      name?: string;
      currency?: string;
      contingencyPercentage?: number;
      fiscalYear?: number;
    }
  ): Promise<Budget> {
    const now = new Date();
    const budgetId = uuidv4();

    // Create budget lines
    const budgetLines: BudgetLine[] = lines.map(line => ({
      ...line,
      id: uuidv4(),
      budgetId,
      committedAmount: 0,
      actualAmount: 0,
      createdAt: now,
      updatedAt: now
    }));

    // Calculate totals
    const totalPlanned = budgetLines.reduce((sum, l) => sum + l.plannedAmount, 0);
    const contingencyPercentage = options?.contingencyPercentage || 10;
    const contingencyAmount = totalPlanned * (contingencyPercentage / 100);

    const budget: Budget = {
      id: budgetId,
      projectId,
      name: options?.name || 'Project Budget',
      totalAmount: totalPlanned + contingencyAmount,
      currency: options?.currency || 'USD',
      lines: budgetLines,
      totalPlanned,
      totalCommitted: 0,
      totalActual: 0,
      totalRemaining: totalPlanned,
      contingencyPercentage,
      contingencyAmount,
      contingencyUsed: 0,
      status: 'draft',
      fiscalYear: options?.fiscalYear || new Date().getFullYear(),
      createdAt: now,
      updatedAt: now
    };

    budgets.set(budgetId, budget);

    return budget;
  }

  /**
   * Get budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget | null> {
    return budgets.get(budgetId) || null;
  }

  /**
   * Get budget for a project
   */
  async getProjectBudget(projectId: string): Promise<Budget | null> {
    for (const budget of budgets.values()) {
      if (budget.projectId === projectId) {
        return budget;
      }
    }
    return null;
  }

  /**
   * Update budget
   */
  async updateBudget(
    budgetId: string,
    changes: Partial<Budget>
  ): Promise<Budget> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const updatedBudget: Budget = {
      ...budget,
      ...changes,
      id: budget.id,
      projectId: budget.projectId,
      createdAt: budget.createdAt,
      updatedAt: new Date()
    };

    // Recalculate totals
    this.recalculateTotals(updatedBudget);

    budgets.set(budgetId, updatedBudget);

    return updatedBudget;
  }

  /**
   * Approve a budget
   */
  async approveBudget(budgetId: string, approverId: string): Promise<Budget> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    budget.status = 'approved';
    budget.approvedBy = approverId;
    budget.approvedAt = new Date();
    budget.updatedAt = new Date();

    budgets.set(budgetId, budget);

    return budget;
  }

  /**
   * Activate a budget
   */
  async activateBudget(budgetId: string): Promise<Budget> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    if (budget.status !== 'approved') {
      throw new Error('Budget must be approved before activation');
    }

    budget.status = 'active';
    budget.updatedAt = new Date();

    budgets.set(budgetId, budget);

    return budget;
  }

  // ===========================================================================
  // BUDGET LINE MANAGEMENT
  // ===========================================================================

  /**
   * Add a budget line
   */
  async addBudgetLine(
    budgetId: string,
    lineData: Omit<BudgetLine, 'id' | 'budgetId' | 'createdAt' | 'updatedAt'>
  ): Promise<BudgetLine> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const now = new Date();
    const line: BudgetLine = {
      ...lineData,
      id: uuidv4(),
      budgetId,
      committedAmount: 0,
      actualAmount: 0,
      createdAt: now,
      updatedAt: now
    };

    budget.lines.push(line);
    this.recalculateTotals(budget);
    budget.updatedAt = now;

    budgets.set(budgetId, budget);

    return line;
  }

  /**
   * Update a budget line
   */
  async updateBudgetLine(
    budgetId: string,
    lineId: string,
    changes: Partial<BudgetLine>
  ): Promise<BudgetLine> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const lineIndex = budget.lines.findIndex(l => l.id === lineId);
    if (lineIndex === -1) {
      throw new Error(`Budget line not found: ${lineId}`);
    }

    const line = budget.lines[lineIndex];
    const updatedLine: BudgetLine = {
      ...line,
      ...changes,
      id: line.id,
      budgetId: line.budgetId,
      createdAt: line.createdAt,
      updatedAt: new Date()
    };

    budget.lines[lineIndex] = updatedLine;
    this.recalculateTotals(budget);
    budget.updatedAt = new Date();

    budgets.set(budgetId, budget);

    return updatedLine;
  }

  /**
   * Delete a budget line
   */
  async deleteBudgetLine(budgetId: string, lineId: string): Promise<boolean> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      return false;
    }

    const originalLength = budget.lines.length;
    budget.lines = budget.lines.filter(l => l.id !== lineId);

    if (budget.lines.length < originalLength) {
      this.recalculateTotals(budget);
      budget.updatedAt = new Date();
      budgets.set(budgetId, budget);
      return true;
    }

    return false;
  }

  // ===========================================================================
  // EXPENSE MANAGEMENT
  // ===========================================================================

  /**
   * Record an expense
   */
  async recordExpense(
    projectId: string,
    expenseData: Omit<Expense, 'id' | 'projectId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const budget = await this.getProjectBudget(projectId);
    if (!budget) {
      throw new Error(`No budget found for project: ${projectId}`);
    }

    // Verify budget line exists
    const budgetLine = budget.lines.find(l => l.id === expenseData.budgetLineId);
    if (!budgetLine) {
      throw new Error(`Budget line not found: ${expenseData.budgetLineId}`);
    }

    const now = new Date();
    const expenseId = uuidv4();

    const expense: Expense = {
      ...expenseData,
      id: expenseId,
      projectId,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };

    expenses.set(expenseId, expense);

    return expense;
  }

  /**
   * Approve an expense
   */
  async approveExpense(expenseId: string, approverId: string): Promise<Expense> {
    const expense = expenses.get(expenseId);
    if (!expense) {
      throw new Error(`Expense not found: ${expenseId}`);
    }

    expense.status = 'approved';
    expense.approvedBy = approverId;
    expense.updatedAt = new Date();

    expenses.set(expenseId, expense);

    // Update budget line actual amount
    const budget = await this.getProjectBudget(expense.projectId);
    if (budget) {
      const line = budget.lines.find(l => l.id === expense.budgetLineId);
      if (line) {
        line.actualAmount += expense.amount;
        line.updatedAt = new Date();
        this.recalculateTotals(budget);
        budgets.set(budget.id, budget);
      }
    }

    return expense;
  }

  /**
   * Reject an expense
   */
  async rejectExpense(expenseId: string, _reason: string): Promise<Expense> {
    const expense = expenses.get(expenseId);
    if (!expense) {
      throw new Error(`Expense not found: ${expenseId}`);
    }

    expense.status = 'rejected';
    expense.updatedAt = new Date();

    expenses.set(expenseId, expense);

    return expense;
  }

  /**
   * Mark expense as paid
   */
  async markExpensePaid(expenseId: string, paymentDate?: Date): Promise<Expense> {
    const expense = expenses.get(expenseId);
    if (!expense) {
      throw new Error(`Expense not found: ${expenseId}`);
    }

    if (expense.status !== 'approved') {
      throw new Error('Expense must be approved before marking as paid');
    }

    expense.status = 'paid';
    expense.paymentDate = paymentDate || new Date();
    expense.updatedAt = new Date();

    expenses.set(expenseId, expense);

    return expense;
  }

  /**
   * Get expenses for a project
   */
  async getProjectExpenses(projectId: string): Promise<Expense[]> {
    const result: Expense[] = [];

    expenses.forEach(expense => {
      if (expense.projectId === projectId) {
        result.push(expense);
      }
    });

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ===========================================================================
  // BUDGET ANALYSIS
  // ===========================================================================

  /**
   * Get budget vs actual comparison
   */
  async getBudgetVsActual(projectId: string): Promise<BudgetVsActual> {
    const budget = await this.getProjectBudget(projectId);
    if (!budget) {
      throw new Error(`No budget found for project: ${projectId}`);
    }

    const projectExpenses = await this.getProjectExpenses(projectId);

    // Calculate actual by category
    const actualByCategory = new Map<BudgetCategory, number>();
    const actualByPhase = new Map<string, number>();

    for (const expense of projectExpenses) {
      if (expense.status === 'approved' || expense.status === 'paid') {
        const current = actualByCategory.get(expense.category) || 0;
        actualByCategory.set(expense.category, current + expense.amount);

        // Get phase from budget line
        const line = budget.lines.find(l => l.id === expense.budgetLineId);
        if (line?.phaseId) {
          const phaseActual = actualByPhase.get(line.phaseId) || 0;
          actualByPhase.set(line.phaseId, phaseActual + expense.amount);
        }
      }
    }

    // Build category breakdown
    const byCategory: BudgetVsActual['byCategory'] = [];
    const categoryBudgets = new Map<BudgetCategory, number>();

    budget.lines.forEach(line => {
      const current = categoryBudgets.get(line.category) || 0;
      categoryBudgets.set(line.category, current + line.plannedAmount);
    });

    for (const category of Object.values(BudgetCategory)) {
      const budgeted = categoryBudgets.get(category) || 0;
      const actual = actualByCategory.get(category) || 0;
      const variance = budgeted - actual;

      if (budgeted > 0 || actual > 0) {
        byCategory.push({
          category,
          budgeted,
          actual,
          variance,
          variancePercentage: budgeted > 0 ? (variance / budgeted) * 100 : 0
        });
      }
    }

    // Build phase breakdown
    const byPhase: BudgetVsActual['byPhase'] = [];
    const phaseBudgets = new Map<string, { budget: number; name: string }>();

    budget.lines.forEach(line => {
      if (line.phaseId) {
        const current = phaseBudgets.get(line.phaseId) || { budget: 0, name: '' };
        phaseBudgets.set(line.phaseId, {
          budget: current.budget + line.plannedAmount,
          name: current.name || line.phaseId // Would get actual name from ProjectService
        });
      }
    });

    phaseBudgets.forEach((data, phaseId) => {
      const actual = actualByPhase.get(phaseId) || 0;
      byPhase.push({
        phaseId,
        phaseName: data.name,
        budgeted: data.budget,
        actual,
        variance: data.budget - actual
      });
    });

    // Build trend data
    const trend: BudgetVsActual['trend'] = [];
    const sortedExpenses = [...projectExpenses]
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let cumActual = 0;
    const dailyMap = new Map<string, number>();

    sortedExpenses.forEach(expense => {
      const dateKey = new Date(expense.createdAt).toISOString().split('T')[0];
      cumActual += expense.amount;
      dailyMap.set(dateKey, cumActual);
    });

    // Linear budget distribution for comparison
    const totalDays = 90; // Placeholder - would calculate from project dates
    const dailyBudget = budget.totalPlanned / totalDays;
    let cumBudget = 0;
    let dayCount = 0;

    dailyMap.forEach((cumulative, dateKey) => {
      dayCount++;
      cumBudget = dayCount * dailyBudget;
      trend.push({
        date: new Date(dateKey),
        cumBudget,
        cumActual: cumulative
      });
    });

    // Summary
    const totalBudget = budget.totalPlanned;
    const totalActual = budget.totalActual;
    const variance = totalBudget - totalActual;

    let status: 'under' | 'on_track' | 'over';
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    if (variancePercentage < -10) {
      status = 'over';
    } else if (variancePercentage > 10) {
      status = 'under';
    } else {
      status = 'on_track';
    }

    return {
      budgetId: budget.id,
      projectId,
      summary: {
        totalBudget,
        totalActual,
        variance,
        variancePercentage: Math.round(variancePercentage * 10) / 10,
        status
      },
      byCategory,
      byPhase,
      trend,
      generatedAt: new Date()
    };
  }

  /**
   * Forecast final cost
   */
  async forecastFinalCost(projectId: string): Promise<{
    currentSpend: number;
    projectedTotal: number;
    originalBudget: number;
    variance: number;
    methodology: 'linear' | 'earned_value' | 'historical';
    confidence: 'high' | 'medium' | 'low';
    breakdown: {
      category: BudgetCategory;
      currentSpend: number;
      projectedTotal: number;
      budgeted: number;
    }[];
  }> {
    const budget = await this.getProjectBudget(projectId);
    if (!budget) {
      throw new Error(`No budget found for project: ${projectId}`);
    }

    // Get project progress (placeholder - would come from ProjectService)
    const projectProgress = 50; // Would be actual project progress

    // Use EVM-based forecasting
    const currentSpend = budget.totalActual;
    const earnedValue = (projectProgress / 100) * budget.totalPlanned;

    // CPI (Cost Performance Index)
    const CPI = currentSpend > 0 ? earnedValue / currentSpend : 1;

    // EAC (Estimate at Completion) = BAC / CPI
    const projectedTotal = CPI > 0 ? budget.totalPlanned / CPI : budget.totalPlanned;

    // Build category breakdown
    const breakdown: {
      category: BudgetCategory;
      currentSpend: number;
      projectedTotal: number;
      budgeted: number;
    }[] = [];

    const categoryData = new Map<BudgetCategory, { budgeted: number; actual: number }>();

    budget.lines.forEach(line => {
      const current = categoryData.get(line.category) || { budgeted: 0, actual: 0 };
      categoryData.set(line.category, {
        budgeted: current.budgeted + line.plannedAmount,
        actual: current.actual + line.actualAmount
      });
    });

    categoryData.forEach((data, category) => {
      const _categoryProgress = data.budgeted > 0 ? (data.actual / data.budgeted) : 0;
      const categoryProjected = projectProgress > 0
        ? (data.actual / (projectProgress / 100))
        : data.budgeted;

      breakdown.push({
        category,
        currentSpend: data.actual,
        projectedTotal: Math.round(categoryProjected * 100) / 100,
        budgeted: data.budgeted
      });
    });

    // Determine confidence based on project progress
    let confidence: 'high' | 'medium' | 'low';
    if (projectProgress >= 70) {
      confidence = 'high';
    } else if (projectProgress >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      currentSpend,
      projectedTotal: Math.round(projectedTotal * 100) / 100,
      originalBudget: budget.totalPlanned,
      variance: Math.round((budget.totalPlanned - projectedTotal) * 100) / 100,
      methodology: 'earned_value',
      confidence,
      breakdown
    };
  }

  /**
   * Get Earned Value metrics
   */
  async getEarnedValue(projectId: string): Promise<EVMMetrics> {
    const budget = await this.getProjectBudget(projectId);
    if (!budget) {
      throw new Error(`No budget found for project: ${projectId}`);
    }

    // Get project progress (placeholder - would come from ProjectService)
    const projectProgress = 50;
    const plannedProgress = 55; // Would be calculated from timeline

    const now = new Date();
    const BAC = budget.totalPlanned;
    const AC = budget.totalActual;

    // PV = Planned progress * BAC
    const PV = (plannedProgress / 100) * BAC;

    // EV = Actual progress * BAC
    const EV = (projectProgress / 100) * BAC;

    // Variances
    const CV = EV - AC; // Cost Variance
    const SV = EV - PV; // Schedule Variance

    // Performance Indices
    const CPI = AC > 0 ? EV / AC : 1;
    const SPI = PV > 0 ? EV / PV : 1;

    // Forecasts
    const EAC = CPI > 0 ? BAC / CPI : BAC;
    const ETC = EAC - AC;
    const VAC = BAC - EAC;
    const TCPI = (BAC - EV) > 0 && (BAC - AC) > 0 ? (BAC - EV) / (BAC - AC) : 1;

    // Health indicators
    const costHealth: 'green' | 'yellow' | 'red' =
      CPI >= 0.95 ? 'green' : CPI >= 0.85 ? 'yellow' : 'red';
    const scheduleHealth: 'green' | 'yellow' | 'red' =
      SPI >= 0.95 ? 'green' : SPI >= 0.85 ? 'yellow' : 'red';
    const overallHealth: 'green' | 'yellow' | 'red' =
      costHealth === 'green' && scheduleHealth === 'green' ? 'green' :
      costHealth === 'red' || scheduleHealth === 'red' ? 'red' : 'yellow';

    return {
      projectId,
      snapshotDate: now,
      BAC,
      PV: Math.round(PV * 100) / 100,
      EV: Math.round(EV * 100) / 100,
      AC: Math.round(AC * 100) / 100,
      CV: Math.round(CV * 100) / 100,
      SV: Math.round(SV * 100) / 100,
      CPI: Math.round(CPI * 1000) / 1000,
      SPI: Math.round(SPI * 1000) / 1000,
      EAC: Math.round(EAC * 100) / 100,
      ETC: Math.round(ETC * 100) / 100,
      VAC: Math.round(VAC * 100) / 100,
      TCPI: Math.round(TCPI * 1000) / 1000,
      plannedProgress,
      actualProgress: projectProgress,
      plannedDuration: 90, // Placeholder
      actualDuration: 45, // Placeholder
      remainingDuration: 45, // Placeholder
      costHealth,
      scheduleHealth,
      overallHealth
    };
  }

  /**
   * Get cost variance
   */
  async getCostVariance(projectId: string): Promise<{
    costVariance: number;
    costVariancePercentage: number;
    status: 'favorable' | 'neutral' | 'unfavorable';
    details: string;
  }> {
    const evm = await this.getEarnedValue(projectId);

    let status: 'favorable' | 'neutral' | 'unfavorable';
    let details: string;

    if (evm.CV > 0) {
      status = 'favorable';
      details = `Project is under budget by ${Math.abs(evm.CV).toFixed(2)}. Cost performance is efficient.`;
    } else if (evm.CV < 0) {
      status = 'unfavorable';
      details = `Project is over budget by ${Math.abs(evm.CV).toFixed(2)}. Cost control measures recommended.`;
    } else {
      status = 'neutral';
      details = 'Project is on budget. Costs are tracking as planned.';
    }

    const cvPercentage = evm.BAC > 0 ? (evm.CV / evm.BAC) * 100 : 0;

    return {
      costVariance: evm.CV,
      costVariancePercentage: Math.round(cvPercentage * 10) / 10,
      status,
      details
    };
  }

  /**
   * Get schedule variance (from budget perspective)
   */
  async getScheduleVariance(projectId: string): Promise<{
    scheduleVariance: number;
    scheduleVariancePercentage: number;
    status: 'ahead' | 'on_track' | 'behind';
    details: string;
  }> {
    const evm = await this.getEarnedValue(projectId);

    let status: 'ahead' | 'on_track' | 'behind';
    let details: string;

    if (evm.SV > 0) {
      status = 'ahead';
      details = `Project is ahead of schedule by ${Math.abs(evm.SV).toFixed(2)} in earned value. Excellent progress.`;
    } else if (evm.SV < 0) {
      status = 'behind';
      details = `Project is behind schedule by ${Math.abs(evm.SV).toFixed(2)} in earned value. Recovery plan may be needed.`;
    } else {
      status = 'on_track';
      details = 'Project is on schedule. Progress matches the plan.';
    }

    const svPercentage = evm.BAC > 0 ? (evm.SV / evm.BAC) * 100 : 0;

    return {
      scheduleVariance: evm.SV,
      scheduleVariancePercentage: Math.round(svPercentage * 10) / 10,
      status,
      details
    };
  }

  // ===========================================================================
  // CONTINGENCY MANAGEMENT
  // ===========================================================================

  /**
   * Request contingency funds
   */
  async requestContingency(
    budgetId: string,
    amount: number,
    _reason: string,
    _requesterId: string
  ): Promise<{
    approved: boolean;
    amount: number;
    remainingContingency: number;
    reason?: string;
  }> {
    const budget = budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const availableContingency = budget.contingencyAmount - budget.contingencyUsed;

    if (amount > availableContingency) {
      return {
        approved: false,
        amount: 0,
        remainingContingency: availableContingency,
        reason: `Requested amount (${amount}) exceeds available contingency (${availableContingency})`
      };
    }

    // Auto-approve if within limits (in production, might need approval workflow)
    budget.contingencyUsed += amount;
    budget.updatedAt = new Date();

    budgets.set(budgetId, budget);

    return {
      approved: true,
      amount,
      remainingContingency: budget.contingencyAmount - budget.contingencyUsed
    };
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Recalculate budget totals
   */
  private recalculateTotals(budget: Budget): void {
    budget.totalPlanned = budget.lines.reduce((sum, l) => sum + l.plannedAmount, 0);
    budget.totalCommitted = budget.lines.reduce((sum, l) => sum + l.committedAmount, 0);
    budget.totalActual = budget.lines.reduce((sum, l) => sum + l.actualAmount, 0);
    budget.totalRemaining = budget.totalPlanned - budget.totalActual;

    // Update contingency
    budget.contingencyAmount = budget.totalPlanned * (budget.contingencyPercentage / 100);
    budget.totalAmount = budget.totalPlanned + budget.contingencyAmount;
  }
}

// Export singleton instance
export const budgetService = new BudgetService();
