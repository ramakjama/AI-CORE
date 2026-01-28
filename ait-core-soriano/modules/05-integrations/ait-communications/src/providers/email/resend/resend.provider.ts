/**
 * @fileoverview Resend Email Provider
 * @module @ait-core/communications/providers/email/resend
 * @description Implementation of email provider using Resend API
 */

import { Resend } from 'resend';
import {
  IEmailProvider,
  IEmailMessage,
  IDeliveryResult,
  IProviderStatus
} from '../../../interfaces/communication-provider.interface';
import { DeliveryStatus } from '../../../interfaces/message.types';
import { Logger } from '../../../utils/logger';
import { EmailTracker } from './email-tracker';

export class ResendProvider implements IEmailProvider {
  readonly channel = 'EMAIL' as const;
  readonly name = 'Resend';

  private client: Resend;
  private tracker: EmailTracker;
  private logger: Logger;
  private initialized = false;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
    this.tracker = new EmailTracker();
    this.logger = new Logger('ResendProvider');
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.checkHealth();
      this.initialized = true;
      this.logger.info('Resend provider initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Resend provider', error);
      throw error;
    }
  }

  /**
   * Send email
   */
  async send(message: IEmailMessage): Promise<IDeliveryResult> {
    if (!this.initialized) {
      throw new Error('Provider not initialized');
    }

    try {
      await this.validateMessage(message);

      const to = Array.isArray(message.to) ? message.to : [message.to];

      const emailData: any = {
        from: message.from || process.env.RESEND_FROM_EMAIL!,
        to,
        subject: message.subject!,
        html: message.html || message.content,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        reply_to: message.replyTo,
        headers: this.buildHeaders(message),
        tags: this.buildTags(message),
        attachments: this.formatAttachments(message.attachments)
      };

      const response = await this.client.emails.send(emailData);

      return {
        success: true,
        messageId: response.data?.id,
        providerId: response.data?.id,
        status: 'SENT',
        timestamp: new Date(),
        metadata: {
          to: response.data?.to,
          from: response.data?.from
        }
      };
    } catch (error: any) {
      this.logger.error('Failed to send email', error);

      return {
        success: false,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send batch emails
   */
  async sendBatch(messages: IEmailMessage[]): Promise<IDeliveryResult[]> {
    const results: IDeliveryResult[] = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  /**
   * Send email with template
   */
  async sendWithTemplate(
    to: string | string[],
    templateId: string,
    data: Record<string, any>,
    options?: Partial<IEmailMessage>
  ): Promise<IDeliveryResult> {
    const message: IEmailMessage = {
      to,
      from: options?.from || process.env.RESEND_FROM_EMAIL!,
      subject: options?.subject || '',
      content: '',
      channel: 'EMAIL',
      templateId,
      templateData: data,
      ...options
    };

    // Template rendering will be handled by template service
    // For now, we'll use a placeholder
    message.html = await this.renderTemplate(templateId, data);

    return this.send(message);
  }

  /**
   * Get delivery status
   */
  async getStatus(messageId: string): Promise<DeliveryStatus> {
    try {
      const email = await this.client.emails.get(messageId);

      // Map Resend status to our status
      switch (email.data?.last_event) {
        case 'delivered':
          return 'DELIVERED';
        case 'bounced':
          return 'BOUNCED';
        case 'complained':
          return 'REJECTED';
        case 'opened':
          return 'OPENED';
        case 'clicked':
          return 'CLICKED';
        default:
          return 'SENT';
      }
    } catch (error) {
      this.logger.error('Failed to get email status', error);
      return 'FAILED';
    }
  }

  /**
   * Track email open
   */
  async trackOpen(messageId: string): Promise<void> {
    await this.tracker.trackOpen(messageId);
    this.logger.info(`Email opened: ${messageId}`);
  }

  /**
   * Track email click
   */
  async trackClick(messageId: string, url: string): Promise<void> {
    await this.tracker.trackClick(messageId, url);
    this.logger.info(`Email clicked: ${messageId}, URL: ${url}`);
  }

  /**
   * Handle bounce
   */
  async handleBounce(data: any): Promise<void> {
    this.logger.warn('Email bounced', data);
    // Store bounce in database
    await this.tracker.recordBounce(data.email, data.reason);
  }

  /**
   * Handle unsubscribe
   */
  async handleUnsubscribe(email: string): Promise<void> {
    this.logger.info(`Unsubscribe request: ${email}`);
    await this.tracker.recordUnsubscribe(email);
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<IProviderStatus> {
    try {
      // Simple API check
      const testEmail = process.env.RESEND_FROM_EMAIL!;

      return {
        available: true,
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
  async validateMessage(message: IEmailMessage): Promise<boolean> {
    if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
      throw new Error('Recipient is required');
    }

    if (!message.subject) {
      throw new Error('Subject is required');
    }

    if (!message.content && !message.html) {
      throw new Error('Content is required');
    }

    // Validate email addresses
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    for (const email of recipients) {
      if (!this.isValidEmail(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    }

    return true;
  }

  /**
   * Build email headers
   */
  private buildHeaders(message: IEmailMessage): Record<string, string> {
    const headers: Record<string, string> = {
      ...message.headers
    };

    // Add tracking pixel if enabled
    if (process.env.ENABLE_TRACKING === 'true' && message.id) {
      headers['X-Message-Id'] = message.id;
    }

    return headers;
  }

  /**
   * Build email tags
   */
  private buildTags(message: IEmailMessage): any[] {
    const tags = message.tags || [];

    if (message.templateId) {
      tags.push({ name: 'template', value: message.templateId });
    }

    if (message.priority) {
      tags.push({ name: 'priority', value: message.priority });
    }

    return tags.map(tag => {
      if (typeof tag === 'string') {
        return { name: 'tag', value: tag };
      }
      return tag;
    });
  }

  /**
   * Format attachments for Resend
   */
  private formatAttachments(attachments?: any[]): any[] | undefined {
    if (!attachments || attachments.length === 0) {
      return undefined;
    }

    return attachments.map(attachment => ({
      filename: attachment.filename,
      content: attachment.content,
      path: attachment.path,
      content_type: attachment.contentType
    }));
  }

  /**
   * Render template (placeholder)
   */
  private async renderTemplate(
    templateId: string,
    data: Record<string, any>
  ): Promise<string> {
    // This will be implemented by TemplateService
    return `<html><body>Template: ${templateId}</body></html>`;
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
