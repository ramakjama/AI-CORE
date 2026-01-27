/**
 * Campaign Service
 *
 * Manages marketing and communication campaigns across all channels
 * Features: Create, schedule, A/B testing, analytics
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';

import {
  Campaign,
  CampaignTarget,
  CampaignVariant,
  CampaignStatus,
  Template,
  Contact,
  ChannelType,
  MessageStatus,
  CommunicationEvent,
  BulkSendResult
} from '../types';

import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';

/**
 * Campaign service configuration
 */
export interface CampaignServiceConfig {
  tenantId: string;
  maxConcurrentSends?: number;
  defaultBatchSize?: number;
  defaultDelayBetweenBatches?: number;
}

/**
 * Channel services container
 */
export interface CampaignChannelServices {
  email?: EmailService;
  sms?: SMSService;
  whatsapp?: WhatsAppService;
}

/**
 * Campaign creation options
 */
export interface CreateCampaignOptions {
  name: string;
  description?: string;
  channel: ChannelType;
  templateId: string;
  targets: Array<{
    contact: Contact;
    customData?: Record<string, unknown>;
  }>;
  tags?: string[];
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
}

/**
 * A/B Test configuration
 */
export interface ABTestConfig {
  variants: Array<{
    name: string;
    templateId: string;
    percentage: number;
  }>;
  winnerCriteria: 'OPENS' | 'CLICKS' | 'CONVERSIONS';
  testDuration: number; // Hours
  autoSelectWinner?: boolean;
}

/**
 * Campaign Service Class
 */
