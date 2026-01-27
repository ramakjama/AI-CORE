/**
 * AI Integrations Module
 * Hub de integraciones, ETL, webhooks y conectores para seguros, banca, gobierno, CRM y ERP
 *
 * @module @ai-core/ai-integrations
 * @version 1.0.0
 */

// ============================================
// TYPES & ENUMS
// ============================================

export {
  // Enums
  IntegrationType,
  SyncDirection,
  SyncStatus,
  WebhookEvent,
  IntegrationStatus,
  AuthType,
  TransformType,
  DeliveryStatus,

  // Integration interfaces
  IntegrationCredentials,
  IntegrationConfig,
  Integration,
  IntegrationLog,

  // Sync interfaces
  SyncMapping,
  FieldMapping,
  FieldTransformation,
  SyncFilter,
  ConflictResolution,
  SyncJob,
  SyncStats,
  SyncLog,
  SyncError,
  SyncConflict,

  // Webhook interfaces
  Webhook,
  RetryPolicy,
  WebhookFilter,
  WebhookDelivery,
  WebhookLog,

  // ETL interfaces
  ETLStep,
  ETLStepConfig,
  Transform,
  TransformConfig,
  ValidationRule,
  ETLJob,
  ETLStats,
  ETLExecution,
  ETLStepResult,
  ETLError,

  // Connector interfaces
  ConnectorConfig,
  ConnectorEndpoint,
  ConnectorParameter,
  Connector,

  // Queue interfaces
  QueueConfig,
  QueueMessage,

  // Response interfaces
  OperationResult,
  PaginatedResult,
  QueryFilters
} from './types';

// ============================================
// SERVICES
// ============================================

// Integration Service
export {
  IntegrationService,
  createIntegrationService
} from './services/integration.service';

// Sync Service
export {
  SyncService,
  createSyncService
} from './services/sync.service';

// Webhook Service
export {
  WebhookService,
  createWebhookService
} from './services/webhook.service';

// ETL Service
export {
  ETLService,
  createETLService
} from './services/etl.service';

// ============================================
// CONNECTORS
// ============================================

// Insurance Connectors
export {
  InsurancePolicy,
  InsuranceCoverage,
  InsuredObject,
  InsuranceClaim,
  InsuranceReceipt,
  MapfreConnector,
  AllianzConnector,
  AXAConnector,
  GenericInsuranceConnector,
  createInsuranceConnector
} from './connectors/insurance-companies.connector';

// Banking Connectors
export {
  BankAccount,
  BankTransaction,
  SEPAPayment,
  SEPADirectDebit,
  PSD2Consent,
  OpenBankingConnector,
  SEPAConnector,
  createBankingConnector
} from './connectors/banking.connector';

// Government Connectors
export {
  SIIFacturaEmitida,
  SIIFacturaRecibida,
  SIIResponse,
  TrabajadorSS,
  CuotaSS,
  EmpresaRM,
  InmuebleCatastro,
  AEATSIIConnector,
  SeguridadSocialConnector,
  RegistroMercantilConnector,
  CatastroConnector,
  createGovernmentConnector
} from './connectors/government.connector';

// CRM Connectors
export {
  CRMContact,
  CRMAccount,
  CRMDeal,
  CRMActivity,
  CRMLead,
  CRMSearchFilters,
  SalesforceConnector,
  HubSpotConnector,
  ZohoCRMConnector,
  PipedriveConnector,
  createCRMConnector
} from './connectors/crm.connector';

// ERP Connectors
export {
  ERPProduct,
  ERPCustomer,
  ERPSupplier,
  ERPAddress,
  ERPSalesOrder,
  ERPOrderLine,
  ERPPurchaseOrder,
  ERPInvoice,
  ERPInvoiceLine,
  ERPJournalEntry,
  ERPJournalLine,
  ERPStockMovement,
  ERPSearchFilters,
  SAPConnector,
  OdooConnector,
  SageConnector,
  createERPConnector
} from './connectors/erp.connector';

// ============================================
// FACTORY FUNCTIONS
// ============================================

import { IntegrationType } from './types';
import { createInsuranceConnector } from './connectors/insurance-companies.connector';
import { createBankingConnector } from './connectors/banking.connector';
import { createGovernmentConnector } from './connectors/government.connector';
import { createCRMConnector } from './connectors/crm.connector';
import { createERPConnector } from './connectors/erp.connector';

/**
 * Factory principal para crear cualquier tipo de conector
 */
export function createConnector(type: IntegrationType) {
  // Insurance connectors
  if (type.startsWith('INSURANCE_')) {
    return createInsuranceConnector(type);
  }

  // Banking connectors
  if (type.startsWith('BANKING_')) {
    return createBankingConnector(type);
  }

  // Government connectors
  if (type.startsWith('GOVERNMENT_')) {
    return createGovernmentConnector(type);
  }

  // CRM connectors
  if (type.startsWith('CRM_')) {
    return createCRMConnector(type);
  }

  // ERP connectors
  if (type.startsWith('ERP_')) {
    return createERPConnector(type);
  }

  throw new Error(`Unsupported connector type: ${type}`);
}

// ============================================
// MODULE INFO
// ============================================

/**
 * Information about the AI Integrations module
 */
export const MODULE_INFO = {
  name: '@ai-core/ai-integrations',
  version: '1.0.0',
  description: 'AI-powered integrations module for insurance, banking, government, CRM and ERP systems',
  features: [
    'Insurance company connectors (Mapfre, Allianz, AXA, etc.)',
    'Open Banking / PSD2 connectors',
    'SEPA payments support',
    'Government connectors (AEAT SII, Seguridad Social, Registro Mercantil, Catastro)',
    'CRM connectors (Salesforce, HubSpot, Zoho, Pipedrive)',
    'ERP connectors (SAP, Odoo, Sage)',
    'ETL pipelines with scheduling',
    'Webhook management with retry policies',
    'Bidirectional data synchronization',
    'Conflict resolution strategies'
  ],
  supportedIntegrations: {
    insurance: [
      'INSURANCE_MAPFRE',
      'INSURANCE_ALLIANZ',
      'INSURANCE_AXA',
      'INSURANCE_GENERALI',
      'INSURANCE_ZURICH',
      'INSURANCE_CASER',
      'INSURANCE_LIBERTY',
      'INSURANCE_MUTUA',
      'INSURANCE_SANITAS',
      'INSURANCE_DKV',
      'INSURANCE_GENERIC'
    ],
    banking: [
      'BANKING_OPEN_BANKING',
      'BANKING_SEPA',
      'BANKING_SWIFT',
      'BANKING_PSD2'
    ],
    government: [
      'GOVERNMENT_AEAT_SII',
      'GOVERNMENT_SEG_SOCIAL',
      'GOVERNMENT_REGISTRO_MERCANTIL',
      'GOVERNMENT_CATASTRO'
    ],
    crm: [
      'CRM_SALESFORCE',
      'CRM_HUBSPOT',
      'CRM_DYNAMICS',
      'CRM_ZOHO',
      'CRM_PIPEDRIVE'
    ],
    erp: [
      'ERP_SAP',
      'ERP_ORACLE',
      'ERP_MICROSOFT_DYNAMICS',
      'ERP_SAGE',
      'ERP_ODOO'
    ]
  }
};

export default {
  // Services
  createIntegrationService,
  createSyncService,
  createWebhookService,
  createETLService,

  // Connectors
  createConnector,
  createInsuranceConnector,
  createBankingConnector,
  createGovernmentConnector,
  createCRMConnector,
  createERPConnector,

  // Module info
  MODULE_INFO
};
