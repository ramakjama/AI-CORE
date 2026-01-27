/**
 * Workflow Repository
 * Manages Workflows in SM_WORKFLOWS database
 */

import { BaseRepository } from './base.repository';
import { Workflow, WorkflowStep, PaginatedResult, PaginationOptions } from '../types';

// ============================================
// WORKFLOW TYPES
// ============================================

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface WorkflowCreateInput {
  name: string;
  type: string;
  status?: WorkflowStatus;
  entityType: string;
  entityId: string;
  currentStep?: string;
  steps: WorkflowStepInput[];
  assignee?: string | null;
  dueDate?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStepInput {
  name: string;
  order: number;
  status?: StepStatus;
  assignee?: string | null;
}

export interface WorkflowUpdateInput {
  name?: string;
  status?: WorkflowStatus;
  currentStep?: string;
  assignee?: string | null;
  dueDate?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface WorkflowSearchCriteria {
  name?: string;
  type?: string;
  status?: WorkflowStatus;
  entityType?: string;
  entityId?: string;
  assignee?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface StepTransition {
  stepId: string;
  newStatus: StepStatus;
  completedBy?: string;
  notes?: string;
}

// ============================================
// WORKFLOW REPOSITORY
// ============================================

export class WorkflowRepository extends BaseRepository<Workflow, WorkflowCreateInput, WorkflowUpdateInput> {
  constructor() {
    super('sm_workflows', 'workflow', 'id');
  }

  /**
   * Find workflows by entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Workflow>> {
    return this.findMany({
      where: { entityType, entityId },
      include: { steps: true },
      ...options,
    });
  }

  /**
   * Find active workflow for entity
   */
  async findActiveByEntity(entityType: string, entityId: string): Promise<Workflow | null> {
    return this.findFirst({
      where: {
        entityType,
        entityId,
        status: 'ACTIVE',
      },
      include: { steps: true },
    });
  }

  /**
   * Find workflows by type
   */
  async findByType(
    type: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Workflow>> {
    return this.findMany({
      where: { type },
      include: { steps: true },
      ...options,
    });
  }

  /**
   * Find workflows assigned to user
   */
  async findByAssignee(
    assignee: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Workflow>> {
    return this.findMany({
      where: { assignee },
      include: { steps: true },
      ...options,
    });
  }

  /**
   * Search workflows with multiple criteria
   */
  async search(
    criteria: WorkflowSearchCriteria,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Workflow>> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }
    if (criteria.type) {
      where.type = criteria.type;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.entityType) {
      where.entityType = criteria.entityType;
    }
    if (criteria.entityId) {
      where.entityId = criteria.entityId;
    }
    if (criteria.assignee) {
      where.assignee = criteria.assignee;
    }
    if (criteria.dueDateFrom || criteria.dueDateTo) {
      where.dueDate = {
        ...(criteria.dueDateFrom && { gte: criteria.dueDateFrom }),
        ...(criteria.dueDateTo && { lte: criteria.dueDateTo }),
      };
    }

    return this.findMany({
      where,
      include: { steps: true },
      ...options,
    });
  }

  /**
   * Start a workflow
   */
  async start(id: string): Promise<Workflow> {
    return this.transaction(async (tx) => {
      const workflow = await tx.workflow.findUnique({
        where: { id },
        include: { steps: true },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'DRAFT') {
        throw new Error('Can only start workflows in DRAFT status');
      }

      // Find first step and set it as current
      const firstStep = workflow.steps.find((s: WorkflowStep) => s.order === 1);
      if (!firstStep) {
        throw new Error('Workflow has no steps');
      }

      // Update first step to IN_PROGRESS
      await tx.workflowStep.update({
        where: { id: firstStep.id },
        data: { status: 'IN_PROGRESS' },
      });

      // Update workflow status
      return tx.workflow.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          currentStep: firstStep.id,
          startedAt: new Date(),
        },
        include: { steps: true },
      });
    });
  }

  /**
   * Advance to next step
   */
  async advanceStep(id: string, completedBy: string, notes?: string): Promise<Workflow> {
    return this.transaction(async (tx) => {
      const workflow = await tx.workflow.findUnique({
        where: { id },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (workflow.status !== 'ACTIVE') {
        throw new Error('Workflow is not active');
      }

      // Find current step
      const currentStepIndex = workflow.steps.findIndex(
        (s: WorkflowStep) => s.id === workflow.currentStep
      );

      if (currentStepIndex === -1) {
        throw new Error('Current step not found');
      }

      const currentStep = workflow.steps[currentStepIndex];
      const nextStep = workflow.steps[currentStepIndex + 1];

      // Complete current step
      await tx.workflowStep.update({
        where: { id: currentStep.id },
        data: {
          status: 'COMPLETED',
          completedBy,
          completedAt: new Date(),
          notes,
        },
      });

      if (nextStep) {
        // Move to next step
        await tx.workflowStep.update({
          where: { id: nextStep.id },
          data: { status: 'IN_PROGRESS' },
        });

        return tx.workflow.update({
          where: { id },
          data: { currentStep: nextStep.id },
          include: { steps: true },
        });
      } else {
        // Complete workflow
        return tx.workflow.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            currentStep: null,
          },
          include: { steps: true },
        });
      }
    });
  }

  /**
   * Skip current step
   */
  async skipStep(id: string, reason: string): Promise<Workflow> {
    return this.transaction(async (tx) => {
      const workflow = await tx.workflow.findUnique({
        where: { id },
        include: { steps: { orderBy: { order: 'asc' } } },
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const currentStepIndex = workflow.steps.findIndex(
        (s: WorkflowStep) => s.id === workflow.currentStep
      );

      if (currentStepIndex === -1) {
        throw new Error('Current step not found');
      }

      const currentStep = workflow.steps[currentStepIndex];
      const nextStep = workflow.steps[currentStepIndex + 1];

      // Skip current step
      await tx.workflowStep.update({
        where: { id: currentStep.id },
        data: {
          status: 'SKIPPED',
          notes: `Skipped: ${reason}`,
        },
      });

      if (nextStep) {
        await tx.workflowStep.update({
          where: { id: nextStep.id },
          data: { status: 'IN_PROGRESS' },
        });

        return tx.workflow.update({
          where: { id },
          data: { currentStep: nextStep.id },
          include: { steps: true },
        });
      } else {
        return tx.workflow.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            currentStep: null,
          },
          include: { steps: true },
        });
      }
    });
  }

  /**
   * Pause a workflow
   */
  async pause(id: string): Promise<Workflow> {
    return this.update(id, { status: 'PAUSED' });
  }

  /**
   * Resume a paused workflow
   */
  async resume(id: string): Promise<Workflow> {
    const workflow = await this.findById(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }
    if (workflow.status !== 'PAUSED') {
      throw new Error('Can only resume paused workflows');
    }
    return this.update(id, { status: 'ACTIVE' });
  }

  /**
   * Cancel a workflow
   */
  async cancel(id: string, reason: string): Promise<Workflow> {
    return this.update(id, {
      status: 'CANCELLED',
      metadata: { cancelledAt: new Date(), cancelReason: reason },
    });
  }

  /**
   * Reassign workflow
   */
  async reassign(id: string, newAssignee: string): Promise<Workflow> {
    return this.update(id, { assignee: newAssignee });
  }

  /**
   * Find overdue workflows
   */
  async findOverdue(): Promise<Workflow[]> {
    const result = await this.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
      include: { steps: true },
    });
    return result.data;
  }

  /**
   * Get workflow statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<WorkflowStatus, number>;
    byType: Record<string, number>;
    overdue: number;
    averageCompletionTime: number;
  }> {
    const delegate = await this.getDelegate();

    const [total, byStatus, byType, overdueCount, completedWorkflows] = await Promise.all([
      delegate.count(),
      delegate.groupBy({
        by: ['status'],
        _count: true,
      }),
      delegate.groupBy({
        by: ['type'],
        _count: true,
      }),
      delegate.count({
        where: {
          status: 'ACTIVE',
          dueDate: { lt: new Date() },
        },
      }),
      delegate.findMany({
        where: { status: 'COMPLETED', completedAt: { not: null } },
        select: { startedAt: true, completedAt: true },
      }),
    ]);

    // Calculate average completion time
    let avgTime = 0;
    if (completedWorkflows.length > 0) {
      const totalTime = completedWorkflows.reduce((sum: number, wf: any) => {
        if (wf.startedAt && wf.completedAt) {
          return sum + (wf.completedAt.getTime() - wf.startedAt.getTime());
        }
        return sum;
      }, 0);
      avgTime = totalTime / completedWorkflows.length / (1000 * 60 * 60); // hours
    }

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<WorkflowStatus, number>, item: any) => {
        acc[item.status as WorkflowStatus] = item._count;
        return acc;
      }, {} as Record<WorkflowStatus, number>),
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      overdue: overdueCount,
      averageCompletionTime: avgTime,
    };
  }

  /**
   * Clone a workflow for another entity
   */
  async cloneForEntity(
    workflowId: string,
    newEntityType: string,
    newEntityId: string
  ): Promise<Workflow> {
    const original = await this.findById(workflowId, { include: { steps: true } });
    if (!original) {
      throw new Error('Workflow not found');
    }

    return this.create({
      name: original.name,
      type: original.type,
      status: 'DRAFT',
      entityType: newEntityType,
      entityId: newEntityId,
      steps: (original as any).steps.map((step: WorkflowStep) => ({
        name: step.name,
        order: step.order,
        status: 'PENDING',
      })),
      metadata: {
        clonedFrom: workflowId,
        clonedAt: new Date(),
      },
    });
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let workflowRepositoryInstance: WorkflowRepository | null = null;

export function getWorkflowRepository(): WorkflowRepository {
  if (!workflowRepositoryInstance) {
    workflowRepositoryInstance = new WorkflowRepository();
  }
  return workflowRepositoryInstance;
}
