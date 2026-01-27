/**
 * Email Provider
 * SendGrid implementation for email communications
 */

import sgMail, { MailService, MailDataRequired } from '@sendgrid/mail';
import { v4 as uuidv4 } from 'uuid';

import { BaseProvider, ProviderConfig, ProviderResponse, DeliveryStatus, WebhookPayload } from './base.provider';
import { Channel, ChannelStatus } from '../types/channel.types';
import { SendMessageRequest, SendMessageResponse, MessageStatus, MessageAttachment } from '../types/message.types';

export interface EmailProviderConfig extends ProviderConfig {
  apiKey: string;
  defaultFromEmail?: string;
  defaultFromName?: string;
  sandboxMode?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
  ipPoolName?: string;
}

export interface EmailProvider {
  send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendBatch(requests: SendMessageRequest[]): Promise<ProviderResponse<SendMessageResponse[]>>;
  getStatus(messageId: string): Promise<ProviderResponse<DeliveryStatus>>;
  cancel(messageId: string): Promise<ProviderResponse<boolean>>;
}

/**
 * SendGrid Email Provider Implementation
 */
export class SendGridProvider extends BaseProvider implements EmailProvider {
  private client: MailService;
  private emailConfig: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    super(Channel.EMAIL, config);
    this.emailConfig = config;
    this.client = sgMail;
  }

  /**
   * Initialize SendGrid client
   */
  async initialize(): Promise<void> {
    if (!this.emailConfig.apiKey) {
      throw new Error('SendGrid API key is required');
    }

    this.client.setApiKey(this.emailConfig.apiKey);

    if (this.emailConfig.timeout) {
      this.client.setTimeout(this.emailConfig.timeout);
    }

    this.initialized = true;
  }

  /**
   * Send a single email
   */
  async send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const mailData = this.buildMailData(request);
      const [response] = await this.withRetry(() => this.client.send(mailData));

      const messageId = uuidv4();
      const externalId = response.headers['x-message-id'] || messageId;

      return {
        success: true,
        data: {
          messageId,
          externalId,
          status: MessageStatus.SENT,
          channel: Channel.EMAIL,
          scheduledAt: request.scheduledAt
        },
        rawResponse: response
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send batch emails
   */
  async sendBatch(requests: SendMessageRequest[]): Promise<ProviderResponse<SendMessageResponse[]>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const mailDataArray = requests.map(req => this.buildMailData(req));
      const responses = await this.withRetry(() => this.client.send(mailDataArray));

      const results: SendMessageResponse[] = mailDataArray.map((_, index) => ({
        messageId: uuidv4(),
        externalId: Array.isArray(responses) ? responses[index]?.headers?.['x-message-id'] : undefined,
        status: MessageStatus.SENT,
        channel: Channel.EMAIL
      }));

      return {
        success: true,
        data: results,
        rawResponse: responses
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get email delivery status
   * Note: SendGrid uses webhooks for status updates; this is a placeholder
   */
  async getStatus(externalId: string): Promise<ProviderResponse<DeliveryStatus>> {
    // SendGrid doesn't provide a direct API for checking message status
    // Status is typically received via webhooks
    return {
      success: true,
      data: {
        messageId: externalId,
        externalId,
        status: MessageStatus.SENT,
        timestamp: new Date()
      }
    };
  }

  /**
   * Cancel a scheduled email
   */
  async cancel(externalId: string): Promise<ProviderResponse<boolean>> {
    // SendGrid scheduled emails can be cancelled via batch_id
    // This would require storing the batch_id when scheduling
    return {
      success: false,
      error: {
        code: 'NOT_SUPPORTED',
        message: 'Cancel operation requires batch_id stored during scheduling',
        retryable: false
      }
    };
  }

  /**
   * Validate SendGrid webhook signature
   */
  validateWebhook(payload: unknown, signature: string): boolean {
    if (!this.emailConfig.webhookSecret) {
      return false;
    }

    const crypto = require('crypto');
    const timestamp = (payload as any)?.timestamp || '';
    const body = JSON.stringify(payload);

    const signaturePayload = timestamp + body;
    const expectedSignature = crypto
      .createHmac('sha256', this.emailConfig.webhookSecret)
      .update(signaturePayload)
      .digest('base64');

    return signature === expectedSignature;
  }

  /**
   * Parse SendGrid webhook payload
   */
  parseWebhook(payload: unknown): WebhookPayload {
    const events = Array.isArray(payload) ? payload : [payload];
    const event = events[0] as Record<string, unknown>;

    const statusMap: Record<string, MessageStatus> = {
      processed: MessageStatus.SENDING,
      dropped: MessageStatus.FAILED,
      delivered: MessageStatus.DELIVERED,
      deferred: MessageStatus.PENDING,
      bounce: MessageStatus.BOUNCED,
      blocked: MessageStatus.FAILED,
      open: MessageStatus.READ,
      click: MessageStatus.READ,
      spam_report: MessageStatus.SPAM,
      unsubscribe: MessageStatus.UNSUBSCRIBED
    };

    return {
      provider: 'sendgrid',
      event: String(event.event || 'unknown'),
      messageId: String(event.sg_message_id || ''),
      externalId: String(event.sg_message_id || ''),
      timestamp: new Date((event.timestamp as number) * 1000 || Date.now()),
      data: {
        email: event.email,
        status: statusMap[String(event.event)] || MessageStatus.PENDING,
        reason: event.reason,
        response: event.response,
        ip: event.ip,
        userAgent: event.useragent,
        url: event.url
      }
    };
  }

  /**
   * Health check for SendGrid
   */
  async healthCheck(): Promise<ChannelStatus> {
    try {
      // SendGrid doesn't have a specific health endpoint
      // We'll try to validate the API key
      const isHealthy = !!this.emailConfig.apiKey;

      return {
        channel: Channel.EMAIL,
        isAvailable: isHealthy,
        lastChecked: new Date(),
        latencyMs: 0
      };
    } catch (error) {
      return {
        channel: Channel.EMAIL,
        isAvailable: false,
        lastChecked: new Date(),
        errorRate: 100
      };
    }
  }

  /**
   * Build SendGrid mail data from request
   */
  private buildMailData(request: SendMessageRequest): MailDataRequired {
    const attachments = request.content?.attachments?.map(att => this.buildAttachment(att));

    const mailData: MailDataRequired = {
      to: {
        email: request.recipient.email!,
        name: request.recipient.name
      },
      from: {
        email: request.sender?.email || this.emailConfig.defaultFromEmail!,
        name: request.sender?.name || this.emailConfig.defaultFromName
      },
      subject: request.content?.subject || 'No Subject',
      text: request.content?.plainTextBody || request.content?.body,
      html: request.content?.htmlBody,
      attachments,
      trackingSettings: {
        clickTracking: {
          enable: request.options?.trackClicks ?? this.emailConfig.trackClicks ?? true
        },
        openTracking: {
          enable: request.options?.trackOpens ?? this.emailConfig.trackOpens ?? true
        }
      },
      mailSettings: {
        sandboxMode: {
          enable: request.options?.sandbox ?? this.emailConfig.sandboxMode ?? false
        }
      }
    };

    // Add reply-to if specified
    if (request.sender?.replyTo) {
      mailData.replyTo = { email: request.sender.replyTo };
    }

    // Add custom headers for tracking
    mailData.headers = {
      'X-Custom-Message-Id': uuidv4()
    };

    // Add categories/tags
    if (request.tags?.length) {
      mailData.categories = request.tags;
    }

    // Add custom args for webhook tracking
    mailData.customArgs = {
      campaignId: request.campaignId,
      ...request.metadata
    };

    // Handle scheduled sending
    if (request.scheduledAt) {
      mailData.sendAt = Math.floor(request.scheduledAt.getTime() / 1000);
    }

    return mailData;
  }

  /**
   * Build attachment for SendGrid
   */
  private buildAttachment(attachment: MessageAttachment): {
    content: string;
    filename: string;
    type: string;
    disposition: string;
  } {
    let content: string;

    if (typeof attachment.content === 'string') {
      content = attachment.content;
    } else if (Buffer.isBuffer(attachment.content)) {
      content = attachment.content.toString('base64');
    } else {
      content = '';
    }

    return {
      content,
      filename: attachment.filename,
      type: attachment.contentType,
      disposition: 'attachment'
    };
  }

  /**
   * Handle SendGrid errors
   */
  private handleError(error: unknown): ProviderResponse {
    const sgError = error as {
      code?: number;
      message?: string;
      response?: {
        body?: {
          errors?: Array<{ message: string; field?: string }>;
        };
      };
    };

    const errorMessage = sgError.response?.body?.errors?.[0]?.message ||
                         sgError.message ||
                         'Unknown SendGrid error';

    const isRetryable = sgError.code ? sgError.code >= 500 : false;

    return {
      success: false,
      error: {
        code: String(sgError.code || 'SENDGRID_ERROR'),
        message: errorMessage,
        retryable: isRetryable,
        details: sgError.response?.body
      },
      rawResponse: error
    };
  }
}

/**
 * Factory function for creating email provider
 */
export function createEmailProvider(config: EmailProviderConfig): EmailProvider {
  return new SendGridProvider(config);
}
