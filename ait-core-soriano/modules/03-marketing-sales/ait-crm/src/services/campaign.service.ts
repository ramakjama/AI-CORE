import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  FilterCampaignDto,
  CampaignStatus,
  CreateSegmentDto,
  CampaignResult,
  CampaignStatistics,
  QueuedCampaign,
  Segment,
  Contact
} from '../dto/campaign.dto';
import { PaginatedResult } from '../dto/lead.dto';
import { Resend } from 'resend';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);
  private readonly prisma: PrismaClient;
  private readonly resend: Resend;

  constructor() {
    this.prisma = new PrismaClient();
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new campaign
   */
  async create(dto: CreateCampaignDto, userId: string): Promise<any> {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        templateId: dto.templateId,
        segmentIds: dto.segmentIds,
        scheduledDate: dto.scheduledDate,
        variables: dto.variables || {},
        status: dto.scheduledDate ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        createdBy: userId
      }
    });

    this.logger.log(`Campaign created: ${campaign.id}`);
    return campaign;
  }

  /**
   * Find all campaigns with filters
   */
  async findAll(filters: FilterCampaignDto): Promise<PaginatedResult<any>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.createdBy) where.createdBy = filters.createdBy;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
          createdBy: { select: { id: true, name: true } }
        }
      }),
      this.prisma.campaign.count({ where })
    ]);

    return {
      data: campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find one campaign by ID
   */
  async findOne(id: string): Promise<any> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
        createdBy: true
      }
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }

    return campaign;
  }

  /**
   * Update a campaign
   */
  async update(id: string, dto: UpdateCampaignDto, userId: string): Promise<any> {
    const campaign = await this.findOne(id);

    if ([CampaignStatus.SENDING, CampaignStatus.SENT].includes(campaign.status)) {
      throw new BadRequestException('Cannot update a campaign that is sending or has been sent');
    }

    return await this.prisma.campaign.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    const campaign = await this.findOne(id);

    if (campaign.status === CampaignStatus.SENDING) {
      throw new BadRequestException('Cannot delete a campaign that is currently sending');
    }

    await this.prisma.campaign.delete({
      where: { id }
    });

    this.logger.log(`Campaign deleted: ${id}`);
  }

  // ========================================
  // EXECUTION (8 methods)
  // ========================================

  /**
   * Schedule a campaign
   */
  async schedule(campaignId: string, scheduledDate: Date): Promise<any> {
    const campaign = await this.findOne(campaignId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be scheduled');
    }

    if (scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        scheduledDate,
        status: CampaignStatus.SCHEDULED
      }
    });
  }

  /**
   * Send a campaign immediately
   */
  async send(campaignId: string): Promise<CampaignResult> {
    const campaign = await this.findOne(campaignId);
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: campaign.templateId }
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    // Get recipients
    const recipients = await this.getRecipients(campaignId);

    if (recipients.length === 0) {
      throw new BadRequestException('No recipients found for this campaign');
    }

    // Update status
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENDING,
        sentAt: new Date()
      }
    });

    const result: CampaignResult = {
      campaignId,
      totalRecipients: recipients.length,
      sent: 0,
      failed: 0,
      startedAt: new Date()
    };

    // Send emails
    for (const recipient of recipients) {
      try {
        const variables = {
          ...campaign.variables,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          email: recipient.email
        };

        const htmlContent = this.replaceVariables(template.htmlContent, variables);
        const subject = this.replaceVariables(template.subject, variables);

        await this.resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@sorianomediadores.com',
          to: recipient.email,
          subject,
          html: htmlContent
        });

        // Track email sent
        await this.prisma.campaignEmail.create({
          data: {
            campaignId,
            recipientId: recipient.id,
            email: recipient.email,
            status: 'SENT',
            sentAt: new Date()
          }
        });

        result.sent++;
      } catch (error) {
        this.logger.error(`Failed to send email to ${recipient.email}: ${error.message}`);

        await this.prisma.campaignEmail.create({
          data: {
            campaignId,
            recipientId: recipient.id,
            email: recipient.email,
            status: 'FAILED',
            error: error.message
          }
        });

        result.failed++;
      }
    }

    // Update campaign status
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENT,
        totalSent: result.sent,
        totalFailed: result.failed
      }
    });

    result.completedAt = new Date();

    this.logger.log(`Campaign ${campaignId} sent: ${result.sent} successful, ${result.failed} failed`);
    return result;
  }

  /**
   * Send test emails
   */
  async sendTest(campaignId: string, emails: string[]): Promise<void> {
    const campaign = await this.findOne(campaignId);
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: campaign.templateId }
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    for (const email of emails) {
      const variables = {
        ...campaign.variables,
        firstName: 'Test',
        lastName: 'User',
        email
      };

      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      const subject = `[TEST] ${this.replaceVariables(template.subject, variables)}`;

      await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@sorianomediadores.com',
        to: email,
        subject,
        html: htmlContent
      });
    }

    this.logger.log(`Test emails sent for campaign ${campaignId} to ${emails.join(', ')}`);
  }

  /**
   * Pause a campaign
   */
  async pause(campaignId: string): Promise<any> {
    const campaign = await this.findOne(campaignId);

    if (campaign.status !== CampaignStatus.SENDING) {
      throw new BadRequestException('Only sending campaigns can be paused');
    }

    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.PAUSED }
    });
  }

  /**
   * Resume a paused campaign
   */
  async resume(campaignId: string): Promise<any> {
    const campaign = await this.findOne(campaignId);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('Only paused campaigns can be resumed');
    }

    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.SENDING }
    });
  }

  /**
   * Cancel a campaign
   */
  async cancel(campaignId: string): Promise<any> {
    const campaign = await this.findOne(campaignId);

    if ([CampaignStatus.SENT, CampaignStatus.CANCELLED].includes(campaign.status)) {
      throw new BadRequestException('Cannot cancel a sent or already cancelled campaign');
    }

    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.CANCELLED }
    });
  }

  /**
   * Duplicate a campaign
   */
  async duplicate(campaignId: string, userId: string): Promise<any> {
    const campaign = await this.findOne(campaignId);

    const duplicated = await this.prisma.campaign.create({
      data: {
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        templateId: campaign.templateId,
        segmentIds: campaign.segmentIds,
        variables: campaign.variables,
        status: CampaignStatus.DRAFT,
        createdBy: userId
      }
    });

    this.logger.log(`Campaign ${campaignId} duplicated to ${duplicated.id}`);
    return duplicated;
  }

  /**
   * Get sending queue
   */
  async getSendingQueue(): Promise<QueuedCampaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.SCHEDULED,
        scheduledDate: { lte: new Date(Date.now() + 24 * 60 * 60 * 1000) } // Next 24 hours
      },
      orderBy: { scheduledDate: 'asc' }
    });

    return Promise.all(
      campaigns.map(async (campaign) => {
        const recipients = await this.getRecipients(campaign.id);
        return {
          campaignId: campaign.id,
          name: campaign.name,
          scheduledDate: campaign.scheduledDate,
          recipientCount: recipients.length
        };
      })
    );
  }

  // ========================================
  // ANALYTICS (6 methods)
  // ========================================

  /**
   * Get campaign statistics
   */
  async getStatistics(campaignId: string): Promise<CampaignStatistics> {
    const campaign = await this.findOne(campaignId);

    const emails = await this.prisma.campaignEmail.findMany({
      where: { campaignId }
    });

    const totalSent = emails.filter(e => e.status === 'SENT').length;
    const delivered = emails.filter(e => e.deliveredAt).length;
    const opened = emails.filter(e => e.openedAt).length;
    const clicked = emails.filter(e => e.clickedAt).length;
    const bounced = emails.filter(e => e.status === 'BOUNCED').length;
    const unsubscribed = emails.filter(e => e.unsubscribedAt).length;

    // Count conversions (leads that converted after receiving email)
    const conversions = await this.prisma.lead.count({
      where: {
        email: { in: emails.map(e => e.email) },
        status: 'CONVERTED',
        convertedAt: { gte: campaign.sentAt || new Date() }
      }
    });

    return {
      campaignId,
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      conversions,
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: totalSent > 0 ? (conversions / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (bounced / totalSent) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0
    };
  }

  /**
   * Get open rate
   */
  async getOpenRate(campaignId: string): Promise<number> {
    const stats = await this.getStatistics(campaignId);
    return stats.openRate;
  }

  /**
   * Get click rate
   */
  async getClickRate(campaignId: string): Promise<number> {
    const stats = await this.getStatistics(campaignId);
    return stats.clickRate;
  }

  /**
   * Get conversion rate
   */
  async getConversionRate(campaignId: string): Promise<number> {
    const stats = await this.getStatistics(campaignId);
    return stats.conversionRate;
  }

  /**
   * Get unsubscribe rate
   */
  async getUnsubscribeRate(campaignId: string): Promise<number> {
    const stats = await this.getStatistics(campaignId);
    return stats.unsubscribeRate;
  }

  /**
   * Get bounce rate
   */
  async getBounceRate(campaignId: string): Promise<number> {
    const stats = await this.getStatistics(campaignId);
    return stats.bounceRate;
  }

  // ========================================
  // SEGMENTATION (4 methods)
  // ========================================

  /**
   * Create a segment
   */
  async createSegment(dto: CreateSegmentDto, userId: string): Promise<Segment> {
    const segment = await this.prisma.segment.create({
      data: {
        name: dto.name,
        description: dto.description,
        criteria: dto.criteria || {},
        contactIds: dto.contactIds || [],
        createdBy: userId
      }
    });

    this.logger.log(`Segment created: ${segment.id}`);
    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      contactCount: dto.contactIds?.length || 0,
      createdAt: segment.createdAt
    };
  }

  /**
   * Get recipients for a campaign
   */
  async getRecipients(campaignId: string): Promise<Contact[]> {
    const campaign = await this.findOne(campaignId);
    const contactIds: string[] = [];

    // Get contacts from segments
    for (const segmentId of campaign.segmentIds || []) {
      const segment = await this.prisma.segment.findUnique({
        where: { id: segmentId }
      });

      if (segment) {
        // Apply criteria to find matching leads
        const leads = await this.prisma.lead.findMany({
          where: segment.criteria || {}
        });

        contactIds.push(...leads.map(l => l.id));
      }
    }

    // Remove duplicates
    const uniqueIds = [...new Set(contactIds)];

    // Get lead details
    const leads = await this.prisma.lead.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        customFields: true
      }
    });

    return leads;
  }

  /**
   * Add recipients to campaign
   */
  async addRecipients(campaignId: string, contactIds: string[]): Promise<any> {
    const campaign = await this.findOne(campaignId);

    // Create a new segment for these contacts
    const segment = await this.createSegment({
      name: `${campaign.name} - Additional Recipients`,
      description: 'Manually added recipients',
      contactIds
    }, campaign.createdBy);

    // Add segment to campaign
    return await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        segmentIds: [...(campaign.segmentIds || []), segment.id]
      }
    });
  }

  /**
   * Remove recipients from campaign
   */
  async removeRecipients(campaignId: string, contactIds: string[]): Promise<any> {
    // Create exclusion list
    await this.prisma.campaignExclusion.createMany({
      data: contactIds.map(contactId => ({
        campaignId,
        contactId
      })),
      skipDuplicates: true
    });

    this.logger.log(`${contactIds.length} recipients excluded from campaign ${campaignId}`);
    return await this.findOne(campaignId);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Replace variables in template
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });
    return result;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
