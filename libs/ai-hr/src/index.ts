/**
 * AI-HR Module - Human Resources Management for Spanish Companies
 *
 * This module provides comprehensive HR management functionality including:
 * - Employee lifecycle management
 * - Payroll calculations with Spanish tax law compliance (IRPF, SS)
 * - Leave and absence management
 * - Performance evaluations and 360 feedback
 * - Training and development tracking
 *
 * All calculations follow Spanish labor law and collective agreement standards.
 */

// ============================================================================
// TYPES EXPORTS
// ============================================================================

export {
  // Enums
  EmployeeStatus,
  ContractType,
  PayrollStatus,
  LeaveType,
  EvaluationStatus,
  SalaryComponentType,
  TrainingStatus,
  EnrollmentStatus,

  // Employee & Organization
  Employee,
  Address,
  BankAccount,
  PersonalSituation,
  Descendant,
  Ascendant,
  EmergencyContact,
  EmployeeDocument,
  Contract,
  ContributionGroup,
  Department,
  Position,
  OrgChartNode,

  // Payroll
  SalaryComponent,
  PayrollPeriod,
  Payslip,
  PayslipLine,
  PayslipEmployeeData,
  InKindBenefit,
  IRPFCalculation,
  IRPFReduction,
  IRPFDeduction,
  SocialSecurityCalculation,
  SEPAPayment,
  PayrollSummary,
  DepartmentPayrollSummary,
  CostCenterPayrollSummary,

  // Leave & Absence
  LeaveRequest,
  MedicalLeaveInfo,
  LeaveBalance,
  LeaveTypeBalance,
  Absence,
  TeamCalendarEntry,
  AbsenceReport,
  AbsenceByType,
  AbsenceByDepartment,
  BradfordFactorResult,

  // Evaluation & Performance
  Evaluation,
  Goal,
  Competency,
  CompetencyLevel,
  CompetencyScore,
  PeerReview,
  DevelopmentAction,
  Feedback360Summary,
  PerformanceScoreResult,

  // Training
  Training,
  TrainingEnrollment,
  Certification,
  TrainingPlan,
  TrainingPlanItem,
  TrainingNeeds,
  CompetencyGap,
  RecommendedTraining,
  TrainingPriorityMatrix,

  // Utility Types
  EmployeeSearchQuery,
  PaginatedResult,
  OperationResult,
  Period,
  DateRange
} from './types';

// ============================================================================
// SERVICES EXPORTS
// ============================================================================

export {
  EmployeeService,
  CreateEmployeeData,
  UpdateEmployeeData,
  TransferData
} from './services/employee.service';

export {
  PayrollService
} from './services/payroll.service';

export {
  LeaveService,
  CreateLeaveRequestData
} from './services/leave.service';

export {
  EvaluationService,
  CreateEvaluationData,
  GoalData,
  CompetencyScoreData,
  PeerReviewRequestData
} from './services/evaluation.service';

// ============================================================================
// MODULE FACADE
// ============================================================================

import { EmployeeService } from './services/employee.service';
import { PayrollService } from './services/payroll.service';
import { LeaveService } from './services/leave.service';
import { EvaluationService } from './services/evaluation.service';

/**
 * AI-HR Module - Main entry point
 *
 * Provides a unified interface to all HR services with Spanish labor law compliance.
 *
 * Features:
 * - IRPF calculation with 2024 tax brackets
 * - Social Security contributions (4.7% employee contingencias comunes)
 * - Collective agreement support (convenios colectivos)
 * - SEPA payment file generation
 * - Leave management per Spanish Estatuto de los Trabajadores
 * - Performance evaluation with 360 feedback
 */
export class AIHRModule {
  public readonly employees: EmployeeService;
  public readonly payroll: PayrollService;
  public readonly leave: LeaveService;
  public readonly evaluation: EvaluationService;

  constructor() {
    this.employees = new EmployeeService();
    this.payroll = new PayrollService();
    this.leave = new LeaveService();
    this.evaluation = new EvaluationService();
  }

  /**
   * Get module version
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get module information
   */
  getInfo(): ModuleInfo {
    return {
      name: '@ai-core/ai-hr',
      version: '1.0.0',
      description: 'AI-powered Human Resources management for Spanish companies',
      features: [
        'Employee lifecycle management',
        'Spanish payroll with IRPF and Social Security',
        'Leave and absence tracking',
        'Performance evaluations and 360 feedback',
        'Collective agreement support'
      ],
      compliance: [
        'Estatuto de los Trabajadores',
        'Ley General de la Seguridad Social',
        'IRPF Regulations 2024',
        'SEPA payment standards'
      ]
    };
  }
}

/**
 * Module information interface
 */
export interface ModuleInfo {
  name: string;
  version: string;
  description: string;
  features: string[];
  compliance: string[];
}

// Default export
export default AIHRModule;
