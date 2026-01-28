/**
 * @fileoverview Communication Provider Interfaces
 * @module @ait-core/communications/interfaces
 * @description Defines base interfaces for all communication providers
 */

import { CommunicationChannel, DeliveryStatus, MessagePriority } from './message.types';

/**
 * Base message interface
 */
export interface IMessage {
  id?: string;
  to: string | string[];
  from?: string;
  subject?: string;
  content: string;
  channel: CommunicationChannel;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  templateId?: string;
  templateData?: Record<string, any>;
}

/**
 * Email message interface
 */
export interface IEmailMessage extends IMessage {
  channel: 'EMAIL';
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: IAttachment[];
  html?: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: string[];
}

/**
 * SMS message interface
 */
export interface ISmsMessage extends IMessage {
  channel: 'SMS';
  shortenLinks?: boolean;
  maxSegments?: number;
}

/**
 * WhatsApp message interface
 */
export interface IWhatsAppMessage extends IMessage {
  channel: 'WHATSAPP';
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video' | 'audio';
  buttons?: IWhatsAppButton[];
  listOptions?: IWhatsAppListOption[];
}

/**
 * Attachment interface
 */
export interface IAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

/**
 * WhatsApp button interface
 */
export interface IWhatsAppButton {
  type: 'reply' | 'url' | 'call';
  title: string;
  payload?: string;
  url?: string;
  phoneNumber?: string;
}

/**
 * WhatsApp list option interface
 */
export interface IWhatsAppListOption {
  id: string;
  title: string;
  description?: string;
}

/**
 * Delivery result interface
 */
export interface IDeliveryResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  status: DeliveryStatus;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Provider status interface
 */
export interface IProviderStatus {
  available: boolean;
  rateLimit?: {
    remaining: number;
    reset: Date;
  };
  lastCheck: Date;
  error?: string;
}

/**
 * Base communication provider interface
 */
export interface ICommunicationProvider {
  readonly channel: CommunicationChannel;
  readonly name: string;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Send a message
   */
  send(message: IMessage): Promise<IDeliveryResult>;

  /**
   * Send multiple messages
   */
  sendBatch(messages: IMessage[]): Promise<IDeliveryResult[]>;

  /**
   * Get delivery status
   */
  getStatus(messageId: string): Promise<DeliveryStatus>;

  /**
   * Check provider availability
   */
  checkHealth(): Promise<IProviderStatus>;

  /**
   * Validate message format
   */
  validateMessage(message: IMessage): Promise<boolean>;
}

/**
 * Email provider interface
 */
export interface IEmailProvider extends ICommunicationProvider {
  channel: 'EMAIL';

  /**
   * Send email with template
   */
  sendWithTemplate(
    to: string | string[],
    templateId: string,
    data: Record<string, any>,
    options?: Partial<IEmailMessage>
  ): Promise<IDeliveryResult>;

  /**
   * Track email opens
   */
  trackOpen(messageId: string): Promise<void>;

  /**
   * Track email clicks
   */
  trackClick(messageId: string, url: string): Promise<void>;

  /**
   * Handle bounces
   */
  handleBounce(data: any): Promise<void>;

  /**
   * Handle unsubscribe
   */
  handleUnsubscribe(email: string): Promise<void>;
}

/**
 * SMS provider interface
 */
export interface ISmsProvider extends ICommunicationProvider {
  channel: 'SMS';

  /**
   * Send SMS with link shortening
   */
  sendWithShortLinks(message: ISmsMessage): Promise<IDeliveryResult>;

  /**
   * Get SMS segments count
   */
  getSegmentsCount(content: string): number;

  /**
   * Validate phone number
   */
  validatePhoneNumber(phoneNumber: string): Promise<boolean>;
}

/**
 * WhatsApp provider interface
 */
export interface IWhatsAppProvider extends ICommunicationProvider {
  channel: 'WHATSAPP';

  /**
   * Send template message
   */
  sendTemplate(
    to: string,
    templateName: string,
    components: any[],
    language?: string
  ): Promise<IDeliveryResult>;

  /**
   * Send media message
   */
  sendMedia(
    to: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'video' | 'audio',
    caption?: string
  ): Promise<IDeliveryResult>;

  /**
   * Send interactive message with buttons
   */
  sendInteractive(message: IWhatsAppMessage): Promise<IDeliveryResult>;

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): Promise<void>;
}

/**
 * Template provider interface
 */
export interface ITemplateProvider {
  /**
   * Compile template
   */
  compile(template: string, data: Record<string, any>): Promise<string>;

  /**
   * Register helper function
   */
  registerHelper(name: string, fn: Function): void;

  /**
   * Precompile templates
   */
  precompile(templates: Map<string, string>): Promise<void>;
}

/**
 * Campaign interface
 */
export interface ICampaign {
  id: string;
  name: string;
  channels: CommunicationChannel[];
  audience: ICampaignAudience;
  content: ICampaignContent;
  schedule?: ICampaignSchedule;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  metadata?: Record<string, any>;
}

/**
 * Campaign audience interface
 */
export interface ICampaignAudience {
  segments?: string[];
  filters?: Record<string, any>;
  excludeUnsubscribed?: boolean;
  size?: number;
}

/**
 * Campaign content interface
 */
export interface ICampaignContent {
  templateId?: string;
  subject?: string;
  content: string;
  variant?: string; // For A/B testing
}

/**
 * Campaign schedule interface
 */
export interface ICampaignSchedule {
  startAt: Date;
  endAt?: Date;
  timezone?: string;
  throttle?: number; // Messages per hour
}

/**
 * Analytics data interface
 */
export interface IAnalyticsData {
  sent: number;
  delivered: number;
  failed: number;
  bounced?: number;
  opened?: number;
  clicked?: number;
  unsubscribed?: number;
  revenue?: number;
}
