import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateActivityDto,
  UpdateActivityDto,
  FilterActivityDto,
  ActivityType,
  LogCallDto,
  LogEmailDto,
  LogMeetingDto,
  LogNoteDto,
  LogTaskDto,
  LogDemoDto,
  LogProposalDto,
  LogDocumentDto,
  ActivitySummary
} from '../dto/activity.dto';
import { PaginatedResult } from '../dto/lead.dto';
import { Activity } from '../entities/activity.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new activity
   */
  async create(dto: CreateActivityDto, userId: string): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: {
        ...dto,
        createdBy: userId
      }
    });

    this.logger.log(`Activity created: ${activity.id} - ${activity.type}`);
    return activity;
  }

  /**
   * Find all activities with filters
   */
  async findAll(filters: FilterActivityDto): Promise<PaginatedResult<Activity>> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.opportunityId) where.opportunityId = filters.opportunityId;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.createdBy) where.createdBy = filters.createdBy;
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { id: true, firstName: true, lastName: true, email: true } },
          opportunity: { select: { id: true, name: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          createdBy: { select: { id: true, name: true } }
        }
      }),
      this.prisma.activity.count({ where })
    ]);

    return {
      data: activities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find one activity by ID
   */
  async findOne(id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        lead: true,
        opportunity: true,
        customer: true,
        createdBy: true
      }
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }

    return activity;
  }

  /**
   * Update an activity
   */
  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    await this.findOne(id);

    const activity = await this.prisma.activity.update({
      where: { id },
      data: dto
    });

    this.logger.log(`Activity updated: ${id}`);
    return activity;
  }

  /**
   * Delete an activity
   */
  async delete(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.activity.delete({
      where: { id }
    });

    this.logger.log(`Activity deleted: ${id}`);
  }

  // ========================================
  // ACTIVITY TYPES (8 methods)
  // ========================================

  /**
   * Log a phone call
   */
  async logCall(dto: LogCallDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.CALL,
      description: dto.description,
      leadId: dto.leadId,
      metadata: {
        duration: dto.duration,
        outcome: dto.outcome
      }
    }, userId);
  }

  /**
   * Log an email
   */
  async logEmail(dto: LogEmailDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.EMAIL,
      description: `${dto.subject}\n\n${dto.body}`,
      leadId: dto.leadId,
      metadata: {
        subject: dto.subject,
        status: dto.status || 'sent'
      }
    }, userId);
  }

  /**
   * Log a meeting
   */
  async logMeeting(dto: LogMeetingDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.MEETING,
      description: dto.title,
      leadId: dto.leadId,
      scheduledFor: dto.scheduledFor,
      metadata: {
        duration: dto.duration,
        location: dto.location
      }
    }, userId);
  }

  /**
   * Log a note
   */
  async logNote(dto: LogNoteDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.NOTE,
      description: dto.content,
      leadId: dto.leadId
    }, userId);
  }

  /**
   * Log a task
   */
  async logTask(dto: LogTaskDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.TASK,
      description: dto.title,
      leadId: dto.leadId,
      scheduledFor: dto.dueDate,
      metadata: {
        priority: dto.priority || 'medium'
      }
    }, userId);
  }

  /**
   * Log a demo
   */
  async logDemo(dto: LogDemoDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.DEMO,
      description: dto.description,
      leadId: dto.leadId,
      metadata: {
        duration: dto.duration,
        feedback: dto.feedback
      }
    }, userId);
  }

  /**
   * Log a proposal
   */
  async logProposal(dto: LogProposalDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.PROPOSAL,
      description: dto.title,
      opportunityId: dto.opportunityId,
      metadata: {
        value: dto.value,
        documentUrl: dto.documentUrl
      }
    }, userId);
  }

  /**
   * Log a document
   */
  async logDocument(dto: LogDocumentDto, userId: string): Promise<Activity> {
    return await this.create({
      type: ActivityType.DOCUMENT,
      description: dto.title,
      leadId: dto.leadId,
      metadata: {
        documentType: dto.documentType,
        documentUrl: dto.documentUrl
      }
    }, userId);
  }

  // ========================================
  // TIMELINE (4 methods)
  // ========================================

  /**
   * Get activity timeline for an entity
   */
  async getTimeline(
    entityType: 'lead' | 'opportunity' | 'customer',
    entityId: string
  ): Promise<Activity[]> {
    const where: any = {};

    if (entityType === 'lead') where.leadId = entityId;
    else if (entityType === 'opportunity') where.opportunityId = entityId;
    else if (entityType === 'customer') where.customerId = entityId;

    return await this.prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });
  }

  /**
   * Get recent activities for an agent
   */
  async getRecentActivities(agentId: string, days: number = 7): Promise<Activity[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.prisma.activity.findMany({
      where: {
        createdBy: agentId,
        createdAt: { gte: cutoffDate }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
        opportunity: { select: { id: true, name: true } }
      },
      take: 100
    });
  }

  /**
   * Get activity summary for an agent
   */
  async getActivitySummary(
    agentId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<ActivitySummary> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await this.prisma.activity.findMany({
      where: {
        createdBy: agentId,
        createdAt: { gte: cutoffDate }
      }
    });

    const byType: Record<ActivityType, number> = {} as any;
    Object.values(ActivityType).forEach(type => {
      byType[type] = 0;
    });

    activities.forEach(activity => {
      byType[activity.type] = (byType[activity.type] || 0) + 1;
    });

    const completedTasks = activities.filter(
      a => a.type === ActivityType.TASK && a.completedAt
    ).length;

    const pendingTasks = activities.filter(
      a => a.type === ActivityType.TASK && !a.completedAt
    ).length;

    const upcomingMeetings = await this.prisma.activity.count({
      where: {
        createdBy: agentId,
        type: ActivityType.MEETING,
        scheduledFor: { gte: new Date() },
        completedAt: null
      }
    });

    return {
      totalActivities: activities.length,
      byType,
      completedTasks,
      pendingTasks,
      upcomingMeetings
    };
  }

  /**
   * Export activities to Excel
   */
  async exportActivities(filters: FilterActivityDto): Promise<Buffer> {
    const { data } = await this.findAll({ ...filters, limit: 10000 });

    const exportData = data.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      leadName: activity.lead ? `${activity.lead.firstName} ${activity.lead.lastName}` : '',
      opportunityName: activity.opportunity?.name || '',
      createdBy: activity.createdBy?.name || '',
      createdAt: activity.createdAt,
      scheduledFor: activity.scheduledFor,
      completedAt: activity.completedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
