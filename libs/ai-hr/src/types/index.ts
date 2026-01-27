/**
 * AI-HR Types - Human Resources Management Types for Spanish Companies
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Employee employment status
 */
export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  PROBATION = 'PROBATION',
  RETIRED = 'RETIRED'
}

/**
 * Contract types according to Spanish labor law
 */
export enum ContractType {
  INDEFINIDO = 'INDEFINIDO',                           // Permanent contract
  INDEFINIDO_FIJO_DISCONTINUO = 'INDEFINIDO_FIJO_DISCONTINUO', // Seasonal permanent
  TEMPORAL_OBRA_SERVICIO = 'TEMPORAL_OBRA_SERVICIO',   // Project-based temporary
  TEMPORAL_CIRCUNSTANCIAS_PRODUCCION = 'TEMPORAL_CIRCUNSTANCIAS_PRODUCCION', // Production needs
  TEMPORAL_SUSTITUCION = 'TEMPORAL_SUSTITUCION',       // Substitution contract
  FORMACION_ALTERNANCIA = 'FORMACION_ALTERNANCIA',     // Training alternating
  FORMACION_PRACTICA = 'FORMACION_PRACTICA',           // Internship/Practice
  TIEMPO_PARCIAL = 'TIEMPO_PARCIAL',                   // Part-time
  RELEVO = 'RELEVO',                                   // Relay contract
  JUBILACION_PARCIAL = 'JUBILACION_PARCIAL'            // Partial retirement
}

/**
 * Payroll processing status
 */
export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR'
}

/**
 * Leave/Absence types according to Spanish labor law
 */
export enum LeaveType {
  VACACIONES = 'VACACIONES',                           // Vacation days
  BAJA_ENFERMEDAD = 'BAJA_ENFERMEDAD',                 // Sick leave
  BAJA_ACCIDENTE_LABORAL = 'BAJA_ACCIDENTE_LABORAL',   // Work accident leave
  MATERNIDAD = 'MATERNIDAD',                           // Maternity leave
  PATERNIDAD = 'PATERNIDAD',                           // Paternity leave
  MATRIMONIO = 'MATRIMONIO',                           // Marriage leave (15 days)
  FALLECIMIENTO_FAMILIAR = 'FALLECIMIENTO_FAMILIAR',   // Bereavement (2-4 days)
  HOSPITALIZACION_FAMILIAR = 'HOSPITALIZACION_FAMILIAR', // Family hospitalization
  MUDANZA = 'MUDANZA',                                 // Moving house (1 day)
  DEBER_INEXCUSABLE = 'DEBER_INEXCUSABLE',             // Civic duty (jury, voting)
  EXAMEN = 'EXAMEN',                                   // Exam leave
  LACTANCIA = 'LACTANCIA',                             // Breastfeeding leave
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',                 // Personal days
  PERMISO_SIN_SUELDO = 'PERMISO_SIN_SUELDO',           // Unpaid leave
  EXCEDENCIA = 'EXCEDENCIA',                           // Leave of absence
  REDUCCION_JORNADA = 'REDUCCION_JORNADA',             // Reduced hours
  FORMACION = 'FORMACION'                              // Training leave
}

/**
 * Performance evaluation status
 */
export enum EvaluationStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_EMPLOYEE_ACK = 'PENDING_EMPLOYEE_ACK',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Payroll component types
 */
