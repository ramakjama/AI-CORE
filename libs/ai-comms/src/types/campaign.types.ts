/**
 * Campaign Types
 * Marketing and communication campaigns
 */

import { Channel, ChannelPriority } from './channel.types';
import { MessageType, MessageTemplate, MessageStatus } from './message.types';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

export enum CampaignType {
  ONE_TIME = 'ONE_TIME',
  RECURRING = 'RECURRING',
  TRIGGERED = 'TRIGGERED',
  AB_TEST = 'AB_TEST',
  DRIP = 'DRIP',
  TRANSACTIONAL = 'TRANSACTIONAL'
}

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  description?: string;

  type: CampaignType;
  status: CampaignStatus;
  channel: Channel;
  messageType: MessageType;
  priority: ChannelPriority;

  template?: MessageTemplate;
  templateId?: string;
  templateData?: Record<string, unknown>;

  content?: {
    subject?: string;
    body: string;
    htmlBody?: string;
  };

  audience: CampaignAudience;
  schedule: CampaignSchedule;

  settings: CampaignSettings;
  abTest?: ABTestConfig;
  drip?: DripConfig;

  metrics: CampaignMetrics;

  tags?: string[];
  metadata?: Record<string, unknown>;

  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CampaignAudience {
  type: 'all' | 'segment' | 'list' | 'query' | 'manual';
  segmentId?: string;
  listId?: string;
  query?: AudienceQuery;
  recipientIds?: string[];
  excludeIds?: string[];

  filters?: AudienceFilter[];

  estimatedSize?: number;
  actualSize?: number;
}

export interface AudienceQuery {
  conditions: AudienceCondition[];
  operator: 'AND' | 'OR';
}

export interface AudienceCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'notContains' | 'in' | 'notIn' | 'exists' | 'notExists';
  value: unknown;
}

export interface AudienceFilter {
  type: 'include' | 'exclude';
  field: string;
  values: unknown[];
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring' | 'optimal';

  // For scheduled
  scheduledAt?: Date;

  // For recurring
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    time: string; // HH:mm
    timezone: string;
    startDate: Date;
    endDate?: Date;
  };

  // For optimal send time
  optimal?: {
    enabled: boolean;
    windowStart?: string;
    windowEnd?: string;
    timezone?: string;
  };

  // Throttling
  throttle?: {
    enabled: boolean;
    messagesPerMinute?: number;
    messagesPerHour?: number;
  };
}

export interface CampaignSettings {
  respectQuietHours: boolean;
  respectPreferences: boolean;
  deduplicateRecipients: boolean;
  validateRecipients: boolean;

  tracking: {
    opens: boolean;
    clicks: boolean;
    conversions: boolean;
  };

  retry: {
    enabled: boolean;
    maxAttempts: number;
    delayMinutes: number;
  };

  fallback?: {
    enabled: boolean;
    channels: Channel[];
    delayMinutes: number;
  };

  unsubscribe?: {
    enabled: boolean;
    url?: string;
    text?: string;
  };

  replyHandling?: {
    enabled: boolean;
    autoResponse?: string;
    forwardTo?: string[];
  };
}

export interface ABTestConfig {
  enabled: boolean;
  variants: ABTestVariant[];
  testSize: number; // Percentage of audience for test
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate' | 'manual';
  testDurationHours: number;
  autoSelectWinner: boolean;
  winnerId?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // Distribution percentage
  subject?: string;
  body?: string;
  htmlBody?: string;
  templateId?: string;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface DripConfig {
  steps: DripStep[];
  exitConditions?: DripCondition[];
  goalCondition?: DripCondition;
}

export interface DripStep {
  id: string;
  name: string;
  order: number;
  delay: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
  channel?: Channel;
  templateId?: string;
  content?: {
    subject?: string;
    body: string;
  };
  conditions?: DripCondition[];
  skipConditions?: DripCondition[];
}

export interface DripCondition {
  type: 'opened' | 'clicked' | 'replied' | 'converted' | 'unsubscribed' | 'custom';
  messageId?: string;
  stepId?: string;
  field?: string;
  operator?: string;
  value?: unknown;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  recipientId: string;

  email?: string;
  phone?: string;
  deviceToken?: string;
  name?: string;

  status: CampaignRecipientStatus;
  messageId?: string;
  messageStatus?: MessageStatus;

  variantId?: string; // For A/B tests
  currentStep?: number; // For drip campaigns

  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  unsubscribedAt?: Date;
  failedAt?: Date;

  failureReason?: string;
  retryCount: number;

  personalizationData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignRecipientStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  CONVERTED = 'CONVERTED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  SKIPPED = 'SKIPPED',
  EXCLUDED = 'EXCLUDED'
}

export interface CampaignMetrics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  complained: number;

  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  complaintRate: number;

  cost?: number;
  revenue?: number;
  roi?: number;

  byVariant?: Record<string, Partial<CampaignMetrics>>;
  byDevice?: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  byLocation?: Record<string, number>;

  updatedAt: Date;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: CampaignType;
  channel: Channel;
  messageType?: MessageType;
  priority?: ChannelPriority;

  templateId?: string;
  templateData?: Record<string, unknown>;
  content?: {
    subject?: string;
    body: string;
    htmlBody?: string;
  };

  audience: Omit<CampaignAudience, 'estimatedSize' | 'actualSize'>;
  schedule: CampaignSchedule;
  settings?: Partial<CampaignSettings>;
  abTest?: Omit<ABTestConfig, 'winnerId'>;
  drip?: DripConfig;

  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  priority?: ChannelPriority;

  templateId?: string;
  templateData?: Record<string, unknown>;
  content?: {
    subject?: string;
    body: string;
    htmlBody?: string;
  };

  audience?: Partial<CampaignAudience>;
  schedule?: Partial<CampaignSchedule>;
  settings?: Partial<CampaignSettings>;

  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CampaignSearchQuery {
  status?: CampaignStatus | CampaignStatus[];
  type?: CampaignType;
  channel?: Channel;
  tags?: string[];
  createdBy?: string;
  fromDate?: Date;
  toDate?: Date;
  searchText?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'startedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}
