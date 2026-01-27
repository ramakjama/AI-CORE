/**
 * SMS Provider
 * Twilio implementation for SMS communications
 */

import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { v4 as uuidv4 } from 'uuid';

import { BaseProvider, ProviderConfig, ProviderResponse, DeliveryStatus, WebhookPayload } from './base.provider';
import { Channel, ChannelStatus } from '../types/channel.types';
import { SendMessageRequest, SendMessageResponse, MessageStatus } from '../types/message.types';
import { phoneFormatter } from '../utils/phone-formatter';

export interface SmsProviderConfig extends ProviderConfig {
  accountSid: string;
  authToken: string;
  defaultFromNumber?: string;
  messagingServiceSid?: string;
  statusCallbackUrl?: string;
  maxPrice?: string;
  validityPeriod?: number;
}

export interface SmsProvider {
  send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>>;
  sendBatch(requests: SendMessageRequest[]): Promise<ProviderResponse<SendMessageResponse[]>>;
  getStatus(messageId: string): Promise<ProviderResponse<DeliveryStatus>>;
  cancel(messageId: string): Promise<ProviderResponse<boolean>>;
}

/**
 * Twilio SMS Provider Implementation
 */
export class TwilioSmsProvider extends BaseProvider implements SmsProvider {
  private client: Twilio;
  private smsConfig: SmsProviderConfig;

  constructor(config: SmsProviderConfig) {
    super(Channel.SMS, config);
    this.smsConfig = config;
    this.client = new Twilio(config.accountSid, config.authToken);
  }

