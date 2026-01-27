/**
 * Communication Channel Types
 * Defines all supported communication channels
 */

export enum Channel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
  PUSH = 'PUSH'
}

export enum ChannelPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

export interface ChannelConfig {
  channel: Channel;
  enabled: boolean;
  priority: ChannelPriority;
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitPerSecond: number;
  rateLimitPerDay: number;
  costPerMessage?: number;
  metadata?: Record<string, unknown>;
}

export interface ChannelCapabilities {
  channel: Channel;
  supportsAttachments: boolean;
  supportsTemplates: boolean;
  supportsScheduling: boolean;
  supportsBatching: boolean;
  supportsDeliveryReceipts: boolean;
  supportsReadReceipts: boolean;
  maxMessageLength?: number;
  maxAttachmentSize?: number;
  supportedMediaTypes?: string[];
}

export const DEFAULT_CHANNEL_CAPABILITIES: Record<Channel, ChannelCapabilities> = {
  [Channel.EMAIL]: {
    channel: Channel.EMAIL,
    supportsAttachments: true,
    supportsTemplates: true,
    supportsScheduling: true,
    supportsBatching: true,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: true,
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB
    supportedMediaTypes: ['*/*']
  },
  [Channel.SMS]: {
    channel: Channel.SMS,
    supportsAttachments: false,
    supportsTemplates: true,
    supportsScheduling: true,
    supportsBatching: true,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: false,
    maxMessageLength: 1600 // Concatenated SMS
  },
  [Channel.WHATSAPP]: {
    channel: Channel.WHATSAPP,
    supportsAttachments: true,
    supportsTemplates: true,
    supportsScheduling: true,
    supportsBatching: true,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: true,
    maxAttachmentSize: 16 * 1024 * 1024, // 16MB
    supportedMediaTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf']
  },
  [Channel.VOICE]: {
    channel: Channel.VOICE,
    supportsAttachments: false,
    supportsTemplates: true,
    supportsScheduling: true,
    supportsBatching: false,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: false
  },
  [Channel.PUSH]: {
    channel: Channel.PUSH,
    supportsAttachments: true,
    supportsTemplates: true,
    supportsScheduling: true,
    supportsBatching: true,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: false,
    maxMessageLength: 4096,
    supportedMediaTypes: ['image/*']
  }
};

export interface ChannelStatus {
  channel: Channel;
  isAvailable: boolean;
  lastChecked: Date;
  latencyMs?: number;
  errorRate?: number;
  quotaRemaining?: number;
  quotaResetAt?: Date;
}
