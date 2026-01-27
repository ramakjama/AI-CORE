/**
 * Lead Service
 * Handles lead management, capture, qualification, scoring, and assignment
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Lead,
  LeadStatus,
  LeadSource,
  LeadScore,
  LeadScoreFactor,
  LeadQualification,
  LeadCaptureData,
  Opportunity,
  OpportunityStage,
  AssignmentRule,
  Territory
} from '../types';

/**
 * Lead creation data
 */
export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  annualRevenue?: number;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source: LeadSource;
  campaignId?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Lead update data
 */
export interface UpdateLeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  annualRevenue?: number;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  source?: LeadSource;
  status?: LeadStatus;
  rating?: 'hot' | 'warm' | 'cold';
  ownerId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * ML Scoring configuration
 */
interface ScoringConfig {
  demographicWeight: number;
  behavioralWeight: number;
  firmographicWeight: number;
  engagementWeight: number;
}

/**
 * BANT Qualification input
 */
export interface BANTInput {
  budget?: {
    amount?: number;
    currency?: string;
    timeframe?: string;
    notes?: string;
  };
  authority?: {
    isDecisionMaker?: boolean;
    decisionMakerName?: string;
    decisionMakerTitle?: string;
    buyingProcess?: string;
    notes?: string;
  };
  need?: {
    painPoints?: string[];
    currentSolution?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    notes?: string;
  };
  timeline?: {
    targetDate?: Date;
    stage?: string;
    blockers?: string[];
    notes?: string;
  };
}

export class LeadService {
  private leads: Map<string, Lead> = new Map();
  private assignmentRules: AssignmentRule[] = [];
  private territories: Territory[] = [];
  private roundRobinIndex: Map<string, number> = new Map();

  private scoringConfig: ScoringConfig = {
    demographicWeight: 0.25,
    behavioralWeight: 0.30,
    firmographicWeight: 0.25,
    engagementWeight: 0.20
  };

  // Ideal customer profile for scoring
  private idealCustomerProfile = {
    industries: ['technology', 'finance', 'healthcare', 'manufacturing'],
    companySizes: ['51-200', '201-500', '501-1000', '1000+'],
    titles: ['ceo', 'cto', 'cfo', 'vp', 'director', 'head', 'manager'],
    minRevenue: 1000000
  };

  /**
   * Create a new lead
   */
  async create(leadData: CreateLeadData): Promise<Lead> {
    const now = new Date();

    const lead: Lead = {
      id: uuidv4(),
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      mobile: leadData.mobile,
      title: leadData.title,
      company: leadData.company,
      industry: leadData.industry,
      companySize: leadData.companySize,
      website: leadData.website,
      annualRevenue: leadData.annualRevenue,
      street: leadData.street,
      city: leadData.city,
      state: leadData.state,
      postalCode: leadData.postalCode,
      country: leadData.country,
      source: leadData.source,
      status: LeadStatus.NEW,
      campaignId: leadData.campaignId,
      ownerId: leadData.ownerId,
      numberOfActivities: 0,
      customFields: leadData.customFields || {},
      tags: leadData.tags || [],
      createdAt: now,
      updatedAt: now
    };

    // Calculate initial score
    lead.score = await this.calculateScore(lead);

    this.leads.set(lead.id, lead);

    return lead;
  }

  /**
   * Update an existing lead
   */
  async update(id: string, changes: UpdateLeadData): Promise<Lead> {
    const lead = this.leads.get(id);
    if (!lead) {
      throw new Error(`Lead not found: ${id}`);
    }

    const updatedLead: Lead = {
      ...lead,
      ...changes,
      updatedAt: new Date()
    };

    // Recalculate score if relevant fields changed
    if (
      changes.title ||
      changes.company ||
      changes.industry ||
      changes.companySize ||
      changes.annualRevenue
    ) {
      updatedLead.score = await this.calculateScore(updatedLead);
    }

    this.leads.set(id, updatedLead);

    return updatedLead;
  }