  /**
   * Initialize Twilio client
   */
  async initialize(): Promise<void> {
    if (!this.smsConfig.accountSid || !this.smsConfig.authToken) {
      throw new Error('Twilio Account SID and Auth Token are required');
    }

    // Verify credentials by fetching account info
    try {
      await this.client.api.accounts(this.smsConfig.accountSid).fetch();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize Twilio: ${error}`);
    }
  }

  /**
   * Send a single SMS
   */
  async send(request: SendMessageRequest): Promise<ProviderResponse<SendMessageResponse>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Format phone number to E.164
      const toNumber = phoneFormatter.toE164(request.recipient.phone!);
      if (!toNumber) {
        return {
          success: false,
          error: {
            code: 'INVALID_PHONE',
            message: 'Invalid recipient phone number',
            retryable: false
          }
        };
      }

      const messageOptions: Record<string, unknown> = {
        to: toNumber,
        body: request.content?.body || ''
      };

      // Use messaging service or from number
      if (this.smsConfig.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.smsConfig.messagingServiceSid;
      } else {
        const fromNumber = request.sender?.phone || this.smsConfig.defaultFromNumber;
        if (!fromNumber) {
          return {
            success: false,
            error: {
              code: 'MISSING_FROM',
              message: 'From phone number is required',
              retryable: false
            }
          };
        }
        messageOptions.from = phoneFormatter.toE164(fromNumber);
      }

      // Add status callback
      if (this.smsConfig.statusCallbackUrl) {
        messageOptions.statusCallback = this.smsConfig.statusCallbackUrl;
      }

      // Add max price if configured
      if (this.smsConfig.maxPrice) {
        messageOptions.maxPrice = this.smsConfig.maxPrice;
      }

      // Add validity period
      if (this.smsConfig.validityPeriod) {
        messageOptions.validityPeriod = this.smsConfig.validityPeriod;
      }

      // Handle scheduled sending
      if (request.scheduledAt && request.scheduledAt > new Date()) {
        messageOptions.scheduleType = 'fixed';
        messageOptions.sendAt = request.scheduledAt.toISOString();
      }

      // Add media URL if present (MMS)
      if (request.content?.mediaUrl) {
        messageOptions.mediaUrl = [request.content.mediaUrl];
      }

      const message: MessageInstance = await this.withRetry(() =>
        this.client.messages.create(messageOptions as any)
      );

      const messageId = uuidv4();

      return {
        success: true,
        data: {
          messageId,
          externalId: message.sid,
          status: this.mapTwilioStatus(message.status),
          channel: Channel.SMS,
          scheduledAt: request.scheduledAt,
          cost: message.price ? parseFloat(message.price) : undefined,
          metadata: {
            numSegments: message.numSegments,
            numMedia: message.numMedia
          }
        },
        rawResponse: message
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send batch SMS messages
   */
  async sendBatch(requests: SendMessageRequest[]): Promise<ProviderResponse<SendMessageResponse[]>> {
    const results: SendMessageResponse[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Twilio doesn't have a native batch API, so we send in parallel with rate limiting
    const batchSize = 10;

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(req => this.send(req))
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          results.push(result.value.data);
        } else {
          const errorMsg = result.status === 'rejected'
            ? result.reason?.message
            : result.value.error?.message;
          errors.push({ index: i + idx, error: errorMsg || 'Unknown error' });
        }
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await this.sleep(100);
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? {
        code: 'PARTIAL_FAILURE',
        message: `${errors.length} messages failed to send`,
        details: { errors },
        retryable: true
      } : undefined
    };
  }

  /**
   * Get SMS delivery status
   */
  async getStatus(externalId: string): Promise<ProviderResponse<DeliveryStatus>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message = await this.client.messages(externalId).fetch();

      return {
        success: true,
        data: {
          messageId: externalId,
          externalId: message.sid,
          status: this.mapTwilioStatus(message.status),
          timestamp: message.dateUpdated || message.dateSent || new Date(),
          errorCode: message.errorCode?.toString(),
          errorMessage: message.errorMessage || undefined,
          metadata: {
            direction: message.direction,
            numSegments: message.numSegments,
            price: message.price,
            priceUnit: message.priceUnit
          }
        }
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cancel a scheduled SMS
   */
  async cancel(externalId: string): Promise<ProviderResponse<boolean>> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const message = await this.client.messages(externalId).update({
        status: 'canceled'
      });

      return {
        success: message.status === 'canceled',
        data: message.status === 'canceled'
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate Twilio webhook signature
   */
  validateWebhook(payload: unknown, signature: string): boolean {
    if (!this.smsConfig.webhookSecret || !this.smsConfig.statusCallbackUrl) {
      return false;
    }

    const twilio = require('twilio');
    const params = payload as Record<string, string>;

    return twilio.validateRequest(
      this.smsConfig.authToken,
      signature,
      this.smsConfig.statusCallbackUrl,
      params
    );
  }

  /**
   * Parse Twilio webhook payload
   */
  parseWebhook(payload: unknown): WebhookPayload {
    const data = payload as Record<string, string>;

    return {
      provider: 'twilio',
      event: data.SmsStatus || data.MessageStatus || 'unknown',
      messageId: data.SmsSid || data.MessageSid,
      externalId: data.SmsSid || data.MessageSid,
      timestamp: new Date(),
      data: {
        status: this.mapTwilioStatus(data.SmsStatus || data.MessageStatus),
        from: data.From,
        to: data.To,
        body: data.Body,
        numSegments: data.SmsMessageSegments,
        errorCode: data.ErrorCode,
        errorMessage: data.ErrorMessage
      }
    };
  }

  /**
   * Health check for Twilio
   */
  async healthCheck(): Promise<ChannelStatus> {
    const startTime = Date.now();

    try {
      await this.client.api.accounts(this.smsConfig.accountSid).fetch();

      return {
        channel: Channel.SMS,
        isAvailable: true,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        channel: Channel.SMS,
        isAvailable: false,
        lastChecked: new Date(),
        latencyMs: Date.now() - startTime,
        errorRate: 100
      };
    }
  }

  /**
   * Map Twilio status to internal status
   */
  private mapTwilioStatus(status: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      queued: MessageStatus.QUEUED,
      sending: MessageStatus.SENDING,
      sent: MessageStatus.SENT,
      delivered: MessageStatus.DELIVERED,
      undelivered: MessageStatus.FAILED,
      failed: MessageStatus.FAILED,
      canceled: MessageStatus.CANCELLED,
      accepted: MessageStatus.PENDING,
      scheduled: MessageStatus.PENDING,
      read: MessageStatus.READ,
      received: MessageStatus.DELIVERED
    };

    return statusMap[status?.toLowerCase()] || MessageStatus.PENDING;
  }

  /**
   * Handle Twilio errors
   */
  private handleError(error: unknown): ProviderResponse {
    const twilioError = error as {
      code?: number;
      message?: string;
      status?: number;
      moreInfo?: string;
    };

    const isRetryable = twilioError.status ? twilioError.status >= 500 : false;

    return {
      success: false,
      error: {
        code: String(twilioError.code || 'TWILIO_ERROR'),
        message: twilioError.message || 'Unknown Twilio error',
        retryable: isRetryable,
        details: {
          moreInfo: twilioError.moreInfo
        }
      },
      rawResponse: error
    };
  }
}

/**
 * Factory function for creating SMS provider
 */
export function createSmsProvider(config: SmsProviderConfig): SmsProvider {
  return new TwilioSmsProvider(config);
}
