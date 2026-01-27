export type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'VOICE' | 'PUSH';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'BOUNCED';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Message {
  id: string;
  channel: Channel;
  from: string;
  to: string;
  subject?: string;
  content: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  status: MessageStatus;
  externalId?: string;
  metadata?: Record<string, unknown>;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: Channel;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  version: number;
  approvedAt?: Date;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  templateId: string;
  status: CampaignStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: Date;
}

export interface CommunicationPreference {
  partyId: string;
  channel: Channel;
  optIn: boolean;
  optInDate?: Date;
  optOutDate?: Date;
  preferredTime?: string;
  language: string;
}

export interface SendMessageRequest {
  channel: Channel;
  to: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  content?: string;
  subject?: string;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResponse {
  messageId: string;
  status: MessageStatus;
  externalId?: string;
}

export interface VoiceCallRequest {
  to: string;
  from?: string;
  script?: string;
  agentId?: string;
  recordCall?: boolean;
  transcribe?: boolean;
}

export interface VoiceCallResponse {
  callId: string;
  status: 'INITIATED' | 'RINGING' | 'ANSWERED' | 'COMPLETED' | 'FAILED';
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
}
