/**
 * Campaign Service
 * Handles marketing campaigns, member management, metrics, and A/B testing
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Campaign,
  CampaignType,
  CampaignStatus,
  CampaignMember,
  CampaignMemberStatus,
  CampaignMetrics,
  CampaignVariant
} from '../types';

/**
 * Campaign creation data
 */
export interface CreateCampaignData {
  name: string;
  description?: string;
  type: CampaignType;
  startDate: Date;
  endDate?: Date;
  budgetedCost?: number;
  expectedRevenue?: number;
  expectedResponse?: number;
  currency?: string;
  ownerId: string;
  ownerName?: string;
  parentCampaignId?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Campaign update data
 */
export interface UpdateCampaignData {
  name?: string;
  description?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budgetedCost?: number;
  actualCost?: number;
  expectedRevenue?: number;
  expectedResponse?: number;
  currency?: string;
  ownerId?: string;
  ownerName?: string;
  customFields?: Record<string, unknown>;
  tags?: string[];
}

/**
 * A/B Test variant data
 */
export interface VariantData {
  name: string;
  description?: string;
  subject?: string;
  content?: string;
  percentage: number;
  isControl?: boolean;
}

export class CampaignService {
  private campaigns: Map<string, Campaign> = new Map();
  private members: Map<string, CampaignMember[]> = new Map();

  /**
   * Create a new campaign
   */
  async create(campaignData: CreateCampaignData): Promise<Campaign> {
    const now = new Date();

    const campaign: Campaign = {
      id: uuidv4(),
      name: campaignData.name,
      description: campaignData.description,
      type: campaignData.type,
      status: CampaignStatus.DRAFT,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      budgetedCost: campaignData.budgetedCost,
      expectedRevenue: campaignData.expectedRevenue,
      expectedResponse: campaignData.expectedResponse,
      currency: campaignData.currency || 'USD',
      parentCampaignId: campaignData.parentCampaignId,
      ownerId: campaignData.ownerId,
      ownerName: campaignData.ownerName,
      numberOfMembers: 0,
      numberOfLeads: 0,
      numberOfContacts: 0,
      numberOfOpportunities: 0,
      numberOfConvertedLeads: 0,
      customFields: campaignData.customFields || {},
      tags: campaignData.tags || [],
      createdAt: now,
      updatedAt: now
    };

    this.campaigns.set(campaign.id, campaign);
    this.members.set(campaign.id, []);

    return campaign;
  }

  /**
   * Update a campaign
   */
  async update(id: string, changes: UpdateCampaignData): Promise<Campaign> {
    const campaign = this.campaigns.get(id);
    if (!campaign) {
      throw new Error(`Campaign not found: ${id}`);
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      ...changes,
      updatedAt: new Date()
    };

    this.campaigns.set(id, updatedCampaign);

    return updatedCampaign;
  }

  /**
   * Get a campaign by ID
   */
  async get(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null;
  }

  /**
   * Add members to a campaign
   */
  async addMembers(
    campaignId: string,
    memberIds: string[],
    memberType: 'lead' | 'contact' = 'lead'
  ): Promise<CampaignMember[]> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const existingMembers = this.members.get(campaignId) || [];
    const newMembers: CampaignMember[] = [];
    const now = new Date();

    for (const memberId of memberIds) {
      // Check if member already exists
      const exists = existingMembers.some(
        (m) => m.memberId === memberId && m.memberType === memberType
      );

      if (!exists) {
        const member: CampaignMember = {
          id: uuidv4(),
          campaignId,
          memberType,
          memberId,
          status: CampaignMemberStatus.SENT,
          hasConverted: false,
          createdAt: now,
          updatedAt: now
        };

        // Assign to variant if A/B test
        if (campaign.isABTest && campaign.variants && campaign.variants.length > 0) {
          member.variantId = this.assignToVariant(campaign.variants);
        }

        newMembers.push(member);
        existingMembers.push(member);
      }
    }

    this.members.set(campaignId, existingMembers);

    // Update campaign counts
    await this.updateCampaignCounts(campaignId);

    return newMembers;
  }

  /**
   * Remove a member from a campaign
   */
  async removeMember(campaignId: string, memberId: string): Promise<boolean> {
    const existingMembers = this.members.get(campaignId) || [];
    const filteredMembers = existingMembers.filter((m) => m.memberId !== memberId);

    if (filteredMembers.length === existingMembers.length) {
      return false;
    }

    this.members.set(campaignId, filteredMembers);
    await this.updateCampaignCounts(campaignId);

    return true;
  }

