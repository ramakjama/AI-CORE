/**
 * @fileoverview Twilio SMS Provider
 * @module @ait-core/communications/providers/sms/twilio
 * @description Implementation of SMS provider using Twilio API
 */

import twilio from 'twilio';
import {
  ISmsProvider,
  ISmsMessage,
  IDeliveryResult,
  IProviderStatus
} from '../../../interfaces/communication-provider.interface';
import { DeliveryStatus } from '../../../interfaces/message.types';
import { Logger } from '../../../utils/logger';
import { LinkShortener } from './link-shortener';

export class TwilioSmsProvider implements ISmsProvider {
  readonly channel = 'SMS' as const;
  readonly name = 'Twilio SMS';

  private client: twilio.Twilio;
  private fromNumber: string;
  private linkShortener: LinkShortener;
  private logger: Logger;
  private initialized = false;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
    this.linkShortener = new LinkShortener();
    this.logger = new Logger('TwilioSmsProvider');
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    try {
      // Verify credentials
      await this.checkHealth();
      this.initialized = true;
      this.logger.info('Twilio SMS provider initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio SMS provider', error);
      throw error;
    }
  }

  /**
   * Send SMS
   */
  async send(message: ISmsMessage): Promise<IDeliveryResult> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      await this.validateMessage(message);

      const to = Array.isArray(message.to) ? message.to[0] : message.to;
      let content = message.content;

      // Shorten links if requested
      if (message.shortenLinks) {
        content = await this.linkShortener.shortenLinks(content);
      }

      // Check segments
      const segments = this.getSegmentsCount(content);
      if (message.maxSegments && segments > message.maxSegments) {
        throw new Error(
          `Message exceeds maximum segments: ${segments} > ${message.maxSegments}`
        );
      }

      const twilioMessage = await this.client.messages.create({
        body: content,
        from: message.from || this.fromNumber,
        to,
        statusCallback: this.getStatusCallbackUrl(message.id),
        validityPeriod: 3600 // 1 hour
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        providerId: twilioMessage.sid,
        status: this.mapTwilioStatus(twilioMessage.status),
        timestamp: new Date(),
        metadata: {
          segments,
          price: twilioMessage.price,
          priceUnit: twilioMessage.priceUnit
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to send SMS', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send batch SMS
   */
  async sendBatch(messages: ISmsMessage[]): Promise<IDeliveryResult[]> {
    const results: IDeliveryResult[] = [];

    // Twilio recommends sending messages sequentially to avoid rate limits
    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);

      // Small delay to respect rate limits
      await this.delay(100);
    }

    return results;
  }

  /**
   * Send SMS with link shortening
   */
  async sendWithShortLinks(message: ISmsMessage): Promise<IDeliveryResult> {
    message.shortenLinks = true;
    return this.send(message);
  }

  /**
   * Get SMS segments count
   */
  getSegmentsCount(content: string): number {
    const encoding = this.detectEncoding(content);

    if (encoding === 'GSM-7') {
      // GSM-7 encoding
      const maxLength = 160;
      const maxLengthMultipart = 153;

      if (content.length <= maxLength) {
        return 1;
      }

      return Math.ceil(content.length / maxLengthMultipart);
    } else {
      // UCS-2 encoding (Unicode)
      const maxLength = 70;
      const maxLengthMultipart = 67;

      if (content.length <= maxLength) {
        return 1;
      }

      return Math.ceil(content.length / maxLengthMultipart);
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
      this.logger.error('Failed to get SMS status', error);
      return 'FAILED';
    }
  }

  /**
   * Validate phone number
   */
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v2
        .phoneNumbers(phoneNumber)
        .fetch();

      return lookup.valid || false;
    } catch (error) {
      this.logger.error('Failed to validate phone number', error);
      return false;
    }
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<IProviderStatus> {
    try {
      // Fetch account info to verify credentials
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
  async validateMessage(message: ISmsMessage): Promise<boolean> {
    if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
      throw new Error('Recipient is required');
    }

    if (!message.content) {
      throw new Error('Content is required');
    }

    if (message.content.length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Validate phone number format
    const phoneNumber = Array.isArray(message.to) ? message.to[0] : message.to;
    if (!this.isValidPhoneFormat(phoneNumber)) {
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }

    return true;
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
      case 'failed':
      case 'undelivered':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Detect encoding type
   */
  private detectEncoding(content: string): 'GSM-7' | 'UCS-2' {
    // GSM-7 character set
    const gsm7Regex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-Z\\ÄÖÑÜ§¿a-z\{äöñüà\}~\[\]\|\^€]*$/;

    return gsm7Regex.test(content) ? 'GSM-7' : 'UCS-2';
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneFormat(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const regex = /^\+[1-9]\d{1,14}$/;
    return regex.test(phoneNumber);
  }

  /**
   * Get status callback URL
   */
  private getStatusCallbackUrl(messageId?: string): string | undefined {
    if (!process.env.ENABLE_TRACKING || !messageId) {
      return undefined;
    }

    return `${process.env.APP_URL}/api/communications/webhooks/twilio/sms/${messageId}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