export class CampaignService extends EventEmitter {
  private config: CampaignServiceConfig;
  private services: CampaignChannelServices;
  private campaigns: Map<string, Campaign> = new Map();
  private targets: Map<string, CampaignTarget[]> = new Map();
  private templates: Map<string, Template> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: CampaignServiceConfig,
    services: CampaignChannelServices
  ) {
    super();
    this.config = config;
    this.services = services;
  }

  /**
   * Create a new campaign
   */
  create(options: CreateCampaignOptions): Campaign {
    const campaign: Campaign = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      name: options.name,
      description: options.description,
      channel: options.channel,
      templateId: options.templateId,
      status: CampaignStatus.DRAFT,
      targetCount: options.targets.length,
      scheduledAt: options.scheduledAt,
      tags: options.tags,
      metadata: options.metadata,
      stats: {
        total: options.targets.length,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0,
        unsubscribed: 0,
        complained: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create campaign targets
    const campaignTargets: CampaignTarget[] = options.targets.map(target => ({
      id: uuidv4(),
      campaignId: campaign.id,
      contact: target.contact,
      status: 'PENDING',
      customData: target.customData
    }));

    this.campaigns.set(campaign.id, campaign);
    this.targets.set(campaign.id, campaignTargets);

    this.emitEvent('campaign.created', campaign.id);

    return campaign;
  }

  /**
   * Schedule a campaign
   */
  schedule(campaignId: string, scheduledAt: Date): boolean {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return false;
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      return false;
    }

    campaign.scheduledAt = scheduledAt;
    campaign.status = CampaignStatus.SCHEDULED;
    campaign.updatedAt = new Date();

    // Set up scheduled job
    const delay = scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.start(campaignId);
      }, delay);

      this.scheduledJobs.set(campaignId, timeout);
    }

    return true;
  }

  /**
   * Start a campaign
   */
  async start(campaignId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    if (campaign.status === CampaignStatus.RUNNING) {
      return { success: false, error: 'Campaign already running' };
    }

    if (campaign.status === CampaignStatus.COMPLETED) {
      return { success: false, error: 'Campaign already completed' };
    }

    // Get template
    const template = this.templates.get(campaign.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Validate channel service
    if (!this.getChannelService(campaign.channel)) {
      return { success: false, error: `Service for ${campaign.channel} not configured` };
    }

    // Update status
    campaign.status = CampaignStatus.RUNNING;
    campaign.startedAt = new Date();
    campaign.updatedAt = new Date();

    this.emitEvent('campaign.started', campaignId);

    // Start sending in background
    this.executeCampaign(campaign, template).catch(err => {
      console.error(`Campaign ${campaignId} execution error:`, err);
      campaign.status = CampaignStatus.FAILED;
      campaign.updatedAt = new Date();
      this.emitEvent('campaign.failed', campaignId, { error: err.message });
    });

    return { success: true };
  }

  /**
   * Pause a running campaign
   */
  pause(campaignId: string): boolean {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
      return false;
    }

    campaign.status = CampaignStatus.PAUSED;
    campaign.updatedAt = new Date();

    return true;
  }

  /**
   * Resume a paused campaign
   */
  async resume(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || campaign.status !== CampaignStatus.PAUSED) {
      return false;
    }

    const template = this.templates.get(campaign.templateId);
    if (!template) {
      return false;
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.updatedAt = new Date();

    // Resume execution
    this.executeCampaign(campaign, template).catch(err => {
      console.error(`Campaign ${campaignId} resume error:`, err);
      campaign.status = CampaignStatus.FAILED;
      campaign.updatedAt = new Date();
    });

    return true;
  }

  /**
   * Cancel a campaign
   */
  cancel(campaignId: string): boolean {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return false;
    }

    // Clear scheduled job if exists
    const job = this.scheduledJobs.get(campaignId);
    if (job) {
      clearTimeout(job);
      this.scheduledJobs.delete(campaignId);
    }

    campaign.status = CampaignStatus.CANCELLED;
    campaign.updatedAt = new Date();

    return true;
  }

  /**
   * Get campaign statistics
   */
  getStats(campaignId: string): Campaign['stats'] | null {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign) {
      return null;
    }

    // Recalculate rates
    if (campaign.stats.sent > 0) {
      campaign.stats.openRate = (campaign.stats.opened / campaign.stats.sent) * 100;
      campaign.stats.clickRate = (campaign.stats.clicked / campaign.stats.sent) * 100;
      campaign.stats.bounceRate = (campaign.stats.bounced / campaign.stats.sent) * 100;
    }

    return campaign.stats;
  }

  /**
   * Get detailed campaign report
   */
  getReport(campaignId: string): {
    campaign: Campaign;
    targets: CampaignTarget[];
    timeline: Array<{ timestamp: Date; event: string; count: number }>;
  } | null {
    const campaign = this.campaigns.get(campaignId);
    const campaignTargets = this.targets.get(campaignId);

    if (!campaign || !campaignTargets) {
      return null;
    }

    // Build timeline from target events
    const timeline: Array<{ timestamp: Date; event: string; count: number }> = [];
    const eventCounts: Record<string, Map<string, number>> = {};

    for (const target of campaignTargets) {
      const events = [
        { date: target.sentAt, event: 'sent' },
        { date: target.deliveredAt, event: 'delivered' },
        { date: target.openedAt, event: 'opened' },
        { date: target.clickedAt, event: 'clicked' }
      ];

      for (const { date, event } of events) {
        if (date) {
          const hourKey = new Date(date).setMinutes(0, 0, 0).toString();
          if (!eventCounts[event]) {
            eventCounts[event] = new Map();
          }
          eventCounts[event].set(hourKey, (eventCounts[event].get(hourKey) || 0) + 1);
        }
      }
    }

    for (const [event, hourMap] of Object.entries(eventCounts)) {
      for (const [hourKey, count] of hourMap) {
        timeline.push({
          timestamp: new Date(parseInt(hourKey)),
          event,
          count
        });
      }
    }

    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      campaign,
      targets: campaignTargets,
      timeline
    };
  }

  /**
   * Set up A/B test for campaign
   */
  setupABTest(campaignId: string, config: ABTestConfig): boolean {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || campaign.status !== CampaignStatus.DRAFT) {
      return false;
    }

    // Validate percentages sum to 100
    const totalPercentage = config.variants.reduce((sum, v) => sum + v.percentage, 0);
    if (totalPercentage !== 100) {
      return false;
    }

    campaign.isAbTest = true;
    campaign.variants = config.variants.map(v => ({
      id: uuidv4(),
      name: v.name,
      templateId: v.templateId,
      percentage: v.percentage,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        failed: 0
      }
    }));
    campaign.winnerCriteria = config.winnerCriteria;

    if (config.autoSelectWinner) {
      campaign.winnerSelectionTime = new Date(
        Date.now() + config.testDuration * 60 * 60 * 1000
      );
    }

    campaign.updatedAt = new Date();

    return true;
  }

  /**
   * Select winner for A/B test
   */
  selectABTestWinner(campaignId: string, variantId?: string): CampaignVariant | null {
    const campaign = this.campaigns.get(campaignId);

    if (!campaign || !campaign.isAbTest || !campaign.variants) {
      return null;
    }

    let winner: CampaignVariant | null = null;

    if (variantId) {
      // Manual selection
      winner = campaign.variants.find(v => v.id === variantId) || null;
    } else {
      // Auto selection based on criteria
      winner = campaign.variants.reduce((best, current) => {
        const bestScore = this.getVariantScore(best, campaign.winnerCriteria!);
        const currentScore = this.getVariantScore(current, campaign.winnerCriteria!);
        return currentScore > bestScore ? current : best;
      });
    }

    if (winner) {
      campaign.winnerVariantId = winner.id;
      campaign.updatedAt = new Date();
    }

    return winner;
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId: string): Campaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * List campaigns with filters
   */
  listCampaigns(filters?: {
    status?: CampaignStatus[];
    channel?: ChannelType[];
    tags?: string[];
    limit?: number;
    offset?: number;
  }): { campaigns: Campaign[]; total: number } {
    let campaigns = Array.from(this.campaigns.values());

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        campaigns = campaigns.filter(c => filters.status!.includes(c.status));
      }

      if (filters.channel && filters.channel.length > 0) {
        campaigns = campaigns.filter(c => filters.channel!.includes(c.channel));
      }

      if (filters.tags && filters.tags.length > 0) {
        campaigns = campaigns.filter(c =>
          c.tags && filters.tags!.some(t => c.tags!.includes(t))
        );
      }
    }

    // Sort by creation date desc
    campaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = campaigns.length;

    // Apply pagination
    if (filters?.offset) {
      campaigns = campaigns.slice(filters.offset);
    }

    if (filters?.limit) {
      campaigns = campaigns.slice(0, filters.limit);
    }

    return { campaigns, total };
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  /**
   * Update target status (for webhook processing)
   */
  updateTargetStatus(
    campaignId: string,
    messageId: string,
    status: CampaignTarget['status'],
    timestamp?: Date
  ): boolean {
    const campaignTargets = this.targets.get(campaignId);

    if (!campaignTargets) {
      return false;
    }

    const target = campaignTargets.find(t => t.messageId === messageId);

    if (!target) {
      return false;
    }

    target.status = status;

    switch (status) {
      case 'SENT':
        target.sentAt = timestamp || new Date();
        break;
      case 'DELIVERED':
        target.deliveredAt = timestamp || new Date();
        break;
      case 'OPENED':
        target.openedAt = timestamp || new Date();
        break;
      case 'CLICKED':
        target.clickedAt = timestamp || new Date();
        break;
    }

    // Update campaign stats
    this.updateCampaignStats(campaignId);

    return true;
  }

  /**
   * Execute campaign sending
   */
  private async executeCampaign(campaign: Campaign, template: Template): Promise<void> {
    const campaignTargets = this.targets.get(campaign.id);

    if (!campaignTargets) {
      return;
    }

    // Filter pending targets
    const pendingTargets = campaignTargets.filter(t => t.status === 'PENDING');

    if (pendingTargets.length === 0) {
      campaign.status = CampaignStatus.COMPLETED;
      campaign.completedAt = new Date();
      campaign.updatedAt = new Date();
      this.emitEvent('campaign.completed', campaign.id);
      return;
    }

    const batchSize = this.config.defaultBatchSize || 50;
    const delay = this.config.defaultDelayBetweenBatches || 1000;

    // Process in batches
    for (let i = 0; i < pendingTargets.length; i += batchSize) {
      // Check if paused or cancelled
      if (campaign.status === CampaignStatus.PAUSED ||
          campaign.status === CampaignStatus.CANCELLED) {
        return;
      }

      const batch = pendingTargets.slice(i, i + batchSize);

      await this.processBatch(campaign, template, batch);

      // Update stats after each batch
      this.updateCampaignStats(campaign.id);

      // Delay between batches
      if (i + batchSize < pendingTargets.length) {
        await this.delay(delay);
      }
    }

    // Campaign completed
    campaign.status = CampaignStatus.COMPLETED;
    campaign.completedAt = new Date();
    campaign.updatedAt = new Date();

    this.emitEvent('campaign.completed', campaign.id);
  }

  /**
   * Process a batch of targets
   */
  private async processBatch(
    campaign: Campaign,
    template: Template,
    targets: CampaignTarget[]
  ): Promise<void> {
    const service = this.getChannelService(campaign.channel);

    if (!service) {
      return;
    }

    const promises = targets.map(async (target) => {
      try {
        // Determine which template/variant to use
        let targetTemplate = template;
        let variant: CampaignVariant | undefined;

        if (campaign.isAbTest && campaign.variants) {
          variant = this.selectVariantForTarget(campaign.variants);
          const variantTemplate = this.templates.get(variant.templateId);
          if (variantTemplate) {
            targetTemplate = variantTemplate;
          }
        }

        // Get recipient based on channel
        const recipient = this.getRecipient(target.contact, campaign.channel);

        if (!recipient) {
          target.status = 'FAILED';
          target.errorMessage = 'No recipient for channel';
          return;
        }

        // Merge custom data
        const data = {
          ...target.customData,
          contact: target.contact
        };

        // Send via appropriate service
        let result: { success: boolean; messageId?: string; error?: any };

        switch (campaign.channel) {
          case ChannelType.EMAIL:
            result = await (service as EmailService).sendTemplate(
              recipient,
              targetTemplate.code,
              data
            );
            break;

          case ChannelType.SMS:
            result = await (service as SMSService).sendTemplate(
              recipient,
              targetTemplate.code,
              data
            );
            break;

          case ChannelType.WHATSAPP:
            result = await (service as WhatsAppService).sendTemplate(
              recipient,
              targetTemplate.code,
              data
            );
            break;

          default:
            result = { success: false, error: { message: 'Unsupported channel' } };
        }

        // Update target
        if (result.success) {
          target.status = 'SENT';
          target.messageId = result.messageId;
          target.sentAt = new Date();

          // Update variant stats if A/B test
          if (variant && variant.stats) {
            variant.stats.sent++;
          }
        } else {
          target.status = 'FAILED';
          target.errorMessage = result.error?.message;

          // Update variant stats if A/B test
          if (variant && variant.stats) {
            variant.stats.failed++;
          }
        }
      } catch (error) {
        const err = error as Error;
        target.status = 'FAILED';
        target.errorMessage = err.message;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Select variant for A/B test target
   */
  private selectVariantForTarget(variants: CampaignVariant[]): CampaignVariant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.percentage;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  /**
   * Get variant score based on criteria
   */
  private getVariantScore(
    variant: CampaignVariant,
    criteria: 'OPENS' | 'CLICKS' | 'CONVERSIONS'
  ): number {
    if (!variant.stats || variant.stats.sent === 0) {
      return 0;
    }

    switch (criteria) {
      case 'OPENS':
        return variant.stats.opened / variant.stats.sent;
      case 'CLICKS':
        return variant.stats.clicked / variant.stats.sent;
      case 'CONVERSIONS':
        // Would need conversion tracking implementation
        return variant.stats.clicked / variant.stats.sent;
      default:
        return 0;
    }
  }

  /**
   * Update campaign statistics
   */
  private updateCampaignStats(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    const campaignTargets = this.targets.get(campaignId);

    if (!campaign || !campaignTargets) {
      return;
    }

    campaign.stats = {
      total: campaignTargets.length,
      sent: campaignTargets.filter(t => t.status !== 'PENDING').length,
      delivered: campaignTargets.filter(t => t.deliveredAt).length,
      opened: campaignTargets.filter(t => t.openedAt).length,
      clicked: campaignTargets.filter(t => t.clickedAt).length,
      bounced: campaignTargets.filter(t => t.status === 'BOUNCED').length,
      failed: campaignTargets.filter(t => t.status === 'FAILED').length,
      unsubscribed: campaignTargets.filter(t => t.status === 'OPTED_OUT').length,
      complained: 0 // Would need complaint tracking
    };

    // Calculate rates
    if (campaign.stats.sent > 0) {
      campaign.stats.openRate = (campaign.stats.opened / campaign.stats.sent) * 100;
      campaign.stats.clickRate = (campaign.stats.clicked / campaign.stats.sent) * 100;
      campaign.stats.bounceRate = (campaign.stats.bounced / campaign.stats.sent) * 100;
    }

    campaign.updatedAt = new Date();
  }

  /**
   * Get channel service
   */
  private getChannelService(channel: ChannelType): EmailService | SMSService | WhatsAppService | null {
    switch (channel) {
      case ChannelType.EMAIL:
        return this.services.email || null;
      case ChannelType.SMS:
        return this.services.sms || null;
      case ChannelType.WHATSAPP:
        return this.services.whatsapp || null;
      default:
        return null;
    }
  }

  /**
   * Get recipient for channel
   */
  private getRecipient(contact: Contact, channel: ChannelType): string | null {
    switch (channel) {
      case ChannelType.EMAIL:
        return contact.email || null;
      case ChannelType.SMS:
        return contact.phone || null;
      case ChannelType.WHATSAPP:
        return contact.whatsappId || contact.phone || null;
      default:
        return null;
    }
  }

  /**
   * Emit event
   */
  private emitEvent(
    type: string,
    campaignId: string,
    data?: Record<string, unknown>
  ): void {
    const event = {
      type,
      campaignId,
      timestamp: new Date(),
      data
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    for (const job of this.scheduledJobs.values()) {
      clearTimeout(job);
    }
    this.scheduledJobs.clear();
  }
}

export default CampaignService;
