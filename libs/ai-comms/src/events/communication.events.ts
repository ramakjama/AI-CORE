/**
 * Communication Events
 * Event definitions for messaging lifecycle
 */

import { EventEmitter } from 'eventemitter3';
import { Channel } from '../types/channel.types';
import { Message, MessageStatus, MessageType } from '../types/message.types';

export interface BaseEvent {
  id: string;
  timestamp: Date;
  source: string;
}

export interface MessageSentEvent extends BaseEvent {
  type: 'MESSAGE_SENT';
  messageId: string;
  externalId?: string;
  channel: Channel;
  messageType: MessageType;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  campaignId?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageDeliveredEvent extends BaseEvent {
  type: 'MESSAGE_DELIVERED';
  messageId: string;
  externalId?: string;
  channel: Channel;
  deliveredAt: Date;
  recipientId?: string;
  providerResponse?: Record<string, unknown>;
}

export interface MessageFailedEvent extends BaseEvent {
  type: 'MESSAGE_FAILED';
  messageId: string;
  externalId?: string;
  channel: Channel;
  errorCode: string;
  errorMessage: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  willRetry: boolean;
  nextRetryAt?: Date;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface MessageOpenedEvent extends BaseEvent {
  type: 'MESSAGE_OPENED';
  messageId: string;
  externalId?: string;
  channel: Channel;
  openedAt: Date;
  recipientId?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface MessageClickedEvent extends BaseEvent {
  type: 'MESSAGE_CLICKED';
  messageId: string;
  externalId?: string;
  channel: Channel;
  clickedAt: Date;
  url: string;
  recipientId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface MessageBouncedEvent extends BaseEvent {
  type: 'MESSAGE_BOUNCED';
  messageId: string;
  externalId?: string;
  channel: Channel;
  bounceType: 'hard' | 'soft' | 'block';
  bounceReason: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export interface MessageUnsubscribedEvent extends BaseEvent {
  type: 'MESSAGE_UNSUBSCRIBED';
  messageId: string;
  channel: Channel;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  unsubscribedAt: Date;
  reason?: string;
}

export interface MessageComplainedEvent extends BaseEvent {
  type: 'MESSAGE_COMPLAINED';
  messageId: string;
  channel: Channel;
  recipientEmail?: string;
  complainedAt: Date;
  complaintType?: string;
}

export interface CampaignStartedEvent extends BaseEvent {
  type: 'CAMPAIGN_STARTED';
  campaignId: string;
  campaignName: string;
  channel: Channel;
  totalRecipients: number;
}

export interface CampaignCompletedEvent extends BaseEvent {
  type: 'CAMPAIGN_COMPLETED';
  campaignId: string;
  campaignName: string;
  channel: Channel;
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  duration: number; // milliseconds
}

export interface CampaignPausedEvent extends BaseEvent {
  type: 'CAMPAIGN_PAUSED';
  campaignId: string;
  campaignName: string;
  reason?: string;
  pausedBy?: string;
}

export interface CampaignFailedEvent extends BaseEvent {
  type: 'CAMPAIGN_FAILED';
  campaignId: string;
  campaignName: string;
  errorCode: string;
  errorMessage: string;
  processedCount: number;
  totalCount: number;
}

export type CommunicationEvent =
  | MessageSentEvent
  | MessageDeliveredEvent
  | MessageFailedEvent
  | MessageOpenedEvent
  | MessageClickedEvent
  | MessageBouncedEvent
  | MessageUnsubscribedEvent
  | MessageComplainedEvent
  | CampaignStartedEvent
  | CampaignCompletedEvent
  | CampaignPausedEvent
  | CampaignFailedEvent;

export type CommunicationEventType = CommunicationEvent['type'];

export interface CommunicationEventHandler<T extends CommunicationEvent = CommunicationEvent> {
  (event: T): void | Promise<void>;
}

/**
 * Communication Event Emitter
 * Central event bus for all communication events
 */
export class CommunicationEventEmitter extends EventEmitter {
  private static instance: CommunicationEventEmitter;

  private constructor() {
    super();
  }

  static getInstance(): CommunicationEventEmitter {
    if (!CommunicationEventEmitter.instance) {
      CommunicationEventEmitter.instance = new CommunicationEventEmitter();
    }
    return CommunicationEventEmitter.instance;
  }

  emitEvent<T extends CommunicationEvent>(event: T): void {
    this.emit(event.type, event);
    this.emit('*', event); // Wildcard for all events
  }

  onEvent<T extends CommunicationEvent>(
    eventType: T['type'] | '*',
    handler: CommunicationEventHandler<T>
  ): void {
    this.on(eventType, handler);
  }

  offEvent<T extends CommunicationEvent>(
    eventType: T['type'] | '*',
    handler: CommunicationEventHandler<T>
  ): void {
    this.off(eventType, handler);
  }

  onceEvent<T extends CommunicationEvent>(
    eventType: T['type'],
    handler: CommunicationEventHandler<T>
  ): void {
    this.once(eventType, handler);
  }
}

// Helper functions to create events
export function createMessageSentEvent(
  messageId: string,
  channel: Channel,
  messageType: MessageType,
  data: Partial<MessageSentEvent> = {}
): MessageSentEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    source: 'ai-comms',
    type: 'MESSAGE_SENT',
    messageId,
    channel,
    messageType,
    ...data
  };
}

export function createMessageDeliveredEvent(
  messageId: string,
  channel: Channel,
  data: Partial<MessageDeliveredEvent> = {}
): MessageDeliveredEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    source: 'ai-comms',
    type: 'MESSAGE_DELIVERED',
    messageId,
    channel,
    deliveredAt: new Date(),
    ...data
  };
}

export function createMessageFailedEvent(
  messageId: string,
  channel: Channel,
  errorCode: string,
  errorMessage: string,
  data: Partial<MessageFailedEvent> = {}
): MessageFailedEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    source: 'ai-comms',
    type: 'MESSAGE_FAILED',
    messageId,
    channel,
    errorCode,
    errorMessage,
    retryable: data.retryable ?? true,
    retryCount: data.retryCount ?? 0,
    maxRetries: data.maxRetries ?? 3,
    willRetry: data.willRetry ?? false,
    ...data
  };
}

export function createMessageOpenedEvent(
  messageId: string,
  channel: Channel,
  data: Partial<MessageOpenedEvent> = {}
): MessageOpenedEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    source: 'ai-comms',
    type: 'MESSAGE_OPENED',
    messageId,
    channel,
    openedAt: new Date(),
    ...data
  };
}

export function createMessageClickedEvent(
  messageId: string,
  channel: Channel,
  url: string,
  data: Partial<MessageClickedEvent> = {}
): MessageClickedEvent {
  return {
    id: generateEventId(),
    timestamp: new Date(),
    source: 'ai-comms',
    type: 'MESSAGE_CLICKED',
    messageId,
    channel,
    url,
    clickedAt: new Date(),
    ...data
  };
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Default instance export
export const communicationEvents = CommunicationEventEmitter.getInstance();
