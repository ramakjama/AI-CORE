/**
 * @fileoverview Communication Orchestrator Service
 * @module @ait-core/communications/services
 * @description Orchestrates multi-channel communication campaigns
 */

import { PrismaClient } from '@prisma/client';
import {
  IMessage,
  IDeliveryResult,
  ICommunicationProvider,
  ICampaign
} from '../interfaces/communication-provider.interface';
import { CommunicationChannel, DeliveryStatus } from '../interfaces/message.types';
import { Logger } from '../utils/logger';
import { ResendProvider } from '../providers/email/resend/resend.provider';
import { TwilioSmsProvider } from '../providers/sms/twilio/twilio-sms.provider';
import { TwilioWhatsAppProvider } from '../providers/whatsapp/twilio/twilio-whatsapp.provider';
import { TemplateService } from './template.service';
import { DeliveryTrackingService } from './delivery-tracking.service';
import { RateLimiter } from '../utils/rate-limiter';

export class CommunicationOrchestrator {
  private providers: Map<CommunicationChannel, ICommunicationProvider>;
  private templateService: TemplateService;
  private trackingService: DeliveryTrackingService;
  private rateLimiter: RateLimiter;
  private prisma: PrismaClient;
  private logger: Logger;

  constructor() {
    this.providers = new Map();
    this.templateService = new TemplateService();
    this.trackingService = new DeliveryTrackingService();
    this.rateLimiter = new RateLimiter();
    this.prisma = new PrismaClient();
    this.logger = new Logger('CommunicationOrchestrator');
  }

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Email provider (Resend)
      if (process.env.ENABLE_EMAIL === 'true' && process.env.RESEND_API_KEY) {
        const emailProvider = new ResendProvider(process.env.RESEND_API_KEY);
        await emailProvider.initialize();
        this.providers.set('EMAIL', emailProvider);
        this.logger.info('Email provider initialized');
      }

      // Initialize SMS provider (Twilio)
      if (
        process.env.ENABLE_SMS === 'true' &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
      ) {
        const smsProvider = new TwilioSmsProvider(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
          process.env.TWILIO_PHONE_NUMBER
        );
        await smsProvider.initialize();
        this.providers.set('SMS', smsProvider);
        this.logger.info('SMS provider initialized');
      }

      // Initialize WhatsApp provider (Twilio)
      if (
        process.env.ENABLE_WHATSAPP === 'true' &&
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_NUMBER
      ) {
        const whatsappProvider = new TwilioWhatsAppProvider(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
          process.env.TWILIO_WHATSAPP_NUMBER
        );
        await whatsappProvider.initialize();
        this.providers.set('WHATSAPP', whatsappProvider);
        this.logger.info('WhatsApp provider initialized');
      }

      // Initialize template service
      await this.templateService.initialize();

