import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateLeadDto,
  UpdateLeadDto,
  LeadStatus,
  LeadSource,
  FilterLeadDto,
  PaginatedResult,
  ConvertLeadDto,
  ImportResult,
  BulkUpdateResult
} from '../dto/lead.dto';
import { Lead } from '../entities/lead.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new lead
   */
  async create(createLeadDto: CreateLeadDto, userId: string): Promise<Lead> {
    // Check for duplicate email
    const existing = await this.prisma.lead.findFirst({
      where: { email: createLeadDto.email }
    });

    if (existing) {
      throw new BadRequestException(`Lead with email ${createLeadDto.email} already exists`);
    }

    // Calculate initial score
    const score = createLeadDto.score ?? await this.calculateScore({
      source: createLeadDto.source,
      company: createLeadDto.company,
      phone: createLeadDto.phone,
      jobTitle: createLeadDto.jobTitle
    });

    const lead = await this.prisma.lead.create({
      data: {
        ...createLeadDto,
        status: LeadStatus.NEW,
        score,
        createdBy: userId,
        updatedBy: userId
      }
    });

    this.logger.log(`Lead created: ${lead.id} - ${lead.email}`);
    return lead;
  }

  /**
   * Find all leads with filters and pagination
   */
  async findAll(filters: FilterLeadDto): Promise<PaginatedResult<Lead>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.source) where.source = filters.source;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.minScore !== undefined) {
      where.score = { ...where.score, gte: filters.minScore };
    }
    if (filters.maxScore !== undefined) {
      where.score = { ...where.score, lte: filters.maxScore };
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activities: { take: 5, orderBy: { createdAt: 'desc' } },
          assignedTo: { select: { id: true, name: true, email: true } }
        }
      }),
      this.prisma.lead.count({ where })
    ]);

    return {
      data: leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find one lead by ID
   */
  async findOne(id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { createdAt: 'desc' } },
        assignedTo: true,
        opportunity: true
      }
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return lead;
  }

  /**
   * Update a lead
   */
  async update(id: string, updateLeadDto: UpdateLeadDto, userId: string): Promise<Lead> {
    await this.findOne(id);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...updateLeadDto,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });

    this.logger.log(`Lead updated: ${id}`);
    return lead;
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.lead.delete({
      where: { id }
    });

    this.logger.log(`Lead deleted: ${id}`);
  }

  // ========================================
  // LEAD SCORING (8 methods)
  // ========================================

  /**
   * Calculate lead score based on multiple factors
   */
  async calculateScore(lead: Partial<Lead>): Promise<number> {
    let score = 0;

    // Source scoring
    score += await this.scoreByProfile(lead);

    // Engagement scoring (if available)
    if (lead.id) {
      score += await this.scoreByEngagement(lead as Lead);
      score += await this.scoreByBehavior(lead as Lead);
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Update lead score
   */
  async updateScore(leadId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);
    const newScore = await this.calculateScore(lead);

    return await this.prisma.lead.update({
      where: { id: leadId },
      data: { score: newScore }
    });
  }

  /**
   * Get hot leads (high score)
   */
  async getHotLeads(threshold: number = 70): Promise<Lead[]> {
    return await this.prisma.lead.findMany({
      where: {
        score: { gte: threshold },
        status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED] }
      },
      orderBy: { score: 'desc' },
      take: 50
    });
  }

  /**
   * Get cold leads (low score)
   */
  async getColdLeads(threshold: number = 30): Promise<Lead[]> {
    return await this.prisma.lead.findMany({
      where: {
        score: { lte: threshold },
        status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED] }
      },
      orderBy: { score: 'asc' },
      take: 50
    });
  }

  /**
   * Score by engagement (emails, calls, meetings)
   */
  async scoreByEngagement(lead: Lead): Promise<number> {
    const activities = await this.prisma.activity.count({
      where: {
        leadId: lead.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    });

    // More activities = higher engagement
    return Math.min(activities * 5, 30);
  }

  /**
   * Score by profile completeness and quality
   */
  async scoreByProfile(lead: Partial<Lead>): Promise<number> {
    let score = 30; // Base score

    // Source bonus
    if (lead.source === LeadSource.REFERRAL) score += 20;
    else if (lead.source === LeadSource.WEBSITE) score += 10;
    else if (lead.source === LeadSource.EVENT) score += 15;
    else if (lead.source === LeadSource.PARTNER) score += 18;

    // Company bonus
    if (lead.company) score += 10;

    // Phone bonus
    if (lead.phone) score += 8;

    // Job title bonus
    if (lead.jobTitle) {
      const seniorTitles = ['CEO', 'CTO', 'CFO', 'Director', 'VP', 'Manager'];
      if (seniorTitles.some(title => lead.jobTitle?.toUpperCase().includes(title))) {
        score += 12;
      } else {
        score += 5;
      }
    }

    return score;
  }

  /**
   * Score by behavior (website visits, downloads, etc.)
   */
  async scoreByBehavior(lead: Lead): Promise<number> {
    // Check for high-value activities
    const highValueActivities = await this.prisma.activity.count({
      where: {
        leadId: lead.id,
        type: { in: ['MEETING', 'DEMO', 'PROPOSAL'] }
      }
    });

    return Math.min(highValueActivities * 10, 30);
  }

  /**
   * Recalculate all lead scores
   */
  async recalculateAllScores(): Promise<void> {
    const leads = await this.prisma.lead.findMany({
      where: { status: { not: LeadStatus.CONVERTED } }
    });

    this.logger.log(`Recalculating scores for ${leads.length} leads...`);

    for (const lead of leads) {
      const newScore = await this.calculateScore(lead);
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { score: newScore }
      });
    }

    this.logger.log(`Score recalculation complete`);
  }

  // ========================================
  // ASSIGNMENT (5 methods)
  // ========================================

  /**
   * Assign lead to an agent
   */
  async assign(leadId: string, agentId: string, userId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);

    // Verify agent exists
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agent ${agentId} not found`);
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: agentId,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: 'ASSIGNMENT',
        leadId,
        description: `Lead assigned to ${agent.name}`,
        createdBy: userId
      }
    });

    this.logger.log(`Lead ${leadId} assigned to ${agentId}`);
    return updated;
  }

  /**
   * Auto-assign lead using round-robin or load balancing
   */
  async autoAssign(lead: Lead): Promise<Lead> {
    // Get all active sales agents
    const agents = await this.prisma.user.findMany({
      where: {
        role: 'SALES_AGENT',
        active: true
      },
      include: {
        _count: {
          select: { assignedLeads: true }
        }
      }
    });

    if (agents.length === 0) {
      throw new BadRequestException('No active sales agents available');
    }

    // Find agent with least leads (load balancing)
    const leastLoadedAgent = agents.reduce((prev, current) => {
      return (prev._count.assignedLeads < current._count.assignedLeads) ? prev : current;
    });

    return await this.assign(lead.id, leastLoadedAgent.id, 'system');
  }

  /**
   * Reassign lead from one agent to another
   */
  async reassign(leadId: string, fromAgentId: string, toAgentId: string, userId: string): Promise<Lead> {
    const lead = await this.findOne(leadId);

    if (lead.assignedToId !== fromAgentId) {
      throw new BadRequestException(`Lead is not assigned to ${fromAgentId}`);
    }

    const toAgent = await this.prisma.user.findUnique({ where: { id: toAgentId } });
    if (!toAgent) {
      throw new NotFoundException(`Agent ${toAgentId} not found`);
    }

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        assignedToId: toAgentId,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: 'REASSIGNMENT',
        leadId,
        description: `Lead reassigned to ${toAgent.name}`,
        createdBy: userId
      }
    });

    this.logger.log(`Lead ${leadId} reassigned from ${fromAgentId} to ${toAgentId}`);
    return updated;
  }

  /**
   * Get unassigned leads
   */
  async getUnassignedLeads(): Promise<Lead[]> {
    return await this.prisma.lead.findMany({
      where: {
        assignedToId: null,
        status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED] }
      },
      orderBy: { score: 'desc' }
    });
  }

  /**
   * Get leads by agent
   */
  async getLeadsByAgent(agentId: string): Promise<Lead[]> {
    return await this.prisma.lead.findMany({
      where: { assignedToId: agentId },
      orderBy: { score: 'desc' }
    });
  }

  // ========================================
  // CONVERSION (4 methods)
  // ========================================

  /**
   * Convert lead to customer
   */
  async convertToCustomer(leadId: string, dto: ConvertLeadDto, userId: string): Promise<any> {
    const lead = await this.findOne(leadId);

    // Check if can convert
    const canConvert = await this.canConvert(leadId);
    if (!canConvert) {
      throw new BadRequestException('Lead cannot be converted. Must be QUALIFIED status.');
    }

    // Create customer/party
    const customer = await this.prisma.party.create({
      data: {
        type: 'individual',
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        createdBy: userId
      }
    });

    // Create opportunity if requested
    let opportunity = null;
    if (dto.createOpportunity) {
      opportunity = await this.prisma.opportunity.create({
        data: {
          name: `${lead.firstName} ${lead.lastName} - Opportunity`,
          leadId: lead.id,
          customerId: customer.id,
          stage: 'QUALIFIED',
          value: dto.estimatedValue || 0,
          probability: 50,
          createdBy: userId
        }
      });
    }

    // Update lead
    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.CONVERTED,
        convertedToPartyId: customer.id,
        opportunityId: opportunity?.id,
        convertedAt: new Date(),
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: 'CONVERSION',
        leadId,
        description: `Lead converted to customer ${customer.id}`,
        createdBy: userId
      }
    });

    this.logger.log(`Lead ${leadId} converted to customer ${customer.id}`);
    return { lead, customer, opportunity };
  }

  /**
   * Check if lead can be converted
   */
  async canConvert(leadId: string): Promise<boolean> {
    const lead = await this.findOne(leadId);
    return lead.status === LeadStatus.QUALIFIED && !lead.convertedAt;
  }

  /**
   * Mark lead as qualified
   */
  async markAsQualified(leadId: string, userId: string): Promise<Lead> {
    return await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.QUALIFIED,
        updatedBy: userId
      }
    });
  }

  /**
   * Mark lead as unqualified
   */
  async markAsUnqualified(leadId: string, reason: string, userId: string): Promise<Lead> {
    const lead = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: LeadStatus.UNQUALIFIED,
        notes: `${reason}\n\n${lead.notes || ''}`,
        updatedBy: userId
      }
    });

    // Log activity
    await this.prisma.activity.create({
      data: {
        type: 'STATUS_CHANGE',
        leadId,
        description: `Lead marked as unqualified: ${reason}`,
        createdBy: userId
      }
    });

    return lead;
  }

  // ========================================
  // IMPORT/EXPORT (3 methods)
  // ========================================

  /**
   * Import leads from CSV/Excel file
   */
  async importLeads(file: Express.Multer.File, userId: string): Promise<ImportResult> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      try {
        await this.create({
          firstName: row.firstName || row.first_name,
          lastName: row.lastName || row.last_name,
          email: row.email,
          phone: row.phone,
          company: row.company,
          jobTitle: row.jobTitle || row.job_title,
          source: row.source || LeadSource.IMPORT,
          notes: row.notes
        }, userId);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    this.logger.log(`Import complete: ${result.successful} successful, ${result.failed} failed`);
    return result;
  }

  /**
   * Export leads to CSV/Excel
   */
  async exportLeads(filters: FilterLeadDto, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Buffer> {
    const { data } = await this.findAll({ ...filters, limit: 10000 });

    const exportData = data.map(lead => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      assignedTo: lead.assignedTo?.name,
      createdAt: lead.createdAt,
      convertedAt: lead.convertedAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    return XLSX.write(workbook, { type: 'buffer', bookType: format });
  }

  /**
   * Bulk update leads
   */
  async bulkUpdate(leadIds: string[], updates: Partial<Lead>, userId: string): Promise<BulkUpdateResult> {
    const result: BulkUpdateResult = {
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const leadId of leadIds) {
      try {
        await this.update(leadId, updates, userId);
        result.updated++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          leadId,
          error: error.message
        });
      }
    }

    this.logger.log(`Bulk update complete: ${result.updated} updated, ${result.failed} failed`);
    return result;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
