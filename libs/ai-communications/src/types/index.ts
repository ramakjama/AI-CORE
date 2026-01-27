/**
 * AI Communications Types
 * Schema: sm_communications
 *
 * Complete type definitions for omnichannel communications
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Communication channel types
 */
export enum ChannelType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
  PUSH = 'PUSH'
}

/**
 * Message status in the system
 */
export enum MessageStatus {
  DRAFT = 'DRAFT',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

/**
 * Delivery status for tracking
 */
export enum DeliveryStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  UNDELIVERED = 'UNDELIVERED',
  FAILED = 'FAILED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Campaign status
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED'
}

/**
 * Conversation status in unified inbox
 */
export enum ConversationStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  SPAM = 'SPAM'
}

/**
 * Call status for voice
 */
export enum CallStatus {
  INITIATED = 'INITIATED',
  RINGING = 'RINGING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BUSY = 'BUSY',
  NO_ANSWER = 'NO_ANSWER',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED'
}

/**
 * Call direction
 */
export enum CallDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

/**
 * WhatsApp message types
 */
export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  INTERACTIVE = 'interactive',
  TEMPLATE = 'template',
  REACTION = 'reaction'
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base message interface
 */
export interface BaseMessage {
  id: string;
  tenantId: string;
  channel: ChannelType;
  status: MessageStatus;
  direction: 'INBOUND' | 'OUTBOUND';
  conversationId?: string;
  templateId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

/**
 * Attachment interface
 */
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  content?: Buffer;
  contentId?: string; // For inline images
  disposition: 'attachment' | 'inline';
}

/**
 * Contact interface
 */
export interface Contact {
  id?: string;
  email?: string;
  phone?: string;
  whatsappId?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// EMAIL INTERFACES
// ============================================================================

/**
 * Email address with optional name
 */
export interface EmailAddress {
  email: string;
  name?: string;
}

/**
 * Email message interface
 */
export interface EmailMessage extends BaseMessage {
  channel: ChannelType.EMAIL;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: Attachment[];
  headers?: Record<string, string>;
  messageId?: string; // RFC 5322 Message-ID
  inReplyTo?: string;
  references?: string[];
  threadId?: string;
  folder?: string;
  labels?: string[];
  priority?: Priority;
  isRead?: boolean;
  isStarred?: boolean;
  hasAttachments?: boolean;
}

/**
 * Email send options
 */
export interface EmailSendOptions {
  trackOpens?: boolean;
  trackClicks?: boolean;
  scheduledAt?: Date;
  priority?: Priority;
  headers?: Record<string, string>;
  tags?: string[];
  replyTo?: EmailAddress;
}

/**
 * Email fetch options
 */
export interface EmailFetchOptions {
  folder?: string;
  since?: Date;
  before?: Date;
  unseen?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
  includeBody?: boolean;
  includeAttachments?: boolean;
}

/**
 * Email account configuration
 */
export interface EmailAccountConfig {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  imap: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  isDefault?: boolean;
  signature?: string;
}

// ============================================================================
// SMS INTERFACES
// ============================================================================

/**
 * SMS message interface
 */
export interface SMSMessage extends BaseMessage {
  channel: ChannelType.SMS;
  from: string; // Phone number
  to: string; // Phone number
  body: string;
  segments?: number;
  encoding?: 'GSM-7' | 'UCS-2';
  providerId?: string; // Twilio SID
  providerStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  price?: number;
  currency?: string;
}

/**
 * SMS send options
 */
export interface SMSSendOptions {
  from?: string;
  statusCallback?: string;
  validityPeriod?: number; // In seconds
  maxPrice?: number;
  provideFeedback?: boolean;
  scheduledAt?: Date;
  tags?: string[];
}

/**
 * SMS opt-out record
 */
export interface SMSOptOut {
  id: string;
  tenantId: string;
  phoneNumber: string;
  optedOutAt: Date;
  reason?: string;
  channel: 'STOP' | 'MANUAL' | 'COMPLAINT';
}

// ============================================================================
// WHATSAPP INTERFACES
// ============================================================================

/**
 * WhatsApp message interface
 */
export interface WhatsAppMessage extends BaseMessage {
  channel: ChannelType.WHATSAPP;
  from: string; // WhatsApp ID (phone number)
  to: string; // WhatsApp ID
  type: WhatsAppMessageType;
  text?: {
    body: string;
    previewUrl?: boolean;
  };
  image?: WhatsAppMedia;
  video?: WhatsAppMedia;
  audio?: WhatsAppMedia;
  document?: WhatsAppMedia & {
    filename?: string;
  };
  sticker?: WhatsAppMedia;
  location?: WhatsAppLocation;
  contacts?: WhatsAppContact[];
  interactive?: WhatsAppInteractive;
  template?: WhatsAppTemplate;
  reaction?: {
    messageId: string;
    emoji: string;
  };
  context?: {
    messageId: string;
  };
  wamid?: string; // WhatsApp Message ID
  timestamp?: number;
}

/**
 * WhatsApp media
 */
export interface WhatsAppMedia {
  id?: string;
  link?: string;
  caption?: string;
  mimeType?: string;
  sha256?: string;
}

/**
 * WhatsApp location
 */
export interface WhatsAppLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

/**
 * WhatsApp contact
 */
export interface WhatsAppContact {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
  };
  phones?: Array<{
    phone: string;
    type?: string;
    wa_id?: string;
  }>;
  emails?: Array<{
    email: string;
    type?: string;
  }>;
}

