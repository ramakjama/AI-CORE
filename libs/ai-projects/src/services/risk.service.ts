/**
 * Risk Service
 * Risk, issue, and change request management
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Risk,
  Issue,
  ChangeRequest,
  RiskLevel,
  RiskStatus,
  IssueStatus,
  ChangeRequestStatus,
  Priority,
  RiskMatrix,
  CreateRiskInput,
  CreateIssueInput,
  CreateChangeRequestInput
} from '../types';

// In-memory storage (replace with actual database in production)
const risks: Map<string, Risk> = new Map();
const issues: Map<string, Issue> = new Map();
const changeRequests: Map<string, ChangeRequest> = new Map();

/**
 * Risk Service - Manages risks, issues, and change requests
 */
export class RiskService {

  // ===========================================================================
  // RISK MANAGEMENT
  // ===========================================================================

  /**
   * Identify and register a new risk
   */
  async identifyRisk(projectId: string, riskData: CreateRiskInput): Promise<Risk> {
    const now = new Date();
    const riskId = uuidv4();

    // Calculate risk score
    const score = riskData.probability * riskData.impact;
    const level = this.calculateRiskLevel(score);

    const risk: Risk = {
      id: riskId,
      projectId,
      title: riskData.title,
      description: riskData.description,
      category: riskData.category,

      status: RiskStatus.IDENTIFIED,
      level,

      probability: riskData.probability,
      impact: riskData.impact,
      score,

      triggers: riskData.triggers || [],
      rootCauses: [],
      affectedAreas: [],

      responseStrategy: riskData.responseStrategy || 'mitigate',
      mitigationPlan: riskData.mitigationPlan || '',
      contingencyPlan: riskData.contingencyPlan || '',

      ownerId: riskData.ownerId,
      assigneeIds: [],

      identifiedDate: now,

      reviewFrequency: 'weekly',

      createdAt: now,
      updatedAt: now
    };

    risks.set(riskId, risk);

    return risk;
  }

