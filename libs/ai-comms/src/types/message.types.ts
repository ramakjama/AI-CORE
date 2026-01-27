/**
 * Message Types
 * Core message definitions for all channels
 */

import { Channel, ChannelPriority } from './channel.types';

export enum MessageStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  BOUNCED = 'BOUNCED',
  SPAM = 'SPAM',
  UNSUBSCRIBED = 'UNSUBSCRIBED'
}

export enum MessageType {
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING',
  NOTIFICATION = 'NOTIFICATION',
  OTP = 'OTP',
  REMINDER = 'REMINDER',
  ALERT = 'ALERT'
}

export interface MessageRecipient {
  id?: string;
  email?: string;
  phone?: string;
  deviceToken?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageSender {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
  replyTo?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content?: string | Buffer; // Base64 or Buffer
  url?: string;
}

export interface MessageContent {
  subject?: string;
  body: string;
  htmlBody?: string;
  plainTextBody?: string;
  previewText?: string;
  attachments?: MessageAttachment[];
  mediaUrl?: string;
  mediaType?: string;
}

export interface Message {
  id: string;
  externalId?: string;
  channel: Channel;
  type: MessageType;
  status: MessageStatus;
  priority: ChannelPriority;

  sender: MessageSender;
  recipient: MessageRecipient;
  content: MessageContent;

  templateId?: string;
  templateData?: Record<string, unknown>;

  campaignId?: string;
  conversationId?: string;
  replyToMessageId?: string;

  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;

  retryCount: number;
  maxRetries: number;
  lastError?: string;

  metadata?: Record<string, unknown>;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  channel: Channel;
  type: MessageType;

  subject?: string;
  body: string;
  htmlBody?: string;

  variables: TemplateVariable[];
  defaultData?: Record<string, unknown>;

  isActive: boolean;
  version: number;

  category?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface SendMessageRequest {
  channel: Channel;
  type?: MessageType;
  priority?: ChannelPriority;

  recipient: MessageRecipient;
  sender?: MessageSender;

  content?: MessageContent;
  templateId?: string;
  templateData?: Record<string, unknown>;

  scheduledAt?: Date;
  expiresAt?: Date;

  campaignId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];

  options?: {
    trackOpens?: boolean;
    trackClicks?: boolean;
    unsubscribeUrl?: string;
    sandbox?: boolean;
  };
}

export interface SendMessageResponse {
  messageId: string;
  externalId?: string;
  status: MessageStatus;
  channel: Channel;
  scheduledAt?: Date;
  estimatedDelivery?: Date;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface BulkSendRequest {
  channel: Channel;
  type?: MessageType;
  priority?: ChannelPriority;

  recipients: MessageRecipient[];
  sender?: MessageSender;

  content?: MessageContent;
  templateId?: string;
  templateData?: Record<string, unknown>;

  campaignId?: string;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface BulkSendResponse {
  batchId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  messages: SendMessageResponse[];
  errors?: Array<{
    recipient: MessageRecipient;
    error: string;
  }>;
}

export interface MessageSearchQuery {
  channel?: Channel;
  status?: MessageStatus | MessageStatus[];
  type?: MessageType;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  campaignId?: string;
  templateId?: string;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'sentAt' | 'deliveredAt';
  sortOrder?: 'asc' | 'desc';
}
