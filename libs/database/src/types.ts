/**
 * Database Types for AI-CORE
 * 36 Databases organized by domain
 */

export type DatabaseName = 
  // Core
  | 'sm_global'
  // Insurance
  | 'ss_insurance' | 'ss_commissions' | 'ss_endorsements' | 'ss_retention' | 'ss_vigilance'
  // Utilities
  | 'se_energy' | 'st_telecom' | 'sf_finance'
  // Services
  | 'sr_repairs' | 'sw_workshops'
  // Business Operations
  | 'sm_analytics' | 'sm_communications' | 'sm_documents' | 'sm_compliance'
  | 'sm_leads' | 'sm_marketing' | 'sm_hr' | 'sm_inventory' | 'sm_integrations'
  | 'sm_projects' | 'sm_strategy' | 'sm_ai_agents' | 'sm_accounting'
  | 'sm_techteam' | 'sm_commercial' | 'sm_products' | 'sm_objectives'
  | 'sm_notifications' | 'sm_scheduling' | 'sm_audit' | 'sm_workflows'
  | 'sm_data_quality' | 'sm_tickets' | 'sm_quality' | 'sm_legal';

export interface DatabaseConfig {
  name: DatabaseName;
  url: string;
  poolSize?: number;
  timeout?: number;
}

export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  publishedAt?: Date;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
}

export const DATABASE_DOMAINS = {
  CORE: ['sm_global'],
  INSURANCE: ['ss_insurance', 'ss_commissions', 'ss_endorsements', 'ss_retention', 'ss_vigilance'],
  UTILITIES: ['se_energy', 'st_telecom', 'sf_finance'],
  SERVICES: ['sr_repairs', 'sw_workshops'],
  OPERATIONS: [
    'sm_analytics', 'sm_communications', 'sm_documents', 'sm_compliance',
    'sm_leads', 'sm_marketing', 'sm_hr', 'sm_inventory', 'sm_integrations',
    'sm_projects', 'sm_strategy', 'sm_ai_agents', 'sm_accounting',
    'sm_techteam', 'sm_commercial', 'sm_products', 'sm_objectives',
    'sm_notifications', 'sm_scheduling', 'sm_audit', 'sm_workflows',
    'sm_data_quality', 'sm_tickets', 'sm_quality', 'sm_legal'
  ]
} as const;
