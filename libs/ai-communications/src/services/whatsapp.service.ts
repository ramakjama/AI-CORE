/**
 * WhatsApp Service
 *
 * Handles all WhatsApp communications via Cloud API
 * Features: Text, templates, media, interactive messages, webhooks
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';

import {
  WhatsAppMessage,
  WhatsAppMedia,
  WhatsAppLocation,
  WhatsAppContact,
  WhatsAppInteractive,
  WhatsAppTemplate,
  WhatsAppWebhookPayload,
  WhatsAppMessageType,
  Template,
  RenderedTemplate,
  SendResult,
  BulkSendResult,
  MessageStatus,
  DeliveryStatus,
  ChannelType,
  CommunicationEvent,
  WebhookResult,
  Conversation,
  ConversationStatus,
  Priority
} from '../types';

/**
 * WhatsApp service configuration
 */
export interface WhatsAppServiceConfig {
  tenantId: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
  apiVersion?: string;
}

/**
 * WhatsApp Cloud API response
 */
interface WhatsAppAPIResponse {
  messaging_product: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Interactive button
 */
export interface InteractiveButton {
  id: string;
  title: string;
}

/**
 * Interactive list section
 */
export interface InteractiveListSection {
  title?: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

/**
 * WhatsApp Service Class
 */
export class WhatsAppService extends EventEmitter {
  private config: WhatsAppServiceConfig;
  private client: AxiosInstance;
  private templates: Map<string, Template> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private apiBaseUrl: string;

