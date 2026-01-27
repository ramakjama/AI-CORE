/**
 * AI-CORE Database Configuration
 * Complete configuration for 68+ databases across all modules and platforms
 *
 * Architecture:
 * - Core ERP (39 databases)
 * - e-SORI Web Platform (5 databases)
 * - Soriano Landings (4 databases)
 * - Taxi Asegurado Platform (5 databases)
 * - Extended ERP Modules (10 databases)
 * - External Integrations (5 databases)
 *
 * Total: 68 PostgreSQL databases
 */

import { z } from 'zod';

// =============================================================================
// DATABASE CONNECTION SCHEMA
// =============================================================================
const DatabaseConnectionSchema = z.object({
  url: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  category: z.string().optional(),
  schema: z.string().optional(),
  poolMin: z.number().int().min(1).default(2),
  poolMax: z.number().int().min(1).default(10),
  idleTimeoutMs: z.number().int().positive().default(30000),
  connectionTimeoutMs: z.number().int().positive().default(5000),
  ssl: z.boolean().default(false),
  sslRejectUnauthorized: z.boolean().default(true),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
});

export type DatabaseConnection = z.infer<typeof DatabaseConnectionSchema>;

// =============================================================================
// DATABASE CATEGORY SCHEMAS - CORE ERP (39 databases)
// =============================================================================
const CoreDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  global: DatabaseConnectionSchema,
  system: DatabaseConnectionSchema,
  audit: DatabaseConnectionSchema,
  logs: DatabaseConnectionSchema,
});

const InsuranceDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  policies: DatabaseConnectionSchema,
  claims: DatabaseConnectionSchema,
  commissions: DatabaseConnectionSchema,
  carriers: DatabaseConnectionSchema,
});

const HRDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  payroll: DatabaseConnectionSchema,
  recruitment: DatabaseConnectionSchema,
  training: DatabaseConnectionSchema,
  performance: DatabaseConnectionSchema,
});

const AnalyticsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  reports: DatabaseConnectionSchema,
  dashboards: DatabaseConnectionSchema,
  metrics: DatabaseConnectionSchema,
});

const AIAgentsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  models: DatabaseConnectionSchema,
  training: DatabaseConnectionSchema,
  prompts: DatabaseConnectionSchema,
});

const CommunicationsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  email: DatabaseConnectionSchema,
  sms: DatabaseConnectionSchema,
  whatsapp: DatabaseConnectionSchema,
  voice: DatabaseConnectionSchema,
});

const FinanceDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  accounting: DatabaseConnectionSchema,
  invoicing: DatabaseConnectionSchema,
  treasury: DatabaseConnectionSchema,
});

const CRMDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  leads: DatabaseConnectionSchema,
  customers: DatabaseConnectionSchema,
});

const DocumentsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  storage: DatabaseConnectionSchema,
});

const WorkflowsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  tasks: DatabaseConnectionSchema,
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - SHARED ECOSYSTEM (8 databases)
// Bases de datos compartidas entre todas las plataformas del ecosistema
// =============================================================================
const SharedEcosystemDatabasesSchema = z.object({
  sso: DatabaseConnectionSchema,           // Single Sign-On / Auth unificado
  masterCustomers: DatabaseConnectionSchema, // Clientes maestro unificado
  masterProducts: DatabaseConnectionSchema,  // Catálogo productos/seguros
  unifiedCRM: DatabaseConnectionSchema,      // CRM unificado
  unifiedAnalytics: DatabaseConnectionSchema, // Analytics agregado
  sharedAssets: DatabaseConnectionSchema,    // Assets compartidos (logos, docs)
  globalConfig: DatabaseConnectionSchema,    // Configuración global
  eventBus: DatabaseConnectionSchema,        // Bus de eventos entre plataformas
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - SORIANO MEDIADORES WEB (5 databases)
// www.sorianomediadores.es - Web corporativa principal
// =============================================================================
const SorianoWebDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  content: DatabaseConnectionSchema,    // CMS contenido web
  blog: DatabaseConnectionSchema,       // Blog/Noticias
  forms: DatabaseConnectionSchema,      // Formularios contacto
  seo: DatabaseConnectionSchema,        // SEO & Analytics web
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - e-SORI PLATFORM (5 databases)
// =============================================================================
const ESoriDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  users: DatabaseConnectionSchema,
  quotes: DatabaseConnectionSchema,
  sessions: DatabaseConnectionSchema,
  content: DatabaseConnectionSchema,
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - SORIANO LANDINGS (4 databases)
// =============================================================================
const SorianoLandingsDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  leads: DatabaseConnectionSchema,
  analytics: DatabaseConnectionSchema,
  campaigns: DatabaseConnectionSchema,
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - TAXI ASEGURADO (5 databases)
// =============================================================================
const TaxiAseguradoDatabasesSchema = z.object({
  main: DatabaseConnectionSchema,
  leads: DatabaseConnectionSchema,
  quotes: DatabaseConnectionSchema,
  policies: DatabaseConnectionSchema,
  analytics: DatabaseConnectionSchema,
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - EXTENDED ERP (10 databases)
// =============================================================================
const ExtendedERPDatabasesSchema = z.object({
  inventory: DatabaseConnectionSchema,
  products: DatabaseConnectionSchema,
  projects: DatabaseConnectionSchema,
  marketing: DatabaseConnectionSchema,
  legal: DatabaseConnectionSchema,
  compliance: DatabaseConnectionSchema,
  quality: DatabaseConnectionSchema,
  tickets: DatabaseConnectionSchema,
  notifications: DatabaseConnectionSchema,
  scheduling: DatabaseConnectionSchema,
});

// =============================================================================
// DATABASE CATEGORY SCHEMAS - EXTERNAL INTEGRATIONS (5 databases)
// =============================================================================
const ExternalIntegrationsDatabasesSchema = z.object({
  carriers: DatabaseConnectionSchema,
  payments: DatabaseConnectionSchema,
  maps: DatabaseConnectionSchema,
  aiModels: DatabaseConnectionSchema,
  backups: DatabaseConnectionSchema,
});

// =============================================================================
// COMPLETE DATABASE CONFIGURATION SCHEMA
// =============================================================================
export const DatabaseConfigSchema = z.object({
  // ══════════════════════════════════════════════════════
  // SHARED ECOSYSTEM (8) - Compartidas entre plataformas
  // ══════════════════════════════════════════════════════
  shared: SharedEcosystemDatabasesSchema,

  // ══════════════════════════════════════════════════════
  // CORE ERP (39)
  // ══════════════════════════════════════════════════════
  core: CoreDatabasesSchema,
  insurance: InsuranceDatabasesSchema,
  hr: HRDatabasesSchema,
  analytics: AnalyticsDatabasesSchema,
  aiAgents: AIAgentsDatabasesSchema,
  communications: CommunicationsDatabasesSchema,
  finance: FinanceDatabasesSchema,
  crm: CRMDatabasesSchema,
  documents: DocumentsDatabasesSchema,
  workflows: WorkflowsDatabasesSchema,

  // ══════════════════════════════════════════════════════
  // WEB PLATFORMS (19)
  // ══════════════════════════════════════════════════════
  sorianoWeb: SorianoWebDatabasesSchema,      // www.sorianomediadores.es
  esori: ESoriDatabasesSchema,                 // e-SORI portal clientes
  sorianoLandings: SorianoLandingsDatabasesSchema, // Landings Soriano
  taxiAsegurado: TaxiAseguradoDatabasesSchema, // Taxi Asegurado

  // ══════════════════════════════════════════════════════
  // EXTENDED ERP + EXTERNAL (15)
  // ══════════════════════════════════════════════════════
  extended: ExtendedERPDatabasesSchema,
  external: ExternalIntegrationsDatabasesSchema,
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// =============================================================================
// HELPER FUNCTION
// =============================================================================
function createDbConfig(
  envVar: string,
  name: string,
  defaultUrl: string,
  options?: Partial<DatabaseConnection>
): DatabaseConnection {
  const url = process.env[envVar] || defaultUrl;
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    url,
    name,
    displayName: options?.displayName || name.replace(/_/g, ' ').toUpperCase(),
    category: options?.category || 'core',
    schema: options?.schema,
    poolMin: options?.poolMin ?? (isProduction ? 5 : 2),
    poolMax: options?.poolMax ?? (isProduction ? 20 : 10),
    idleTimeoutMs: options?.idleTimeoutMs ?? 30000,
    connectionTimeoutMs: options?.connectionTimeoutMs ?? 5000,
    ssl: options?.ssl ?? isProduction,
    sslRejectUnauthorized: options?.sslRejectUnauthorized ?? true,
    priority: options?.priority ?? 'medium',
  };
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================
export const databaseConfig: DatabaseConfig = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED ECOSYSTEM DATABASES (8) - Compartidas entre todas las plataformas
  // ═══════════════════════════════════════════════════════════════════════════
  shared: {
    sso: createDbConfig(
      'SHARED_SSO_DATABASE_URL',
      'shared_sso',
      'postgresql://postgres:password@localhost:5432/shared_sso',
      { displayName: 'SSO Unificado', category: 'shared', priority: 'critical' }
    ),
    masterCustomers: createDbConfig(
      'SHARED_CUSTOMERS_DATABASE_URL',
      'shared_master_customers',
      'postgresql://postgres:password@localhost:5432/shared_master_customers',
      { displayName: 'Clientes Maestro', category: 'shared', priority: 'critical' }
    ),
    masterProducts: createDbConfig(
      'SHARED_PRODUCTS_DATABASE_URL',
      'shared_master_products',
      'postgresql://postgres:password@localhost:5432/shared_master_products',
      { displayName: 'Catálogo Productos', category: 'shared', priority: 'critical' }
    ),
    unifiedCRM: createDbConfig(
      'SHARED_CRM_DATABASE_URL',
      'shared_unified_crm',
      'postgresql://postgres:password@localhost:5432/shared_unified_crm',
      { displayName: 'CRM Unificado', category: 'shared', priority: 'critical' }
    ),
    unifiedAnalytics: createDbConfig(
      'SHARED_ANALYTICS_DATABASE_URL',
      'shared_unified_analytics',
      'postgresql://postgres:password@localhost:5432/shared_unified_analytics',
      { displayName: 'Analytics Unificado', category: 'shared', priority: 'high' }
    ),
    sharedAssets: createDbConfig(
      'SHARED_ASSETS_DATABASE_URL',
      'shared_assets',
      'postgresql://postgres:password@localhost:5432/shared_assets',
      { displayName: 'Assets Compartidos', category: 'shared', priority: 'high' }
    ),
    globalConfig: createDbConfig(
      'SHARED_CONFIG_DATABASE_URL',
      'shared_global_config',
      'postgresql://postgres:password@localhost:5432/shared_global_config',
      { displayName: 'Config Global', category: 'shared', priority: 'critical' }
    ),
    eventBus: createDbConfig(
      'SHARED_EVENTS_DATABASE_URL',
      'shared_event_bus',
      'postgresql://postgres:password@localhost:5432/shared_event_bus',
      { displayName: 'Event Bus', category: 'shared', priority: 'critical' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE SYSTEM DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  core: {
    main: createDbConfig(
      'DATABASE_URL',
      'ai_core_main',
      'postgresql://postgres:password@localhost:5432/ai_core_main',
      { displayName: 'Core Principal', category: 'core', priority: 'critical' }
    ),
    global: createDbConfig(
      'SM_GLOBAL_DATABASE_URL',
      'ai_core_global',
      'postgresql://postgres:password@localhost:5432/ai_core_global',
      { displayName: 'Global Compartido', category: 'core', priority: 'critical' }
    ),
    system: createDbConfig(
      'SM_SYSTEM_DATABASE_URL',
      'ai_core_system',
      'postgresql://postgres:password@localhost:5432/ai_core_system',
      { displayName: 'Sistema', category: 'core', priority: 'critical' }
    ),
    audit: createDbConfig(
      'SM_AUDIT_DATABASE_URL',
      'ai_core_audit',
      'postgresql://postgres:password@localhost:5432/ai_core_audit',
      { displayName: 'Auditoría', category: 'core', priority: 'high' }
    ),
    logs: createDbConfig(
      'SM_LOGS_DATABASE_URL',
      'ai_core_logs',
      'postgresql://postgres:password@localhost:5432/ai_core_logs',
      { displayName: 'Logs Sistema', category: 'core', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSURANCE MODULE DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  insurance: {
    main: createDbConfig(
      'SS_INSURANCE_DATABASE_URL',
      'ss_insurance',
      'postgresql://postgres:password@localhost:5432/ss_insurance',
      { displayName: 'Seguros Principal', category: 'insurance', priority: 'critical' }
    ),
    policies: createDbConfig(
      'SS_POLICIES_DATABASE_URL',
      'ss_policies',
      'postgresql://postgres:password@localhost:5432/ss_policies',
      { displayName: 'Pólizas', category: 'insurance', priority: 'critical' }
    ),
    claims: createDbConfig(
      'SS_CLAIMS_DATABASE_URL',
      'ss_claims',
      'postgresql://postgres:password@localhost:5432/ss_claims',
      { displayName: 'Siniestros', category: 'insurance', priority: 'critical' }
    ),
    commissions: createDbConfig(
      'SS_COMMISSIONS_DATABASE_URL',
      'ss_commissions',
      'postgresql://postgres:password@localhost:5432/ss_commissions',
      { displayName: 'Comisiones', category: 'insurance', priority: 'high' }
    ),
    carriers: createDbConfig(
      'SS_CARRIERS_DATABASE_URL',
      'ss_carriers',
      'postgresql://postgres:password@localhost:5432/ss_carriers',
      { displayName: 'Compañías', category: 'insurance', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HR MODULE DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  hr: {
    main: createDbConfig(
      'SM_HR_DATABASE_URL',
      'sm_hr',
      'postgresql://postgres:password@localhost:5432/sm_hr',
      { displayName: 'RRHH Principal', category: 'hr', priority: 'high' }
    ),
    payroll: createDbConfig(
      'SM_HR_PAYROLL_DATABASE_URL',
      'sm_hr_payroll',
      'postgresql://postgres:password@localhost:5432/sm_hr_payroll',
      { displayName: 'Nóminas', category: 'hr', priority: 'critical' }
    ),
    recruitment: createDbConfig(
      'SM_HR_RECRUITMENT_DATABASE_URL',
      'sm_hr_recruitment',
      'postgresql://postgres:password@localhost:5432/sm_hr_recruitment',
      { displayName: 'Selección', category: 'hr', priority: 'medium' }
    ),
    training: createDbConfig(
      'SM_HR_TRAINING_DATABASE_URL',
      'sm_hr_training',
      'postgresql://postgres:password@localhost:5432/sm_hr_training',
      { displayName: 'Formación', category: 'hr', priority: 'medium' }
    ),
    performance: createDbConfig(
      'SM_HR_PERFORMANCE_DATABASE_URL',
      'sm_hr_performance',
      'postgresql://postgres:password@localhost:5432/sm_hr_performance',
      { displayName: 'Evaluación', category: 'hr', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS MODULE DATABASES (4)
  // ═══════════════════════════════════════════════════════════════════════════
  analytics: {
    main: createDbConfig(
      'SM_ANALYTICS_DATABASE_URL',
      'sm_analytics',
      'postgresql://postgres:password@localhost:5432/sm_analytics',
      { displayName: 'Analytics Principal', category: 'analytics', priority: 'high' }
    ),
    reports: createDbConfig(
      'SM_ANALYTICS_REPORTS_DATABASE_URL',
      'sm_analytics_reports',
      'postgresql://postgres:password@localhost:5432/sm_analytics_reports',
      { displayName: 'Informes', category: 'analytics', priority: 'medium' }
    ),
    dashboards: createDbConfig(
      'SM_ANALYTICS_DASHBOARDS_DATABASE_URL',
      'sm_analytics_dashboards',
      'postgresql://postgres:password@localhost:5432/sm_analytics_dashboards',
      { displayName: 'Dashboards', category: 'analytics', priority: 'medium' }
    ),
    metrics: createDbConfig(
      'SM_ANALYTICS_METRICS_DATABASE_URL',
      'sm_analytics_metrics',
      'postgresql://postgres:password@localhost:5432/sm_analytics_metrics',
      { displayName: 'Métricas', category: 'analytics', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI AGENTS MODULE DATABASES (4)
  // ═══════════════════════════════════════════════════════════════════════════
  aiAgents: {
    main: createDbConfig(
      'SM_AI_AGENTS_DATABASE_URL',
      'sm_ai_agents',
      'postgresql://postgres:password@localhost:5432/sm_ai_agents',
      { displayName: 'Agentes IA', category: 'ai', priority: 'critical' }
    ),
    models: createDbConfig(
      'SM_AI_MODELS_DATABASE_URL',
      'sm_ai_models',
      'postgresql://postgres:password@localhost:5432/sm_ai_models',
      { displayName: 'Modelos IA', category: 'ai', priority: 'high' }
    ),
    training: createDbConfig(
      'SM_AI_TRAINING_DATABASE_URL',
      'sm_ai_training',
      'postgresql://postgres:password@localhost:5432/sm_ai_training',
      { displayName: 'Training IA', category: 'ai', priority: 'medium' }
    ),
    prompts: createDbConfig(
      'SM_AI_PROMPTS_DATABASE_URL',
      'sm_ai_prompts',
      'postgresql://postgres:password@localhost:5432/sm_ai_prompts',
      { displayName: 'Prompts IA', category: 'ai', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATIONS MODULE DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  communications: {
    main: createDbConfig(
      'SM_COMMUNICATIONS_DATABASE_URL',
      'sm_communications',
      'postgresql://postgres:password@localhost:5432/sm_communications',
      { displayName: 'Comunicaciones', category: 'communications', priority: 'high' }
    ),
    email: createDbConfig(
      'SM_COMMS_EMAIL_DATABASE_URL',
      'sm_comms_email',
      'postgresql://postgres:password@localhost:5432/sm_comms_email',
      { displayName: 'Email', category: 'communications', priority: 'high' }
    ),
    sms: createDbConfig(
      'SM_COMMS_SMS_DATABASE_URL',
      'sm_comms_sms',
      'postgresql://postgres:password@localhost:5432/sm_comms_sms',
      { displayName: 'SMS', category: 'communications', priority: 'high' }
    ),
    whatsapp: createDbConfig(
      'SM_COMMS_WHATSAPP_DATABASE_URL',
      'sm_comms_whatsapp',
      'postgresql://postgres:password@localhost:5432/sm_comms_whatsapp',
      { displayName: 'WhatsApp', category: 'communications', priority: 'high' }
    ),
    voice: createDbConfig(
      'SM_COMMS_VOICE_DATABASE_URL',
      'sm_comms_voice',
      'postgresql://postgres:password@localhost:5432/sm_comms_voice',
      { displayName: 'Voz', category: 'communications', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE MODULE DATABASES (4)
  // ═══════════════════════════════════════════════════════════════════════════
  finance: {
    main: createDbConfig(
      'SM_FINANCE_DATABASE_URL',
      'sm_finance',
      'postgresql://postgres:password@localhost:5432/sm_finance',
      { displayName: 'Finanzas', category: 'finance', priority: 'critical' }
    ),
    accounting: createDbConfig(
      'SM_FINANCE_ACCOUNTING_DATABASE_URL',
      'sm_finance_accounting',
      'postgresql://postgres:password@localhost:5432/sm_finance_accounting',
      { displayName: 'Contabilidad', category: 'finance', priority: 'critical' }
    ),
    invoicing: createDbConfig(
      'SM_FINANCE_INVOICING_DATABASE_URL',
      'sm_finance_invoicing',
      'postgresql://postgres:password@localhost:5432/sm_finance_invoicing',
      { displayName: 'Facturación', category: 'finance', priority: 'critical' }
    ),
    treasury: createDbConfig(
      'SM_FINANCE_TREASURY_DATABASE_URL',
      'sm_finance_treasury',
      'postgresql://postgres:password@localhost:5432/sm_finance_treasury',
      { displayName: 'Tesorería', category: 'finance', priority: 'critical' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRM & LEADS MODULE DATABASES (3)
  // ═══════════════════════════════════════════════════════════════════════════
  crm: {
    main: createDbConfig(
      'SM_CRM_DATABASE_URL',
      'sm_crm',
      'postgresql://postgres:password@localhost:5432/sm_crm',
      { displayName: 'CRM', category: 'crm', priority: 'high' }
    ),
    leads: createDbConfig(
      'SM_LEADS_DATABASE_URL',
      'sm_leads',
      'postgresql://postgres:password@localhost:5432/sm_leads',
      { displayName: 'Leads', category: 'crm', priority: 'high' }
    ),
    customers: createDbConfig(
      'SM_CUSTOMERS_DATABASE_URL',
      'sm_customers',
      'postgresql://postgres:password@localhost:5432/sm_customers',
      { displayName: 'Clientes', category: 'crm', priority: 'critical' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS MODULE DATABASES (2)
  // ═══════════════════════════════════════════════════════════════════════════
  documents: {
    main: createDbConfig(
      'SM_DOCUMENTS_DATABASE_URL',
      'sm_documents',
      'postgresql://postgres:password@localhost:5432/sm_documents',
      { displayName: 'Documentos', category: 'documents', priority: 'high' }
    ),
    storage: createDbConfig(
      'SM_STORAGE_DATABASE_URL',
      'sm_storage',
      'postgresql://postgres:password@localhost:5432/sm_storage',
      { displayName: 'Almacenamiento', category: 'documents', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOWS MODULE DATABASES (2)
  // ═══════════════════════════════════════════════════════════════════════════
  workflows: {
    main: createDbConfig(
      'SM_WORKFLOWS_DATABASE_URL',
      'sm_workflows',
      'postgresql://postgres:password@localhost:5432/sm_workflows',
      { displayName: 'Workflows', category: 'workflows', priority: 'high' }
    ),
    tasks: createDbConfig(
      'SM_TASKS_DATABASE_URL',
      'sm_tasks',
      'postgresql://postgres:password@localhost:5432/sm_tasks',
      { displayName: 'Tareas', category: 'workflows', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SORIANO MEDIADORES WEB - www.sorianomediadores.es (5)
  // ═══════════════════════════════════════════════════════════════════════════
  sorianoWeb: {
    main: createDbConfig(
      'SORIANO_WEB_DATABASE_URL',
      'soriano_web_main',
      'postgresql://postgres:password@localhost:5432/soriano_web_main',
      { displayName: 'Soriano Web', category: 'sorianoWeb', priority: 'critical' }
    ),
    content: createDbConfig(
      'SORIANO_WEB_CONTENT_DATABASE_URL',
      'soriano_web_content',
      'postgresql://postgres:password@localhost:5432/soriano_web_content',
      { displayName: 'Soriano CMS', category: 'sorianoWeb', priority: 'high' }
    ),
    blog: createDbConfig(
      'SORIANO_WEB_BLOG_DATABASE_URL',
      'soriano_web_blog',
      'postgresql://postgres:password@localhost:5432/soriano_web_blog',
      { displayName: 'Soriano Blog', category: 'sorianoWeb', priority: 'medium' }
    ),
    forms: createDbConfig(
      'SORIANO_WEB_FORMS_DATABASE_URL',
      'soriano_web_forms',
      'postgresql://postgres:password@localhost:5432/soriano_web_forms',
      { displayName: 'Soriano Formularios', category: 'sorianoWeb', priority: 'high' }
    ),
    seo: createDbConfig(
      'SORIANO_WEB_SEO_DATABASE_URL',
      'soriano_web_seo',
      'postgresql://postgres:password@localhost:5432/soriano_web_seo',
      { displayName: 'Soriano SEO', category: 'sorianoWeb', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // e-SORI WEB PLATFORM DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  esori: {
    main: createDbConfig(
      'ESORI_DATABASE_URL',
      'esori_main',
      'postgresql://postgres:password@localhost:5432/esori_main',
      { displayName: 'e-SORI Principal', category: 'esori', priority: 'critical' }
    ),
    users: createDbConfig(
      'ESORI_USERS_DATABASE_URL',
      'esori_users',
      'postgresql://postgres:password@localhost:5432/esori_users',
      { displayName: 'e-SORI Usuarios', category: 'esori', priority: 'critical' }
    ),
    quotes: createDbConfig(
      'ESORI_QUOTES_DATABASE_URL',
      'esori_quotes',
      'postgresql://postgres:password@localhost:5432/esori_quotes',
      { displayName: 'e-SORI Cotizaciones', category: 'esori', priority: 'high' }
    ),
    sessions: createDbConfig(
      'ESORI_SESSIONS_DATABASE_URL',
      'esori_sessions',
      'postgresql://postgres:password@localhost:5432/esori_sessions',
      { displayName: 'e-SORI Sesiones', category: 'esori', priority: 'medium' }
    ),
    content: createDbConfig(
      'ESORI_CONTENT_DATABASE_URL',
      'esori_content',
      'postgresql://postgres:password@localhost:5432/esori_content',
      { displayName: 'e-SORI CMS', category: 'esori', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SORIANO LANDINGS DATABASES (4)
  // ═══════════════════════════════════════════════════════════════════════════
  sorianoLandings: {
    main: createDbConfig(
      'LANDING_SORIANO_DATABASE_URL',
      'landing_soriano_main',
      'postgresql://postgres:password@localhost:5432/landing_soriano_main',
      { displayName: 'Soriano Landings', category: 'landings', priority: 'high' }
    ),
    leads: createDbConfig(
      'LANDING_SORIANO_LEADS_DATABASE_URL',
      'landing_soriano_leads',
      'postgresql://postgres:password@localhost:5432/landing_soriano_leads',
      { displayName: 'Soriano Landing Leads', category: 'landings', priority: 'critical' }
    ),
    analytics: createDbConfig(
      'LANDING_SORIANO_ANALYTICS_DATABASE_URL',
      'landing_soriano_analytics',
      'postgresql://postgres:password@localhost:5432/landing_soriano_analytics',
      { displayName: 'Soriano Analytics', category: 'landings', priority: 'medium' }
    ),
    campaigns: createDbConfig(
      'LANDING_SORIANO_CAMPAIGNS_DATABASE_URL',
      'landing_soriano_campaigns',
      'postgresql://postgres:password@localhost:5432/landing_soriano_campaigns',
      { displayName: 'Soriano Campañas', category: 'landings', priority: 'high' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAXI ASEGURADO PLATFORM DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  taxiAsegurado: {
    main: createDbConfig(
      'TAXI_DATABASE_URL',
      'taxi_asegurado_main',
      'postgresql://postgres:password@localhost:5432/taxi_asegurado_main',
      { displayName: 'Taxi Asegurado', category: 'taxi', priority: 'critical' }
    ),
    leads: createDbConfig(
      'TAXI_LEADS_DATABASE_URL',
      'taxi_asegurado_leads',
      'postgresql://postgres:password@localhost:5432/taxi_asegurado_leads',
      { displayName: 'Taxi Leads', category: 'taxi', priority: 'critical' }
    ),
    quotes: createDbConfig(
      'TAXI_QUOTES_DATABASE_URL',
      'taxi_asegurado_quotes',
      'postgresql://postgres:password@localhost:5432/taxi_asegurado_quotes',
      { displayName: 'Taxi Cotizaciones', category: 'taxi', priority: 'high' }
    ),
    policies: createDbConfig(
      'TAXI_POLICIES_DATABASE_URL',
      'taxi_asegurado_policies',
      'postgresql://postgres:password@localhost:5432/taxi_asegurado_policies',
      { displayName: 'Taxi Pólizas', category: 'taxi', priority: 'critical' }
    ),
    analytics: createDbConfig(
      'TAXI_ANALYTICS_DATABASE_URL',
      'taxi_asegurado_analytics',
      'postgresql://postgres:password@localhost:5432/taxi_asegurado_analytics',
      { displayName: 'Taxi Analytics', category: 'taxi', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTENDED ERP MODULES (10)
  // ═══════════════════════════════════════════════════════════════════════════
  extended: {
    inventory: createDbConfig(
      'SM_INVENTORY_DATABASE_URL',
      'sm_inventory',
      'postgresql://postgres:password@localhost:5432/sm_inventory',
      { displayName: 'Inventario', category: 'extended', priority: 'medium' }
    ),
    products: createDbConfig(
      'SM_PRODUCTS_DATABASE_URL',
      'sm_products',
      'postgresql://postgres:password@localhost:5432/sm_products',
      { displayName: 'Productos', category: 'extended', priority: 'high' }
    ),
    projects: createDbConfig(
      'SM_PROJECTS_DATABASE_URL',
      'sm_projects',
      'postgresql://postgres:password@localhost:5432/sm_projects',
      { displayName: 'Proyectos', category: 'extended', priority: 'high' }
    ),
    marketing: createDbConfig(
      'SM_MARKETING_DATABASE_URL',
      'sm_marketing',
      'postgresql://postgres:password@localhost:5432/sm_marketing',
      { displayName: 'Marketing', category: 'extended', priority: 'high' }
    ),
    legal: createDbConfig(
      'SM_LEGAL_DATABASE_URL',
      'sm_legal',
      'postgresql://postgres:password@localhost:5432/sm_legal',
      { displayName: 'Legal', category: 'extended', priority: 'high' }
    ),
    compliance: createDbConfig(
      'SM_COMPLIANCE_DATABASE_URL',
      'sm_compliance',
      'postgresql://postgres:password@localhost:5432/sm_compliance',
      { displayName: 'Compliance', category: 'extended', priority: 'critical' }
    ),
    quality: createDbConfig(
      'SM_QUALITY_DATABASE_URL',
      'sm_quality',
      'postgresql://postgres:password@localhost:5432/sm_quality',
      { displayName: 'Calidad', category: 'extended', priority: 'medium' }
    ),
    tickets: createDbConfig(
      'SM_TICKETS_DATABASE_URL',
      'sm_tickets',
      'postgresql://postgres:password@localhost:5432/sm_tickets',
      { displayName: 'Tickets', category: 'extended', priority: 'high' }
    ),
    notifications: createDbConfig(
      'SM_NOTIFICATIONS_DATABASE_URL',
      'sm_notifications',
      'postgresql://postgres:password@localhost:5432/sm_notifications',
      { displayName: 'Notificaciones', category: 'extended', priority: 'high' }
    ),
    scheduling: createDbConfig(
      'SM_SCHEDULING_DATABASE_URL',
      'sm_scheduling',
      'postgresql://postgres:password@localhost:5432/sm_scheduling',
      { displayName: 'Planificación', category: 'extended', priority: 'medium' }
    ),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTERNAL INTEGRATIONS DATABASES (5)
  // ═══════════════════════════════════════════════════════════════════════════
  external: {
    carriers: createDbConfig(
      'EXT_CARRIERS_DATABASE_URL',
      'ext_carriers',
      'postgresql://postgres:password@localhost:5432/ext_carriers',
      { displayName: 'APIs Compañías', category: 'external', priority: 'high' }
    ),
    payments: createDbConfig(
      'EXT_PAYMENTS_DATABASE_URL',
      'ext_payments',
      'postgresql://postgres:password@localhost:5432/ext_payments',
      { displayName: 'Pasarelas Pago', category: 'external', priority: 'critical' }
    ),
    maps: createDbConfig(
      'EXT_MAPS_DATABASE_URL',
      'ext_maps',
      'postgresql://postgres:password@localhost:5432/ext_maps',
      { displayName: 'Geolocalización', category: 'external', priority: 'low' }
    ),
    aiModels: createDbConfig(
      'EXT_AI_MODELS_DATABASE_URL',
      'ext_ai_models',
      'postgresql://postgres:password@localhost:5432/ext_ai_models',
      { displayName: 'Modelos IA Ext', category: 'external', priority: 'high' }
    ),
    backups: createDbConfig(
      'EXT_BACKUPS_DATABASE_URL',
      'ext_backups',
      'postgresql://postgres:password@localhost:5432/ext_backups',
      { displayName: 'Backups Meta', category: 'external', priority: 'critical' }
    ),
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all database URLs as a flat array
 */
export function getAllDatabaseUrls(): string[] {
  const urls: string[] = [];
  const extractUrls = (obj: Record<string, unknown>) => {
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        if ('url' in value && typeof (value as DatabaseConnection).url === 'string') {
          urls.push((value as DatabaseConnection).url);
        } else {
          extractUrls(value as Record<string, unknown>);
        }
      }
    }
  };
  extractUrls(databaseConfig as unknown as Record<string, unknown>);
  return urls;
}

/**
 * Get all database connections as a flat array
 */
export function getAllDatabaseConnections(): DatabaseConnection[] {
  const connections: DatabaseConnection[] = [];
  const extractConnections = (obj: Record<string, unknown>) => {
    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        if ('url' in value && 'name' in value) {
          connections.push(value as DatabaseConnection);
        } else {
          extractConnections(value as Record<string, unknown>);
        }
      }
    }
  };
  extractConnections(databaseConfig as unknown as Record<string, unknown>);
  return connections;
}

/**
 * Get database connection by name
 */
export function getDatabaseByName(name: string): DatabaseConnection | undefined {
  return getAllDatabaseConnections().find((db) => db.name === name);
}

/**
 * Get databases by category
 */
export function getDatabasesByCategory(category: string): DatabaseConnection[] {
  return getAllDatabaseConnections().filter((db) => db.category === category);
}

/**
 * Get databases by priority
 */
export function getDatabasesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): DatabaseConnection[] {
  return getAllDatabaseConnections().filter((db) => db.priority === priority);
}

/**
 * Get database count by category
 */
export function getDatabaseCounts(): Record<string, number> {
  return {
    // Shared Ecosystem
    shared: Object.keys(databaseConfig.shared).length,
    // Core ERP
    core: Object.keys(databaseConfig.core).length,
    insurance: Object.keys(databaseConfig.insurance).length,
    hr: Object.keys(databaseConfig.hr).length,
    analytics: Object.keys(databaseConfig.analytics).length,
    aiAgents: Object.keys(databaseConfig.aiAgents).length,
    communications: Object.keys(databaseConfig.communications).length,
    finance: Object.keys(databaseConfig.finance).length,
    crm: Object.keys(databaseConfig.crm).length,
    documents: Object.keys(databaseConfig.documents).length,
    workflows: Object.keys(databaseConfig.workflows).length,
    // Web Platforms
    sorianoWeb: Object.keys(databaseConfig.sorianoWeb).length,
    esori: Object.keys(databaseConfig.esori).length,
    sorianoLandings: Object.keys(databaseConfig.sorianoLandings).length,
    taxiAsegurado: Object.keys(databaseConfig.taxiAsegurado).length,
    // Extended
    extended: Object.keys(databaseConfig.extended).length,
    external: Object.keys(databaseConfig.external).length,
    // Total
    total: getAllDatabaseConnections().length,
  };
}

/**
 * Get summary by platform/ecosystem
 */
export function getDatabaseSummary(): {
  shared: number;
  erp: number;
  platforms: number;
  extended: number;
  total: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
} {
  const all = getAllDatabaseConnections();
  const counts = getDatabaseCounts();

  return {
    shared: counts.shared,                                              // 8 - Compartidas
    erp: counts.core + counts.insurance + counts.hr + counts.analytics +
         counts.aiAgents + counts.communications + counts.finance +
         counts.crm + counts.documents + counts.workflows,              // 39 - Core ERP
    platforms: counts.sorianoWeb + counts.esori +
               counts.sorianoLandings + counts.taxiAsegurado,           // 19 - Web Platforms
    extended: counts.extended + counts.external,                        // 15 - Extended
    total: all.length,                                                  // 81 Total
    byPriority: {
      critical: all.filter(db => db.priority === 'critical').length,
      high: all.filter(db => db.priority === 'high').length,
      medium: all.filter(db => db.priority === 'medium').length,
      low: all.filter(db => db.priority === 'low').length,
    },
    byCategory: {
      shared: counts.shared,
      core: counts.core,
      insurance: counts.insurance,
      hr: counts.hr,
      analytics: counts.analytics,
      ai: counts.aiAgents,
      communications: counts.communications,
      finance: counts.finance,
      crm: counts.crm,
      documents: counts.documents,
      workflows: counts.workflows,
      sorianoWeb: counts.sorianoWeb,
      esori: counts.esori,
      landings: counts.sorianoLandings,
      taxi: counts.taxiAsegurado,
      extended: counts.extended,
      external: counts.external,
    }
  };
}

/**
 * Get ecosystem overview
 */
export function getEcosystemOverview() {
  const summary = getDatabaseSummary();
  return {
    name: 'SORIANO ECOSYSTEM',
    version: '1.0.0',
    platforms: [
      { name: 'AIT-CORE (ERP)', databases: summary.erp, status: 'active' },
      { name: 'SHARED (SSO/CRM)', databases: summary.shared, status: 'active' },
      { name: 'www.sorianomediadores.es', databases: getDatabaseCounts().sorianoWeb, status: 'active' },
      { name: 'e-SORI Portal', databases: getDatabaseCounts().esori, status: 'active' },
      { name: 'Landings Soriano', databases: getDatabaseCounts().sorianoLandings, status: 'active' },
      { name: 'Taxi Asegurado', databases: getDatabaseCounts().taxiAsegurado, status: 'active' },
      { name: 'Extended Modules', databases: getDatabaseCounts().extended, status: 'active' },
      { name: 'External APIs', databases: getDatabaseCounts().external, status: 'active' },
    ],
    totalDatabases: summary.total,
    priority: summary.byPriority,
  };
}

/**
 * Validate all database URLs format
 */
export function validateDatabaseUrls(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const urlPattern = /^postgresql:\/\/[\w-]+:[\w-]+@[\w.-]+:\d+\/[\w_-]+$/;

  for (const connection of getAllDatabaseConnections()) {
    if (!urlPattern.test(connection.url)) {
      errors.push(`Invalid URL format for database '${connection.name}': ${connection.url}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default databaseConfig;
