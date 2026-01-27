/**
 * AI-Projects Types
 * Complete type definitions for project management module
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Project lifecycle status
 */
export enum ProjectStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

/**
 * Task status within a project
 */
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  BLOCKED = 'blocked',
  DONE = 'done',
  CANCELLED = 'cancelled'
}

/**
 * Priority levels for tasks and issues
 */
export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none'
}

/**
 * Risk assessment levels
 */
export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NEGLIGIBLE = 'negligible'
}

/**
 * Project methodology types
 */
export enum Methodology {
  WATERFALL = 'waterfall',
  AGILE = 'agile',
  HYBRID = 'hybrid',
  KANBAN = 'kanban',
  SCRUM = 'scrum'
}

/**
 * Task dependency types
 */
export enum DependencyType {
  FINISH_TO_START = 'FS',  // Most common: Task B starts after Task A finishes
  START_TO_START = 'SS',   // Task B starts when Task A starts
  FINISH_TO_FINISH = 'FF', // Task B finishes when Task A finishes
  START_TO_FINISH = 'SF'   // Task B finishes when Task A starts (rare)
}

/**
 * Resource types
 */
export enum ResourceType {
  HUMAN = 'human',
  EQUIPMENT = 'equipment',
  MATERIAL = 'material',
  FACILITY = 'facility',
  SOFTWARE = 'software'
}

/**
 * Budget line types
 */
export enum BudgetCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SOFTWARE = 'software',
  TRAVEL = 'travel',
  TRAINING = 'training',
  CONSULTING = 'consulting',
  OVERHEAD = 'overhead',
  CONTINGENCY = 'contingency',
  OTHER = 'other'
}

/**
 * Issue status
 */
export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  WONT_FIX = 'wont_fix'
}

/**
 * Change request status
 */
export enum ChangeRequestStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
  DEFERRED = 'deferred'
}

/**
 * Risk status
 */
export enum RiskStatus {
  IDENTIFIED = 'identified',
  ANALYZING = 'analyzing',
  MITIGATING = 'mitigating',
  MONITORING = 'monitoring',
  OCCURRED = 'occurred',
  CLOSED = 'closed'
}

// ============================================================================
// PROJECT INTERFACES
// ============================================================================

/**
 * Main project entity
 */
export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  methodology: Methodology;

  // Stakeholders
  managerId: string;
  sponsorId?: string;
  teamIds: string[];
  stakeholderIds: string[];

  // Timeline
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // Budget
  budgetId?: string;
  estimatedBudget: number;
  currency: string;

  // Progress
  progress: number; // 0-100
  healthStatus: 'green' | 'yellow' | 'red';

  // Structure
  phases: ProjectPhase[];
  milestones: Milestone[];

  // Metadata
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Project phase (for Waterfall/Hybrid methodologies)
 */
