import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FilterLeadDto, FilterOpportunityDto } from '../dto/lead.dto';
import { PipelineStage, WinLossAnalysis, RevenueForest } from '../dto/opportunity.dto';
import { LeadStatus } from '../dto/lead.dto';

export interface LeadStatistics {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  conversionRate: number;
  averageScore: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ConversionFunnel {
  period: string;
  stages: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  dropOffRate: number;
}

export interface SourcePerformance {
  source: string;
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageScore: number;
}

export interface SalesStatistics {
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  winRate: number;
  averageDealSize: number;
  totalValue: number;
  totalWonValue: number;
  byStage: Record<PipelineStage, number>;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  period: string;
  leadsAssigned: number;
  leadsConverted: number;
  opportunitiesWon: number;
  opportunitiesLost: number;
  totalRevenue: number;
  winRate: number;
  averageDealSize: number;
  activitiesLogged: number;
}

export interface ActivityReport {
  agentId: string;
  period: string;
  totalActivities: number;
  calls: number;
  emails: number;
  meetings: number;
  demos: number;
  proposals: number;
  averageActivitiesPerDay: number;
}

export interface EmailEngagement {
  period: string;
  totalCampaigns: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageConversionRate: number;
  topPerformingCampaigns: Array<{
    campaignId: string;
    name: string;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
}

@Injectable()
export class CRMAnalyticsService {
  private readonly logger = new Logger(CRMAnalyticsService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ========================================
  // LEAD ANALYTICS
  // ========================================

  /**
   * Get comprehensive lead statistics
   */
  async getLeadStatistics(filters?: FilterLeadDto): Promise<LeadStatistics> {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.source) where.source = filters.source;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    const leads = await this.prisma.lead.findMany({ where });

    const total = leads.length;
    const newLeads = leads.filter(l => l.status === LeadStatus.NEW).length;
    const contacted = leads.filter(l => l.status === LeadStatus.CONTACTED).length;
    const qualified = leads.filter(l => l.status === LeadStatus.QUALIFIED).length;
    const converted = leads.filter(l => l.status === LeadStatus.CONVERTED).length;

    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    leads.forEach(lead => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
    });

    const averageScore = total > 0
      ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / total
      : 0;