export enum SalaryComponentType {
  SALARIO_BASE = 'SALARIO_BASE',
  COMPLEMENTO_ANTIGUEDAD = 'COMPLEMENTO_ANTIGUEDAD',
  COMPLEMENTO_PUESTO = 'COMPLEMENTO_PUESTO',
  COMPLEMENTO_CONVENIO = 'COMPLEMENTO_CONVENIO',
  PLUS_TRANSPORTE = 'PLUS_TRANSPORTE',
  PLUS_PRODUCTIVIDAD = 'PLUS_PRODUCTIVIDAD',
  HORAS_EXTRA = 'HORAS_EXTRA',
  COMISIONES = 'COMISIONES',
  BONUS = 'BONUS',
  PAGA_EXTRA = 'PAGA_EXTRA',
  DIETAS = 'DIETAS',
  KILOMETRAJE = 'KILOMETRAJE',
  IRPF = 'IRPF',
  SEGURIDAD_SOCIAL_TRABAJADOR = 'SEGURIDAD_SOCIAL_TRABAJADOR',
  ANTICIPO = 'ANTICIPO',
  EMBARGO = 'EMBARGO',
  OTROS_DEVENGOS = 'OTROS_DEVENGOS',
  OTRAS_DEDUCCIONES = 'OTRAS_DEDUCCIONES'
}

/**
 * Training/Course status
 */
export enum TrainingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Enrollment status
 */
export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  WITHDRAWN = 'WITHDRAWN'
}

// ============================================================================
// EMPLOYEE & ORGANIZATION INTERFACES
// ============================================================================

/**
 * Employee personal and professional information
 */
export interface Employee {
  id: string;

  // Personal data
  firstName: string;
  lastName: string;
  secondLastName?: string;
  dni: string;                                         // Spanish ID
  nie?: string;                                        // Foreign ID
  naf: string;                                         // Social Security Number
  birthDate: Date;
  nationality: string;
  gender: 'M' | 'F' | 'O';

  // Contact information
  email: string;
  personalEmail?: string;
  phone: string;
  mobilePhone?: string;
  address: Address;

  // Employment data
  employeeNumber: string;
  status: EmployeeStatus;
  departmentId: string;
  positionId: string;
  managerId?: string;
  hireDate: Date;
  seniorityDate: Date;                                 // May differ from hire date
  terminationDate?: Date;
  terminationReason?: string;

  // Contract & Compensation
  currentContractId: string;
  workCenterId: string;
  costCenterId?: string;

  // Personal situation for IRPF
  personalSituation: PersonalSituation;

  // Banking
  bankAccount: BankAccount;

  // Additional
  photo?: string;
  documents?: EmployeeDocument[];
  emergencyContact?: EmergencyContact;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

/**
 * Address structure
 */
export interface Address {
  street: string;
  number: string;
  floor?: string;
  door?: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
}

/**
 * Bank account information
 */
export interface BankAccount {
  iban: string;
  bic?: string;
  bankName?: string;
  accountHolder: string;
}

/**
 * Personal situation for IRPF calculation
 */
export interface PersonalSituation {
  familySituation: 1 | 2 | 3;                          // 1: Single, 2: Married, 3: Married both working
  disability: number;                                   // Percentage 0-100
  descendants: Descendant[];
  ascendants: Ascendant[];
  mortgageDeduction: boolean;                           // Deducción vivienda habitual (anterior a 2013)
  geographicMobility: boolean;                          // Movilidad geográfica
  prolongedUnemployment: boolean;                       // Desempleo prolongado
}

/**
 * Descendant for IRPF deductions
 */
export interface Descendant {
  birthDate: Date;
  disability: number;
  sharedCustody: boolean;
}

/**
 * Ascendant for IRPF deductions
 */
export interface Ascendant {
  age: number;
  livesWithEmployee: boolean;
  disability: number;
}

/**
 * Emergency contact
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternativePhone?: string;
}

/**
 * Employee document
 */
export interface EmployeeDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

/**
 * Employment contract
 */
export interface Contract {
  id: string;
  employeeId: string;

  // Contract details
  type: ContractType;
  startDate: Date;
  endDate?: Date;
  trialPeriodEnd?: Date;

  // Work conditions
  hoursPerWeek: number;
  workSchedule: string;
  workModality: 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';

  // Compensation
  grossAnnualSalary: number;
  numberOfPayments: 12 | 14;                           // 12 or 14 payments
  salaryComponents: SalaryComponent[];

  // Legal references
  collectiveAgreement?: string;                        // Convenio colectivo
  professionalGroup: string;
  contributionGroup: ContributionGroup;

