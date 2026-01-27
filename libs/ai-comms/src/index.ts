// AI-COMMS: Unified Communications Module
// Voice, WhatsApp, SMS, Email - All in one
// Integrated with sm_communications database

export * from './types';
export * from './providers/email.provider';
export * from './providers/sms.provider';
export * from './providers/whatsapp.provider';
export * from './providers/voice.provider';
export * from './services/message.service';
export * from './services/template.service';
export * from './services/campaign.service';
export * from './services/preference.service';
export * from './utils/template-renderer';
export * from './utils/phone-formatter';
export * from './events';
