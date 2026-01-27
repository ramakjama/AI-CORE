/**
 * AI Communications Module
 *
 * Omnichannel communications management for:
 * - Email (SMTP/IMAP)
 * - SMS (Twilio)
 * - WhatsApp (Cloud API)
 * - Voice (Twilio)
 *
 * Features:
 * - Unified inbox for all channels
 * - Campaign management with A/B testing
 * - Template-based messaging
 * - Delivery tracking and analytics
 *
 * @module @ai-core/ai-communications
 */

// ============================================================================
// Types
// ============================================================================

export * from './types';

// ============================================================================
// Services
// ============================================================================

export { EmailService } from './services/email.service';
export type { EmailServiceConfig } from './services/email.service';

export { SMSService } from './services/sms.service';
export type { SMSServiceConfig, TwilioSMSWebhook } from './services/sms.service';

export { WhatsAppService } from './services/whatsapp.service';
export type {
  WhatsAppServiceConfig,
  InteractiveButton,
  InteractiveListSection
} from './services/whatsapp.service';

export { VoiceService } from './services/voice.service';
export type {
  VoiceServiceConfig,
  TwilioVoiceWebhook,
  InitiateCallOptions
} from './services/voice.service';

export { UnifiedInboxService } from './services/unified-inbox.service';
export type {
  UnifiedInboxServiceConfig,
  ChannelServices,
  ResolutionData,
  ReplyOptions
} from './services/unified-inbox.service';

export { CampaignService } from './services/campaign.service';
export type {
  CampaignServiceConfig,
  CampaignChannelServices,
  CreateCampaignOptions,
  ABTestConfig
} from './services/campaign.service';

// ============================================================================
// Factory Functions
// ============================================================================

import { EmailService, EmailServiceConfig } from './services/email.service';
import { SMSService, SMSServiceConfig } from './services/sms.service';
import { WhatsAppService, WhatsAppServiceConfig } from './services/whatsapp.service';
import { VoiceService, VoiceServiceConfig } from './services/voice.service';
import { UnifiedInboxService, UnifiedInboxServiceConfig, ChannelServices } from './services/unified-inbox.service';
import { CampaignService, CampaignServiceConfig, CampaignChannelServices } from './services/campaign.service';
import { CommunicationsConfig, Contact } from './types';

/**
 * Complete communications module configuration
 */
export interface CommunicationsModuleConfig {
  tenantId: string;
  email?: Omit<EmailServiceConfig, 'tenantId'>;
  sms?: Omit<SMSServiceConfig, 'tenantId'>;
  whatsapp?: Omit<WhatsAppServiceConfig, 'tenantId'>;
  voice?: Omit<VoiceServiceConfig, 'tenantId'>;
  inbox?: Omit<UnifiedInboxServiceConfig, 'tenantId'>;
  campaign?: Omit<CampaignServiceConfig, 'tenantId'>;
}

/**
 * Communications module instance
 */
export interface CommunicationsModule {
  email?: EmailService;
  sms?: SMSService;
  whatsapp?: WhatsAppService;
  voice?: VoiceService;
  inbox?: UnifiedInboxService;
  campaign?: CampaignService;
}

/**
 * Create a complete communications module
 *
 * @param config - Module configuration
 * @returns Communications module instance with all configured services
 *
 * @example
 * ```typescript
 * const comms = createCommunicationsModule({
 *   tenantId: 'tenant-123',
 *   email: {
 *     accounts: [{
 *       id: 'main',
 *       email: 'support@example.com',
 *       smtp: { host: 'smtp.example.com', port: 587, secure: false, auth: { user: '...', pass: '...' } },
 *       imap: { host: 'imap.example.com', port: 993, secure: true, auth: { user: '...', pass: '...' } }
 *     }]
 *   },
 *   sms: {
 *     accountSid: 'AC...',
 *     authToken: '...',
 *     defaultFrom: '+1234567890'
 *   },
 *   whatsapp: {
 *     accessToken: '...',
 *     phoneNumberId: '...',
 *     businessAccountId: '...'
 *   }
 * });
 *
 * // Send an email
 * await comms.email.send('user@example.com', 'Hello', 'World');
 *
 * // Send an SMS
 * await comms.sms.send('+1234567890', 'Hello from SMS');
 *
 * // Get unified inbox
 * const inbox = comms.inbox.getConversations('agent-1');
 * ```
 */
export function createCommunicationsModule(
  config: CommunicationsModuleConfig
): CommunicationsModule {
  const module: CommunicationsModule = {};

  // Initialize email service
  if (config.email) {
    module.email = new EmailService({
      tenantId: config.tenantId,
      ...config.email
    });
  }

  // Initialize SMS service
  if (config.sms) {
    module.sms = new SMSService({
      tenantId: config.tenantId,
      ...config.sms
    });
  }

  // Initialize WhatsApp service
  if (config.whatsapp) {
    module.whatsapp = new WhatsAppService({
      tenantId: config.tenantId,
      ...config.whatsapp
    });
  }

  // Initialize voice service
  if (config.voice) {
    module.voice = new VoiceService({
      tenantId: config.tenantId,
      ...config.voice
    });
  }

  // Initialize unified inbox (aggregates all channels)
  const channelServices: ChannelServices = {
    email: module.email,
    sms: module.sms,
    whatsapp: module.whatsapp,
    voice: module.voice
  };

  module.inbox = new UnifiedInboxService(
    {
      tenantId: config.tenantId,
      ...config.inbox
    },
    channelServices
  );

  // Initialize campaign service
  const campaignServices: CampaignChannelServices = {
    email: module.email,
    sms: module.sms,
    whatsapp: module.whatsapp
  };

  module.campaign = new CampaignService(
    {
      tenantId: config.tenantId,
      ...config.campaign
    },
    campaignServices
  );

  return module;
}

/**
 * Create standalone email service
 */
export function createEmailService(config: EmailServiceConfig): EmailService {
  return new EmailService(config);
}

/**
 * Create standalone SMS service
 */
export function createSMSService(config: SMSServiceConfig): SMSService {
  return new SMSService(config);
}

/**
 * Create standalone WhatsApp service
 */
export function createWhatsAppService(config: WhatsAppServiceConfig): WhatsAppService {
  return new WhatsAppService(config);
}

/**
 * Create standalone voice service
 */
export function createVoiceService(
  config: VoiceServiceConfig,
  contactLookup?: (phone: string) => Promise<Contact | null>
): VoiceService {
  return new VoiceService(config, contactLookup);
}

/**
 * Create standalone unified inbox service
 */
export function createUnifiedInboxService(
  config: UnifiedInboxServiceConfig,
  services: ChannelServices
): UnifiedInboxService {
  return new UnifiedInboxService(config, services);
}

/**
 * Create standalone campaign service
 */
export function createCampaignService(
  config: CampaignServiceConfig,
  services: CampaignChannelServices
): CampaignService {
  return new CampaignService(config, services);
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  createCommunicationsModule,
  createEmailService,
  createSMSService,
  createWhatsAppService,
  createVoiceService,
  createUnifiedInboxService,
  createCampaignService,
  EmailService,
  SMSService,
  WhatsAppService,
  VoiceService,
  UnifiedInboxService,
  CampaignService
};