  // Document
  documentUrl?: string;
  signedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  previousContractId?: string;
}

/**
 * Social Security contribution group
 */
export interface ContributionGroup {
  code: string;                                        // 1-11
  description: string;
  minBase: number;
  maxBase: number;
}

/**
 * Department structure
 */
export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  costCenterId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Job position
 */
export interface Position {
  id: string;
  code: string;
  title: string;
  description?: string;
  departmentId: string;
  level: number;
  minSalary?: number;
  maxSalary?: number;
  requiredCompetencies?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization chart node
 */
export interface OrgChartNode {
  employee: Employee;
  position: Position;
  department: Department;
  directReports: OrgChartNode[];
}

// ============================================================================
// PAYROLL INTERFACES
// ============================================================================

/**
 * Salary component (devengos y deducciones)
 */
export interface SalaryComponent {
  id: string;
  type: SalaryComponentType;
  name: string;
  amount: number;
  isDeduction: boolean;
  isExempt: boolean;                                   // Exempt from IRPF
  isCotizable: boolean;                                // Subject to Social Security
  frequency: 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
  prorated?: boolean;                                  // For extra payments
}

/**
 * Payroll period
 */
export interface PayrollPeriod {
  id: string;
  year: number;
  month: number;
  type: 'ORDINARY' | 'EXTRA_JUNE' | 'EXTRA_DECEMBER' | 'SETTLEMENT';
  startDate: Date;
  endDate: Date;
  paymentDate: Date;
  status: PayrollStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  createdAt: Date;
  processedAt?: Date;
  paidAt?: Date;
}

/**
 * Individual payslip (nómina)
 */
export interface Payslip {
  id: string;
  employeeId: string;
  periodId: string;

  // Employee data snapshot
  employeeData: PayslipEmployeeData;

  // Earnings (Devengos)
  earnings: PayslipLine[];
  totalEarnings: number;

  // Deductions
  deductions: PayslipLine[];
  totalDeductions: number;

  // Calculations
  grossSalary: number;
  socialSecurityBase: number;
  irpfBase: number;
  irpfPercentage: number;
  irpfAmount: number;
  socialSecurityEmployee: number;
  socialSecurityEmployer: number;
  netSalary: number;

  // Extras
  inKindBenefits?: InKindBenefit[];

