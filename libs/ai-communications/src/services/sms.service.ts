/**
 * SMS Service
 *
 * Handles all SMS communications via Twilio
 * Features: Send, templates, bulk, delivery status, opt-out management
 */

import { Twilio } from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import * as Handlebars from 'handlebars';
import { EventEmitter } from 'eventemitter3';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

import {
  SMSMessage,
  SMSSendOptions,
  SMSOptOut,
  Template,
  RenderedTemplate,
  SendResult,
  BulkSendResult,
  MessageStatus,
  DeliveryStatus,
  ChannelType,
  CommunicationEvent,
  WebhookResult
} from '../types';

/**
 * SMS service configuration
 */
export interface SMSServiceConfig {
  tenantId: string;
  accountSid: string;
  authToken: string;
  defaultFrom?: string;
  messagingServiceSid?: string;
  statusCallbackUrl?: string;
}

/**
 * Twilio webhook payload
 */
export interface TwilioSMSWebhook {
  MessageSid: string;
  SmsSid?: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  NumSegments?: string;
  SmsStatus?: string;
  MessageStatus?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  ApiVersion?: string;
}

/**
 * SMS Service Class
 */
export class SMSService extends EventEmitter {
  private config: SMSServiceConfig;
  private client: Twilio;
  private templates: Map<string, Template> = new Map();
  private optOutList: Map<string, SMSOptOut> = new Map();

  constructor(config: SMSServiceConfig) {
    super();
    this.config = config;
    this.client = new Twilio(config.accountSid, config.authToken);
  }

