/**
 * Communication Types
 * Communication records and user preferences
 */

import { Channel, ChannelPriority } from './channel.types';
import { Message, MessageStatus, MessageType } from './message.types';

export interface Communication {
  id: string;
  userId: string;
  contactId?: string;
  organizationId?: string;

  channel: Channel;
  direction: CommunicationDirection;
  type: MessageType;

  message: Message;

  conversationId?: string;
  threadId?: string;
  parentCommunicationId?: string;

  sentiment?: CommunicationSentiment;
  category?: string;
  tags?: string[];

  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;

  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export enum CommunicationDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum CommunicationSentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE'
}

export interface CommunicationPreference {
  id: string;
  userId: string;
  contactId?: string;

  channel: Channel;

  isOptedIn: boolean;
  optInDate?: Date;
  optOutDate?: Date;
  optInSource?: string;
  optOutReason?: string;

  allowedTypes: MessageType[];
  blockedTypes?: MessageType[];

  preferredLanguage?: string;
  timezone?: string;

  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
    allowUrgent: boolean;
  };

  frequency?: {
    maxPerDay?: number;
    maxPerWeek?: number;
    maxPerMonth?: number;
    minIntervalMinutes?: number;
  };

  channelSpecific?: {
    email?: EmailPreferences;
    sms?: SmsPreferences;
    whatsapp?: WhatsAppPreferences;
    voice?: VoicePreferences;
    push?: PushPreferences;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  primaryEmail: string;
  secondaryEmails?: string[];
  format: 'html' | 'plain' | 'both';
  includeImages: boolean;
  groupDigest?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    timeOfDay?: string;
  };
}

export interface SmsPreferences {
  primaryPhone: string;
  allowLinks: boolean;
  maxLength?: number;
}

export interface WhatsAppPreferences {
  phoneNumber: string;
  allowMedia: boolean;
  allowDocuments: boolean;
}

export interface VoicePreferences {
  phoneNumber: string;
  voicemail: boolean;
  maxCallDuration?: number;
  preferredCallTimes?: {
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
  };
}

export interface PushPreferences {
  deviceTokens: DeviceToken[];
  showPreview: boolean;
  sound: boolean;
  badge: boolean;
  categories?: string[];
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  appVersion?: string;
  lastActiveAt?: Date;
  isActive: boolean;
}

export interface CommunicationSummary {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  byChannel: Record<Channel, ChannelSummary>;
  totalSent: number;
  totalReceived: number;
  totalFailed: number;
  engagementRate: number;
  responseRate: number;
  averageResponseTime?: number;
}

export interface ChannelSummary {
  channel: Channel;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  bounced: number;
  unsubscribed: number;
  deliveryRate: number;
  openRate?: number;
  clickRate?: number;
  cost?: number;
}

export interface ConversationThread {
  id: string;
  channel: Channel;
  participants: ConversationParticipant[];

  subject?: string;
  lastMessage?: Message;
  lastMessageAt: Date;

  messageCount: number;
  unreadCount: number;

  status: ConversationStatus;
  priority: ChannelPriority;

  assignedTo?: string;
  tags?: string[];

  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface ConversationParticipant {
  id: string;
  type: 'user' | 'contact' | 'system' | 'bot';
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export enum ConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export interface CommunicationLog {
  id: string;
  communicationId: string;
  messageId: string;

  event: CommunicationEvent;
  status: MessageStatus;

  timestamp: Date;

  details?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;

  providerResponse?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export enum CommunicationEvent {
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  REPLIED = 'REPLIED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED'
}