  // Status
  status: PayrollStatus;
  generatedAt: Date;
  paidAt?: Date;
  paymentReference?: string;
}

/**
 * Payslip line item
 */
export interface PayslipLine {
  componentType: SalaryComponentType;
  description: string;
  units?: number;
  unitPrice?: number;
  amount: number;
  isDeduction: boolean;
}

/**
 * Employee data snapshot for payslip
 */
export interface PayslipEmployeeData {
  employeeNumber: string;
  fullName: string;
  dni: string;
  naf: string;
  category: string;
  contributionGroup: string;
  startDate: Date;
  seniorityDate: Date;
}

/**
 * In-kind benefit (retribución en especie)
 */
export interface InKindBenefit {
  type: string;
  description: string;
  value: number;
  taxableAmount: number;
}

/**
 * IRPF calculation result
 */
export interface IRPFCalculation {
  grossAnnual: number;
  exemptIncome: number;
  taxableBase: number;
  reductions: IRPFReduction[];
  totalReductions: number;
  liquidBase: number;
  generalQuota: number;
  autonomicQuota: number;
  totalQuota: number;
  deductions: IRPFDeduction[];
  totalDeductions: number;
  finalQuota: number;
  retentionPercentage: number;
  monthlyRetention: number;
}

/**
 * IRPF reduction
 */
export interface IRPFReduction {
  concept: string;
  amount: number;
}

/**
 * IRPF deduction
 */
export interface IRPFDeduction {
  concept: string;
  amount: number;
}

/**
 * Social Security calculation result
 */
export interface SocialSecurityCalculation {
  contributionBase: number;
  contingenciasComunes: {
    base: number;
    employeeRate: number;
    employeeAmount: number;
    employerRate: number;
    employerAmount: number;
  };
  desempleo: {
    base: number;
    employeeRate: number;
    employeeAmount: number;
    employerRate: number;
    employerAmount: number;
  };
  formacion: {
    base: number;
    employeeRate: number;
    employeeAmount: number;
    employerRate: number;
    employerAmount: number;
  };
  horasExtra?: {
    base: number;
    employeeRate: number;
    employeeAmount: number;
    employerRate: number;
    employerAmount: number;
  };
  totalEmployee: number;
  totalEmployer: number;
}

/**
 * SEPA payment file data
 */
export interface SEPAPayment {
  id: string;
  payrollId: string;
  fileContent: string;
  fileName: string;
  totalAmount: number;
  numberOfTransactions: number;
  generatedAt: Date;
}

/**
 * Payroll summary
 */
export interface PayrollSummary {
  period: PayrollPeriod;
  totalGross: number;
  totalNet: number;
  totalIRPF: number;
  totalSSEmployee: number;
  totalSSEmployer: number;
  byDepartment: DepartmentPayrollSummary[];
  byCostCenter: CostCenterPayrollSummary[];
}

/**
 * Department payroll summary
 */
export interface DepartmentPayrollSummary {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalGross: number;
  totalNet: number;
}

/**
 * Cost center payroll summary
 */
export interface CostCenterPayrollSummary {
  costCenterId: string;
  costCenterName: string;
  totalCost: number;
}

// ============================================================================
// LEAVE & ABSENCE INTERFACES
// ============================================================================

/**
 * Leave request
 */
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;

  // Dates
  startDate: Date;
  endDate: Date;
  startHalfDay?: boolean;
  endHalfDay?: boolean;

  // Duration
  workingDays: number;
  calendarDays: number;

  // Details
  reason?: string;
  attachmentUrls?: string[];

  // Medical leave specific
  medicalLeaveInfo?: MedicalLeaveInfo;

  // Approval workflow
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedAt: Date;
  approverId?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Medical leave specific information
 */
export interface MedicalLeaveInfo {
  diagnosisCode?: string;
  contingencyType: 'COMUN' | 'PROFESIONAL';
  expectedEndDate?: Date;
  partialReturn?: boolean;
  partialHours?: number;
}

/**
 * Leave balance for an employee
 */
export interface LeaveBalance {
  employeeId: string;
  year: number;
  balances: LeaveTypeBalance[];
  lastUpdated: Date;
}

/**
 * Balance for a specific leave type
 */
export interface LeaveTypeBalance {
  type: LeaveType;
  entitled: number;
  taken: number;
  pending: number;
  remaining: number;
  carriedOver?: number;
  expiresAt?: Date;
}

/**
 * Absence record (historical)
 */
export interface Absence {
  id: string;
  employeeId: string;
  leaveRequestId?: string;
  type: LeaveType;
  date: Date;
  hours: number;
  isPaid: boolean;
  affectsVacation: boolean;
  notes?: string;
}

/**
 * Team calendar entry
 */
export interface TeamCalendarEntry {
  employeeId: string;
  employeeName: string;
  date: Date;
  type: LeaveType;
  status: 'APPROVED' | 'PENDING';
  isHalfDay: boolean;
}

/**
 * Absence report
 */
export interface AbsenceReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalAbsenceDays: number;
  byType: AbsenceByType[];
  byDepartment: AbsenceByDepartment[];
  absenteeismRate: number;
  bradfordFactor?: BradfordFactorResult[];
}

/**
 * Absence statistics by type
 */
export interface AbsenceByType {
  type: LeaveType;
  days: number;
  occurrences: number;
  percentage: number;
}

/**
 * Absence statistics by department
 */
export interface AbsenceByDepartment {
  departmentId: string;
  departmentName: string;
  totalDays: number;
  averagePerEmployee: number;
  absenteeismRate: number;
}

/**
 * Bradford Factor calculation result
 */
export interface BradfordFactorResult {
  employeeId: string;
  employeeName: string;
  spells: number;
  days: number;
  bradfordFactor: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ============================================================================
// EVALUATION & PERFORMANCE INTERFACES
// ============================================================================

/**
 * Performance evaluation
 */
export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatorId: string;