/**
 * WhatsApp interactive message
 */
export interface WhatsAppInteractive {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'image' | 'video' | 'document';
    text?: string;
    image?: WhatsAppMedia;
    video?: WhatsAppMedia;
    document?: WhatsAppMedia;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: WhatsAppInteractiveAction;
}

/**
 * WhatsApp interactive action
 */
export interface WhatsAppInteractiveAction {
  button?: string;
  buttons?: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
  sections?: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  catalog_id?: string;
  product_retailer_id?: string;
}

/**
 * WhatsApp template for Business API
 */
export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: 'quick_reply' | 'url';
    index?: number;
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: WhatsAppMedia;
      document?: WhatsAppMedia;
      video?: WhatsAppMedia;
    }>;
  }>;
}

/**
 * WhatsApp webhook payload
 */
export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          image?: WhatsAppMedia;
          video?: WhatsAppMedia;
          audio?: WhatsAppMedia;
          document?: WhatsAppMedia;
          location?: WhatsAppLocation;
          contacts?: WhatsAppContact[];
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description?: string;
            };
          };
          context?: {
            from: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: {
              type: string;
            };
          };
          pricing?: {
            billable: boolean;
            pricing_model: string;
            category: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ============================================================================
// VOICE INTERFACES
// ============================================================================

/**
 * Voice call interface
 */
export interface VoiceCall extends BaseMessage {
  channel: ChannelType.VOICE;
  from: string;
  to: string;
  callSid: string;
  accountSid?: string;
  direction: CallDirection;
  callStatus: CallStatus;
  duration?: number; // In seconds
  startTime?: Date;
  endTime?: Date;
  answeredBy?: 'human' | 'machine_start' | 'machine_end_beep' | 'machine_end_silence' | 'machine_end_other' | 'fax' | 'unknown';
  callerName?: string;
  forwardedFrom?: string;
  recordings?: VoiceRecording[];
  transcriptions?: VoiceTranscription[];
  ivrPath?: string[];
  queueInfo?: {
    queueSid: string;
    queueName: string;
    position?: number;
    waitTime?: number;
  };
  conferenceInfo?: {
    conferenceSid: string;
    conferenceName: string;
    participants?: number;
  };
  price?: number;
  currency?: string;
}

/**
 * Voice recording
 */
export interface VoiceRecording {
  id: string;
  callSid: string;
  recordingSid: string;
  url: string;
  duration: number;
  channels?: number;
  source?: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * Voice transcription
 */
export interface VoiceTranscription {
  id: string;
  recordingSid: string;
  transcriptionSid?: string;
  text: string;
  confidence?: number;
  language?: string;
  status: 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
}

/**
 * IVR menu option
 */
export interface IVRMenuOption {
  digit: string;
  description: string;
  action: 'play' | 'say' | 'gather' | 'dial' | 'enqueue' | 'record' | 'hangup' | 'redirect';
  actionData?: {
    message?: string;
    audioUrl?: string;
    destination?: string;
    queueName?: string;
    redirectUrl?: string;
    voice?: string;
    language?: string;
  };
  subMenu?: IVRMenuOption[];
}

/**
 * IVR configuration
 */
export interface IVRConfig {
  id: string;
  tenantId: string;
  name: string;
  welcomeMessage?: string;
  welcomeAudioUrl?: string;
  options: IVRMenuOption[];
  invalidInputMessage?: string;
  timeoutMessage?: string;
  maxRetries?: number;
  timeout?: number;
  voice?: string;
  language?: string;
}

/**
 * Screen pop data for incoming calls
 */
export interface ScreenPopData {
  callSid: string;
  from: string;
  to: string;
  direction: CallDirection;
  contact?: Contact;
  recentConversations?: Array<{
    id: string;
    channel: ChannelType;
    lastMessage: string;
    timestamp: Date;
  }>;
  openTickets?: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
  }>;
  customerData?: Record<string, unknown>;
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'url' | 'phone' | 'email';
  required: boolean;
  defaultValue?: string;
  description?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Message template
 */
export interface Template {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  channel: ChannelType;
  category?: string;
  language: string;
  subject?: string; // For email
  bodyText?: string;
  bodyHtml?: string;
  variables: TemplateVariable[];

  // WhatsApp specific
  whatsappTemplateId?: string;
  whatsappStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  whatsappCategory?: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';

  // Metadata
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Rendered template result
 */
export interface RenderedTemplate {
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  whatsappTemplate?: WhatsAppTemplate;
  missingVariables?: string[];
}

// ============================================================================
// CAMPAIGN INTERFACES
// ============================================================================

/**
 * Campaign target
 */
export interface CampaignTarget {
  id: string;
  campaignId: string;
  contact: Contact;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED' | 'OPTED_OUT';
  messageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
  customData?: Record<string, unknown>;
}

/**
 * Campaign A/B test variant
 */
export interface CampaignVariant {
  id: string;
  name: string;
  templateId: string;
  percentage: number;
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
  };
}

/**
 * Campaign
 */
export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  channel: ChannelType;
  templateId: string;
  status: CampaignStatus;

  // Targeting
  targetCount: number;
  segmentId?: string;
  segmentQuery?: Record<string, unknown>;

  // Scheduling
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  // A/B Testing
  isAbTest?: boolean;
  variants?: CampaignVariant[];
  winnerCriteria?: 'OPENS' | 'CLICKS' | 'CONVERSIONS';
  winnerSelectionTime?: Date;
  winnerVariantId?: string;

  // Stats
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    unsubscribed: number;
    complained: number;
    openRate?: number;
    clickRate?: number;
    bounceRate?: number;
  };

  // Metadata
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// ============================================================================
// UNIFIED INBOX INTERFACES
// ============================================================================

/**
 * Conversation message in unified inbox
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  channel: ChannelType;
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
  contentHtml?: string;
  attachments?: Attachment[];
  sender: {
    type: 'CONTACT' | 'AGENT' | 'BOT';
    id: string;
    name?: string;
    avatar?: string;
  };
  status: MessageStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;

  // Original message reference
  originalMessageId?: string;
  originalMessage?: EmailMessage | SMSMessage | WhatsAppMessage | VoiceCall;
}

/**
 * Conversation in unified inbox
 */
export interface Conversation {
  id: string;
  tenantId: string;
  contact: Contact;
  channels: ChannelType[];
  status: ConversationStatus;
  priority?: Priority;

  // Assignment
  assignedTo?: string;
  assignedTeam?: string;
  assignedAt?: Date;

  // Timing
  firstMessageAt: Date;
  lastMessageAt: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;

  // Metrics
  messageCount: number;
  unreadCount: number;
  responseTime?: number; // In seconds
  resolutionTime?: number; // In seconds

  // Organization
  subject?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;

  // Last message preview
  lastMessage?: {
    content: string;
    channel: ChannelType;
    direction: 'INBOUND' | 'OUTBOUND';
    timestamp: Date;
  };

  // Related data
  relatedTicketId?: string;
  relatedLeadId?: string;
  relatedContactId?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Unified inbox view
 */
export interface UnifiedInbox {
  tenantId: string;
  agentId?: string;
  conversations: Conversation[];
  totalCount: number;
  unreadCount: number;
  filters: UnifiedInboxFilters;
}

/**
 * Unified inbox filters
 */
export interface UnifiedInboxFilters {
  status?: ConversationStatus[];
  channels?: ChannelType[];
  assignedTo?: string;
  assignedTeam?: string;
  tags?: string[];
  priority?: Priority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: 'lastMessageAt' | 'firstMessageAt' | 'priority' | 'unreadCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Agent metrics
 */
export interface AgentMetrics {
  agentId: string;
  period: {
    start: Date;
    end: Date;
  };
  conversations: {
    total: number;
    resolved: number;
    open: number;
    assigned: number;
  };
  messages: {
    sent: number;
    received: number;
    byChannel: Record<ChannelType, number>;
  };
  responseTime: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  resolutionTime: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  satisfaction?: {
    score: number;
    responses: number;
  };
}

// ============================================================================
// READ RECEIPT INTERFACES
// ============================================================================

/**
 * Read receipt
 */
export interface ReadReceipt {
  id: string;
  messageId: string;
  channel: ChannelType;
  readAt: Date;
  readBy?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Delivery report
 */
export interface DeliveryReport {
  id: string;
  messageId: string;
  channel: ChannelType;
  status: DeliveryStatus;
  timestamp: Date;
  providerMessageId?: string;
  providerStatus?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE CONFIGURATION INTERFACES
// ============================================================================

/**
 * Communications service configuration
 */
export interface CommunicationsConfig {
  tenantId: string;

  email?: {
    defaultAccount?: string;
    accounts: EmailAccountConfig[];
    trackingDomain?: string;
    unsubscribeUrl?: string;
  };

  sms?: {
    provider: 'twilio';
    accountSid: string;
    authToken: string;
    defaultFrom?: string;
    messagingServiceSid?: string;
    statusCallbackUrl?: string;
  };

  whatsapp?: {
    provider: 'cloud-api';
    accessToken: string;
    phoneNumberId: string;
    businessAccountId: string;
    webhookVerifyToken?: string;
  };

  voice?: {
    provider: 'twilio';
    accountSid: string;
    authToken: string;
    defaultFrom?: string;
    statusCallbackUrl?: string;
    recordingsEnabled?: boolean;
    transcriptionEnabled?: boolean;
  };
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * Communication event types
 */
export type CommunicationEventType =
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  | 'message.bounced'
  | 'message.incoming'
  | 'call.initiated'
  | 'call.ringing'
  | 'call.answered'
  | 'call.completed'
  | 'call.failed'
  | 'conversation.created'
  | 'conversation.assigned'
  | 'conversation.resolved'
  | 'conversation.reopened'
  | 'campaign.started'
  | 'campaign.completed'
  | 'campaign.failed';

/**
 * Communication event
 */
export interface CommunicationEvent {
  id: string;
  tenantId: string;
  type: CommunicationEventType;
  channel: ChannelType;
  timestamp: Date;
  data: {
    messageId?: string;
    conversationId?: string;
    campaignId?: string;
    callSid?: string;
    contact?: Contact;
    agentId?: string;
    metadata?: Record<string, unknown>;
  };
}

// ============================================================================
// RESULT INTERFACES
// ============================================================================

/**
 * Send message result
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  status: MessageStatus;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Bulk send result
 */
export interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    recipient: string;
    result: SendResult;
  }>;
}

/**
 * Webhook result
 */
export interface WebhookResult {
  processed: boolean;
  messageId?: string;
  conversationId?: string;
  event?: CommunicationEvent;
  error?: {
    code: string;
    message: string;
  };
}
