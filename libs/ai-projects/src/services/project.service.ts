/**
 * Project Service
 * Core project management operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  ProjectStatus,
  ProjectPhase,
  Milestone,
  GanttData,
  GanttTask,
  GanttMilestone,
  GanttDependency,
  ProjectDashboard,
  EVMMetrics,
  CreateProjectInput,
  Methodology,
  TaskStatus,
  ActivityItem,
  Task
} from '../types';

// In-memory storage (replace with actual database in production)
const projects: Map<string, Project> = new Map();
const phases: Map<string, ProjectPhase> = new Map();
const milestones: Map<string, Milestone> = new Map();

/**
 * Project Service - Manages project lifecycle and operations
 */
export class ProjectService {

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Create a new project
   */
  async create(projectData: CreateProjectInput): Promise<Project> {
    const now = new Date();
    const projectId = uuidv4();

    const project: Project = {
      id: projectId,
      code: projectData.code,
      name: projectData.name,
      description: projectData.description,
      status: ProjectStatus.DRAFT,
      methodology: projectData.methodology,

      managerId: projectData.managerId,
      sponsorId: projectData.sponsorId,
      teamIds: projectData.teamIds || [],
      stakeholderIds: [],

      plannedStartDate: new Date(projectData.plannedStartDate),
      plannedEndDate: new Date(projectData.plannedEndDate),

      estimatedBudget: projectData.estimatedBudget,
      currency: projectData.currency || 'USD',

      progress: 0,
      healthStatus: 'green',

      phases: [],
      milestones: [],

      tags: projectData.tags || [],
      customFields: projectData.customFields || {},
      createdAt: now,
      updatedAt: now,
      createdBy: projectData.managerId
    };

    // Auto-generate phases for Waterfall methodology
    if (projectData.methodology === Methodology.WATERFALL) {
      project.phases = this.generateWaterfallPhases(project);
    }

    projects.set(projectId, project);

    return project;
  }

  /**
   * Update an existing project
   */
  async update(id: string, changes: Partial<Project>): Promise<Project> {
    const project = projects.get(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }

    const updatedProject: Project = {
      ...project,
      ...changes,
      id: project.id, // Prevent ID change
      createdAt: project.createdAt, // Preserve creation date
      updatedAt: new Date()
    };

    // Recalculate health status
    updatedProject.healthStatus = this.calculateHealthStatus(updatedProject);

    projects.set(id, updatedProject);

    return updatedProject;
  }

  /**
   * Get a project by ID
   */
  async get(id: string): Promise<Project | null> {
    return projects.get(id) || null;
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    const result: Project[] = [];
    projects.forEach(project => {
      if (project.status === status) {
        result.push(project);
      }
    });
    return result;
  }

  /**
   * Get projects by manager
   */
  async getByManager(managerId: string): Promise<Project[]> {
    const result: Project[] = [];
    projects.forEach(project => {
      if (project.managerId === managerId) {
        result.push(project);
      }
    });
    return result;
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    return projects.delete(id);
  }

  /**
   * List all projects with optional filters
   */
  async list(filters?: {
    status?: ProjectStatus;
    methodology?: Methodology;
    managerId?: string;
    teamId?: string;
  }): Promise<Project[]> {
    let result = Array.from(projects.values());

    if (filters) {
      if (filters.status) {
        result = result.filter(p => p.status === filters.status);
      }
      if (filters.methodology) {
        result = result.filter(p => p.methodology === filters.methodology);
      }
      if (filters.managerId) {
        result = result.filter(p => p.managerId === filters.managerId);
      }
      if (filters.teamId) {
        result = result.filter(p => p.teamIds.includes(filters.teamId!));
      }
    }

    return result;
  }

  // ===========================================================================
  // PHASE MANAGEMENT
  // ===========================================================================

  /**
   * Create a new project phase
   */
  async createPhase(
    projectId: string,
    phaseData: Omit<ProjectPhase, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectPhase> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date();
    const phaseId = uuidv4();

    const phase: ProjectPhase = {
      ...phaseData,
      id: phaseId,
      projectId,
      createdAt: now,
      updatedAt: now
    };

    phases.set(phaseId, phase);
    project.phases.push(phase);
    project.updatedAt = now;

    return phase;
  }

