/**
 * AI-Projects Module
 * Comprehensive project management with Waterfall/Agile methodologies and EVM metrics
 *
 * @packageDocumentation
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export {
  // Enums
  ProjectStatus,
  TaskStatus,
  Priority,
  RiskLevel,
  Methodology,
  DependencyType,
  ResourceType,
  BudgetCategory,
  IssueStatus,
  ChangeRequestStatus,
  RiskStatus,

  // Project interfaces
  Project,
  ProjectPhase,
  Milestone,

  // Task interfaces
  Task,
  Subtask,
  TaskDependency,
  TaskComment,

  // Resource interfaces
  Resource,
  ResourceAllocation,
  TimeEntry,

  // Budget interfaces
  Budget,
  BudgetLine,
  Expense,

  // EVM interfaces
  EVMMetrics,

  // Risk & Issue interfaces
  Risk,
  Issue,
  ChangeRequest,

  // Gantt & Timeline
  GanttData,
  GanttTask,
  GanttMilestone,
  GanttDependency,

  // Dashboard & Reporting
  ProjectDashboard,
  ActivityItem,

  // Input types
  CreateProjectInput,
  CreateTaskInput,
  CreateRiskInput,
  CreateIssueInput,
  CreateChangeRequestInput,

  // Utility types
  TimePeriod,
  TeamCapacity,
  BudgetVsActual,
  RiskMatrix
} from './types';

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

export { ProjectService, projectService } from './services/project.service';
export { TaskService, taskService } from './services/task.service';
export { ResourceService, resourceService } from './services/resource.service';
export { BudgetService, budgetService } from './services/budget.service';
export { RiskService, riskService } from './services/risk.service';

// =============================================================================
// MODULE FACADE
// =============================================================================

import { projectService } from './services/project.service';
import { taskService } from './services/task.service';
import { resourceService } from './services/resource.service';
import { budgetService } from './services/budget.service';
import { riskService } from './services/risk.service';

/**
 * AI-Projects Module Facade
 * Unified access to all project management services
 */
export const AIProjects = {
  /**
   * Project management service
   * - Create and manage projects
   * - Phase management (Waterfall)
   * - Milestone tracking
   * - Timeline/Gantt generation
   * - Progress calculation
   * - EVM metrics
   */
  projects: projectService,

  /**
   * Task management service
   * - Task CRUD operations
   * - Assignment and progress tracking
   * - Dependencies (FS, SS, FF, SF)
   * - Subtasks management
   * - Critical path calculation
   */
  tasks: taskService,

  /**
   * Resource management service
   * - Resource allocation
   * - Availability tracking
   * - Utilization metrics
   * - Workload balancing
   * - Time entry logging
   */
  resources: resourceService,

  /**
   * Budget management service
   * - Budget creation and tracking
   * - Expense recording
   * - Budget vs Actual analysis
   * - EVM (Earned Value Management)
   * - Contingency management
   */
  budget: budgetService,

  /**
   * Risk management service
   * - Risk identification and assessment
   * - Issue tracking
   * - Change request management
   * - Risk matrix generation
   */
  risks: riskService
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate project health based on EVM metrics
 * @param cpi Cost Performance Index
 * @param spi Schedule Performance Index
 * @returns Health status: 'green' | 'yellow' | 'red'
 */
export function calculateProjectHealth(
  cpi: number,
  spi: number
): 'green' | 'yellow' | 'red' {
  if (cpi >= 0.95 && spi >= 0.95) {
    return 'green';
  } else if (cpi >= 0.85 && spi >= 0.85) {
    return 'yellow';
  } else {
    return 'red';
  }
}

/**
 * Calculate Critical Ratio (SPI * CPI)
 * @param spi Schedule Performance Index
 * @param cpi Cost Performance Index
 * @returns Critical ratio value
 */
export function calculateCriticalRatio(spi: number, cpi: number): number {
  return Math.round(spi * cpi * 1000) / 1000;
}

/**
 * Determine risk level from probability and impact
 * @param probability Risk probability (1-5)
 * @param impact Risk impact (1-5)
 * @returns Risk level
 */
export function determineRiskLevel(
  probability: number,
  impact: number
): 'critical' | 'high' | 'medium' | 'low' | 'negligible' {
  const score = probability * impact;

  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  if (score >= 2) return 'low';
  return 'negligible';
}

/**
 * Calculate EVM metrics from basic inputs
 * @param bac Budget at Completion
 * @param pv Planned Value
 * @param ev Earned Value
 * @param ac Actual Cost
 * @returns Calculated EVM metrics
 */
export function calculateEVMMetrics(
  bac: number,
  pv: number,
  ev: number,
  ac: number
): {
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
} {
  // Variances
  const cv = ev - ac;
  const sv = ev - pv;

  // Performance Indices
  const cpi = ac > 0 ? ev / ac : 1;
  const spi = pv > 0 ? ev / pv : 1;

  // Forecasts
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (bac - ev) > 0 && (bac - ac) > 0 ? (bac - ev) / (bac - ac) : 1;

  return {
    cv: Math.round(cv * 100) / 100,
    sv: Math.round(sv * 100) / 100,
    cpi: Math.round(cpi * 1000) / 1000,
    spi: Math.round(spi * 1000) / 1000,
    eac: Math.round(eac * 100) / 100,
    etc: Math.round(etc * 100) / 100,
    vac: Math.round(vac * 100) / 100,
    tcpi: Math.round(tcpi * 1000) / 1000
  };
}

/**
 * Format currency value
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Calculate working days between two dates (excluding weekends)
 * @param start Start date
 * @param end End date
 * @returns Number of working days
 */
export function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

// Default export
export default AIProjects;