  /**
   * Assess/update risk probability and impact
   */
  async assessRisk(
    riskId: string,
    probability: number,
    impact: number,
    options?: {
      triggers?: string[];
      rootCauses?: string[];
      affectedAreas?: string[];
    }
  ): Promise<Risk> {
    const risk = risks.get(riskId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Validate ranges
    if (probability < 1 || probability > 5) {
      throw new Error('Probability must be between 1 and 5');
    }
    if (impact < 1 || impact > 5) {
      throw new Error('Impact must be between 1 and 5');
    }

    const score = probability * impact;
    const level = this.calculateRiskLevel(score);

    risk.probability = probability;
    risk.impact = impact;
    risk.score = score;
    risk.level = level;
    risk.status = RiskStatus.ANALYZING;

    if (options?.triggers) {
      risk.triggers = options.triggers;
    }
    if (options?.rootCauses) {
      risk.rootCauses = options.rootCauses;
    }
    if (options?.affectedAreas) {
      risk.affectedAreas = options.affectedAreas;
    }

    risk.lastReviewDate = new Date();
    risk.updatedAt = new Date();

    // Set next review date based on frequency
    risk.nextReviewDate = this.calculateNextReviewDate(risk.reviewFrequency);

    risks.set(riskId, risk);

    return risk;
  }

  /**
   * Add mitigation strategy to a risk
   */
  async mitigateRisk(
    riskId: string,
    mitigation: string,
    options?: {
      strategy?: 'avoid' | 'mitigate' | 'transfer' | 'accept';
      contingencyPlan?: string;
      assigneeIds?: string[];
    }
  ): Promise<Risk> {
    const risk = risks.get(riskId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    risk.mitigationPlan = mitigation;
    risk.status = RiskStatus.MITIGATING;

    if (options?.strategy) {
      risk.responseStrategy = options.strategy;
    }
    if (options?.contingencyPlan) {
      risk.contingencyPlan = options.contingencyPlan;
    }
    if (options?.assigneeIds) {
      risk.assigneeIds = options.assigneeIds;
    }

    risk.updatedAt = new Date();

    risks.set(riskId, risk);

    return risk;
  }

  /**
   * Update risk status to monitoring
   */
  async startMonitoring(riskId: string): Promise<Risk> {
    const risk = risks.get(riskId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    risk.status = RiskStatus.MONITORING;
    risk.updatedAt = new Date();
    risk.lastReviewDate = new Date();
    risk.nextReviewDate = this.calculateNextReviewDate(risk.reviewFrequency);

    risks.set(riskId, risk);

    return risk;
  }

  /**
   * Mark risk as occurred
   */
  async riskOccurred(
    riskId: string,
    actualImpact: string,
    options?: {
      createIssue?: boolean;
      issueData?: Partial<CreateIssueInput>;
    }
  ): Promise<{ risk: Risk; issue?: Issue }> {
    const risk = risks.get(riskId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    risk.status = RiskStatus.OCCURRED;
    risk.actualImpact = actualImpact;
    risk.updatedAt = new Date();

    risks.set(riskId, risk);

    let issue: Issue | undefined;

    // Optionally create an issue
    if (options?.createIssue && risk.projectId) {
      issue = await this.createIssue(risk.projectId, {
        title: `[Risk Occurred] ${risk.title}`,
        description: `Risk has materialized: ${risk.description}\n\nActual Impact: ${actualImpact}`,
        category: risk.category,
        priority: this.riskLevelToPriority(risk.level),
        severity: risk.level,
        reporterId: risk.ownerId,
        ownerId: risk.ownerId,
        impactDescription: actualImpact,
        riskId: risk.id,
        ...options.issueData
      });
    }

    return { risk, issue };
  }

  /**
   * Close a risk
   */
  async closeRisk(riskId: string, lessonsLearned?: string): Promise<Risk> {
    const risk = risks.get(riskId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    risk.status = RiskStatus.CLOSED;
    risk.closedDate = new Date();
    risk.lessonsLearned = lessonsLearned;
    risk.updatedAt = new Date();

    risks.set(riskId, risk);

    return risk;
  }

  /**
   * Get risk by ID
   */
  async getRisk(riskId: string): Promise<Risk | null> {
    return risks.get(riskId) || null;
  }

  /**
   * Get all risks for a project
   */
  async getProjectRisks(projectId: string): Promise<Risk[]> {
    const result: Risk[] = [];

    risks.forEach(risk => {
      if (risk.projectId === projectId) {
        result.push(risk);
      }
    });

    return result.sort((a, b) => b.score - a.score);
  }

  /**
   * Get risk matrix data
   */
  async getRiskMatrix(projectId: string): Promise<RiskMatrix> {
    const projectRisks = await this.getProjectRisks(projectId);

    // Initialize matrix cells (5x5)
    const matrix: RiskMatrix['matrix'] = [];
    for (let prob = 1; prob <= 5; prob++) {
      for (let imp = 1; imp <= 5; imp++) {
        matrix.push({
          probability: prob,
          impact: imp,
          count: 0,
          riskIds: []
        });
      }
    }

    // Initialize summary
    const byLevel: Record<RiskLevel, number> = {
      [RiskLevel.CRITICAL]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.LOW]: 0,
      [RiskLevel.NEGLIGIBLE]: 0
    };

    const byStatus: Record<RiskStatus, number> = {
      [RiskStatus.IDENTIFIED]: 0,
      [RiskStatus.ANALYZING]: 0,
      [RiskStatus.MITIGATING]: 0,
      [RiskStatus.MONITORING]: 0,
      [RiskStatus.OCCURRED]: 0,
      [RiskStatus.CLOSED]: 0
    };

    let totalScore = 0;

    // Process risks
    const riskItems: RiskMatrix['risks'] = [];

    for (const risk of projectRisks) {
      // Skip closed risks in matrix
      if (risk.status === RiskStatus.CLOSED) continue;

      riskItems.push({
        id: risk.id,
        title: risk.title,
        probability: risk.probability,
        impact: risk.impact,
        score: risk.score,
        level: risk.level,
        status: risk.status
      });

      // Update matrix cell
      const cellIndex = matrix.findIndex(
        c => c.probability === risk.probability && c.impact === risk.impact
      );
      if (cellIndex !== -1) {
        matrix[cellIndex].count++;
        matrix[cellIndex].riskIds.push(risk.id);
      }

      // Update summary
      byLevel[risk.level]++;
      byStatus[risk.status]++;
      totalScore += risk.score;
    }

    const activeRisks = projectRisks.filter(r => r.status !== RiskStatus.CLOSED);

    return {
      projectId,
      risks: riskItems,
      summary: {
        total: projectRisks.length,
        byLevel,
        byStatus,
        averageScore: activeRisks.length > 0 ? totalScore / activeRisks.length : 0
      },
      matrix,
      generatedAt: new Date()
    };
  }

  /**
   * Get risks needing review
   */
  async getRisksNeedingReview(projectId?: string): Promise<Risk[]> {
    const now = new Date();
    const result: Risk[] = [];

    risks.forEach(risk => {
      if (projectId && risk.projectId !== projectId) return;
      if (risk.status === RiskStatus.CLOSED) return;

      if (risk.nextReviewDate && risk.nextReviewDate <= now) {
        result.push(risk);
      }
    });

    return result.sort(
      (a, b) => new Date(a.nextReviewDate!).getTime() - new Date(b.nextReviewDate!).getTime()
    );
  }

  // ===========================================================================
  // ISSUE MANAGEMENT
  // ===========================================================================

  /**
   * Create a new issue
   */
  async createIssue(projectId: string, issueData: CreateIssueInput): Promise<Issue> {
    const now = new Date();
    const issueId = uuidv4();

    const issue: Issue = {
      id: issueId,
      projectId,
      riskId: issueData.riskId,
      title: issueData.title,
      description: issueData.description,
      category: issueData.category,
      status: IssueStatus.OPEN,
      priority: issueData.priority,
      severity: issueData.severity,
      impactDescription: issueData.impactDescription,
      affectedMilestones: [],
      affectedTasks: [],
      reporterId: issueData.reporterId,
      ownerId: issueData.ownerId,
      assigneeIds: [],
      reportedDate: now,
      dueDate: issueData.dueDate ? new Date(issueData.dueDate) : undefined,
      attachments: [],
      relatedIssueIds: [],
      createdAt: now,
      updatedAt: now
    };

    issues.set(issueId, issue);

    return issue;
  }

  /**
   * Update an issue
   */
  async updateIssue(issueId: string, changes: Partial<Issue>): Promise<Issue> {
    const issue = issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const updatedIssue: Issue = {
      ...issue,
      ...changes,
      id: issue.id,
      projectId: issue.projectId,
      createdAt: issue.createdAt,
      updatedAt: new Date()
    };

    issues.set(issueId, updatedIssue);

    return updatedIssue;
  }

  /**
   * Resolve an issue
   */
  async resolveIssue(issueId: string, resolution: string): Promise<Issue> {
    const issue = issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.status = IssueStatus.RESOLVED;
    issue.resolution = resolution;
    issue.resolvedDate = new Date();
    issue.updatedAt = new Date();

    issues.set(issueId, issue);

    return issue;
  }

  /**
   * Close an issue
   */
  async closeIssue(issueId: string): Promise<Issue> {
    const issue = issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    if (issue.status !== IssueStatus.RESOLVED) {
      throw new Error('Issue must be resolved before closing');
    }

    issue.status = IssueStatus.CLOSED;
    issue.updatedAt = new Date();

    issues.set(issueId, issue);

    return issue;
  }

  /**
   * Add workaround to an issue
   */
  async addWorkaround(issueId: string, workaround: string): Promise<Issue> {
    const issue = issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    issue.workaround = workaround;
    issue.updatedAt = new Date();

    issues.set(issueId, issue);

    return issue;
  }

  /**
   * Get issue by ID
   */
  async getIssue(issueId: string): Promise<Issue | null> {
    return issues.get(issueId) || null;
  }

  /**
   * Get all issues for a project
   */
  async getProjectIssues(projectId: string): Promise<Issue[]> {
    const result: Issue[] = [];

    issues.forEach(issue => {
      if (issue.projectId === projectId) {
        result.push(issue);
      }
    });

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get open issues
   */
  async getOpenIssues(projectId?: string): Promise<Issue[]> {
    const result: Issue[] = [];

    issues.forEach(issue => {
      if (projectId && issue.projectId !== projectId) return;

      if (
        issue.status === IssueStatus.OPEN ||
        issue.status === IssueStatus.IN_PROGRESS
      ) {
        result.push(issue);
      }
    });

    return result.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = {
        [Priority.CRITICAL]: 0,
        [Priority.HIGH]: 1,
        [Priority.MEDIUM]: 2,
        [Priority.LOW]: 3,
        [Priority.NONE]: 4
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ===========================================================================
  // CHANGE REQUEST MANAGEMENT
  // ===========================================================================

  /**
   * Create a change request
   */
  async createChangeRequest(
    projectId: string,
    changeData: CreateChangeRequestInput
  ): Promise<ChangeRequest> {
    const now = new Date();
    const changeId = uuidv4();

    // Generate change request code
    const projectChanges = await this.getProjectChangeRequests(projectId);
    const changeNumber = projectChanges.length + 1;
    const code = `CR-${changeNumber.toString().padStart(4, '0')}`;

    const changeRequest: ChangeRequest = {
      id: changeId,
      projectId,
      code,
      title: changeData.title,
      description: changeData.description,
      justification: changeData.justification,
      status: ChangeRequestStatus.SUBMITTED,
      priority: changeData.priority,
      type: changeData.type,
      requesterId: changeData.requesterId,
      requestDate: now,

      scopeImpact: changeData.scopeImpact || '',
      scheduleImpact: '',
      scheduleImpactDays: changeData.scheduleImpactDays || 0,
      costImpact: '',
      costImpactAmount: changeData.costImpactAmount || 0,
      resourceImpact: '',
      riskImpact: '',
      qualityImpact: '',

      affectedTasks: changeData.affectedTasks || [],
      affectedMilestones: changeData.affectedMilestones || [],
      affectedDeliverables: [],

      attachments: [],

      createdAt: now,
      updatedAt: now
    };

    changeRequests.set(changeId, changeRequest);

    return changeRequest;
  }

  /**
   * Start review of a change request
   */
  async startReview(changeId: string, reviewerId: string): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    change.status = ChangeRequestStatus.UNDER_REVIEW;
    change.reviewerId = reviewerId;
    change.reviewDate = new Date();
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Complete impact analysis
   */
  async analyzeImpact(
    changeId: string,
    analysis: {
      scopeImpact: string;
      scheduleImpact: string;
      scheduleImpactDays: number;
      costImpact: string;
      costImpactAmount: number;
      resourceImpact: string;
      riskImpact: string;
      qualityImpact: string;
      affectedTasks?: string[];
      affectedMilestones?: string[];
      affectedDeliverables?: string[];
    }
  ): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    change.scopeImpact = analysis.scopeImpact;
    change.scheduleImpact = analysis.scheduleImpact;
    change.scheduleImpactDays = analysis.scheduleImpactDays;
    change.costImpact = analysis.costImpact;
    change.costImpactAmount = analysis.costImpactAmount;
    change.resourceImpact = analysis.resourceImpact;
    change.riskImpact = analysis.riskImpact;
    change.qualityImpact = analysis.qualityImpact;

    if (analysis.affectedTasks) {
      change.affectedTasks = analysis.affectedTasks;
    }
    if (analysis.affectedMilestones) {
      change.affectedMilestones = analysis.affectedMilestones;
    }
    if (analysis.affectedDeliverables) {
      change.affectedDeliverables = analysis.affectedDeliverables;
    }

    change.reviewNotes = 'Impact analysis completed';
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Approve a change request
   */
  async approveChangeRequest(
    changeId: string,
    approverId: string,
    notes?: string
  ): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    change.status = ChangeRequestStatus.APPROVED;
    change.approverId = approverId;
    change.approvalDate = new Date();
    change.approvalNotes = notes;
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Reject a change request
   */
  async rejectChangeRequest(
    changeId: string,
    approverId: string,
    reason: string
  ): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    change.status = ChangeRequestStatus.REJECTED;
    change.approverId = approverId;
    change.approvalDate = new Date();
    change.rejectionReason = reason;
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Defer a change request
   */
  async deferChangeRequest(changeId: string, reason: string): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    change.status = ChangeRequestStatus.DEFERRED;
    change.approvalNotes = reason;
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Implement a change request
   */
  async implementChangeRequest(
    changeId: string,
    implementerId: string,
    notes?: string
  ): Promise<ChangeRequest> {
    const change = changeRequests.get(changeId);
    if (!change) {
      throw new Error(`Change request not found: ${changeId}`);
    }

    if (change.status !== ChangeRequestStatus.APPROVED) {
      throw new Error('Change request must be approved before implementation');
    }

    change.status = ChangeRequestStatus.IMPLEMENTED;
    change.implementedBy = implementerId;
    change.implementedDate = new Date();
    change.implementationNotes = notes;
    change.updatedAt = new Date();

    changeRequests.set(changeId, change);

    return change;
  }

  /**
   * Get change request by ID
   */
  async getChangeRequest(changeId: string): Promise<ChangeRequest | null> {
    return changeRequests.get(changeId) || null;
  }

  /**
   * Get all change requests for a project
   */
  async getProjectChangeRequests(projectId: string): Promise<ChangeRequest[]> {
    const result: ChangeRequest[] = [];

    changeRequests.forEach(change => {
      if (change.projectId === projectId) {
        result.push(change);
      }
    });

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get pending change requests
   */
  async getPendingChangeRequests(projectId?: string): Promise<ChangeRequest[]> {
    const result: ChangeRequest[] = [];

    changeRequests.forEach(change => {
      if (projectId && change.projectId !== projectId) return;

      if (
        change.status === ChangeRequestStatus.SUBMITTED ||
        change.status === ChangeRequestStatus.UNDER_REVIEW
      ) {
        result.push(change);
      }
    });

    return result.sort(
      (a, b) => new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
    );
  }

  // ===========================================================================
  // ANALYTICS
  // ===========================================================================

  /**
   * Get risk summary for a project
   */
  async getRiskSummary(projectId: string): Promise<{
    totalRisks: number;
    openRisks: number;
    highRisks: number;
    criticalRisks: number;
    averageScore: number;
    topRisks: Risk[];
    risksByCategory: Record<string, number>;
  }> {
    const projectRisks = await this.getProjectRisks(projectId);

    const openRisks = projectRisks.filter(r => r.status !== RiskStatus.CLOSED);
    const highRisks = openRisks.filter(
      r => r.level === RiskLevel.HIGH || r.level === RiskLevel.CRITICAL
    );
    const criticalRisks = openRisks.filter(r => r.level === RiskLevel.CRITICAL);

    const totalScore = openRisks.reduce((sum, r) => sum + r.score, 0);

    // Count by category
    const risksByCategory: Record<string, number> = {};
    openRisks.forEach(r => {
      risksByCategory[r.category] = (risksByCategory[r.category] || 0) + 1;
    });

    return {
      totalRisks: projectRisks.length,
      openRisks: openRisks.length,
      highRisks: highRisks.length,
      criticalRisks: criticalRisks.length,
      averageScore: openRisks.length > 0 ? totalScore / openRisks.length : 0,
      topRisks: openRisks.slice(0, 5), // Top 5 by score (already sorted)
      risksByCategory
    };
  }

  /**
   * Get issue summary for a project
   */
  async getIssueSummary(projectId: string): Promise<{
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
    averageResolutionDays: number;
    issuesByPriority: Record<Priority, number>;
  }> {
    const projectIssues = await this.getProjectIssues(projectId);

    const openIssues = projectIssues.filter(
      i => i.status === IssueStatus.OPEN || i.status === IssueStatus.IN_PROGRESS
    );
    const criticalIssues = openIssues.filter(
      i => i.priority === Priority.CRITICAL || i.severity === RiskLevel.CRITICAL
    );

    // Calculate average resolution time
    const resolvedIssues = projectIssues.filter(
      i => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED
    );

    let totalResolutionDays = 0;
    resolvedIssues.forEach(i => {
      if (i.resolvedDate) {
        const days = Math.ceil(
          (new Date(i.resolvedDate).getTime() - new Date(i.reportedDate).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        totalResolutionDays += days;
      }
    });

    // Count by priority
    const issuesByPriority: Record<Priority, number> = {
      [Priority.CRITICAL]: 0,
      [Priority.HIGH]: 0,
      [Priority.MEDIUM]: 0,
      [Priority.LOW]: 0,
      [Priority.NONE]: 0
    };

    openIssues.forEach(i => {
      issuesByPriority[i.priority]++;
    });

    return {
      totalIssues: projectIssues.length,
      openIssues: openIssues.length,
      criticalIssues: criticalIssues.length,
      averageResolutionDays: resolvedIssues.length > 0
        ? totalResolutionDays / resolvedIssues.length
        : 0,
      issuesByPriority
    };
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Calculate risk level from score
   */
  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 20) return RiskLevel.CRITICAL;
    if (score >= 15) return RiskLevel.HIGH;
    if (score >= 8) return RiskLevel.MEDIUM;
    if (score >= 4) return RiskLevel.LOW;
    return RiskLevel.NEGLIGIBLE;
  }

  /**
   * Calculate next review date based on frequency
   */
  private calculateNextReviewDate(frequency: 'daily' | 'weekly' | 'monthly'): Date {
    const next = new Date();

    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  /**
   * Convert risk level to priority
   */
  private riskLevelToPriority(level: RiskLevel): Priority {
    switch (level) {
      case RiskLevel.CRITICAL: return Priority.CRITICAL;
      case RiskLevel.HIGH: return Priority.HIGH;
      case RiskLevel.MEDIUM: return Priority.MEDIUM;
      case RiskLevel.LOW: return Priority.LOW;
      default: return Priority.NONE;
    }
  }
}

// Export singleton instance
export const riskService = new RiskService();