  // Period
  periodStart: Date;
  periodEnd: Date;
  type: 'ANNUAL' | 'SEMESTRAL' | 'QUARTERLY' | 'PROBATION' | 'PROJECT';

  // Content
  goals: Goal[];
  competencies: CompetencyScore[];

  // Feedback
  selfAssessment?: string;
  evaluatorComments?: string;
  employeeComments?: string;

  // Scores
  goalScore?: number;
  competencyScore?: number;
  overallScore?: number;
  rating?: 'EXCEEDS' | 'MEETS' | 'DEVELOPING' | 'BELOW';

  // Development
  developmentPlan?: DevelopmentAction[];

  // Status
  status: EvaluationStatus;
  createdAt: Date;
  submittedAt?: Date;
  acknowledgedAt?: Date;

  // 360 Feedback
  is360: boolean;
  peerReviews?: PeerReview[];
}

/**
 * Goal within an evaluation
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'BUSINESS' | 'DEVELOPMENT' | 'TEAM' | 'PERSONAL';
  weight: number;                                      // Percentage weight
  targetValue?: number;
  actualValue?: number;
  unit?: string;
  dueDate: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionPercentage: number;
  score?: number;                                      // 1-5 scale
  comments?: string;
}

/**
 * Competency definition
 */
export interface Competency {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'CORE' | 'LEADERSHIP' | 'FUNCTIONAL' | 'TECHNICAL';
  levels: CompetencyLevel[];
  isActive: boolean;
}

/**
 * Competency level definition
 */
export interface CompetencyLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  behaviors: string[];
}

/**
 * Competency score in evaluation
 */
export interface CompetencyScore {
  competencyId: string;
  competencyName: string;
  expectedLevel: number;
  currentLevel: number;
  score: number;
  comments?: string;
  evidences?: string[];
}

/**
 * Peer review for 360 feedback
 */
export interface PeerReview {
  reviewerId: string;
  reviewerRelationship: 'PEER' | 'SUBORDINATE' | 'SUPERVISOR' | 'EXTERNAL';
  isAnonymous: boolean;
  competencyScores: CompetencyScore[];
  qualitativeFeedback?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  submittedAt: Date;
}

/**
 * Development action in development plan
 */
export interface DevelopmentAction {
  id: string;
  type: 'TRAINING' | 'COACHING' | 'MENTORING' | 'PROJECT' | 'READING' | 'OTHER';
  title: string;
  description: string;
  linkedCompetencies: string[];
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completedAt?: Date;
}

/**
 * 360 Feedback summary
 */
export interface Feedback360Summary {
  employeeId: string;
  evaluationPeriod: {
    start: Date;
    end: Date;
  };
  selfAssessment: CompetencyScore[];
  supervisorAssessment: CompetencyScore[];
  peerAverage: CompetencyScore[];
  subordinateAverage?: CompetencyScore[];
  overallAverage: CompetencyScore[];
  strengthsIdentified: string[];
  developmentAreas: string[];
}

/**
 * Performance score calculation
 */
export interface PerformanceScoreResult {
  employeeId: string;
  period: {
    start: Date;
    end: Date;
  };
  goalScore: number;
  goalWeight: number;
  competencyScore: number;
  competencyWeight: number;
  overallScore: number;
  rating: 'EXCEEDS' | 'MEETS' | 'DEVELOPING' | 'BELOW';
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  previousScore?: number;
}

// ============================================================================
// TRAINING INTERFACES
// ============================================================================

/**
 * Training course
 */
export interface Training {
  id: string;
  code: string;
  title: string;
  description: string;