  /**
   * Update a phase
   */
  async updatePhase(
    phaseId: string,
    changes: Partial<ProjectPhase>
  ): Promise<ProjectPhase> {
    const phase = phases.get(phaseId);
    if (!phase) {
      throw new Error(`Phase not found: ${phaseId}`);
    }

    const updatedPhase: ProjectPhase = {
      ...phase,
      ...changes,
      id: phase.id,
      projectId: phase.projectId,
      createdAt: phase.createdAt,
      updatedAt: new Date()
    };

    phases.set(phaseId, updatedPhase);

    // Update in project
    const project = projects.get(phase.projectId);
    if (project) {
      const idx = project.phases.findIndex(p => p.id === phaseId);
      if (idx !== -1) {
        project.phases[idx] = updatedPhase;
      }
    }

    return updatedPhase;
  }

  /**
   * Get phases for a project
   */
  async getPhases(projectId: string): Promise<ProjectPhase[]> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return project.phases.sort((a, b) => a.order - b.order);
  }

  // ===========================================================================
  // MILESTONE MANAGEMENT
  // ===========================================================================

  /**
   * Create a new milestone
   */
  async createMilestone(
    projectId: string,
    milestoneData: Omit<Milestone, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
  ): Promise<Milestone> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date();
    const milestoneId = uuidv4();

    const milestone: Milestone = {
      ...milestoneData,
      id: milestoneId,
      projectId,
      createdAt: now,
      updatedAt: now
    };

    milestones.set(milestoneId, milestone);
    project.milestones.push(milestone);
    project.updatedAt = now;

    return milestone;
  }

  /**
   * Update a milestone
   */
  async updateMilestone(
    milestoneId: string,
    changes: Partial<Milestone>
  ): Promise<Milestone> {
    const milestone = milestones.get(milestoneId);
    if (!milestone) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }

    const updatedMilestone: Milestone = {
      ...milestone,
      ...changes,
      id: milestone.id,
      projectId: milestone.projectId,
      createdAt: milestone.createdAt,
      updatedAt: new Date()
    };

    milestones.set(milestoneId, updatedMilestone);

    // Update in project
    const project = projects.get(milestone.projectId);
    if (project) {
      const idx = project.milestones.findIndex(m => m.id === milestoneId);
      if (idx !== -1) {
        project.milestones[idx] = updatedMilestone;
      }
    }

    return updatedMilestone;
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(milestoneId: string): Promise<Milestone> {
    return this.updateMilestone(milestoneId, {
      status: 'achieved',
      completedDate: new Date()
    });
  }

  /**
   * Get milestones for a project
   */
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return project.milestones.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  // ===========================================================================
  // TIMELINE & GANTT
  // ===========================================================================

  /**
   * Get project timeline data for Gantt chart
   */
  async getProjectTimeline(projectId: string): Promise<GanttData> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Get tasks (would come from TaskService in real implementation)
    const projectTasks = await this.getProjectTasks(projectId);

    const ganttTasks: GanttTask[] = [];
    const ganttMilestones: GanttMilestone[] = [];
    const ganttDependencies: GanttDependency[] = [];

    // Add phases as group tasks
    for (const phase of project.phases) {
      ganttTasks.push({
        id: phase.id,
        name: phase.name,
        startDate: new Date(phase.plannedStartDate),
        endDate: new Date(phase.plannedEndDate),
        duration: this.calculateDays(phase.plannedStartDate, phase.plannedEndDate),
        progress: phase.progress,
        status: this.phaseStatusToTaskStatus(phase.status),
        isOnCriticalPath: false,
        isMilestone: false,
        isGroup: true,
        level: 0
      });
    }

    // Add tasks
    for (const task of projectTasks) {
      const startDate = task.plannedStartDate || task.actualStartDate || new Date();
      const endDate = task.plannedEndDate || task.actualEndDate || new Date();

      ganttTasks.push({
        id: task.id,
        name: task.title,
        parentId: task.phaseId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: this.calculateDays(startDate, endDate),
        progress: task.progress,
        status: task.status,
        assignee: task.assigneeId,
        resourceId: task.assigneeId,
        isOnCriticalPath: task.isOnCriticalPath,
        isMilestone: false,
        isGroup: false,
        level: task.phaseId ? 1 : 0
      });

      // Add dependencies
      for (const dep of task.dependencies) {
        ganttDependencies.push({
          id: dep.id,
          sourceId: dep.dependsOnTaskId,
          targetId: dep.taskId,
          type: dep.type,
          lag: dep.lagDays
        });
      }
    }

    // Add milestones
    for (const milestone of project.milestones) {
      ganttMilestones.push({
        id: milestone.id,
        name: milestone.name,
        date: new Date(milestone.dueDate),
        status: milestone.status,
        isCritical: milestone.isCritical
      });
    }

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(ganttTasks, ganttDependencies);

    return {
      projectId,
      projectName: project.name,
      startDate: new Date(project.plannedStartDate),
      endDate: new Date(project.plannedEndDate),
      tasks: ganttTasks,
      milestones: ganttMilestones,
      dependencies: ganttDependencies,
      criticalPath,
      generatedAt: new Date()
    };
  }

  // ===========================================================================
  // PROGRESS & METRICS
  // ===========================================================================

  /**
   * Calculate project progress
   */
  async calculateProgress(projectId: string): Promise<number> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await this.getProjectTasks(projectId);

    if (tasks.length === 0) {
      // If no tasks, use phase progress
      if (project.phases.length === 0) {
        return 0;
      }
      const totalPhaseProgress = project.phases.reduce((sum, p) => sum + p.progress, 0);
      return Math.round(totalPhaseProgress / project.phases.length);
    }

    // Weight by estimated hours if available
    let totalWeight = 0;
    let weightedProgress = 0;

    for (const task of tasks) {
      const weight = task.estimatedHours || 1;
      totalWeight += weight;
      weightedProgress += (task.progress * weight);
    }

    const progress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    // Update project
    project.progress = progress;
    project.updatedAt = new Date();

    return progress;
  }

  /**
   * Get comprehensive project dashboard
   */
  async getProjectDashboard(projectId: string): Promise<ProjectDashboard> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tasks = await this.getProjectTasks(projectId);
    const now = new Date();

    // Calculate task statistics
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const blockedTasks = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
    const overdueTasks = tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
    ).length;

    // Calculate days remaining
    const daysRemaining = this.calculateDays(now, project.plannedEndDate);

    // Calculate schedule variance
    const plannedProgress = this.calculatePlannedProgress(project);
    const scheduleVarianceDays = this.calculateScheduleVarianceDays(
      project,
      project.progress,
      plannedProgress
    );

    // Budget calculations (placeholder - would come from BudgetService)
    const budgetData = await this.getProjectBudgetSummary(projectId);

    // Get EVM metrics
    const evm = await this.calculateEVMMetrics(projectId);

    // Get recent activities (placeholder)
    const recentActivities: ActivityItem[] = [];

    // Get upcoming milestones
    const upcomingMilestones = project.milestones
      .filter(m => new Date(m.dueDate) >= now && m.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Get upcoming task deadlines
    const upcomingDeadlines = tasks
      .filter(t => t.dueDate && new Date(t.dueDate) >= now && t.status !== TaskStatus.DONE)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    // Calculate projected end date
    const projectedEndDate = this.calculateProjectedEndDate(project, project.progress);

    const dashboard: ProjectDashboard = {
      projectId,
      projectName: project.name,

      status: project.status,
      healthStatus: project.healthStatus,
      progress: project.progress,
      daysRemaining,

      plannedStartDate: project.plannedStartDate,
      plannedEndDate: project.plannedEndDate,
      actualStartDate: project.actualStartDate,
      projectedEndDate,
      scheduleVarianceDays,

      totalBudget: budgetData.total,
      spentBudget: budgetData.spent,
      remainingBudget: budgetData.remaining,
      budgetVariance: budgetData.variance,
      budgetUtilization: budgetData.utilization,

      totalTasks: tasks.length,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,

      totalResources: project.teamIds.length,
      averageUtilization: 75, // Placeholder

      openRisks: 0, // Would come from RiskService
      highRisks: 0,
      openIssues: 0,
      criticalIssues: 0,

      evm,
      recentActivities,
      upcomingMilestones,
      upcomingDeadlines,

      generatedAt: now
    };

    return dashboard;
  }

  // ===========================================================================
  // EVM METRICS
  // ===========================================================================

  /**
   * Calculate Earned Value Management metrics
   */
  async calculateEVMMetrics(projectId: string): Promise<EVMMetrics> {
    const project = projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const now = new Date();
    const BAC = project.estimatedBudget; // Budget at Completion

    // Calculate planned progress percentage
    const totalDays = this.calculateDays(project.plannedStartDate, project.plannedEndDate);
    const elapsedDays = this.calculateDays(project.plannedStartDate, now);
    const plannedProgressPercent = Math.min(100, (elapsedDays / totalDays) * 100);

    // Planned Value (PV) - What we planned to accomplish by now
    const PV = (plannedProgressPercent / 100) * BAC;

    // Earned Value (EV) - Value of work actually completed
    const EV = (project.progress / 100) * BAC;

    // Actual Cost (AC) - What we've actually spent (placeholder)
    const budgetData = await this.getProjectBudgetSummary(projectId);
    const AC = budgetData.spent;

    // Cost Variance (CV) - Are we under/over budget?
    const CV = EV - AC;

    // Schedule Variance (SV) - Are we ahead/behind schedule?
    const SV = EV - PV;

    // Cost Performance Index (CPI)
    const CPI = AC > 0 ? EV / AC : 1;

    // Schedule Performance Index (SPI)
    const SPI = PV > 0 ? EV / PV : 1;

    // Estimate at Completion (EAC) - Projected final cost
    const EAC = CPI > 0 ? BAC / CPI : BAC;

    // Estimate to Complete (ETC) - Cost to finish
    const ETC = EAC - AC;

    // Variance at Completion (VAC)
    const VAC = BAC - EAC;

    // To-Complete Performance Index (TCPI)
    const TCPI = (BAC - EV) > 0 && (BAC - AC) > 0 ? (BAC - EV) / (BAC - AC) : 1;

    // Health indicators
    const costHealth = CPI >= 0.95 ? 'green' : CPI >= 0.85 ? 'yellow' : 'red';
    const scheduleHealth = SPI >= 0.95 ? 'green' : SPI >= 0.85 ? 'yellow' : 'red';
    const overallHealth =
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

      plannedProgress: Math.round(plannedProgressPercent),
      actualProgress: project.progress,
      plannedDuration: totalDays,
      actualDuration: elapsedDays,
      remainingDuration: Math.max(0, totalDays - elapsedDays),

      costHealth,
      scheduleHealth,
      overallHealth
    };
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Generate standard Waterfall phases
   */
  private generateWaterfallPhases(project: Project): ProjectPhase[] {
    const phases: ProjectPhase[] = [];
    const totalDays = this.calculateDays(project.plannedStartDate, project.plannedEndDate);

    const phaseDefinitions = [
      { name: 'Initiation', percentage: 0.1 },
      { name: 'Planning', percentage: 0.15 },
      { name: 'Execution', percentage: 0.5 },
      { name: 'Monitoring & Control', percentage: 0.15 },
      { name: 'Closure', percentage: 0.1 }
    ];

    let currentStart = new Date(project.plannedStartDate);

    phaseDefinitions.forEach((def, index) => {
      const phaseDays = Math.round(totalDays * def.percentage);
      const phaseEnd = new Date(currentStart);
      phaseEnd.setDate(phaseEnd.getDate() + phaseDays);

      phases.push({
        id: uuidv4(),
        projectId: project.id,
        name: def.name,
        description: `${def.name} phase`,
        order: index + 1,
        plannedStartDate: new Date(currentStart),
        plannedEndDate: phaseEnd,
        status: 'pending',
        progress: 0,
        deliverables: [],
        approvalRequired: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      currentStart = new Date(phaseEnd);
    });

    return phases;
  }

  /**
   * Calculate health status based on various factors
   */
  private calculateHealthStatus(project: Project): 'green' | 'yellow' | 'red' {
    const now = new Date();

    // Check schedule
    const totalDays = this.calculateDays(project.plannedStartDate, project.plannedEndDate);
    const elapsedDays = this.calculateDays(project.plannedStartDate, now);
    const plannedProgress = (elapsedDays / totalDays) * 100;

    const scheduleVariance = project.progress - plannedProgress;

    // Determine health
    if (scheduleVariance >= -5) {
      return 'green';
    } else if (scheduleVariance >= -15) {
      return 'yellow';
    } else {
      return 'red';
    }
  }

  /**
   * Calculate days between two dates
   */
  private calculateDays(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get project tasks (placeholder - would integrate with TaskService)
   */
  private async getProjectTasks(_projectId: string): Promise<Task[]> {
    // This would call TaskService.getTasksByProject()
    return [];
  }

  /**
   * Get project budget summary (placeholder - would integrate with BudgetService)
   */
  private async getProjectBudgetSummary(projectId: string): Promise<{
    total: number;
    spent: number;
    remaining: number;
    variance: number;
    utilization: number;
  }> {
    const project = projects.get(projectId);
    if (!project) {
      return { total: 0, spent: 0, remaining: 0, variance: 0, utilization: 0 };
    }

    // Placeholder values
    const total = project.estimatedBudget;
    const spent = total * (project.progress / 100) * 0.9; // Simulated
    const remaining = total - spent;
    const variance = remaining - (total * (1 - project.progress / 100));
    const utilization = (spent / total) * 100;

    return { total, spent, remaining, variance, utilization };
  }

  /**
   * Convert phase status to task status
   */
  private phaseStatusToTaskStatus(
    status: 'pending' | 'active' | 'completed' | 'skipped'
  ): TaskStatus {
    switch (status) {
      case 'pending': return TaskStatus.TODO;
      case 'active': return TaskStatus.IN_PROGRESS;
      case 'completed': return TaskStatus.DONE;
      case 'skipped': return TaskStatus.CANCELLED;
    }
  }

  /**
   * Calculate critical path using simplified forward/backward pass
   */
  private calculateCriticalPath(
    tasks: GanttTask[],
    dependencies: GanttDependency[]
  ): string[] {
    if (tasks.length === 0) return [];

    // Build adjacency list
    const dependencyMap = new Map<string, string[]>();
    const reverseDependencyMap = new Map<string, string[]>();

    dependencies.forEach(dep => {
      if (!dependencyMap.has(dep.sourceId)) {
        dependencyMap.set(dep.sourceId, []);
      }
      dependencyMap.get(dep.sourceId)!.push(dep.targetId);

      if (!reverseDependencyMap.has(dep.targetId)) {
        reverseDependencyMap.set(dep.targetId, []);
      }
      reverseDependencyMap.get(dep.targetId)!.push(dep.sourceId);
    });

    // Find tasks with no dependencies (start tasks)
    const startTasks = tasks.filter(
      t => !t.isGroup && !reverseDependencyMap.has(t.id)
    );

    // Find tasks with no successors (end tasks)
    const endTasks = tasks.filter(
      t => !t.isGroup && !dependencyMap.has(t.id)
    );

    if (startTasks.length === 0 || endTasks.length === 0) {
      // No dependencies, longest task is critical
      const longestTask = tasks
        .filter(t => !t.isGroup)
        .sort((a, b) => b.duration - a.duration)[0];
      return longestTask ? [longestTask.id] : [];
    }

    // Simplified: Find longest path
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const _criticalPath: string[] = [];

    let longestDuration = 0;
    let longestPath: string[] = [];

    const findPaths = (
      taskId: string,
      currentPath: string[],
      currentDuration: number
    ) => {
      const task = taskMap.get(taskId);
      if (!task) return;

      currentPath.push(taskId);
      currentDuration += task.duration;

      const successors = dependencyMap.get(taskId) || [];

      if (successors.length === 0) {
        if (currentDuration > longestDuration) {
          longestDuration = currentDuration;
          longestPath = [...currentPath];
        }
      } else {
        for (const successor of successors) {
          findPaths(successor, [...currentPath], currentDuration);
        }
      }
    };

    for (const startTask of startTasks) {
      findPaths(startTask.id, [], 0);
    }

    return longestPath;
  }

  /**
   * Calculate planned progress based on timeline
   */
  private calculatePlannedProgress(project: Project): number {
    const now = new Date();
    const start = new Date(project.plannedStartDate);
    const end = new Date(project.plannedEndDate);

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDays = this.calculateDays(start, end);
    const elapsedDays = this.calculateDays(start, now);

    return Math.min(100, Math.round((elapsedDays / totalDays) * 100));
  }

  /**
   * Calculate schedule variance in days
   */
  private calculateScheduleVarianceDays(
    project: Project,
    actualProgress: number,
    plannedProgress: number
  ): number {
    const totalDays = this.calculateDays(project.plannedStartDate, project.plannedEndDate);
    const progressDifference = actualProgress - plannedProgress;
    return Math.round((progressDifference / 100) * totalDays);
  }

  /**
   * Calculate projected end date based on current progress
   */
  private calculateProjectedEndDate(project: Project, currentProgress: number): Date {
    if (currentProgress >= 100) {
      return project.actualEndDate || new Date();
    }

    if (currentProgress === 0) {
      return new Date(project.plannedEndDate);
    }

    const now = new Date();
    const start = project.actualStartDate || project.plannedStartDate;
    const elapsedDays = this.calculateDays(start, now);

    // Rate of progress per day
    const dailyProgress = currentProgress / elapsedDays;

    if (dailyProgress <= 0) {
      // No progress, can't project
      return new Date(project.plannedEndDate);
    }

    // Days needed to complete
    const remainingProgress = 100 - currentProgress;
    const remainingDays = remainingProgress / dailyProgress;

    const projectedEnd = new Date(now);
    projectedEnd.setDate(projectedEnd.getDate() + Math.ceil(remainingDays));

    return projectedEnd;
  }
}

// Export singleton instance
export const projectService = new ProjectService();