export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;

  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  status: 'pending' | 'active' | 'completed' | 'skipped';
  progress: number;

  deliverables: string[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project milestone
 */
export interface Milestone {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  description: string;

  dueDate: Date;
  completedDate?: Date;

  status: 'pending' | 'achieved' | 'missed' | 'at_risk';
  isCritical: boolean;

  deliverables: string[];
  dependencies: string[]; // Milestone IDs

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// TASK INTERFACES
// ============================================================================

/**
 * Main task entity
 */
export interface Task {
  id: string;
  projectId: string;
  phaseId?: string;
  parentTaskId?: string; // For subtasks
  milestoneId?: string;

  code: string;
  title: string;
  description: string;

  status: TaskStatus;
  priority: Priority;

  // Assignment
  assigneeId?: string;
  reporterId: string;
  watcherIds: string[];

  // Timeline
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  dueDate?: Date;

  // Effort
  estimatedHours: number;
  actualHours: number;
  remainingHours: number;
  progress: number; // 0-100

  // Agile specific
  storyPoints?: number;
  sprintId?: string;
  epicId?: string;

  // Structure
  subtasks: Subtask[];
  dependencies: TaskDependency[];

  // Additional
  tags: string[];
  attachments: string[];
  comments: TaskComment[];

  // Flags
  isOnCriticalPath: boolean;
  isBlocked: boolean;
  blockReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subtask within a task
 */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;

  status: TaskStatus;
  assigneeId?: string;

  estimatedHours: number;
  actualHours: number;

  order: number;
  completed: boolean;
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task dependency relationship
 */
export interface TaskDependency {
  id: string;
  taskId: string;           // The dependent task
  dependsOnTaskId: string;  // The task it depends on
  type: DependencyType;
  lagDays: number;          // Delay between tasks (can be negative for lead)

  createdAt: Date;
}

/**
 * Task comment
 */
export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;

  mentions: string[]; // User IDs
  attachments: string[];

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// RESOURCE INTERFACES
// ============================================================================

/**
 * Resource entity (human or other)
 */
export interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  email?: string;

  // For human resources
  role?: string;
  department?: string;
  skills: string[];
  certifications: string[];

  // Availability
  hoursPerDay: number;      // Standard working hours
  workingDays: number[];    // 0-6 (Sunday-Saturday)
  vacationDays: Date[];

  // Cost
  hourlyRate: number;
  currency: string;

  // Capacity
  maxAllocationPercentage: number; // Max % allocation across projects

  isActive: boolean;
  teamId?: string;
  managerId?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resource allocation to a project
 */
export interface ResourceAllocation {
  id: string;
  resourceId: string;
  projectId: string;
  taskId?: string;

  startDate: Date;
  endDate: Date;

  allocationPercentage: number; // 0-100
  hoursPerDay: number;

  role: string;
  responsibilities: string[];

  status: 'planned' | 'active' | 'completed' | 'cancelled';

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Time entry for tracking actual work
 */
export interface TimeEntry {
  id: string;
  resourceId: string;
  projectId: string;
  taskId: string;

  date: Date;
  hours: number;
  description: string;

  billable: boolean;
  billingRate?: number;

  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// BUDGET INTERFACES
// ============================================================================

/**
 * Project budget
 */
export interface Budget {
  id: string;
  projectId: string;
  name: string;

  totalAmount: number;
  currency: string;

  lines: BudgetLine[];

  // Tracking
  totalPlanned: number;
  totalCommitted: number;
  totalActual: number;
  totalRemaining: number;

  // Contingency
  contingencyPercentage: number;
  contingencyAmount: number;
  contingencyUsed: number;

  status: 'draft' | 'approved' | 'active' | 'closed';
  approvedBy?: string;
  approvedAt?: Date;

  fiscalYear: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual budget line item
 */
export interface BudgetLine {
  id: string;
  budgetId: string;
  category: BudgetCategory;

  name: string;
  description: string;

  plannedAmount: number;
  committedAmount: number;
  actualAmount: number;

  unit?: string;
  quantity?: number;
  unitCost?: number;

  phaseId?: string;
  vendorId?: string;

  startDate?: Date;
  endDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Expense record
 */
export interface Expense {
  id: string;
  projectId: string;
  budgetLineId: string;

  description: string;
  amount: number;
  currency: string;

  category: BudgetCategory;
  vendorId?: string;
  vendorName?: string;

  invoiceNumber?: string;
  invoiceDate?: Date;
  paymentDate?: Date;

  status: 'pending' | 'approved' | 'paid' | 'rejected';

  attachments: string[];

  submittedBy: string;
  approvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// EVM (Earned Value Management) INTERFACES
// ============================================================================

/**
 * EVM metrics snapshot
 */
export interface EVMMetrics {
  projectId: string;
  snapshotDate: Date;

  // Core values
  BAC: number;   // Budget at Completion
  PV: number;    // Planned Value
  EV: number;    // Earned Value
  AC: number;    // Actual Cost

  // Variances
  CV: number;    // Cost Variance (EV - AC)
  SV: number;    // Schedule Variance (EV - PV)

  // Performance Indices
  CPI: number;   // Cost Performance Index (EV / AC)
  SPI: number;   // Schedule Performance Index (EV / PV)

  // Forecasts
  EAC: number;   // Estimate at Completion
  ETC: number;   // Estimate to Complete
  VAC: number;   // Variance at Completion (BAC - EAC)
  TCPI: number;  // To-Complete Performance Index

  // Schedule
  plannedProgress: number;
  actualProgress: number;
  plannedDuration: number;
  actualDuration: number;
  remainingDuration: number;

  // Health indicators
  costHealth: 'green' | 'yellow' | 'red';
  scheduleHealth: 'green' | 'yellow' | 'red';
  overallHealth: 'green' | 'yellow' | 'red';
}

// ============================================================================
// RISK INTERFACES
// ============================================================================

/**
 * Project risk
 */
export interface Risk {
  id: string;
  projectId: string;

  title: string;
  description: string;
  category: string;

  status: RiskStatus;
  level: RiskLevel;

  // Assessment
  probability: number;  // 1-5
  impact: number;       // 1-5
  score: number;        // probability * impact

  // Analysis
  triggers: string[];
  rootCauses: string[];
  affectedAreas: string[];

  // Response
  responseStrategy: 'avoid' | 'mitigate' | 'transfer' | 'accept';
  mitigationPlan: string;
  contingencyPlan: string;

  // Assignment
  ownerId: string;
  assigneeIds: string[];

  // Timeline
  identifiedDate: Date;
  dueDate?: Date;
  closedDate?: Date;

  // If risk occurs
  actualImpact?: string;
  lessonsLearned?: string;

  // Tracking
  reviewFrequency: 'daily' | 'weekly' | 'monthly';
  lastReviewDate?: Date;
  nextReviewDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project issue (materialized risk or new problem)
 */
export interface Issue {
  id: string;
  projectId: string;
  riskId?: string;  // If originated from a risk

  title: string;
  description: string;
  category: string;

  status: IssueStatus;
  priority: Priority;
  severity: RiskLevel;

  // Impact
  impactDescription: string;
  affectedMilestones: string[];
  affectedTasks: string[];

  // Resolution
  resolution?: string;
  workaround?: string;

  // Assignment
  reporterId: string;
  ownerId: string;
  assigneeIds: string[];

  // Timeline
  reportedDate: Date;
  dueDate?: Date;
  resolvedDate?: Date;

  // Effort
  estimatedEffortHours?: number;
  actualEffortHours?: number;

  // Cost impact
  estimatedCostImpact?: number;
  actualCostImpact?: number;

  attachments: string[];
  relatedIssueIds: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Change request
 */
export interface ChangeRequest {
  id: string;
  projectId: string;

  code: string;
  title: string;
  description: string;
  justification: string;

  status: ChangeRequestStatus;
  priority: Priority;
  type: 'scope' | 'schedule' | 'budget' | 'resource' | 'technical' | 'other';

  // Requester
  requesterId: string;
  requestDate: Date;

  // Impact analysis
  scopeImpact: string;
  scheduleImpact: string;
  scheduleImpactDays: number;
  costImpact: string;
  costImpactAmount: number;
  resourceImpact: string;
  riskImpact: string;
  qualityImpact: string;

  // Affected items
  affectedTasks: string[];
  affectedMilestones: string[];
  affectedDeliverables: string[];

  // Decision
  reviewerId?: string;
  reviewDate?: Date;
  reviewNotes?: string;

  approverId?: string;
  approvalDate?: Date;
  approvalNotes?: string;
  rejectionReason?: string;

  // Implementation
  implementedBy?: string;
  implementedDate?: Date;
  implementationNotes?: string;

  attachments: string[];

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// GANTT & TIMELINE INTERFACES
// ============================================================================

/**
 * Gantt chart data structure
 */
export interface GanttData {
  projectId: string;
  projectName: string;
  startDate: Date;
  endDate: Date;

  tasks: GanttTask[];
  milestones: GanttMilestone[];
  dependencies: GanttDependency[];

  criticalPath: string[]; // Task IDs on critical path

  generatedAt: Date;
}

/**
 * Task representation for Gantt
 */
export interface GanttTask {
  id: string;
  name: string;
  parentId?: string;

  startDate: Date;
  endDate: Date;
  duration: number; // in days

  progress: number;
  status: TaskStatus;

  assignee?: string;
  resourceId?: string;

  isOnCriticalPath: boolean;
  isMilestone: boolean;
  isGroup: boolean;

  color?: string;
  level: number; // Hierarchy level
}

/**
 * Milestone representation for Gantt
 */
export interface GanttMilestone {
  id: string;
  name: string;
  date: Date;
  status: 'pending' | 'achieved' | 'missed' | 'at_risk';
  isCritical: boolean;
}

/**
 * Dependency representation for Gantt
 */
export interface GanttDependency {
  id: string;
  sourceId: string;
  targetId: string;
  type: DependencyType;
  lag: number;
}

// ============================================================================
// DASHBOARD & REPORTING INTERFACES
// ============================================================================

/**
 * Project dashboard data
 */
export interface ProjectDashboard {
  projectId: string;
  projectName: string;

  // Summary
  status: ProjectStatus;
  healthStatus: 'green' | 'yellow' | 'red';
  progress: number;
  daysRemaining: number;

  // Timeline
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  projectedEndDate: Date;
  scheduleVarianceDays: number;

  // Budget
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  budgetVariance: number;
  budgetUtilization: number;

  // Tasks
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;

  // Resources
  totalResources: number;
  averageUtilization: number;

  // Risks & Issues
  openRisks: number;
  highRisks: number;
  openIssues: number;
  criticalIssues: number;

  // EVM metrics (if available)
  evm?: EVMMetrics;

  // Recent activity
  recentActivities: ActivityItem[];

  // Upcoming
  upcomingMilestones: Milestone[];
  upcomingDeadlines: Task[];

  generatedAt: Date;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  projectId: string;

  type: 'task_created' | 'task_completed' | 'task_updated' |
        'milestone_achieved' | 'issue_reported' | 'issue_resolved' |
        'risk_identified' | 'change_requested' | 'comment_added' |
        'resource_assigned' | 'expense_recorded' | 'status_changed';

  entityType: 'task' | 'milestone' | 'issue' | 'risk' | 'change_request' | 'expense';
  entityId: string;
  entityName: string;

  userId: string;
  userName: string;

  description: string;
  details?: Record<string, unknown>;

  timestamp: Date;
}

// ============================================================================
// INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Project creation input
 */
export interface CreateProjectInput {
  code: string;
  name: string;
  description: string;
  methodology: Methodology;

  managerId: string;
  sponsorId?: string;
  teamIds?: string[];

  plannedStartDate: Date;
  plannedEndDate: Date;

  estimatedBudget: number;
  currency?: string;

  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Task creation input
 */
export interface CreateTaskInput {
  projectId: string;
  phaseId?: string;
  parentTaskId?: string;
  milestoneId?: string;

  title: string;
  description: string;
  priority: Priority;

  assigneeId?: string;
  reporterId: string;

  plannedStartDate?: Date;
  plannedEndDate?: Date;
  dueDate?: Date;

  estimatedHours: number;
  storyPoints?: number;

  tags?: string[];
}

/**
 * Risk creation input
 */
export interface CreateRiskInput {
  projectId: string;
  title: string;
  description: string;
  category: string;

  probability: number;
  impact: number;

  ownerId: string;

  triggers?: string[];
  mitigationPlan?: string;
  contingencyPlan?: string;

  responseStrategy?: 'avoid' | 'mitigate' | 'transfer' | 'accept';
}

/**
 * Issue creation input
 */
export interface CreateIssueInput {
  projectId: string;
  riskId?: string;

  title: string;
  description: string;
  category: string;

  priority: Priority;
  severity: RiskLevel;

  reporterId: string;
  ownerId: string;

  impactDescription: string;
  dueDate?: Date;
}

/**
 * Change request creation input
 */
export interface CreateChangeRequestInput {
  projectId: string;

  title: string;
  description: string;
  justification: string;

  priority: Priority;
  type: 'scope' | 'schedule' | 'budget' | 'resource' | 'technical' | 'other';

  requesterId: string;

  scopeImpact?: string;
  scheduleImpactDays?: number;
  costImpactAmount?: number;

  affectedTasks?: string[];
  affectedMilestones?: string[];
}

/**
 * Period for resource/time queries
 */
export interface TimePeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Capacity data for a team
 */
export interface TeamCapacity {
  teamId: string;
  period: TimePeriod;

  totalHours: number;
  allocatedHours: number;
  availableHours: number;

  utilizationPercentage: number;

  resourceBreakdown: {
    resourceId: string;
    resourceName: string;
    totalHours: number;
    allocatedHours: number;
    availableHours: number;
  }[];
}

/**
 * Budget vs Actual comparison
 */
export interface BudgetVsActual {
  budgetId: string;
  projectId: string;

  summary: {
    totalBudget: number;
    totalActual: number;
    variance: number;
    variancePercentage: number;
    status: 'under' | 'on_track' | 'over';
  };

  byCategory: {
    category: BudgetCategory;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }[];

  byPhase?: {
    phaseId: string;
    phaseName: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];

  trend: {
    date: Date;
    cumBudget: number;
    cumActual: number;
  }[];

  generatedAt: Date;
}

/**
 * Risk matrix data
 */
export interface RiskMatrix {
  projectId: string;

  risks: {
    id: string;
    title: string;
    probability: number;
    impact: number;
    score: number;
    level: RiskLevel;
    status: RiskStatus;
  }[];

  summary: {
    total: number;
    byLevel: Record<RiskLevel, number>;
    byStatus: Record<RiskStatus, number>;
    averageScore: number;
  };

  matrix: {
    probability: number;
    impact: number;
    count: number;
    riskIds: string[];
  }[];

  generatedAt: Date;
}