  /**
   * Update member status
   */
  async updateMemberStatus(
    campaignId: string,
    memberId: string,
    status: CampaignMemberStatus
  ): Promise<CampaignMember> {
    const existingMembers = this.members.get(campaignId) || [];
    const memberIndex = existingMembers.findIndex((m) => m.memberId === memberId);

    if (memberIndex === -1) {
      throw new Error(`Member not found in campaign: ${memberId}`);
    }

    const existingMember = existingMembers[memberIndex];
    if (!existingMember) {
      throw new Error(`Member not found in campaign: ${memberId}`);
    }

    const now = new Date();
    const updatedMember: CampaignMember = {
      ...existingMember,
      status,
      updatedAt: now
    };

    // Track response date
    if (
      status === CampaignMemberStatus.RESPONDED ||
      status === CampaignMemberStatus.OPENED ||
      status === CampaignMemberStatus.CLICKED
    ) {
      updatedMember.respondedDate = now;
      if (!existingMember.firstRespondedDate) {
        updatedMember.firstRespondedDate = now;
      }
    }

    // Track conversion
    if (status === CampaignMemberStatus.CONVERTED) {
      updatedMember.hasConverted = true;
      updatedMember.convertedDate = now;
    }

    existingMembers[memberIndex] = updatedMember;
    this.members.set(campaignId, existingMembers);

    // Update metrics
    await this.updateCampaignCounts(campaignId);

    return updatedMember;
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PLANNED) {
      throw new Error('Campaign must be in draft or planned status to launch');
    }

    const members = this.members.get(campaignId) || [];
    if (members.length === 0) {
      throw new Error('Campaign must have at least one member to launch');
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: CampaignStatus.ACTIVE,
      numberSent: members.length,
      updatedAt: new Date()
    };

    this.campaigns.set(campaignId, updatedCampaign);

