/**
 * @fileoverview Twilio WhatsApp Provider
 * @module @ait-core/communications/providers/whatsapp/twilio
 * @description Implementation of WhatsApp provider using Twilio Business API
 */

import twilio from 'twilio';
import {
  IWhatsAppProvider,
  IWhatsAppMessage,
  IDeliveryResult,
  IProviderStatus
} from '../../../interfaces/communication-provider.interface';
import { DeliveryStatus } from '../../../interfaces/message.types';
import { Logger } from '../../../utils/logger';

export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  readonly channel = 'WHATSAPP' as const;
  readonly name = 'Twilio WhatsApp';

  private client: twilio.Twilio;
  private fromNumber: string;
  private logger: Logger;
  private initialized = false;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
    this.logger = new Logger('TwilioWhatsAppProvider');
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    try {
      await this.checkHealth();
      this.initialized = true;
      this.logger.info('Twilio WhatsApp provider initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio WhatsApp provider', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  async send(message: IWhatsAppMessage): Promise<IDeliveryResult> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      await this.validateMessage(message);

      const to = Array.isArray(message.to) ? message.to[0] : message.to;
      const from = message.from || this.fromNumber;

      // Ensure WhatsApp format
      const formattedTo = this.formatWhatsAppNumber(to);
      const formattedFrom = this.formatWhatsAppNumber(from);

      const messageParams: any = {
        from: formattedFrom,
        to: formattedTo,
        body: message.content,
        statusCallback: this.getStatusCallbackUrl(message.id)
      };

      // Add media if present
      if (message.mediaUrl) {
        messageParams.mediaUrl = [message.mediaUrl];
      }

      const twilioMessage = await this.client.messages.create(messageParams);

      return {
        success: true,
        messageId: twilioMessage.sid,
        providerId: twilioMessage.sid,
        status: this.mapTwilioStatus(twilioMessage.status),
        timestamp: new Date(),
        metadata: {
          price: twilioMessage.price,
          priceUnit: twilioMessage.priceUnit,
          numMedia: twilioMessage.numMedia
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp message', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send batch WhatsApp messages
   */
  async sendBatch(messages: IWhatsAppMessage[]): Promise<IDeliveryResult[]> {
    const results: IDeliveryResult[] = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);

      // Delay to respect rate limits
      await this.delay(100);
    }

    return results;
  }

  /**
   * Send template message
   */
  async sendTemplate(
    to: string,
    templateName: string,
    components: any[],
    language: string = 'es'
  ): Promise<IDeliveryResult> {
    try {
      const formattedTo = this.formatWhatsAppNumber(to);
      const formattedFrom = this.formatWhatsAppNumber(this.fromNumber);

      const message = await this.client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        contentSid: templateName,
        contentVariables: JSON.stringify(components)
      });

      return {
        success: true,
        messageId: message.sid,
        providerId: message.sid,
        status: this.mapTwilioStatus(message.status),
        timestamp: new Date()
      };
    } catch (error: any) {
      this.logger.error('Failed to send WhatsApp template', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send media message
   */
  async sendMedia(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'video' | 'audio',
    caption?: string
  ): Promise<IDeliveryResult> {
    const message: IWhatsAppMessage = {
      to,
      content: caption || '',
      channel: 'WHATSAPP',
      mediaUrl,
      mediaType
    };

    return this.send(message);
  }

  /**
   * Send interactive message with buttons
   */
  async sendInteractive(message: IWhatsAppMessage): Promise<IDeliveryResult> {
    try {
      const formattedTo = this.formatWhatsAppNumber(
        Array.isArray(message.to) ? message.to[0] : message.to
      );
      const formattedFrom = this.formatWhatsAppNumber(
        message.from || this.fromNumber
      );

      // Build interactive message
      const interactiveContent = this.buildInteractiveContent(message);

      const twilioMessage = await this.client.messages.create({
        from: formattedFrom,
        to: formattedTo,
        body: message.content,
        persistentAction: interactiveContent
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        providerId: twilioMessage.sid,
        status: this.mapTwilioStatus(twilioMessage.status),
        timestamp: new Date()
      };
    } catch (error: any) {
      this.logger.error('Failed to send interactive WhatsApp message', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.messages(messageId).update({
        status: 'read'
      });

      this.logger.info(`WhatsApp message marked as read: ${messageId}`);
    } catch (error) {
      this.logger.error('Failed to mark WhatsApp message as read', error);
    }
  }

  /**
   * Get delivery status
   */
  async getStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return this.mapTwilioStatus(message.status);
    } catch (error) {
      this.logger.error('Failed to get WhatsApp message status', error);
      return 'FAILED';
    }
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<IProviderStatus> {
    try {
      const account = await this.client.api.accounts(this.client.accountSid).fetch();

      return {
        available: account.status === 'active',
        lastCheck: new Date()
      };
    } catch (error: any) {
      return {
        available: false,
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Validate message
   */
  async validateMessage(message: IWhatsAppMessage): Promise<boolean> {
    if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
      throw new Error('Recipient is required');
    }

    if (!message.content && !message.mediaUrl) {
      throw new Error('Content or media is required');
    }

    const phoneNumber = Array.isArray(message.to) ? message.to[0] : message.to;
    if (!this.isValidPhoneFormat(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    // Validate media type if present
    if (message.mediaUrl && !message.mediaType) {
      throw new Error('Media type is required when sending media');
    }

    return true;
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatWhatsAppNumber(number: string): string {
    if (number.startsWith('whatsapp:')) {
      return number;
    }

    // Remove whatsapp: prefix if exists and add it back
    const cleanNumber = number.replace(/^whatsapp:/, '');
    return `whatsapp:${cleanNumber}`;
  }

  /**
   * Map Twilio status to our status
   */
  private mapTwilioStatus(twilioStatus: string): DeliveryStatus {
    switch (twilioStatus) {
      case 'queued':
      case 'accepted':
        return 'QUEUED';
      case 'sending':
        return 'SENT';
      case 'sent':
        return 'SENT';
      case 'delivered':
        return 'DELIVERED';
      case 'read':
        return 'OPENED';
      case 'failed':
      case 'undelivered':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Build interactive content
   */
  private buildInteractiveContent(message: IWhatsAppMessage): string[] {
    const actions: string[] = [];

    if (message.buttons) {
      for (const button of message.buttons) {
        if (button.type === 'reply') {
          actions.push(button.title);
        } else if (button.type === 'url' && button.url) {
          actions.push(`${button.title}: ${button.url}`);
        } else if (button.type === 'call' && button.phoneNumber) {
          actions.push(`${button.title}: ${button.phoneNumber}`);
        }
      }
    }

    return actions;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneFormat(phoneNumber: string): boolean {
    // Remove whatsapp: prefix for validation
    const cleanNumber = phoneNumber.replace(/^whatsapp:/, '');

    // E.164 format: +[country code][number]
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(cleanNumber);
  }

  /**
   * Get status callback URL
   */
  private getStatusCallbackUrl(messageId?: string): string | undefined {
    if (!process.env.ENABLE_TRACKING || !messageId) {
      return undefined;
    }

    return `${process.env.APP_URL}/api/communications/webhooks/twilio/whatsapp/${messageId}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