  // Course details
  category: 'TECHNICAL' | 'SOFT_SKILLS' | 'COMPLIANCE' | 'LEADERSHIP' | 'ONBOARDING' | 'SAFETY';
  format: 'PRESENCIAL' | 'ONLINE' | 'BLENDED' | 'SELF_PACED';
  provider: 'INTERNAL' | 'EXTERNAL';
  providerName?: string;

  // Duration
  durationHours: number;
  startDate?: Date;
  endDate?: Date;

  // Capacity
  maxParticipants?: number;
  currentEnrollments: number;

  // Requirements
  prerequisites?: string[];
  targetPositions?: string[];
  targetDepartments?: string[];
  isMandatory: boolean;

  // Evaluation
  hasExam: boolean;
  passingScore?: number;

  // Certification
  grantsCertification: boolean;
  certificationName?: string;
  certificationValidity?: number;                      // Months

  // Cost
  costPerParticipant?: number;

  // Status
  status: TrainingStatus;

  // Competencies developed
  linkedCompetencies?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Employee enrollment in training
 */
export interface TrainingEnrollment {
  id: string;
  employeeId: string;
  trainingId: string;

  // Enrollment info
  enrolledAt: Date;
  enrolledBy: string;
  reason?: string;

  // Progress
  status: EnrollmentStatus;
  startedAt?: Date;
  completedAt?: Date;

  // Results
  attendancePercentage?: number;
  examScore?: number;
  passed?: boolean;

  // Certification
  certificationId?: string;
  certificationExpiresAt?: Date;

  // Feedback
  rating?: number;
  feedback?: string;
}

/**
 * Employee certification
 */
export interface Certification {
  id: string;
  employeeId: string;
  trainingId?: string;

  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string;

  documentUrl?: string;
  isActive: boolean;
}

/**
 * Training plan for an employee
 */
export interface TrainingPlan {
  employeeId: string;
  year: number;

  mandatoryTrainings: TrainingPlanItem[];
  recommendedTrainings: TrainingPlanItem[];
  developmentTrainings: TrainingPlanItem[];

  totalPlannedHours: number;
  completedHours: number;
  budget?: number;
  usedBudget?: number;
}

/**
 * Training plan item
 */
export interface TrainingPlanItem {
  trainingId: string;
  trainingTitle: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetQuarter: 1 | 2 | 3 | 4;
  status: 'PLANNED' | 'ENROLLED' | 'COMPLETED' | 'CANCELLED';
  linkedGoalId?: string;
  linkedCompetencies?: string[];
}

/**
 * Training needs analysis for a department
 */
export interface TrainingNeeds {
  departmentId: string;
  departmentName: string;
  analysisDate: Date;

  competencyGaps: CompetencyGap[];
  recommendedTrainings: RecommendedTraining[];

  priorityMatrix: TrainingPriorityMatrix;
  estimatedBudget: number;
  estimatedHours: number;
}

/**
 * Competency gap identified
 */
export interface CompetencyGap {
  competencyId: string;
  competencyName: string;
  currentAverageLevel: number;
  requiredLevel: number;
  gap: number;
  affectedEmployees: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Recommended training based on needs analysis
 */
export interface RecommendedTraining {
  trainingId?: string;
  title: string;
  addressesCompetencies: string[];
  suggestedParticipants: string[];
  estimatedCost: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Training priority matrix
 */
export interface TrainingPriorityMatrix {
  urgent: string[];                                    // High importance, immediate need
  planned: string[];                                   // High importance, can be scheduled
  nice_to_have: string[];                              // Lower importance
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Search query for employees
 */
export interface EmployeeSearchQuery {
  query?: string;
  departmentId?: string;
  positionId?: string;
  status?: EmployeeStatus;
  managerId?: string;
  contractType?: ContractType;
  hiredAfter?: Date;
  hiredBefore?: Date;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Operation result
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Period definition
 */
export interface Period {
  year: number;
  month: number;
}

/**
 * Date range
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}
