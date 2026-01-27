/**
 * Analytics Service
 * Provides advanced analytics, predictions, and insights for sales and leads
 */

import {
  Lead,
  LeadSource,
  LeadStatus,
  Opportunity,
  OpportunityStage,
  FunnelMetrics,
  FunnelStageMetrics,
  SalesVelocity,
  WinLossAnalysis,
  SalesRepPerformance,
  LeadSourceAnalysis,
  NextBestAction,
  ActivityType
} from '../types';
import { LeadService } from './lead.service';
import { OpportunityService } from './opportunity.service';
import { ActivityService } from './activity.service';

/**
 * Period definition
 */
export interface Period {
  start: Date;
  end: Date;
}

/**
 * Stage order for funnel
 */
const STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.PROSPECTING,
  OpportunityStage.QUALIFICATION,
  OpportunityStage.NEEDS_ANALYSIS,
  OpportunityStage.VALUE_PROPOSITION,
  OpportunityStage.DECISION_MAKERS,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION,
  OpportunityStage.CLOSED_WON,
  OpportunityStage.CLOSED_LOST
];

export class AnalyticsService {
  constructor(
    private leadService: LeadService,
    private opportunityService: OpportunityService,
    private activityService: ActivityService
  ) {}

  /**
   * Get conversion funnel metrics
   */
  async getConversionFunnel(period: Period): Promise<FunnelMetrics> {
    const allLeads = await this.leadService.getAllLeads();
    const allOpportunities = await this.opportunityService.getAllOpportunities();

    // Filter by period
    const leads = allLeads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= period.start && createdAt <= period.end;
    });

    const opportunities = allOpportunities.filter((opp) => {
      const createdAt = new Date(opp.createdAt);
      return createdAt >= period.start && createdAt <= period.end;
    });

    // Calculate stage metrics
    const stages: FunnelStageMetrics[] = STAGE_ORDER.map((stage) => {
      const stageOpps = opportunities.filter((opp) => opp.stage === stage);

      return {
        stageId: stage,
        stageName: this.formatStageName(stage),
        entered: stageOpps.length,
        exited: stageOpps.filter((o) => o.lastStageChangeDate).length,
        currentCount: stageOpps.length,
        enteredValue: stageOpps.reduce((sum, o) => sum + o.amount, 0),
        exitedValue: 0, // Would need historical tracking
        currentValue: stageOpps.reduce((sum, o) => sum + o.amount, 0),
        conversionRate: 0, // Calculated below
        conversionToNext: 0,
        averageTimeInStage: 0, // Would need historical tracking
        wonFromStage: stageOpps.filter((o) => o.isWon).length,
        lostFromStage: stageOpps.filter((o) => o.isClosed && !o.isWon).length
      };
    });

    // Calculate conversion rates
    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      if (current && next && current.entered > 0) {
        current.conversionToNext = (next.entered / current.entered) * 100;
        current.conversionRate = current.conversionToNext;
      }
    }

    // Calculate overall metrics
    const closedWon = opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_WON);
    const closedLost = opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_LOST);
    const closedWonValue = closedWon.reduce((sum, o) => sum + o.amount, 0);
    const closedLostValue = closedLost.reduce((sum, o) => sum + o.amount, 0);

    // Lead to opportunity conversion
    const convertedLeads = leads.filter((l) => l.status === LeadStatus.CONVERTED);
    const leadToOpportunityRate = leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0;

    // Opportunity to win rate
    const closedOpps = opportunities.filter((o) => o.isClosed);
    const opportunityToWinRate =
      closedOpps.length > 0 ? (closedWon.length / closedOpps.length) * 100 : 0;

    // Overall conversion
    const overallConversionRate =
      leads.length > 0 ? (closedWon.length / leads.length) * 100 : 0;

    // Calculate average time in pipeline
    const wonOppsWithTiming = closedWon.filter((o) => o.createdDate && o.lastStageChangeDate);
    const totalDays = wonOppsWithTiming.reduce((sum, o) => {
      const days = Math.ceil(
        (new Date(o.lastStageChangeDate!).getTime() - new Date(o.createdDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    const averageTimeInPipeline =
      wonOppsWithTiming.length > 0 ? totalDays / wonOppsWithTiming.length : 0;

    // Loss reasons
    const lossReasons = this.aggregateLossReasons(closedLost);

    // Leakage by stage
    const leakageByStage: Record<string, number> = {};
    stages.forEach((stage) => {
      leakageByStage[stage.stageId] = stage.lostFromStage;
    });

    return {
      period,
      stages,
      overallConversionRate: Math.round(overallConversionRate * 100) / 100,
      leadToOpportunityRate: Math.round(leadToOpportunityRate * 100) / 100,
      opportunityToWinRate: Math.round(opportunityToWinRate * 100) / 100,
      averageTimeInPipeline: Math.round(averageTimeInPipeline),
      averageTimePerStage: {}, // Would need stage history tracking
      totalPipelineValue: opportunities.filter((o) => !o.isClosed).reduce((sum, o) => sum + o.amount, 0),
      weightedPipelineValue: opportunities
        .filter((o) => !o.isClosed)
        .reduce((sum, o) => sum + o.amount * (o.probability / 100), 0),
      closedWonValue,
      closedLostValue,
      newLeads: leads.length,
      newOpportunities: opportunities.length,
      closedWon: closedWon.length,
      closedLost: closedLost.length,
      leakageByStage,
      topLossReasons: lossReasons
    };
  }

  /**
   * Get lead source analysis
   */
  async getLeadSourceAnalysis(period: Period): Promise<LeadSourceAnalysis> {
    const allLeads = await this.leadService.getAllLeads();

    // Filter by period
    const leads = allLeads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= period.start && createdAt <= period.end;
    });

    const totalLeads = leads.length;

    // Group by source
    const sourceGroups = new Map<LeadSource, Lead[]>();
    for (const lead of leads) {
      const existing = sourceGroups.get(lead.source) || [];
      existing.push(lead);
      sourceGroups.set(lead.source, existing);
    }

    const sources = Array.from(sourceGroups.entries()).map(([source, sourceLeads]) => {
      const qualified = sourceLeads.filter(
        (l) => l.status === LeadStatus.QUALIFIED || l.status === LeadStatus.CONVERTED
      ).length;
      const converted = sourceLeads.filter((l) => l.status === LeadStatus.CONVERTED).length;
      const avgScore =
        sourceLeads.reduce((sum, l) => sum + (l.score?.overall || 0), 0) / sourceLeads.length || 0;

      // Revenue calculation (simplified)
      const avgDealSize = 35000;
      const revenue = converted * avgDealSize;

      // Time to convert (simplified)
      const convertedLeads = sourceLeads.filter((l) => l.convertedDate);
      const totalConversionDays = convertedLeads.reduce((sum, l) => {
        const days = Math.ceil(
          (new Date(l.convertedDate!).getTime() - new Date(l.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      const avgTimeToConvert =
        convertedLeads.length > 0 ? totalConversionDays / convertedLeads.length : 0;

      return {
        source,
        leads: sourceLeads.length,
        leadsPercentage: totalLeads > 0 ? (sourceLeads.length / totalLeads) * 100 : 0,
        qualified,
        qualificationRate: sourceLeads.length > 0 ? (qualified / sourceLeads.length) * 100 : 0,
        averageScore: Math.round(avgScore),
        converted,
        conversionRate: sourceLeads.length > 0 ? (converted / sourceLeads.length) * 100 : 0,
        revenue,
        averageDealSize: converted > 0 ? revenue / converted : 0,
        averageTimeToConvert: Math.round(avgTimeToConvert)
      };
    });

    // Sort by leads count
    sources.sort((a, b) => b.leads - a.leads);

    // Determine best performers
    const bestByVolume = sources[0]?.source || LeadSource.OTHER;
    const bestByConversion = [...sources].sort((a, b) => b.conversionRate - a.conversionRate)[0]
      ?.source || LeadSource.OTHER;
    const bestByRevenue = [...sources].sort((a, b) => b.revenue - a.revenue)[0]?.source ||
      LeadSource.OTHER;

    return {
      period,
      sources,
      bestByVolume,
      bestByConversion,
      bestByRevenue
    };
  }

  /**
   * Get sales velocity metrics
   */
  async getSalesVelocity(period?: Period): Promise<SalesVelocity> {
    const allOpportunities = await this.opportunityService.getAllOpportunities();

    // Filter by period if provided
    let opportunities = allOpportunities;
    if (period) {
      opportunities = allOpportunities.filter((opp) => {
        const createdAt = new Date(opp.createdAt);
        return createdAt >= period.start && createdAt <= period.end;
      });
    }

    const closedWon = opportunities.filter((o) => o.stage === OpportunityStage.CLOSED_WON);
    const closed = opportunities.filter((o) => o.isClosed);

    // Calculate metrics
    const numberOfOpportunities = opportunities.filter((o) => !o.isClosed).length;
    const averageDealValue =
      closedWon.length > 0
        ? closedWon.reduce((sum, o) => sum + o.amount, 0) / closedWon.length
        : 0;
    const winRate = closed.length > 0 ? (closedWon.length / closed.length) * 100 : 0;

    // Calculate average sales cycle
    const cycleData = closedWon.filter((o) => o.createdDate && o.lastStageChangeDate);
    const totalCycleDays = cycleData.reduce((sum, o) => {
      const days = Math.ceil(
        (new Date(o.lastStageChangeDate!).getTime() - new Date(o.createdDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    const salesCycleLength = cycleData.length > 0 ? totalCycleDays / cycleData.length : 30;

    // Calculate velocity
    // Velocity = (Opportunities * Avg Deal Value * Win Rate) / Sales Cycle
    const velocity =
      salesCycleLength > 0
        ? (numberOfOpportunities * averageDealValue * (winRate / 100)) / salesCycleLength
        : 0;

    const calculatedPeriod = period || {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      end: new Date()
    };

    return {
      period: calculatedPeriod,
      numberOfOpportunities,
      averageDealValue: Math.round(averageDealValue),
      winRate: Math.round(winRate * 100) / 100,
      salesCycleLength: Math.round(salesCycleLength),
      velocity: Math.round(velocity),
      velocityPerDay: Math.round(velocity / 30), // Monthly velocity / 30
      velocityTrend: 0 // Would need historical data to calculate trend
    };
  }

  /**
   * Get win/loss analysis
   */
  async getWinLossAnalysis(period: Period): Promise<WinLossAnalysis> {
    const allOpportunities = await this.opportunityService.getAllOpportunities();

    // Filter closed opportunities in period
    const closedOpportunities = allOpportunities.filter((opp) => {
      if (!opp.isClosed || !opp.lastStageChangeDate) return false;
      const closeDate = new Date(opp.lastStageChangeDate);
      return closeDate >= period.start && closeDate <= period.end;
    });

    const won = closedOpportunities.filter((o) => o.isWon);
    const lost = closedOpportunities.filter((o) => !o.isWon);

    const wonValue = won.reduce((sum, o) => sum + o.amount, 0);
    const lostValue = lost.reduce((sum, o) => sum + o.amount, 0);

    // Loss reasons
    const lossReasons = this.aggregateLossReasons(lost);

    // Competitor analysis
    const competitorData = new Map<
      string,
      { encounters: number; wins: number; losses: number }
    >();

    for (const opp of closedOpportunities) {
      if (opp.competitor) {
        const existing = competitorData.get(opp.competitor) || {
          encounters: 0,
          wins: 0,
          losses: 0
        };
        existing.encounters++;
        if (opp.isWon) {
          existing.wins++;
        } else {
          existing.losses++;
        }
        competitorData.set(opp.competitor, existing);
      }
    }

    const competitorAnalysis = Array.from(competitorData.entries()).map(([competitor, data]) => ({
      competitor,
      encounters: data.encounters,
      wins: data.wins,
      losses: data.losses,
      winRate: data.encounters > 0 ? (data.wins / data.encounters) * 100 : 0
    }));

    return {
      period,
      totalClosed: closedOpportunities.length,
      won: won.length,
      lost: lost.length,
      winRate: closedOpportunities.length > 0 ? (won.length / closedOpportunities.length) * 100 : 0,
      wonValue,
      lostValue,
      averageWonValue: won.length > 0 ? wonValue / won.length : 0,
      averageLostValue: lost.length > 0 ? lostValue / lost.length : 0,
      lossReasons,
      competitorAnalysis
    };
  }

  /**
   * Get sales rep performance
   */
  async getSalesRepPerformance(period: Period): Promise<SalesRepPerformance[]> {
    const allOpportunities = await this.opportunityService.getAllOpportunities();
    const allActivities = await this.activityService.getAllActivities();

    // Group by owner
    const ownerGroups = new Map<string, Opportunity[]>();
    for (const opp of allOpportunities) {
      const existing = ownerGroups.get(opp.ownerId) || [];
      existing.push(opp);
      ownerGroups.set(opp.ownerId, existing);
    }

    const performances: SalesRepPerformance[] = [];

    for (const [userId, userOpps] of ownerGroups) {
      // Filter by period for closed
      const closedInPeriod = userOpps.filter((o) => {
        if (!o.isClosed || !o.lastStageChangeDate) return false;
        const closeDate = new Date(o.lastStageChangeDate);
        return closeDate >= period.start && closeDate <= period.end;
      });

      const won = closedInPeriod.filter((o) => o.isWon);
      const closed = closedInPeriod.reduce((sum, o) => (o.isWon ? sum + o.amount : sum), 0);

      // Activities
      const userActivities = allActivities.filter((a) => {
        const createdAt = new Date(a.createdAt);
        return a.ownerId === userId && createdAt >= period.start && createdAt <= period.end;
      });

      const calls = userActivities.filter((a) => a.type === ActivityType.CALL).length;
      const emails = userActivities.filter((a) => a.type === ActivityType.EMAIL).length;
      const meetings = userActivities.filter(
        (a) => a.type === ActivityType.MEETING || a.type === ActivityType.EVENT
      ).length;

      // Calculate sales cycle for won deals
      const cycleData = won.filter((o) => o.createdDate && o.lastStageChangeDate);
      const totalCycle = cycleData.reduce((sum, o) => {
        return (
          sum +
          Math.ceil(
            (new Date(o.lastStageChangeDate!).getTime() - new Date(o.createdDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
      }, 0);

      const quota = 100000; // Default quota

      performances.push({
        userId,
        userName: userOpps[0]?.ownerName || 'Unknown',
        period,
        quota,
        closed,
        quotaAttainment: (closed / quota) * 100,
        pipelineValue: userOpps.filter((o) => !o.isClosed).reduce((sum, o) => sum + o.amount, 0),
        pipelineCount: userOpps.filter((o) => !o.isClosed).length,
        activitiesCompleted: userActivities.filter((a) => a.status === 'completed').length,
        callsMade: calls,
        emailsSent: emails,
        meetingsHeld: meetings,
        winRate: closedInPeriod.length > 0 ? (won.length / closedInPeriod.length) * 100 : 0,
        averageDealSize: won.length > 0 ? closed / won.length : 0,
        averageSalesCycle: cycleData.length > 0 ? totalCycle / cycleData.length : 0,
        conversionRate: 0 // Would need lead data
      });
    }

    // Sort by closed amount
    performances.sort((a, b) => b.closed - a.closed);

    // Add rankings
    performances.forEach((p, index) => {
      p.rank = index + 1;
      p.percentile = ((performances.length - index) / performances.length) * 100;
    });

    return performances;
  }

  /**
   * Predict conversion probability for a lead
   */
  async predictConversion(leadId: string): Promise<{
    probability: number;
    confidence: number;
    factors: Array<{ factor: string; impact: number; direction: 'positive' | 'negative' }>;
    recommendedActions: string[];
  }> {
    const lead = await this.leadService.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const factors: Array<{
      factor: string;
      impact: number;
      direction: 'positive' | 'negative';
    }> = [];

    let baseProbability = 0.25; // Base 25% probability

    // Score impact
    if (lead.score) {
      if (lead.score.overall >= 70) {
        factors.push({ factor: 'High lead score', impact: 0.2, direction: 'positive' });
        baseProbability += 0.2;
      } else if (lead.score.overall >= 50) {
        factors.push({ factor: 'Medium lead score', impact: 0.1, direction: 'positive' });
        baseProbability += 0.1;
      } else {
        factors.push({ factor: 'Low lead score', impact: 0.1, direction: 'negative' });
        baseProbability -= 0.1;
      }
    }

    // Qualification impact
    if (lead.qualification?.overallQualified) {
      factors.push({ factor: 'BANT qualified', impact: 0.25, direction: 'positive' });
      baseProbability += 0.25;
    }

    // Activity recency
    if (lead.lastActivityDate) {
      const daysSince = Math.ceil(
        (Date.now() - new Date(lead.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince <= 7) {
        factors.push({ factor: 'Recent engagement', impact: 0.1, direction: 'positive' });
        baseProbability += 0.1;
      } else if (daysSince > 30) {
        factors.push({ factor: 'Stale lead', impact: 0.15, direction: 'negative' });
        baseProbability -= 0.15;
      }
    } else {
      factors.push({ factor: 'No activity recorded', impact: 0.1, direction: 'negative' });
      baseProbability -= 0.1;
    }

    // Source quality
    const highValueSources = [
      LeadSource.REFERRAL,
      LeadSource.PARTNER,
      LeadSource.INBOUND_CALL
    ];
    if (highValueSources.includes(lead.source)) {
      factors.push({ factor: 'High-value source', impact: 0.1, direction: 'positive' });
      baseProbability += 0.1;
    }

    // Generate recommendations
    const recommendedActions: string[] = [];

    if (!lead.qualification?.overallQualified) {
      recommendedActions.push('Complete BANT qualification');
    }

    if (!lead.lastActivityDate || lead.numberOfActivities < 3) {
      recommendedActions.push('Increase engagement with follow-up activities');
    }

    if (lead.rating === 'cold') {
      recommendedActions.push('Nurture with targeted content');
    }

    if (lead.qualification && !lead.qualification.authority.qualified) {
      recommendedActions.push('Identify and engage decision maker');
    }

    // Clamp probability
    baseProbability = Math.max(0.05, Math.min(0.95, baseProbability));

    return {
      probability: Math.round(baseProbability * 100) / 100,
      confidence: 0.72, // Model confidence
      factors,
      recommendedActions
    };
  }

  /**
   * Get next best action for a lead
   */
  async getNextBestAction(leadId: string): Promise<NextBestAction> {
    const lead = await this.leadService.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const activities = await this.activityService.getActivitiesByLead(leadId);

    // Analyze current state
    const daysSinceLastActivity = lead.lastActivityDate
      ? Math.ceil(
          (Date.now() - new Date(lead.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

    const hasCallActivity = activities.some((a) => a.type === ActivityType.CALL);
    const hasMeetingActivity = activities.some(
      (a) => a.type === ActivityType.MEETING || a.type === ActivityType.EVENT
    );
    const _hasEmailActivity = activities.some((a) => a.type === ActivityType.EMAIL);

    // Determine next action
    let action: string;
    let actionType: ActivityType;
    let priority: 'low' | 'medium' | 'high' | 'critical';
    let urgency: 'immediate' | 'today' | 'this_week' | 'this_month';
    let reason: string;
    const factors: string[] = [];
    let conversionLift = 0;

    // Decision logic
    if (lead.status === LeadStatus.NEW) {
      action = 'Make initial contact call';
      actionType = ActivityType.CALL;
      priority = 'high';
      urgency = 'today';
      reason = 'New lead requires prompt follow-up';
      factors.push('Lead is new and uncontacted');
      conversionLift = 0.15;
    } else if (!lead.qualification?.overallQualified && lead.numberOfActivities >= 2) {
      action = 'Conduct BANT qualification call';
      actionType = ActivityType.CALL;
      priority = 'high';
      urgency = 'this_week';
      reason = 'Lead has engagement but needs qualification';
      factors.push('Multiple activities without qualification');
      conversionLift = 0.2;
    } else if (daysSinceLastActivity > 14) {
      action = 'Re-engage with personalized email';
      actionType = ActivityType.EMAIL;
      priority = daysSinceLastActivity > 30 ? 'critical' : 'high';
      urgency = daysSinceLastActivity > 30 ? 'immediate' : 'today';
      reason = 'Lead engagement has gone cold';
      factors.push(`${daysSinceLastActivity} days since last activity`);
      conversionLift = 0.1;
    } else if (!hasMeetingActivity && lead.qualification?.overallQualified) {
      action = 'Schedule discovery meeting';
      actionType = ActivityType.MEETING;
      priority = 'high';
      urgency = 'this_week';
      reason = 'Qualified lead ready for deeper engagement';
      factors.push('Lead is qualified but no meeting scheduled');
      conversionLift = 0.25;
    } else if (lead.score && lead.score.overall >= 70 && !hasMeetingActivity) {
      action = 'Request meeting to discuss needs';
      actionType = ActivityType.MEETING;
      priority = 'high';
      urgency = 'this_week';
      reason = 'High-scoring lead should be prioritized';
      factors.push('Lead score above 70');
      conversionLift = 0.2;
    } else if (!hasCallActivity) {
      action = 'Make introductory call';
      actionType = ActivityType.CALL;
      priority = 'medium';
      urgency = 'this_week';
      reason = 'No phone contact established yet';
      factors.push('No call activity recorded');
      conversionLift = 0.12;
    } else {
      action = 'Send follow-up email with value content';
      actionType = ActivityType.EMAIL;
      priority = 'medium';
      urgency = 'this_week';
      reason = 'Maintain engagement momentum';
      factors.push('Regular follow-up needed');
      conversionLift = 0.08;
    }

    // Calculate expected impact
    const baseRevenue = lead.score?.expectedValue || 25000;
    const revenueImpact = baseRevenue * conversionLift;
    const _currentProbability = lead.score?.conversionProbability || 0.25;
    const timeToClose = lead.score?.timeToConvert || 30;

    return {
      leadId,
      action,
      actionType,
      priority,
      reason,
      factors,
      expectedImpact: {
        conversionLift: Math.round(conversionLift * 100) / 100,
        revenueImpact: Math.round(revenueImpact),
        timeToClose: Math.round(timeToClose * 0.9) // 10% reduction with action
      },
      confidence: 0.75,
      suggestedDate: this.getSuggestedDate(urgency),
      urgency,
      suggestedContent: this.getSuggestedContent(actionType, lead)
    };
  }

  /**
   * Aggregate loss reasons from lost opportunities
   */
  private aggregateLossReasons(
    lostOpportunities: Opportunity[]
  ): Array<{ reason: string; count: number; value: number; percentage: number }> {
    const reasonMap = new Map<string, { count: number; value: number }>();

    for (const opp of lostOpportunities) {
      const reason = opp.lossReason || 'Unknown';
      const existing = reasonMap.get(reason) || { count: 0, value: 0 };
      existing.count++;
      existing.value += opp.amount;
      reasonMap.set(reason, existing);
    }

    const total = lostOpportunities.length;

    return Array.from(reasonMap.entries())
      .map(([reason, data]) => ({
        reason,
        count: data.count,
        value: data.value,
        percentage: total > 0 ? (data.count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Format stage name for display
   */
  private formatStageName(stage: OpportunityStage): string {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get suggested date based on urgency
   */
  private getSuggestedDate(urgency: string): Date {
    const now = new Date();

    switch (urgency) {
      case 'immediate':
        return now;
      case 'today':
        return now;
      case 'this_week':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case 'this_month':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get suggested content for action
   */
  private getSuggestedContent(
    actionType: ActivityType,
    lead: Lead
  ): { type: string; template?: string; talking_points?: string[] } {
    const firstName = lead.firstName || 'there';

    switch (actionType) {
      case ActivityType.CALL:
        return {
          type: 'call_script',
          talking_points: [
            `Greet ${firstName} and introduce yourself`,
            'Acknowledge how they found us',
            'Ask about their current challenges',
            'Qualify budget and timeline',
            'Schedule follow-up if interested'
          ]
        };
      case ActivityType.EMAIL:
        return {
          type: 'email_template',
          template: `Hi ${firstName},\n\nI wanted to follow up on our previous conversation and share some insights that might be valuable for ${lead.company || 'your team'}.\n\n[Insert value proposition]\n\nWould you be available for a brief call this week?\n\nBest regards`
        };
      case ActivityType.MEETING:
        return {
          type: 'meeting_agenda',
          talking_points: [
            'Review their current situation and pain points',
            'Present relevant case studies',
            'Demonstrate product capabilities',
            'Discuss implementation timeline',
            'Outline next steps'
          ]
        };
      default:
        return {
          type: 'general',
          talking_points: ['Follow up on previous interactions', 'Provide relevant value']
        };
    }
  }
}

// Factory function to create analytics service with dependencies
export function createAnalyticsService(
  leadService: LeadService,
  opportunityService: OpportunityService,
  activityService: ActivityService
): AnalyticsService {
  return new AnalyticsService(leadService, opportunityService, activityService);
}