  constructor(config: WhatsAppServiceConfig) {
    super();
    this.config = config;

    const apiVersion = config.apiVersion || 'v18.0';
    this.apiBaseUrl = `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}`;

    this.client = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send a text message
   */
  async sendText(
    to: string,
    message: string,
    previewUrl: boolean = false
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'text',
        text: {
          preview_url: previewUrl,
          body: message
        }
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'text'
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send a template message (WhatsApp Business approved templates)
   */
  async sendTemplate(
    to: string,
    templateCode: string,
    data: Record<string, unknown>,
    language: string = 'en'
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const template = this.templates.get(templateCode);

      if (!template) {
        return {
          success: false,
          messageId,
          status: MessageStatus.FAILED,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template not found: ${templateCode}`
          }
        };
      }

      // Build template components with parameters
      const components = this.buildTemplateComponents(template, data);

      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'template',
        template: {
          name: template.whatsappTemplateId || template.code,
          language: {
            code: language
          },
          components
        }
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'template',
        templateCode
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send media message (image, video, audio, document)
   */
  async sendMedia(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    caption?: string,
    filename?: string
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const mediaPayload: any = {
        link: mediaUrl
      };

      if (caption) {
        mediaPayload.caption = caption;
      }

      if (filename && mediaType === 'document') {
        mediaPayload.filename = filename;
      }

      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: mediaType,
        [mediaType]: mediaPayload
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: mediaType,
        mediaUrl
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send interactive message (buttons or list)
   */
  async sendInteractive(
    to: string,
    type: 'button' | 'list',
    body: string,
    options: {
      header?: { type: 'text' | 'image' | 'video' | 'document'; content: string };
      footer?: string;
      buttons?: InteractiveButton[];
      sections?: InteractiveListSection[];
      buttonText?: string;
    }
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const interactive: WhatsAppInteractive = {
        type,
        body: { text: body },
        action: {} as any
      };

      // Add header
      if (options.header) {
        interactive.header = {
          type: options.header.type,
          ...(options.header.type === 'text'
            ? { text: options.header.content }
            : { [options.header.type]: { link: options.header.content } })
        };
      }

      // Add footer
      if (options.footer) {
        interactive.footer = { text: options.footer };
      }

      // Add action based on type
      if (type === 'button' && options.buttons) {
        interactive.action = {
          buttons: options.buttons.map(btn => ({
            type: 'reply' as const,
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        };
      } else if (type === 'list' && options.sections) {
        interactive.action = {
          button: options.buttonText || 'Select',
          sections: options.sections
        };
      }

      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'interactive',
        interactive
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'interactive',
        interactiveType: type
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send location message
   */
  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const location: WhatsAppLocation = {
        latitude,
        longitude,
        name,
        address
      };

      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'location',
        location
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'location',
        location
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send contacts
   */
  async sendContacts(
    to: string,
    contacts: WhatsAppContact[]
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'contacts',
        contacts
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'contacts'
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Send reaction to a message
   */
  async sendReaction(
    to: string,
    messageId: string,
    emoji: string
  ): Promise<SendResult> {
    const localMessageId = uuidv4();

    try {
      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'reaction',
        reaction: {
          message_id: messageId,
          emoji
        }
      });

      const wamid = response.data.messages?.[0]?.id;

      return {
        success: true,
        messageId: localMessageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, localMessageId);
    }
  }

  /**
   * Reply to a specific message
   */
  async reply(
    to: string,
    replyToMessageId: string,
    message: string
  ): Promise<SendResult> {
    const messageId = uuidv4();

    try {
      const response = await this.client.post<WhatsAppAPIResponse>('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.normalizePhone(to),
        type: 'text',
        context: {
          message_id: replyToMessageId
        },
        text: {
          body: message
        }
      });

      const wamid = response.data.messages?.[0]?.id;

      this.emitEvent('message.sent', messageId, {
        to,
        wamid,
        type: 'reply',
        replyTo: replyToMessageId
      });

      return {
        success: true,
        messageId,
        providerId: wamid,
        status: MessageStatus.SENT
      };
    } catch (error) {
      return this.handleAPIError(error, messageId);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(wamid: string): Promise<boolean> {
    try {
      await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: wamid
      });

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Handle incoming webhook from WhatsApp Cloud API
   */
  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<WebhookResult> {
    try {
      if (payload.object !== 'whatsapp_business_account') {
        return {
          processed: false,
          error: {
            code: 'INVALID_OBJECT',
            message: 'Invalid webhook object type'
          }
        };
      }

      const results: WebhookResult[] = [];

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const value = change.value;

          // Handle incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              const result = await this.processIncomingMessage(
                message,
                value.contacts?.[0],
                value.metadata
              );
              results.push(result);
            }
          }

          // Handle message status updates
          if (value.statuses) {
            for (const status of value.statuses) {
              const result = await this.processStatusUpdate(status);
              results.push(result);
            }
          }
        }
      }

      // Return combined result
      const allProcessed = results.every(r => r.processed);
      return {
        processed: allProcessed,
        messageId: results[0]?.messageId,
        conversationId: results[0]?.conversationId,
        event: results[0]?.event
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
   * Verify webhook for WhatsApp
   */
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Get or create conversation for a contact
   */
  async getConversation(contactId: string): Promise<Conversation | null> {
    // Check existing conversations
    for (const conv of this.conversations.values()) {
      if (conv.contact.whatsappId === contactId) {
        return conv;
      }
    }

    return null;
  }

  /**
   * Create a new conversation
   */
  createConversation(
    contactId: string,
    contactName?: string
  ): Conversation {
    const conversation: Conversation = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      contact: {
        whatsappId: contactId,
        phone: contactId,
        name: contactName
      },
      channels: [ChannelType.WHATSAPP],
      status: ConversationStatus.OPEN,
      firstMessageAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Assign conversation to agent
   */
  async assignToAgent(
    conversationId: string,
    agentId: string
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.assignedTo = agentId;
    conversation.assignedAt = new Date();
    conversation.status = ConversationStatus.ASSIGNED;
    conversation.updatedAt = new Date();

    this.emitEvent('conversation.assigned', conversationId, {
      agentId
    });

    return true;
  }

  /**
   * Upload media to WhatsApp
   */
  async uploadMedia(
    file: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<{ id: string } | null> {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', new Blob([file], { type: mimeType }), filename);
      formData.append('type', mimeType);

      const response = await axios.post(
        `https://graph.facebook.com/${this.config.apiVersion || 'v18.0'}/${this.config.phoneNumberId}/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return { id: response.data.id };
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  /**
   * Get media URL from media ID
   */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${this.config.apiVersion || 'v18.0'}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return null;
    }
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.code, template);
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(
    message: any,
    contact: any,
    metadata: any
  ): Promise<WebhookResult> {
    const messageId = uuidv4();
    const contactId = message.from;

    // Get or create conversation
    let conversation = await this.getConversation(contactId);
    if (!conversation) {
      conversation = this.createConversation(
        contactId,
        contact?.profile?.name
      );
    }

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.messageCount++;
    conversation.unreadCount++;
    conversation.updatedAt = new Date();

    // Build WhatsApp message object
    const waMessage: WhatsAppMessage = {
      id: messageId,
      tenantId: this.config.tenantId,
      channel: ChannelType.WHATSAPP,
      status: MessageStatus.DELIVERED,
      direction: 'INBOUND',
      conversationId: conversation.id,
      from: message.from,
      to: metadata.phone_number_id,
      type: message.type as WhatsAppMessageType,
      wamid: message.id,
      timestamp: parseInt(message.timestamp),
      createdAt: new Date(),
      updatedAt: new Date(),
      deliveredAt: new Date()
    };

    // Add content based on type
    switch (message.type) {
      case 'text':
        waMessage.text = message.text;
        break;
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
      case 'sticker':
        (waMessage as any)[message.type] = message[message.type];
        break;
      case 'location':
        waMessage.location = message.location;
        break;
      case 'contacts':
        waMessage.contacts = message.contacts;
        break;
      case 'interactive':
        waMessage.interactive = message.interactive;
        break;
    }

    // Add context if reply
    if (message.context) {
      waMessage.context = message.context;
    }

    // Emit event
    const event: CommunicationEvent = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      type: 'message.incoming',
      channel: ChannelType.WHATSAPP,
      timestamp: new Date(),
      data: {
        messageId,
        conversationId: conversation.id,
        contact: {
          whatsappId: contactId,
          name: contact?.profile?.name
        },
        metadata: {
          message: waMessage
        }
      }
    };

    this.emit('message.incoming', event);
    this.emit('event', event);

    return {
      processed: true,
      messageId,
      conversationId: conversation.id,
      event
    };
  }

  /**
   * Process status update
   */
  private async processStatusUpdate(status: any): Promise<WebhookResult> {
    const deliveryStatus = this.mapStatus(status.status);

    let eventType: CommunicationEvent['type'];
    switch (status.status) {
      case 'delivered':
        eventType = 'message.delivered';
        break;
      case 'read':
        eventType = 'message.read';
        break;
      case 'failed':
        eventType = 'message.failed';
        break;
      default:
        eventType = 'message.sent';
    }

    const event: CommunicationEvent = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      type: eventType,
      channel: ChannelType.WHATSAPP,
      timestamp: new Date(),
      data: {
        messageId: status.id,
        metadata: {
          status: deliveryStatus,
          recipientId: status.recipient_id,
          conversation: status.conversation,
          pricing: status.pricing,
          errors: status.errors
        }
      }
    };

    this.emit(eventType, event);
    this.emit('event', event);

    return {
      processed: true,
      messageId: status.id,
      event
    };
  }

  /**
   * Build template components with parameters
   */
  private buildTemplateComponents(
    template: Template,
    data: Record<string, unknown>
  ): any[] {
    const components: any[] = [];

    // Build header parameters if any
    const headerParams = template.variables.filter(v => v.name.startsWith('header_'));
    if (headerParams.length > 0) {
      components.push({
        type: 'header',
        parameters: headerParams.map(p => ({
          type: p.type === 'text' ? 'text' : p.type,
          text: data[p.name] as string
        }))
      });
    }

    // Build body parameters
    const bodyParams = template.variables.filter(v => !v.name.startsWith('header_') && !v.name.startsWith('button_'));
    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams.map(p => ({
          type: p.type === 'text' ? 'text' : p.type,
          text: data[p.name] as string
        }))
      });
    }