    return updatedCampaign;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error('Can only pause active campaigns');
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: CampaignStatus.PAUSED,
      updatedAt: new Date()
    };

    this.campaigns.set(campaignId, updatedCampaign);

    return updatedCampaign;
  }

  /**
   * Complete a campaign
   */
  async completeCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const updatedCampaign: Campaign = {
      ...campaign,
      status: CampaignStatus.COMPLETED,
      endDate: new Date(),
      updatedAt: new Date()
    };

    // Calculate final metrics
    updatedCampaign.metrics = await this.calculateMetrics(campaignId);

    this.campaigns.set(campaignId, updatedCampaign);

    return updatedCampaign;
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    return this.calculateMetrics(campaignId);
  }

  /**
   * Calculate ROI for a campaign
   */
  async getROI(campaignId: string): Promise<{
    roi: number;
    revenue: number;
    cost: number;
    profit: number;
    costPerLead: number;
    costPerConversion: number;
    revenuePerConversion: number;
  }> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    const metrics = await this.calculateMetrics(campaignId);

    const cost = campaign.actualCost || campaign.budgetedCost || 0;
    const revenue = metrics.totalRevenue;
    const profit = revenue - cost;
    const roi = cost > 0 ? (profit / cost) * 100 : 0;

    const costPerLead = metrics.sent > 0 ? cost / metrics.sent : 0;
    const costPerConversion = metrics.converted > 0 ? cost / metrics.converted : 0;
    const revenuePerConversion = metrics.converted > 0 ? revenue / metrics.converted : 0;

    return {
      roi: Math.round(roi * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      costPerLead: Math.round(costPerLead * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      revenuePerConversion: Math.round(revenuePerConversion * 100) / 100
    };
  }

  /**
   * Set up A/B test variants
   */
  async ABTest(campaignId: string, variants: VariantData[]): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new Error('Can only set up A/B test for draft campaigns');
    }

    // Validate percentages sum to 100
    const totalPercentage = variants.reduce((sum, v) => sum + v.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error('Variant percentages must sum to 100');
    }

    // Ensure at least one control
    const hasControl = variants.some((v) => v.isControl);
    if (!hasControl) {
      variants[0]!.isControl = true;
    }

    const campaignVariants: CampaignVariant[] = variants.map((v) => ({
      id: uuidv4(),
      name: v.name,
      description: v.description,
      subject: v.subject,
      content: v.content,
      percentage: v.percentage,
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      isControl: v.isControl || false,
      isWinner: false
    }));

    const updatedCampaign: Campaign = {
      ...campaign,
      isABTest: true,
      variants: campaignVariants,
      updatedAt: new Date()
    };

    this.campaigns.set(campaignId, updatedCampaign);

    return updatedCampaign;
  }

  /**
   * Determine A/B test winner
   */
  async determineABTestWinner(
    campaignId: string,
    metric: 'openRate' | 'clickRate' | 'conversionRate' = 'conversionRate'
  ): Promise<CampaignVariant | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (!campaign.isABTest || !campaign.variants || campaign.variants.length === 0) {
      throw new Error('Campaign is not an A/B test');
    }

    // Update variant metrics
    const members = this.members.get(campaignId) || [];
    const updatedVariants = campaign.variants.map((variant) => {
      const variantMembers = members.filter((m) => m.variantId === variant.id);
      const sent = variantMembers.length;
      const opened = variantMembers.filter(
        (m) =>
          m.status === CampaignMemberStatus.OPENED ||
          m.status === CampaignMemberStatus.CLICKED ||
          m.status === CampaignMemberStatus.RESPONDED ||
          m.status === CampaignMemberStatus.CONVERTED
      ).length;
      const clicked = variantMembers.filter(
        (m) =>
          m.status === CampaignMemberStatus.CLICKED ||
          m.status === CampaignMemberStatus.RESPONDED ||
          m.status === CampaignMemberStatus.CONVERTED
      ).length;
      const converted = variantMembers.filter((m) => m.hasConverted).length;

      return {
        ...variant,
        sent,
        opened,
        clicked,
        converted,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        conversionRate: sent > 0 ? (converted / sent) * 100 : 0
      };
    });

    // Find winner based on metric
    let winner: CampaignVariant | null = null;
    let maxValue = -1;

    for (const variant of updatedVariants) {
      if (variant[metric] > maxValue) {
        maxValue = variant[metric];
        winner = variant;
      }
    }

    // Mark winner
    const finalVariants = updatedVariants.map((v) => ({
      ...v,
      isWinner: v.id === winner?.id
    }));

    const updatedCampaign: Campaign = {
      ...campaign,
      variants: finalVariants,
      winningVariant: winner?.id,
      updatedAt: new Date()
    };

    this.campaigns.set(campaignId, updatedCampaign);

    return winner;
  }

  /**
   * Get campaign members
   */
  async getCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    return this.members.get(campaignId) || [];
  }

  /**
   * Get campaigns by status
   */
  async getCampaignsByStatus(status: CampaignStatus): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter((c) => c.status === status);
  }

  /**
   * Get campaigns by owner
   */
  async getCampaignsByOwner(ownerId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter((c) => c.ownerId === ownerId);
  }

  /**
   * Get all campaigns
   */
  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<boolean> {
    this.members.delete(id);
    return this.campaigns.delete(id);
  }

  /**
   * Calculate campaign metrics
   */
  private async calculateMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = this.campaigns.get(campaignId);
    const members = this.members.get(campaignId) || [];

    const sent = members.length;
    const bounced = members.filter((m) => m.status === CampaignMemberStatus.BOUNCED).length;
    const delivered = sent - bounced;
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;

    const opened = members.filter(
      (m) =>
        m.status === CampaignMemberStatus.OPENED ||
        m.status === CampaignMemberStatus.CLICKED ||
        m.status === CampaignMemberStatus.RESPONDED ||
        m.status === CampaignMemberStatus.CONVERTED
    ).length;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;

    const clicked = members.filter(
      (m) =>
        m.status === CampaignMemberStatus.CLICKED ||
        m.status === CampaignMemberStatus.RESPONDED ||
        m.status === CampaignMemberStatus.CONVERTED
    ).length;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;

    const responded = members.filter(
      (m) =>
        m.status === CampaignMemberStatus.RESPONDED ||
        m.status === CampaignMemberStatus.CONVERTED
    ).length;
    const responseRate = delivered > 0 ? (responded / delivered) * 100 : 0;

    const converted = members.filter((m) => m.hasConverted).length;
    const conversionRate = delivered > 0 ? (converted / delivered) * 100 : 0;

    // Revenue calculation (simplified - would normally come from opportunities)
    const avgDealSize = 25000;
    const totalRevenue = converted * avgDealSize;
    const averageDealSize = converted > 0 ? totalRevenue / converted : 0;

    const totalCost = campaign?.actualCost || campaign?.budgetedCost || 0;
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
    const costPerLead = sent > 0 ? totalCost / sent : 0;
    const costPerConversion = converted > 0 ? totalCost / converted : 0;

    return {
      sent,
      delivered,
      bounced,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      opened,
      openRate: Math.round(openRate * 100) / 100,
      uniqueOpens: opened,
      clicked,
      clickRate: Math.round(clickRate * 100) / 100,
      uniqueClicks: clicked,
      clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
      responded,
      responseRate: Math.round(responseRate * 100) / 100,
      converted,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageDealSize: Math.round(averageDealSize * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      costPerLead: Math.round(costPerLead * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      calculatedAt: new Date()
    };
  }

  /**
   * Update campaign member counts
   */
  private async updateCampaignCounts(campaignId: string): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    const members = this.members.get(campaignId) || [];

    const numberOfMembers = members.length;
    const numberOfLeads = members.filter((m) => m.memberType === 'lead').length;
    const numberOfContacts = members.filter((m) => m.memberType === 'contact').length;
    const numberOfConvertedLeads = members.filter((m) => m.hasConverted).length;

    const updatedCampaign: Campaign = {
      ...campaign,
      numberOfMembers,
      numberOfLeads,
      numberOfContacts,
      numberOfConvertedLeads,
      updatedAt: new Date()
    };

    this.campaigns.set(campaignId, updatedCampaign);
  }

  /**
   * Assign member to a variant in A/B test
   */
  private assignToVariant(variants: CampaignVariant[]): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.percentage;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1]!.id;
  }

  /**
   * Clone a campaign
   */
  async clone(campaignId: string, newName?: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    return this.create({
      name: newName || `${campaign.name} (Copy)`,
      description: campaign.description,
      type: campaign.type,
      startDate: new Date(),
      budgetedCost: campaign.budgetedCost,
      expectedRevenue: campaign.expectedRevenue,
      expectedResponse: campaign.expectedResponse,
      currency: campaign.currency,
      ownerId: campaign.ownerId,
      ownerName: campaign.ownerName,
      customFields: campaign.customFields,
      tags: campaign.tags
    });
  }
}

export const campaignService = new CampaignService();