  /**
   * Send a single SMS
   */
  async send(
    to: string,
    message: string,
    options?: SMSSendOptions
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      // Validate phone number
      if (!this.isValidPhone(to)) {
        return {
          success: false,
          messageId,
          status: MessageStatus.FAILED,
          error: {
            code: 'INVALID_PHONE',
            message: `Invalid phone number: ${to}`
          }
        };
      }

      // Normalize phone number
      const normalizedTo = this.normalizePhone(to);

      // Check opt-out list
      if (this.isOptedOut(normalizedTo)) {
        return {
          success: false,
          messageId,
          status: MessageStatus.REJECTED,
          error: {
            code: 'OPTED_OUT',
            message: `Phone number has opted out: ${normalizedTo}`
          }
        };
      }

      // Build message options
      const messageOptions: any = {
        to: normalizedTo,
        body: message,
        statusCallback: options?.statusCallback || this.config.statusCallbackUrl
      };

      // Use messaging service or from number
      if (this.config.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.config.messagingServiceSid;
      } else {
        messageOptions.from = options?.from || this.config.defaultFrom;
      }

      // Set validity period
      if (options?.validityPeriod) {
        messageOptions.validityPeriod = options.validityPeriod;
      }

      // Set max price
      if (options?.maxPrice) {
        messageOptions.maxPrice = options.maxPrice;
      }

      // Schedule message
      if (options?.scheduledAt) {
        messageOptions.sendAt = options.scheduledAt.toISOString();
        messageOptions.scheduleType = 'fixed';
      }

      // Send via Twilio
      const twilioMessage = await this.client.messages.create(messageOptions);

      // Emit event
      this.emitEvent('message.sent', messageId, {
        to: normalizedTo,
        providerId: twilioMessage.sid
      });

      return {
        success: true,
        messageId,
        providerId: twilioMessage.sid,
        status: this.mapTwilioStatus(twilioMessage.status)
      };
    } catch (error) {
      const err = error as Error & { code?: number; moreInfo?: string };

      this.emitEvent('message.failed', messageId, {
        to,
        error: err.message,
        code: err.code
      });

      return {
        success: false,
        messageId,
        status: MessageStatus.FAILED,
        error: {
          code: err.code?.toString() || 'SEND_FAILED',
          message: err.message,
          details: err.moreInfo
        }
      };
    }
  }

  /**
   * Send SMS using a template
   */
  async sendTemplate(
    to: string,
    templateCode: string,
    data: Record<string, unknown>,
    options?: SMSSendOptions
  ): Promise<SendResult> {
    const template = this.templates.get(templateCode);

    if (!template) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template not found: ${templateCode}`
        }
      };
    }

    const rendered = this.renderTemplate(template, data);

    if (rendered.missingVariables && rendered.missingVariables.length > 0) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'MISSING_VARIABLES',
          message: `Missing required variables: ${rendered.missingVariables.join(', ')}`
        }
      };
    }

    return this.send(to, rendered.bodyText || '', options);
  }

  /**
   * Send bulk SMS messages
   */
  async sendBulk(
    recipients: Array<{
      to: string;
      data?: Record<string, unknown>;
    }>,
    template: Template | string,
    defaultData?: Record<string, unknown>,
    options?: SMSSendOptions & { batchSize?: number; delayMs?: number }
  ): Promise<BulkSendResult> {
    const batchSize = options?.batchSize || 30;
    const delayMs = options?.delayMs || 100;
    const results: BulkSendResult['results'] = [];

    // Get template
    const templateObj = typeof template === 'string'
      ? this.templates.get(template)
      : template;

    if (!templateObj) {
      return {
        total: recipients.length,
        successful: 0,
        failed: recipients.length,
        results: recipients.map(r => ({
          recipient: r.to,
          result: {
            success: false,
            status: MessageStatus.FAILED,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found'
            }
          }
        }))
      };
    }

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (recipient) => {
        const mergedData = { ...defaultData, ...recipient.data };
        const rendered = this.renderTemplate(templateObj, mergedData);

        const result = await this.send(
          recipient.to,
          rendered.bodyText || '',
          options
        );

        return {
          recipient: recipient.to,
          result
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await this.delay(delayMs);
      }
    }

    const successful = results.filter(r => r.result.success).length;

    return {
      total: recipients.length,
      successful,
      failed: recipients.length - successful,
      results
    };
  }

  /**
   * Get delivery status for a message
   */
  async getDeliveryStatus(
    messageId: string,
    providerId?: string
  ): Promise<{
    status: DeliveryStatus;
    providerStatus?: string;
    errorCode?: string;
    errorMessage?: string;
    timestamp?: Date;
  }> {
    try {
      const sid = providerId || messageId;
      const message = await this.client.messages(sid).fetch();

      return {
        status: this.mapTwilioDeliveryStatus(message.status),
        providerStatus: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage || undefined,
        timestamp: message.dateUpdated ? new Date(message.dateUpdated) : undefined
      };
    } catch (error) {
      const err = error as Error;
      return {
        status: DeliveryStatus.UNKNOWN,
        errorMessage: err.message
      };
    }
  }

  /**
   * Handle incoming SMS webhook
   */
  async handleIncoming(payload: TwilioSMSWebhook): Promise<WebhookResult> {
    const messageId = uuidv4();

    try {
      // Normalize phone number
      const from = this.normalizePhone(payload.From);
      const to = this.normalizePhone(payload.To);

      // Check for opt-out commands
      const body = payload.Body.trim().toUpperCase();
      if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'].includes(body)) {
        await this.optOut(from, 'STOP');

        return {
          processed: true,
          messageId,
          event: {
            id: uuidv4(),
            tenantId: this.config.tenantId,
            type: 'message.incoming',
            channel: ChannelType.SMS,
            timestamp: new Date(),
            data: {
              messageId,
              metadata: {
                type: 'opt_out',
                from,
                command: body
              }
            }
          }
        };
      }

      // Create SMS message object
      const smsMessage: SMSMessage = {
        id: messageId,
        tenantId: this.config.tenantId,
        channel: ChannelType.SMS,
        status: MessageStatus.DELIVERED,
        direction: 'INBOUND',
        from,
        to,
        body: payload.Body,
        segments: payload.NumSegments ? parseInt(payload.NumSegments) : undefined,
        providerId: payload.MessageSid,
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveredAt: new Date()
      };

      // Emit incoming message event
      const event: CommunicationEvent = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        type: 'message.incoming',
        channel: ChannelType.SMS,
        timestamp: new Date(),
        data: {
          messageId,
          contact: {
            phone: from
          },
          metadata: {
            message: smsMessage
          }
        }
      };

      this.emit('message.incoming', event);
      this.emit('event', event);

      return {
        processed: true,
        messageId,
        event
      };
    } catch (error) {
      const err = error as Error;

      return {
        processed: false,
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Handle status callback webhook
   */
  async handleStatusCallback(payload: TwilioSMSWebhook): Promise<WebhookResult> {
    try {
      const status = payload.MessageStatus || payload.SmsStatus;
      const deliveryStatus = this.mapTwilioDeliveryStatus(status);

      let eventType: CommunicationEvent['type'];
      switch (deliveryStatus) {
        case DeliveryStatus.DELIVERED:
          eventType = 'message.delivered';
          break;
        case DeliveryStatus.FAILED:
        case DeliveryStatus.UNDELIVERED:
          eventType = 'message.failed';
          break;
        default:
          eventType = 'message.sent';
      }

      const event: CommunicationEvent = {
        id: uuidv4(),
        tenantId: this.config.tenantId,
        type: eventType,
        channel: ChannelType.SMS,
        timestamp: new Date(),
        data: {
          messageId: payload.MessageSid,
          metadata: {
            status: deliveryStatus,
            providerStatus: status,
            errorCode: payload.ErrorCode,
            errorMessage: payload.ErrorMessage
          }
        }
      };

      this.emit(eventType, event);
      this.emit('event', event);

      return {
        processed: true,
        messageId: payload.MessageSid,
        event
      };
    } catch (error) {
      const err = error as Error;

      return {
        processed: false,
        error: {
          code: 'STATUS_CALLBACK_ERROR',
          message: err.message
        }
      };
    }
  }

  /**
   * Opt out a phone number
   */
  async optOut(
    phoneNumber: string,
    channel: SMSOptOut['channel'] = 'MANUAL',
    reason?: string
  ): Promise<boolean> {
    const normalized = this.normalizePhone(phoneNumber);

    const optOutRecord: SMSOptOut = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      phoneNumber: normalized,
      optedOutAt: new Date(),
      reason,
      channel
    };

    this.optOutList.set(normalized, optOutRecord);

    this.emit('opt_out', optOutRecord);

    return true;
  }

  /**
   * Opt in a phone number (remove from opt-out list)
   */
  async optIn(phoneNumber: string): Promise<boolean> {
    const normalized = this.normalizePhone(phoneNumber);

    if (this.optOutList.has(normalized)) {
      this.optOutList.delete(normalized);
      this.emit('opt_in', { phoneNumber: normalized });
      return true;
    }

    return false;
  }

  /**
   * Check if a phone number is opted out
   */
  isOptedOut(phoneNumber: string): boolean {
    const normalized = this.normalizePhone(phoneNumber);
    return this.optOutList.has(normalized);
  }

  /**
   * Get all opted out numbers
   */
  getOptOutList(): SMSOptOut[] {
    return Array.from(this.optOutList.values());
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.code, template);
  }

  /**
   * Validate phone number
   */
  isValidPhone(phone: string): boolean {
    try {
      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  }

  /**
   * Normalize phone number to E.164 format
   */
  normalizePhone(phone: string): string {
    try {
      const parsed = parsePhoneNumber(phone);
      return parsed?.format('E.164') || phone;
    } catch {
      return phone;
    }
  }

  /**
   * Calculate message segments
   */
  calculateSegments(message: string): {
    segments: number;
    encoding: 'GSM-7' | 'UCS-2';
    charactersLeft: number;
  } {
    // GSM-7 character set
    const gsm7Chars = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
    const gsm7Extended = '^{}\\[~]|€';

    let encoding: 'GSM-7' | 'UCS-2' = 'GSM-7';
    let charCount = 0;

    for (const char of message) {
      if (gsm7Chars.includes(char)) {
        charCount += 1;
      } else if (gsm7Extended.includes(char)) {
        charCount += 2; // Extended chars take 2 bytes
      } else {
        encoding = 'UCS-2';
        break;
      }
    }

    if (encoding === 'UCS-2') {
      charCount = message.length;
    }

    let segmentSize: number;
    let multipartSegmentSize: number;

    if (encoding === 'GSM-7') {
      segmentSize = 160;
      multipartSegmentSize = 153;
    } else {
      segmentSize = 70;
      multipartSegmentSize = 67;
    }

    let segments: number;
    let charactersLeft: number;

    if (charCount <= segmentSize) {
      segments = 1;
      charactersLeft = segmentSize - charCount;
    } else {
      segments = Math.ceil(charCount / multipartSegmentSize);
      charactersLeft = (segments * multipartSegmentSize) - charCount;
    }

    return { segments, encoding, charactersLeft };
  }

  /**
   * Render a template with data
   */
  private renderTemplate(template: Template, data: Record<string, unknown>): RenderedTemplate {
    const missingVariables: string[] = [];

    // Check for required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in data)) {
        missingVariables.push(variable.name);
      }
    }

    if (missingVariables.length > 0) {
      return { missingVariables };
    }

    // Compile and render template
    const textTemplate = template.bodyText ? Handlebars.compile(template.bodyText) : null;

    return {
      bodyText: textTemplate ? textTemplate(data) : undefined
    };
  }

  /**
   * Map Twilio status to MessageStatus
   */
  private mapTwilioStatus(status: string): MessageStatus {
    switch (status) {
      case 'queued':
        return MessageStatus.QUEUED;
      case 'sending':
        return MessageStatus.SENDING;
      case 'sent':
        return MessageStatus.SENT;
      case 'delivered':
        return MessageStatus.DELIVERED;
      case 'read':
        return MessageStatus.READ;
      case 'failed':
        return MessageStatus.FAILED;
      case 'undelivered':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.QUEUED;
    }
  }

  /**
   * Map Twilio status to DeliveryStatus
   */
  private mapTwilioDeliveryStatus(status?: string): DeliveryStatus {
    switch (status) {
      case 'accepted':
        return DeliveryStatus.ACCEPTED;
      case 'queued':
        return DeliveryStatus.QUEUED;
      case 'sending':
        return DeliveryStatus.SENDING;
      case 'sent':
        return DeliveryStatus.SENT;
      case 'delivered':
        return DeliveryStatus.DELIVERED;
      case 'undelivered':
        return DeliveryStatus.UNDELIVERED;
      case 'failed':
        return DeliveryStatus.FAILED;
      default:
        return DeliveryStatus.UNKNOWN;
    }
  }

  /**
   * Emit communication event
   */
  private emitEvent(
    type: CommunicationEvent['type'],
    messageId: string,
    data: Record<string, unknown>
  ): void {
    const event: CommunicationEvent = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      type,
      channel: ChannelType.SMS,
      timestamp: new Date(),
      data: {
        messageId,
        ...data
      }
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
}

export default SMSService;