    return {
      total,
      new: newLeads,
      contacted,
      qualified,
      converted,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      averageScore,
      bySource,
      byStatus
    };
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(period: 'day' | 'week' | 'month' = 'week'): Promise<ConversionFunnel> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: { gte: cutoffDate } }
    });

    const stages = [
      { name: 'New Leads', count: leads.length },
      { name: 'Contacted', count: leads.filter(l => [LeadStatus.CONTACTED, LeadStatus.QUALIFIED, LeadStatus.CONVERTED].includes(l.status)).length },
      { name: 'Qualified', count: leads.filter(l => [LeadStatus.QUALIFIED, LeadStatus.CONVERTED].includes(l.status)).length },
      { name: 'Converted', count: leads.filter(l => l.status === LeadStatus.CONVERTED).length }
    ];

    const total = stages[0].count;
    stages.forEach(stage => {
      stage['percentage'] = total > 0 ? (stage.count / total) * 100 : 0;
    });

    const dropOffRate = total > 0
      ? ((total - stages[stages.length - 1].count) / total) * 100
      : 0;

    return {
      period: `Last ${days} days`,
      stages,
      dropOffRate
    };
  }

  /**
   * Get lead source performance
   */
  async getLeadSourcePerformance(): Promise<SourcePerformance[]> {
    const leads = await this.prisma.lead.findMany();

    const sourceMap = new Map<string, any[]>();
    leads.forEach(lead => {
      if (!sourceMap.has(lead.source)) {
        sourceMap.set(lead.source, []);
      }
      sourceMap.get(lead.source).push(lead);
    });

    const performance: SourcePerformance[] = [];

    sourceMap.forEach((sourceLeads, source) => {
      const totalLeads = sourceLeads.length;
      const qualifiedLeads = sourceLeads.filter(l => [LeadStatus.QUALIFIED, LeadStatus.CONVERTED].includes(l.status)).length;
      const convertedLeads = sourceLeads.filter(l => l.status === LeadStatus.CONVERTED).length;
      const averageScore = sourceLeads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads;

      performance.push({
        source,
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        conversionRate: (convertedLeads / totalLeads) * 100,
        averageScore
      });
    });

    return performance.sort((a, b) => b.conversionRate - a.conversionRate);
  }

  // ========================================
  // SALES ANALYTICS
  // ========================================

  /**
   * Get sales statistics
   */
  async getSalesStatistics(filters?: FilterOpportunityDto): Promise<SalesStatistics> {
    const where: any = {};
    if (filters?.stage) where.stage = filters.stage;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    const opportunities = await this.prisma.opportunity.findMany({ where });

    const total = opportunities.length;
    const open = opportunities.filter(o => ![PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST].includes(o.stage)).length;
    const won = opportunities.filter(o => o.stage === PipelineStage.CLOSED_WON).length;
    const lost = opportunities.filter(o => o.stage === PipelineStage.CLOSED_LOST).length;

    const byStage: Record<PipelineStage, number> = {} as any;
    Object.values(PipelineStage).forEach(stage => {
      byStage[stage] = opportunities.filter(o => o.stage === stage).length;
    });

    const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);
    const totalWonValue = opportunities
      .filter(o => o.stage === PipelineStage.CLOSED_WON)
      .reduce((sum, o) => sum + (o.actualValue || o.value), 0);

    const averageDealSize = won > 0 ? totalWonValue / won : 0;
    const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;

    return {
      totalOpportunities: total,
      openOpportunities: open,
      wonOpportunities: won,
      lostOpportunities: lost,
      winRate,
      averageDealSize,
      totalValue,
      totalWonValue,
      byStage
    };
  }

  /**
   * Forecast revenue
   */
  async getRevenueForecast(months: number = 3): Promise<RevenueForest> {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        stage: {
          notIn: [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST]
        },
        expectedCloseDate: {
          lte: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);
    const weightedValue = opportunities.reduce(
      (sum, o) => sum + (o.value * o.probability / 100),
      0
    );

    return {
      period: `Next ${months} months`,
      predictedRevenue: totalValue,
      weightedRevenue: weightedValue,
      opportunities: opportunities.length
    };
  }

  /**
   * Get win/loss analysis
   */
  async getWinLossAnalysis(period: string = 'month'): Promise<WinLossAnalysis> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        closedAt: { gte: cutoffDate },
        stage: { in: [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST] }
      }
    });

    const won = opportunities.filter(o => o.stage === PipelineStage.CLOSED_WON);
    const lost = opportunities.filter(o => o.stage === PipelineStage.CLOSED_LOST);

    const averageWinValue = won.length > 0
      ? won.reduce((sum, o) => sum + (o.actualValue || o.value), 0) / won.length
      : 0;

    const winRate = opportunities.length > 0
      ? (won.length / opportunities.length) * 100
      : 0;

    // Get top loss reasons
    const lossReasons = new Map<string, number>();
    lost.forEach(o => {
      if (o.lostReason) {
        lossReasons.set(o.lostReason, (lossReasons.get(o.lostReason) || 0) + 1);
      }
    });

    const topLossReasons = Array.from(lossReasons.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      won: won.length,
      lost: lost.length,
      winRate,
      averageWinValue,
      topLossReasons
    };
  }

  /**
   * Get average deal size
   */
  async getAverageDealSize(filters?: FilterOpportunityDto): Promise<number> {
    const stats = await this.getSalesStatistics(filters);
    return stats.averageDealSize;
  }

  /**
   * Get average sales cycle
   */
  async getAverageSalesCycle(filters?: FilterOpportunityDto): Promise<number> {
    const where: any = {
      stage: PipelineStage.CLOSED_WON,
      closedAt: { not: null }
    };
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;

    const opportunities = await this.prisma.opportunity.findMany({ where });

    if (opportunities.length === 0) return 0;

    const totalDays = opportunities.reduce((sum, o) => {
      const created = o.createdAt.getTime();
      const closed = o.closedAt!.getTime();
      const days = (closed - created) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return Math.round(totalDays / opportunities.length);
  }

  // ========================================
  // AGENT PERFORMANCE
  // ========================================

  /**
   * Get agent performance
   */
  async getAgentPerformance(agentId: string, period: string = 'month'): Promise<AgentPerformance> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true }
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const leadsAssigned = await this.prisma.lead.count({
      where: {
        assignedToId: agentId,
        createdAt: { gte: cutoffDate }
      }
    });

    const leadsConverted = await this.prisma.lead.count({
      where: {
        assignedToId: agentId,
        status: LeadStatus.CONVERTED,
        convertedAt: { gte: cutoffDate }
      }
    });

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        assignedToId: agentId,
        closedAt: { gte: cutoffDate },
        stage: { in: [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST] }
      }
    });

    const won = opportunities.filter(o => o.stage === PipelineStage.CLOSED_WON);
    const lost = opportunities.filter(o => o.stage === PipelineStage.CLOSED_LOST);

    const totalRevenue = won.reduce((sum, o) => sum + (o.actualValue || o.value), 0);
    const averageDealSize = won.length > 0 ? totalRevenue / won.length : 0;
    const winRate = opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0;

    const activitiesLogged = await this.prisma.activity.count({
      where: {
        createdBy: agentId,
        createdAt: { gte: cutoffDate }
      }
    });

    return {
      agentId: agent.id,
      agentName: agent.name,
      period: `Last ${days} days`,
      leadsAssigned,
      leadsConverted,
      opportunitiesWon: won.length,
      opportunitiesLost: lost.length,
      totalRevenue,
      winRate,
      averageDealSize,
      activitiesLogged
    };
  }

  /**
   * Get top performers
   */
  async getTopPerformers(period: string = 'month', limit: number = 10): Promise<any[]> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const agents = await this.prisma.user.findMany({
      where: { role: 'SALES_AGENT', active: true }
    });

    const performances = await Promise.all(
      agents.map(agent => this.getAgentPerformance(agent.id, period))
    );

    return performances
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Get activity report for agent
   */
  async getActivityReport(agentId: string, period: string = 'month'): Promise<ActivityReport> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await this.prisma.activity.findMany({
      where: {
        createdBy: agentId,
        createdAt: { gte: cutoffDate }
      }
    });

    const calls = activities.filter(a => a.type === 'CALL').length;
    const emails = activities.filter(a => a.type === 'EMAIL').length;
    const meetings = activities.filter(a => a.type === 'MEETING').length;
    const demos = activities.filter(a => a.type === 'DEMO').length;
    const proposals = activities.filter(a => a.type === 'PROPOSAL').length;

    return {
      agentId,
      period: `Last ${days} days`,
      totalActivities: activities.length,
      calls,
      emails,
      meetings,
      demos,
      proposals,
      averageActivitiesPerDay: activities.length / days
    };
  }

  // ========================================
  // CAMPAIGN ANALYTICS
  // ========================================

  /**
   * Get campaign ROI
   */
  async getCampaignROI(campaignId: string): Promise<number> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get emails from campaign
    const emails = await this.prisma.campaignEmail.findMany({
      where: { campaignId }
    });

    // Get conversions (leads that converted after receiving email)
    const conversions = await this.prisma.lead.count({
      where: {
        email: { in: emails.map(e => e.email) },
        status: LeadStatus.CONVERTED,
        convertedAt: { gte: campaign.sentAt || new Date() }
      }
    });

    // Calculate revenue from conversions
    const revenue = conversions * 1000; // Assuming average value per conversion

    // Estimate cost (assuming €0.01 per email)
    const cost = emails.length * 0.01;

    // ROI = (Revenue - Cost) / Cost * 100
    return cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
  }

  /**
   * Get email engagement metrics
   */
  async getEmailEngagement(period: string = 'month'): Promise<EmailEngagement> {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        sentAt: { gte: cutoffDate },
        status: 'SENT'
      }
    });

    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalConverted = 0;

    const campaignStats = await Promise.all(
      campaigns.map(async campaign => {
        const emails = await this.prisma.campaignEmail.findMany({
          where: { campaignId: campaign.id }
        });

        const sent = emails.filter(e => e.status === 'SENT').length;
        const opened = emails.filter(e => e.openedAt).length;
        const clicked = emails.filter(e => e.clickedAt).length;

        const conversions = await this.prisma.lead.count({
          where: {
            email: { in: emails.map(e => e.email) },
            status: LeadStatus.CONVERTED,
            convertedAt: { gte: campaign.sentAt || new Date() }
          }
        });

        totalSent += sent;
        totalOpened += opened;
        totalClicked += clicked;
        totalConverted += conversions;

        return {
          campaignId: campaign.id,
          name: campaign.name,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
          conversionRate: sent > 0 ? (conversions / sent) * 100 : 0
        };
      })
    );

    const topPerforming = campaignStats
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);

    return {
      period: `Last ${days} days`,
      totalCampaigns: campaigns.length,
      totalEmailsSent: totalSent,
      averageOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      averageClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      averageConversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0,
      topPerformingCampaigns: topPerforming
    };
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