    // Build button parameters if any
    const buttonParams = template.variables.filter(v => v.name.startsWith('button_'));
    for (const param of buttonParams) {
      const match = param.name.match(/button_(\d+)_(.+)/);
      if (match) {
        const index = parseInt(match[1]);
        components.push({
          type: 'button',
          sub_type: 'url',
          index,
          parameters: [{
            type: 'text',
            text: data[param.name] as string
          }]
        });
      }
    }

    return components;
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    // Remove any non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Remove leading + if present
    if (normalized.startsWith('+')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  /**
   * Map WhatsApp status to DeliveryStatus
   */
  private mapStatus(status: string): DeliveryStatus {
    switch (status) {
      case 'sent':
        return DeliveryStatus.SENT;
      case 'delivered':
        return DeliveryStatus.DELIVERED;
      case 'read':
        return DeliveryStatus.DELIVERED;
      case 'failed':
        return DeliveryStatus.FAILED;
      default:
        return DeliveryStatus.UNKNOWN;
    }
  }

  /**
   * Handle API error
   */
  private handleAPIError(error: any, messageId: string): SendResult {
    const err = error as any;
    const apiError = err.response?.data?.error;

    this.emitEvent('message.failed', messageId, {
      error: apiError?.message || err.message,
      code: apiError?.code
    });

    return {
      success: false,
      messageId,
      status: MessageStatus.FAILED,
      error: {
        code: apiError?.code?.toString() || 'API_ERROR',
        message: apiError?.message || err.message,
        details: apiError
      }
    };
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
      channel: ChannelType.WHATSAPP,
      timestamp: new Date(),
      data: {
        messageId,
        ...data
      }
    };

    this.emit(type, event);
    this.emit('event', event);
  }
}

export default WhatsAppService;
