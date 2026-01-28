import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  FilterOpportunityDto,
  PipelineStage,
  CloseWonDto,
  CloseLostDto,
  ScheduleFollowUpDto,
  PipelineView,
  RevenueForest
} from '../dto/opportunity.dto';
import { PaginatedResult } from '../dto/lead.dto';
import { Opportunity } from '../entities/opportunity.entity';
import { Activity } from '../entities/activity.entity';
import { CreateActivityDto, ActivityType } from '../dto/activity.dto';

@Injectable()
export class OpportunityService {
  private readonly logger = new Logger(OpportunityService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new opportunity
   */
  async create(dto: CreateOpportunityDto, userId: string): Promise<Opportunity> {
    const opportunity = await this.prisma.opportunity.create({
      data: {
        ...dto,
        probability: dto.probability || this.getDefaultProbability(dto.stage),
        createdBy: userId,
        updatedBy: userId
      }
    });

    this.logger.log(`Opportunity created: ${opportunity.id}`);
    return opportunity;
  }

  /**
   * Find all opportunities with filters
   */
  async findAll(filters: FilterOpportunityDto): Promise<PaginatedResult<Opportunity>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.stage) where.stage = filters.stage;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.minValue !== undefined) {
      where.value = { ...where.value, gte: filters.minValue };
    }
    if (filters.maxValue !== undefined) {
      where.value = { ...where.value, lte: filters.maxValue };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: true,
          customer: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          activities: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      }),
      this.prisma.opportunity.count({ where })
    ]);

    return {
      data: opportunities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find one opportunity by ID
   */
  async findOne(id: string): Promise<Opportunity> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        lead: true,
        customer: true,
        assignedTo: true,
        activities: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }

    return opportunity;
  }

  /**
   * Update an opportunity
   */
  async update(id: string, dto: UpdateOpportunityDto, userId: string): Promise<Opportunity> {
    await this.findOne(id);

    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    this.logger.log(`Opportunity updated: ${id}`);
    return opportunity;
  }

  /**
   * Delete an opportunity
   */
  async delete(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.opportunity.delete({
      where: { id }
    });

    this.logger.log(`Opportunity deleted: ${id}`);
  }

  // ========================================
  // PIPELINE MANAGEMENT (10 methods)
  // ========================================

  /**
   * Move opportunity to a different stage
   */
  async moveToStage(opportunityId: string, stage: PipelineStage, userId: string): Promise<Opportunity> {
    const opportunity = await this.findOne(opportunityId);

    // Update probability based on stage
    const newProbability = this.getDefaultProbability(stage);

    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage,
        probability: newProbability,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: ActivityType.STATUS_CHANGE,
        opportunityId,
        description: `Moved from ${opportunity.stage} to ${stage}`,
        createdBy: userId
      }
    });

    this.logger.log(`Opportunity ${opportunityId} moved to ${stage}`);
    return updated;
  }

  /**
   * Get opportunities by stage
   */
  async getByStage(stage: PipelineStage): Promise<Opportunity[]> {
    return await this.prisma.opportunity.findMany({
      where: { stage },
      orderBy: { value: 'desc' },
      include: {
        lead: true,
        customer: true,
        assignedTo: { select: { id: true, name: true } }
      }
    });
  }

  /**
   * Get pipeline view with all stages
   */
  async getPipeline(agentId?: string): Promise<PipelineView> {
    const where: any = {};
    if (agentId) where.assignedToId = agentId;

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        lead: true,
        customer: true,
        assignedTo: { select: { id: true, name: true } }
      }
    });

    const stages: PipelineView['stages'] = {} as any;
    let totalValue = 0;
    let totalCount = 0;

    // Initialize all stages
    Object.values(PipelineStage).forEach(stage => {
      stages[stage] = { count: 0, value: 0, opportunities: [] };
    });

    // Group by stage
    opportunities.forEach(opp => {
      if (!stages[opp.stage]) {
        stages[opp.stage] = { count: 0, value: 0, opportunities: [] };
      }
      stages[opp.stage].count++;
      stages[opp.stage].value += opp.value;
      stages[opp.stage].opportunities.push(opp);
      totalValue += opp.value;
      totalCount++;
    });

    return {
      stages,
      totalValue,
      totalCount,
      averageValue: totalCount > 0 ? totalValue / totalCount : 0
    };
  }

  /**
   * Calculate win probability based on stage and other factors
   */
  async calculateProbability(opportunity: Opportunity): Promise<number> {
    let probability = this.getDefaultProbability(opportunity.stage);

    // Adjust based on activities
    const activityCount = await this.prisma.activity.count({
      where: { opportunityId: opportunity.id }
    });
    probability += Math.min(activityCount * 2, 20);

    // Adjust based on age
    const daysOld = Math.floor(
      (Date.now() - opportunity.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysOld > 90) probability -= 10;
    else if (daysOld > 60) probability -= 5;

    return Math.min(Math.max(probability, 0), 100);
  }

  /**
   * Update probability for an opportunity
   */
  async updateProbability(opportunityId: string): Promise<Opportunity> {
    const opportunity = await this.findOne(opportunityId);
    const newProbability = await this.calculateProbability(opportunity);

    return await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { probability: newProbability }
    });
  }

  /**
   * Forecast revenue based on opportunities
   */
  async forecastRevenue(filters?: FilterOpportunityDto): Promise<RevenueForest> {
    const where: any = {
      stage: {
        notIn: [PipelineStage.CLOSED_LOST, PipelineStage.CLOSED_WON]
      }
    };
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    const opportunities = await this.prisma.opportunity.findMany({ where });

    const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const weightedValue = opportunities.reduce(
      (sum, opp) => sum + (opp.value * opp.probability / 100),
      0
    );

    return {
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      predictedRevenue: totalValue,
      weightedRevenue: weightedValue,
      opportunities: opportunities.length
    };
  }

  /**
   * Get stale opportunities (no activity for X days)
   */
  async getStaleOpportunities(days: number = 30): Promise<Opportunity[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        stage: {
          notIn: [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]
        },
        updatedAt: { lte: cutoffDate }
      },
      orderBy: { updatedAt: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        lead: true
      }
    });

    return opportunities;
  }

  /**
   * Close opportunity as won
   */
  async closeWon(opportunityId: string, dto: CloseWonDto, userId: string): Promise<Opportunity> {
    const opportunity = await this.findOne(opportunityId);

    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage: PipelineStage.CLOSED_WON,
        probability: 100,
        actualValue: dto.actualValue,
        closedAt: new Date(),
        notes: dto.notes ? `${dto.notes}\n\n${opportunity.notes || ''}` : opportunity.notes,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: ActivityType.STATUS_CHANGE,
        opportunityId,
        description: `Opportunity won! Value: €${dto.actualValue}`,
        metadata: { actualValue: dto.actualValue },
        createdBy: userId
      }
    });

    this.logger.log(`Opportunity ${opportunityId} closed as won: €${dto.actualValue}`);
    return updated;
  }

  /**
   * Close opportunity as lost
   */
  async closeLost(opportunityId: string, dto: CloseLostDto, userId: string): Promise<Opportunity> {
    const opportunity = await this.findOne(opportunityId);

    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage: PipelineStage.CLOSED_LOST,
        probability: 0,
        lostReason: dto.reason,
        closedAt: new Date(),
        notes: dto.notes ? `${dto.notes}\n\n${opportunity.notes || ''}` : opportunity.notes,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: ActivityType.STATUS_CHANGE,
        opportunityId,
        description: `Opportunity lost. Reason: ${dto.reason}`,
        metadata: { lostReason: dto.reason },
        createdBy: userId
      }
    });

    this.logger.log(`Opportunity ${opportunityId} closed as lost: ${dto.reason}`);
    return updated;
  }

  /**
   * Reopen a closed opportunity
   */
  async reopen(opportunityId: string, reason: string, userId: string): Promise<Opportunity> {
    const opportunity = await this.findOne(opportunityId);

    if (![PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST].includes(opportunity.stage)) {
      throw new BadRequestException('Only closed opportunities can be reopened');
    }

    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stage: PipelineStage.QUALIFIED,
        probability: 50,
        closedAt: null,
        actualValue: null,
        lostReason: null,
        notes: `Reopened: ${reason}\n\n${opportunity.notes || ''}`,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: ActivityType.STATUS_CHANGE,
        opportunityId,
        description: `Opportunity reopened: ${reason}`,
        createdBy: userId
      }
    });

    this.logger.log(`Opportunity ${opportunityId} reopened`);
    return updated;
  }

  // ========================================
  // ACTIVITIES (5 methods)
  // ========================================

  /**
   * Log an activity for an opportunity
   */
  async logActivity(opportunityId: string, dto: CreateActivityDto, userId: string): Promise<Activity> {
    await this.findOne(opportunityId);

    const activity = await this.prisma.activity.create({
      data: {
        ...dto,
        opportunityId,
        createdBy: userId
      }
    });

    this.logger.log(`Activity logged for opportunity ${opportunityId}: ${dto.type}`);
    return activity;
  }

  /**
   * Get all activities for an opportunity
   */
  async getActivities(opportunityId: string): Promise<Activity[]> {
    await this.findOne(opportunityId);

    return await this.prisma.activity.findMany({
      where: { opportunityId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } }
      }
    });
  }

  /**
   * Schedule a follow-up activity
   */
  async scheduleFollowUp(
    opportunityId: string,
    dto: ScheduleFollowUpDto,
    userId: string
  ): Promise<Activity> {
    await this.findOne(opportunityId);

    const activity = await this.prisma.activity.create({
      data: {
        type: dto.type || ActivityType.TASK,
        description: dto.description,
        opportunityId,
        scheduledFor: dto.scheduledFor,
        createdBy: userId
      }
    });

    this.logger.log(`Follow-up scheduled for opportunity ${opportunityId}`);
    return activity;
  }

  /**
   * Complete an activity
   */
  async completeActivity(activityId: string, outcome: string): Promise<Activity> {
    const activity = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        completedAt: new Date(),
        metadata: { outcome }
      }
    });

    this.logger.log(`Activity ${activityId} completed`);
    return activity;
  }

  /**
   * Get upcoming activities for an agent
   */
  async getUpcomingActivities(agentId: string): Promise<Activity[]> {
    return await this.prisma.activity.findMany({
      where: {
        createdBy: agentId,
        scheduledFor: { gte: new Date() },
        completedAt: null
      },
      orderBy: { scheduledFor: 'asc' },
      include: {
        opportunity: { select: { id: true, name: true } },
        lead: { select: { id: true, firstName: true, lastName: true } }
      },
      take: 50
    });
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get default probability for a stage
   */
  private getDefaultProbability(stage: PipelineStage): number {
    const probabilities = {
      [PipelineStage.LEAD]: 10,
      [PipelineStage.QUALIFIED]: 25,
      [PipelineStage.MEETING_SCHEDULED]: 40,
      [PipelineStage.PROPOSAL]: 60,
      [PipelineStage.NEGOTIATION]: 75,
      [PipelineStage.CLOSED_WON]: 100,
      [PipelineStage.CLOSED_LOST]: 0
    };
    return probabilities[stage] || 50;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