  /**
   * Get a lead by ID
   */
  async get(id: string): Promise<Lead | null> {
    return this.leads.get(id) || null;
  }

  /**
   * Capture lead from web form or API
   */
  async capture(source: LeadSource, data: LeadCaptureData): Promise<Lead> {
    // Check for duplicate by email
    const existingLead = Array.from(this.leads.values()).find(
      (lead) => lead.email.toLowerCase() === data.email.toLowerCase()
    );

    if (existingLead) {
      // Update existing lead with new information
      return this.update(existingLead.id, {
        ...data,
        source
      });
    }

    // Create new lead
    const leadData: CreateLeadData = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email,
      phone: data.phone,
      company: data.company,
      title: data.title,
      source,
      campaignId: data.campaignId,
      customFields: {
        ...data.customFields,
        ...data.formData,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmTerm: data.utmTerm,
        utmContent: data.utmContent,
        landingPage: data.landingPage,
        referrer: data.referrer,
        marketingConsent: data.marketingConsent,
        privacyPolicyAccepted: data.privacyPolicyAccepted
      }
    };

    const lead = await this.create(leadData);

    // Auto-assign if configured
    await this.autoAssign(lead.id);

    return lead;
  }

  /**
   * BANT Qualification
   */
  async qualify(leadId: string, bantInput?: BANTInput): Promise<LeadQualification> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const qualification: LeadQualification = {
      budget: {
        qualified: false,
        ...(bantInput?.budget || {})
      },
      authority: {
        qualified: false,
        isDecisionMaker: false,
        ...(bantInput?.authority || {})
      },
      need: {
        qualified: false,
        ...(bantInput?.need || {})
      },
      timeline: {
        qualified: false,
        ...(bantInput?.timeline || {})
      },
      overallQualified: false,
      qualificationScore: 0
    };

    // Score each BANT component
    let bantScore = 0;

    // Budget qualification (25 points)
    if (bantInput?.budget?.amount && bantInput.budget.amount > 0) {
      qualification.budget.qualified = true;
      bantScore += 25;
    } else if (bantInput?.budget?.notes) {
      bantScore += 10;
    }

    // Authority qualification (25 points)
    if (bantInput?.authority?.isDecisionMaker) {
      qualification.authority.qualified = true;
      bantScore += 25;
    } else if (bantInput?.authority?.decisionMakerName) {
      qualification.authority.qualified = true;
      bantScore += 15;
    }

    // Need qualification (25 points)
    if (bantInput?.need?.painPoints && bantInput.need.painPoints.length > 0) {
      qualification.need.qualified = true;
      bantScore += 15;
      if (bantInput.need.urgency === 'high' || bantInput.need.urgency === 'critical') {
        bantScore += 10;
      }
    }

    // Timeline qualification (25 points)
    if (bantInput?.timeline?.targetDate) {
      qualification.timeline.qualified = true;
      const daysUntilTarget = Math.ceil(
        (new Date(bantInput.timeline.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilTarget <= 30) {
        bantScore += 25;
      } else if (daysUntilTarget <= 90) {
        bantScore += 20;
      } else {
        bantScore += 10;
      }
    }

    qualification.qualificationScore = bantScore;
    qualification.overallQualified = bantScore >= 50;

    if (qualification.overallQualified) {
      qualification.qualifiedDate = new Date();
    }

    // Update lead with qualification
    const updatedLead: Lead = {
      ...lead,
      qualification,
      status: qualification.overallQualified ? LeadStatus.QUALIFIED : lead.status,
      updatedAt: new Date()
    };

    this.leads.set(leadId, updatedLead);

    return qualification;
  }

  /**
   * ML-based lead scoring
   */
  async score(leadId: string): Promise<LeadScore> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const score = await this.calculateScore(lead);

    // Update lead with new score
    const updatedLead: Lead = {
      ...lead,
      score,
      rating: score.overall >= 70 ? 'hot' : score.overall >= 40 ? 'warm' : 'cold',
      updatedAt: new Date()
    };

    this.leads.set(leadId, updatedLead);

    return score;
  }

  /**
   * Calculate lead score internally
   */
  private async calculateScore(lead: Lead): Promise<LeadScore> {
    const factors: LeadScoreFactor[] = [];

    // Demographic scoring
    let demographicScore = 0;

    // Title match
    const titleLower = lead.title?.toLowerCase() || '';
    const titleMatch = this.idealCustomerProfile.titles.some((t) => titleLower.includes(t));
    if (titleMatch) {
      demographicScore += 30;
      factors.push({
        name: 'Title Match',
        category: 'demographic',
        value: lead.title,
        points: 30,
        weight: 0.3,
        description: 'Title matches ideal customer profile'
      });
    }

    // Email domain (not free email)
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const emailDomain = lead.email.split('@')[1]?.toLowerCase();
    if (emailDomain && !freeEmailDomains.includes(emailDomain)) {
      demographicScore += 20;
      factors.push({
        name: 'Business Email',
        category: 'demographic',
        value: emailDomain,
        points: 20,
        weight: 0.2,
        description: 'Uses business email domain'
      });
    }

    // Firmographic scoring
    let firmographicScore = 0;

    // Industry match
    if (lead.industry) {
      const industryLower = lead.industry.toLowerCase();
      const industryMatch = this.idealCustomerProfile.industries.some((i) =>
        industryLower.includes(i)
      );
      if (industryMatch) {
        firmographicScore += 25;
        factors.push({
          name: 'Industry Match',
          category: 'firmographic',
          value: lead.industry,
          points: 25,
          weight: 0.25,
          description: 'Industry matches ideal customer profile'
        });
      }
    }

    // Company size
    if (lead.companySize) {
      const sizeMatch = this.idealCustomerProfile.companySizes.includes(lead.companySize);
      if (sizeMatch) {
        firmographicScore += 25;
        factors.push({
          name: 'Company Size Match',
          category: 'firmographic',
          value: lead.companySize,
          points: 25,
          weight: 0.25,
          description: 'Company size matches ideal customer profile'
        });
      }
    }

    // Annual revenue
    if (lead.annualRevenue && lead.annualRevenue >= this.idealCustomerProfile.minRevenue) {
      firmographicScore += 25;
      factors.push({
        name: 'Revenue Threshold',
        category: 'firmographic',
        value: lead.annualRevenue,
        points: 25,
        weight: 0.25,
        description: 'Annual revenue meets minimum threshold'
      });
    }

    // Behavioral scoring (based on engagement)
    let behavioralScore = 0;

    // Number of activities
    if (lead.numberOfActivities >= 5) {
      behavioralScore += 30;
      factors.push({
        name: 'High Engagement',
        category: 'behavioral',
        value: lead.numberOfActivities,
        points: 30,
        weight: 0.3,
        description: 'High number of activities'
      });
    } else if (lead.numberOfActivities >= 2) {
      behavioralScore += 15;
      factors.push({
        name: 'Moderate Engagement',
        category: 'behavioral',
        value: lead.numberOfActivities,
        points: 15,
        weight: 0.15,
        description: 'Moderate number of activities'
      });
    }

    // Recency of last activity
    if (lead.lastActivityDate) {
      const daysSinceActivity = Math.ceil(
        (Date.now() - new Date(lead.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivity <= 7) {
        behavioralScore += 25;
        factors.push({
          name: 'Recent Activity',
          category: 'behavioral',
          value: daysSinceActivity,
          points: 25,
          weight: 0.25,
          description: 'Activity within last 7 days'
        });
      } else if (daysSinceActivity <= 30) {
        behavioralScore += 10;
        factors.push({
          name: 'Activity in Last Month',
          category: 'behavioral',
          value: daysSinceActivity,
          points: 10,
          weight: 0.1,
          description: 'Activity within last 30 days'
        });
      }
    }

    // Engagement scoring (source quality)
    let engagementScore = 0;

    // High-intent sources
    const highIntentSources = [
      LeadSource.INBOUND_CALL,
      LeadSource.WEBFORM,
      LeadSource.REFERRAL,
      LeadSource.PARTNER
    ];
    if (highIntentSources.includes(lead.source)) {
      engagementScore += 30;
      factors.push({
        name: 'High-Intent Source',
        category: 'engagement',
        value: lead.source,
        points: 30,
        weight: 0.3,
        description: 'Lead came from high-intent source'
      });
    }

    // Calculate weighted scores
    const weightedDemographic = demographicScore * this.scoringConfig.demographicWeight;
    const weightedBehavioral = behavioralScore * this.scoringConfig.behavioralWeight;
    const weightedFirmographic = firmographicScore * this.scoringConfig.firmographicWeight;
    const weightedEngagement = engagementScore * this.scoringConfig.engagementWeight;

    const overallScore = Math.min(
      100,
      weightedDemographic + weightedBehavioral + weightedFirmographic + weightedEngagement
    );

    // Calculate conversion probability (simplified ML model)
    const conversionProbability = this.calculateConversionProbability(overallScore, factors);

    // Calculate expected value
    const avgDealSize = 50000; // Base average deal size
    const expectedValue = avgDealSize * conversionProbability;

    // Estimate time to convert based on score
    const timeToConvert = overallScore >= 70 ? 14 : overallScore >= 50 ? 30 : 60;

    return {
      overall: Math.round(overallScore),
      demographic: Math.round(demographicScore),
      behavioral: Math.round(behavioralScore),
      firmographic: Math.round(firmographicScore),
      engagement: Math.round(engagementScore),
      conversionProbability: Math.round(conversionProbability * 100) / 100,
      expectedValue: Math.round(expectedValue),
      timeToConvert,
      factors,
      lastCalculated: new Date(),
      model: 'lead-scoring-v1',
      modelVersion: '1.0.0'
    };
  }

  /**
   * Calculate conversion probability using scoring factors
   */
  private calculateConversionProbability(score: number, factors: LeadScoreFactor[]): number {
    // Base probability from score
    let probability = score / 100;

    // Adjust based on key factors
    const hasBusinessEmail = factors.some((f) => f.name === 'Business Email');
    const hasHighIntent = factors.some((f) => f.name === 'High-Intent Source');
    const hasRecentActivity = factors.some((f) => f.name === 'Recent Activity');

    if (hasBusinessEmail) probability *= 1.1;
    if (hasHighIntent) probability *= 1.15;
    if (hasRecentActivity) probability *= 1.1;

    return Math.min(0.95, probability);
  }

  /**
   * Manually assign lead to a user
   */
  async assign(leadId: string, userId: string): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    const updatedLead: Lead = {
      ...lead,
      ownerId: userId,
      updatedAt: new Date()
    };

    this.leads.set(leadId, updatedLead);

    return updatedLead;
  }

  /**
   * Auto-assign lead using round-robin or territory rules
   */
  async autoAssign(leadId: string): Promise<Lead> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    let assignedUserId: string | undefined;

    // Check territory-based assignment first
    const matchingTerritory = this.findMatchingTerritory(lead);
    if (matchingTerritory && matchingTerritory.assignedUsers.length > 0) {
      // Round-robin within territory
      assignedUserId = this.getNextRoundRobinUser(
        `territory-${matchingTerritory.id}`,
        matchingTerritory.assignedUsers
      );
      const updatedLead: Lead = {
        ...lead,
        ownerId: assignedUserId,
        territory: matchingTerritory.name,
        updatedAt: new Date()
      };
      this.leads.set(leadId, updatedLead);
      return updatedLead;
    }

    // Check assignment rules
    const matchingRule = this.findMatchingAssignmentRule(lead);
    if (matchingRule) {
      if (matchingRule.assignmentType === 'user' && matchingRule.assignToId) {
        assignedUserId = matchingRule.assignToId;
      } else if (
        matchingRule.assignmentType === 'round_robin' &&
        matchingRule.roundRobinUsers &&
        matchingRule.roundRobinUsers.length > 0
      ) {
        assignedUserId = this.getNextRoundRobinUser(
          `rule-${matchingRule.id}`,
          matchingRule.roundRobinUsers
        );
      }
    }

    if (assignedUserId) {
      const updatedLead: Lead = {
        ...lead,
        ownerId: assignedUserId,
        updatedAt: new Date()
      };
      this.leads.set(leadId, updatedLead);
      return updatedLead;
    }

    return lead;
  }

  /**
   * Find matching territory for lead
   */
  private findMatchingTerritory(lead: Lead): Territory | undefined {
    return this.territories.find((territory) => {
      if (!territory.isActive) return false;

      return territory.rules.every((rule) => {
        const fieldValue = (lead as unknown as Record<string, unknown>)[rule.field];
        return this.evaluateRule(fieldValue, rule.operator, rule.value);
      });
    });
  }

  /**
   * Find matching assignment rule for lead
   */
  private findMatchingAssignmentRule(lead: Lead): AssignmentRule | undefined {
    const sortedRules = [...this.assignmentRules].sort((a, b) => a.priority - b.priority);

    return sortedRules.find((rule) => {
      if (!rule.isActive) return false;

      return rule.conditions.every((condition) => {
        const fieldValue = (lead as unknown as Record<string, unknown>)[condition.field];
        return this.evaluateRule(fieldValue, condition.operator, condition.value);
      });
    });
  }

  /**
   * Evaluate a single rule condition
   */
  private evaluateRule(fieldValue: unknown, operator: string, ruleValue: unknown): boolean {
    const strFieldValue = String(fieldValue || '').toLowerCase();
    const strRuleValue = String(ruleValue || '').toLowerCase();

    switch (operator) {
      case 'equals':
        return strFieldValue === strRuleValue;
      case 'contains':
        return strFieldValue.includes(strRuleValue);
      case 'starts_with':
        return strFieldValue.startsWith(strRuleValue);
      case 'ends_with':
        return strFieldValue.endsWith(strRuleValue);
      case 'in':
        return Array.isArray(ruleValue) && ruleValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get next user in round-robin rotation
   */
  private getNextRoundRobinUser(groupKey: string, users: string[]): string {
    const currentIndex = this.roundRobinIndex.get(groupKey) || 0;
    const selectedUser = users[currentIndex % users.length];
    this.roundRobinIndex.set(groupKey, currentIndex + 1);
    if (selectedUser === undefined) {
      throw new Error('No users available for round-robin assignment');
    }
    return selectedUser;
  }

  /**
   * Convert lead to opportunity
   */
  async convertToOpportunity(
    leadId: string,
    opportunityData?: Partial<Opportunity>
  ): Promise<Opportunity> {
    const lead = this.leads.get(leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new Error(`Lead already converted: ${leadId}`);
    }

    const now = new Date();

    const opportunity: Opportunity = {
      id: uuidv4(),
      name: opportunityData?.name || `${lead.company || lead.lastName} - New Opportunity`,
      description: opportunityData?.description,
      leadId: leadId,
      stage: opportunityData?.stage || OpportunityStage.QUALIFICATION,
      probability: opportunityData?.probability || 20,
      forecastCategory: 'pipeline',
      amount: opportunityData?.amount || lead.score?.expectedValue || 0,
      currency: opportunityData?.currency || 'USD',
      closeDate: opportunityData?.closeDate || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      createdDate: now,
      ownerId: lead.ownerId || '',
      ownerName: lead.ownerName,
      isClosed: false,
      createdAt: now,
      updatedAt: now,
      createdBy: lead.ownerId
    };

    // Update lead status
    const updatedLead: Lead = {
      ...lead,
      status: LeadStatus.CONVERTED,
      convertedOpportunityId: opportunity.id,
      convertedDate: now,
      updatedAt: now
    };

    this.leads.set(leadId, updatedLead);

    return opportunity;
  }

  /**
   * Merge duplicate leads
   */
  async merge(leadIds: string[]): Promise<Lead> {
    if (leadIds.length < 2) {
      throw new Error('At least 2 leads required for merge');
    }

    const leads = leadIds.map((id) => this.leads.get(id)).filter((l): l is Lead => l !== undefined);

    if (leads.length !== leadIds.length) {
      throw new Error('One or more leads not found');
    }

    // Sort by creation date, oldest first (primary lead)
    leads.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const [primaryLead, ...secondaryLeads] = leads;

    if (!primaryLead) {
      throw new Error('No primary lead found for merge');
    }

    // Merge data from secondary leads into primary
    const mergedLead: Lead = { ...primaryLead };

    for (const secondary of secondaryLeads) {
      // Fill in missing fields from secondary leads
      if (!mergedLead.phone && secondary.phone) mergedLead.phone = secondary.phone;
      if (!mergedLead.mobile && secondary.mobile) mergedLead.mobile = secondary.mobile;
      if (!mergedLead.title && secondary.title) mergedLead.title = secondary.title;
      if (!mergedLead.company && secondary.company) mergedLead.company = secondary.company;
      if (!mergedLead.industry && secondary.industry) mergedLead.industry = secondary.industry;
      if (!mergedLead.website && secondary.website) mergedLead.website = secondary.website;
      if (!mergedLead.annualRevenue && secondary.annualRevenue)
        mergedLead.annualRevenue = secondary.annualRevenue;

      // Merge tags
      if (secondary.tags) {
        mergedLead.tags = [...new Set([...(mergedLead.tags || []), ...secondary.tags])];
      }

      // Merge custom fields
      if (secondary.customFields) {
        mergedLead.customFields = {
          ...(mergedLead.customFields || {}),
          ...secondary.customFields
        };
      }

      // Sum activities
      mergedLead.numberOfActivities += secondary.numberOfActivities;

      // Delete secondary lead
      this.leads.delete(secondary.id);
    }

    mergedLead.updatedAt = new Date();

    // Recalculate score after merge
    mergedLead.score = await this.calculateScore(mergedLead);

    this.leads.set(mergedLead.id, mergedLead);

    return mergedLead;
  }

  /**
   * Get leads by source
   */
  async getLeadsBySource(source: LeadSource): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter((lead) => lead.source === source);
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter((lead) => lead.status === status);
  }

  /**
   * Get leads by owner
   */
  async getLeadsByOwner(ownerId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter((lead) => lead.ownerId === ownerId);
  }

  /**
   * Get all leads
   */
  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  /**
   * Add assignment rule
   */
  addAssignmentRule(rule: AssignmentRule): void {
    this.assignmentRules.push(rule);
  }

  /**
   * Add territory
   */
  addTerritory(territory: Territory): void {
    this.territories.push(territory);
  }

  /**
   * Update scoring configuration
   */
  updateScoringConfig(config: Partial<ScoringConfig>): void {
    this.scoringConfig = { ...this.scoringConfig, ...config };
  }

  /**
   * Bulk import leads
   */
  async bulkImport(leadsData: CreateLeadData[]): Promise<Lead[]> {
    const createdLeads: Lead[] = [];

    for (const leadData of leadsData) {
      const lead = await this.create({
        ...leadData,
        source: leadData.source || LeadSource.IMPORT
      });
      createdLeads.push(lead);
    }

    return createdLeads;
  }

  /**
   * Search leads
   */
  async search(query: string): Promise<Lead[]> {
    const queryLower = query.toLowerCase();

    return Array.from(this.leads.values()).filter((lead) => {
      return (
        lead.firstName.toLowerCase().includes(queryLower) ||
        lead.lastName.toLowerCase().includes(queryLower) ||
        lead.email.toLowerCase().includes(queryLower) ||
        (lead.company && lead.company.toLowerCase().includes(queryLower))
      );
    });
  }
}

export const leadService = new LeadService();