      this.logger.info('Communication orchestrator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize communication orchestrator', error);
      throw error;
    }
  }

  /**
   * Send message through single channel
   */
  async sendMessage(message: IMessage): Promise<IDeliveryResult> {
    try {
      const provider = this.providers.get(message.channel);
      if (!provider) {
        throw new Error(`Provider not available for channel: ${message.channel}`);
      }

      // Check rate limit
      await this.rateLimiter.checkLimit(message.channel);

      // Render template if specified
      if (message.templateId && message.templateData) {
        message.content = await this.templateService.render(
          message.channel,
          message.templateId,
          message.templateData
        );
      }

      // Send message
      const result = await provider.send(message);

      // Track delivery
      await this.trackingService.trackDelivery(message, result);

      return result;
    } catch (error: any) {
      this.logger.error('Failed to send message', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send multi-channel message
   */
  async sendMultiChannel(
    channels: CommunicationChannel[],
    message: Omit<IMessage, 'channel'>
  ): Promise<Map<CommunicationChannel, IDeliveryResult>> {
    const results = new Map<CommunicationChannel, IDeliveryResult>();

    for (const channel of channels) {
      const channelMessage: IMessage = {
        ...message,
        channel
      };

      const result = await this.sendMessage(channelMessage);
      results.set(channel, result);
    }

    return results;
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = await this.prisma.communicationCampaign.findUnique({
        where: { id: campaignId },
        include: {
          audience: true
        }
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status !== 'SCHEDULED' && campaign.status !== 'RUNNING') {
        throw new Error(`Campaign is not in sendable state: ${campaign.status}`);
      }

      // Update campaign status
      await this.prisma.communicationCampaign.update({
        where: { id: campaignId },
        data: { status: 'RUNNING', startedAt: new Date() }
      });

      // Get recipients
      const recipients = await this.getRecipients(campaign);

      this.logger.info(
        `Starting campaign ${campaign.name} with ${recipients.length} recipients`
      );

      // Send messages
      let sent = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          const message: IMessage = {
            to: recipient.contact,
            channel: campaign.channel as CommunicationChannel,
            content: campaign.content,
            templateId: campaign.templateId || undefined,
            templateData: recipient.data,
            metadata: {
              campaignId,
              recipientId: recipient.id
            }
          };

          const result = await this.sendMessage(message);

          if (result.success) {
            sent++;
          } else {
            failed++;
          }

          // Respect throttle limit
          if (campaign.throttleLimit) {
            await this.delay(3600000 / campaign.throttleLimit); // Convert per-hour to ms delay
          }
        } catch (error) {
          this.logger.error(`Failed to send to recipient ${recipient.id}`, error);
          failed++;
        }
      }

      // Update campaign status
      await this.prisma.communicationCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          sentCount: sent,
          failedCount: failed
        }
      });

      this.logger.info(
        `Campaign ${campaign.name} completed: ${sent} sent, ${failed} failed`
      );
    } catch (error) {
      this.logger.error('Failed to send campaign', error);

      // Mark campaign as failed
      await this.prisma.communicationCampaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' }
      });

      throw error;
    }
  }

  /**
   * Send A/B test campaign
   */
  async sendABTestCampaign(
    campaignId: string,
    variantA: string,
    variantB: string,
    splitPercentage: number = 50
  ): Promise<void> {
    try {
      const campaign = await this.prisma.communicationCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      const recipients = await this.getRecipients(campaign);

      // Split recipients
      const splitIndex = Math.floor((recipients.length * splitPercentage) / 100);
      const groupA = recipients.slice(0, splitIndex);
      const groupB = recipients.slice(splitIndex);

      this.logger.info(
        `A/B test: Group A (${groupA.length}), Group B (${groupB.length})`
      );

      // Send variant A
      await this.sendVariant(campaign, groupA, variantA, 'A');

      // Send variant B
      await this.sendVariant(campaign, groupB, variantB, 'B');
    } catch (error) {
      this.logger.error('Failed to send A/B test campaign', error);
      throw error;
    }
  }

  /**
   * Get campaign recipients
   */
  private async getRecipients(campaign: any): Promise<any[]> {
    const filters: any = campaign.filters || {};

    // Apply audience filters
    const recipients = await this.prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        ...filters
      }
    });

    // Filter out unsubscribed users
    if (campaign.excludeUnsubscribed) {
      const unsubscribed = await this.prisma.unsubscribe.findMany();
      const unsubscribedEmails = new Set(
        unsubscribed.map(u => u.email.toLowerCase())
      );

      return recipients.filter(
        r => !unsubscribedEmails.has(r.contact.toLowerCase())
      );
    }

    return recipients;
  }

  /**
   * Send campaign variant
   */
  private async sendVariant(
    campaign: any,
    recipients: any[],
    content: string,
    variant: string
  ): Promise<void> {
    for (const recipient of recipients) {
      const message: IMessage = {
        to: recipient.contact,
        channel: campaign.channel as CommunicationChannel,
        content,
        metadata: {
          campaignId: campaign.id,
          variant
        }
      };

      await this.sendMessage(message);
    }
  }

  /**
   * Get provider status
   */
  async getProviderStatus(channel: CommunicationChannel): Promise<any> {
    const provider = this.providers.get(channel);
    if (!provider) {
      return { available: false, error: 'Provider not configured' };
    }

    return provider.checkHealth();
  }

  /**
   * Get all providers status
   */
  async getAllProvidersStatus(): Promise<Map<CommunicationChannel, any>> {
    const statuses = new Map<CommunicationChannel, any>();

    for (const [channel, provider] of this.providers.entries()) {
      const status = await provider.checkHealth();
      statuses.set(channel, status);
    }

    return statuses;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
