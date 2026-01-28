/**
 * Prisma Client Instances for all 40 databases
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '@ait-core/shared/logger';

const logger = createLogger('@ait-core/database');

/**
 * Database client factory
 */
function createDatabaseClient(name: string, databaseUrl?: string): PrismaClient {
  const url = databaseUrl || process.env[`DATABASE_URL_${name.toUpperCase()}`] || process.env.DATABASE_URL;

  const client = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  // @ts-ignore - Event emitter types
  client.$on('query', (e) => {
    logger.debug(`[${name}] Query: ${e.query}`, {
      params: e.params,
      duration: e.duration,
    });
  });

  // @ts-ignore
  client.$on('error', (e) => {
    logger.error(`[${name}] Database error`, { error: e });
  });

  return client;
}

// ============================================================================
// CORE BUSINESS DATABASES (6)
// ============================================================================

/**
 * DB-01: Policies Database
 * Insurance policies, coverages, endorsements
 */
export const policiesDb = createDatabaseClient('POLICIES');

/**
 * DB-02: Claims Database
 * Claims, adjustments, settlements
 */
export const claimsDb = createDatabaseClient('CLAIMS');

/**
 * DB-03: Customers Database
 * Customers, contacts, relationships (CRM)
 */
export const customersDb = createDatabaseClient('CUSTOMERS');

/**
 * DB-04: Finance Database
 * Payments, invoices, commissions, accounting
 */
export const financeDb = createDatabaseClient('FINANCE');

/**
 * DB-05: Documents Database
 * Document storage, versioning, metadata
 */
export const documentsDb = createDatabaseClient('DOCUMENTS');

/**
 * DB-06: Quotes Database
 * Quote requests, calculations, comparisons
 */
export const quotesDb = createDatabaseClient('QUOTES');

// ============================================================================
// INSURANCE SPECIALIZED DATABASES (12)
// ============================================================================

/**
 * DB-07: Auto Insurance
 * Vehicles, drivers, auto-specific data
 */
export const autoInsuranceDb = createDatabaseClient('AUTO_INSURANCE');

/**
 * DB-08: Home Insurance
 * Properties, home-specific coverages
 */
export const homeInsuranceDb = createDatabaseClient('HOME_INSURANCE');

/**
 * DB-09: Health Insurance
 * Medical records, providers, health plans
 */
export const healthInsuranceDb = createDatabaseClient('HEALTH_INSURANCE');

/**
 * DB-10: Life Insurance
 * Beneficiaries, underwriting, life-specific data
 */
export const lifeInsuranceDb = createDatabaseClient('LIFE_INSURANCE');

/**
 * DB-11: Business Insurance
 * Commercial policies, business assets
 */
export const businessInsuranceDb = createDatabaseClient('BUSINESS_INSURANCE');

/**
 * DB-12: Travel Insurance
 * Travel plans, destinations, travel-specific coverages
 */
export const travelInsuranceDb = createDatabaseClient('TRAVEL_INSURANCE');

/**
 * DB-13: Liability Insurance
 * Liability coverages, professional indemnity
 */
export const liabilityInsuranceDb = createDatabaseClient('LIABILITY_INSURANCE');

/**
 * DB-14: Marine Insurance
 * Maritime assets, cargo insurance
 */
export const marineInsuranceDb = createDatabaseClient('MARINE_INSURANCE');

/**
 * DB-15: Agricultural Insurance
 * Crops, livestock, agricultural assets
 */
export const agriculturalInsuranceDb = createDatabaseClient('AGRICULTURAL_INSURANCE');

/**
 * DB-16: Construction Insurance
 * Construction projects, builder's risk
 */
export const constructionInsuranceDb = createDatabaseClient('CONSTRUCTION_INSURANCE');

/**
 * DB-17: Cyber Insurance
 * Cyber risks, data breach coverage
 */
export const cyberInsuranceDb = createDatabaseClient('CYBER_INSURANCE');

/**
 * DB-18: Pet Insurance
 * Pets, veterinary coverage
 */
export const petInsuranceDb = createDatabaseClient('PET_INSURANCE');

// ============================================================================
// MARKETING & SALES DATABASES (5)
// ============================================================================

/**
 * DB-19: Campaigns Database
 * Marketing campaigns, channels, performance
 */
export const campaignsDb = createDatabaseClient('CAMPAIGNS');

/**
 * DB-20: Leads Database
 * Lead generation, scoring, nurturing
 */
export const leadsDb = createDatabaseClient('LEADS');

/**
 * DB-21: Sales Pipeline
 * Opportunities, sales stages, forecasting
 */
export const salesPipelineDb = createDatabaseClient('SALES_PIPELINE');

/**
 * DB-22: Referrals Database
 * Referral programs, partner tracking
 */
export const referralsDb = createDatabaseClient('REFERRALS');

/**
 * DB-23: Loyalty Database
 * Loyalty programs, rewards, points
 */
export const loyaltyDb = createDatabaseClient('LOYALTY');

// ============================================================================
// ANALYTICS & INTELLIGENCE DATABASES (5)
// ============================================================================

/**
 * DB-24: Analytics Warehouse
 * Data warehouse, aggregated metrics
 */
export const analyticsDb = createDatabaseClient('ANALYTICS');

/**
 * DB-25: Reporting Database
 * Report definitions, scheduled reports
 */
export const reportingDb = createDatabaseClient('REPORTING');

/**
 * DB-26: Actuarial Database
 * Risk modeling, actuarial calculations
 */
export const actuarialDb = createDatabaseClient('ACTUARIAL');

/**
 * DB-27: Fraud Detection
 * Fraud patterns, risk scores, investigations
 */
export const fraudDetectionDb = createDatabaseClient('FRAUD_DETECTION');

/**
 * DB-28: Predictive Models
 * ML models, predictions, training data
 */
export const predictiveModelsDb = createDatabaseClient('PREDICTIVE_MODELS');

// ============================================================================
// SECURITY & COMPLIANCE DATABASES (3)
// ============================================================================

/**
 * DB-29: Authentication & Authorization
 * Users, roles, permissions, sessions
 */
export const authDb = createDatabaseClient('AUTH');

/**
 * DB-30: Audit Logs
 * Audit trails, compliance logs
 */
export const auditDb = createDatabaseClient('AUDIT');

/**
 * DB-31: Compliance Database
 * Regulatory requirements, compliance records
 */
export const complianceDb = createDatabaseClient('COMPLIANCE');

// ============================================================================
// INFRASTRUCTURE DATABASES (4)
// ============================================================================

/**
 * DB-32: Notifications Database
 * Notification queue, delivery tracking
 */
export const notificationsDb = createDatabaseClient('NOTIFICATIONS');

/**
 * DB-33: Email Queue
 * Email templates, send queue, tracking
 */
export const emailQueueDb = createDatabaseClient('EMAIL_QUEUE');

/**
 * DB-34: File Storage
 * File metadata, storage locations
 */
export const fileStorageDb = createDatabaseClient('FILE_STORAGE');

/**
 * DB-35: Cache Store
 * Application cache, session storage
 */
export const cacheDb = createDatabaseClient('CACHE');

// ============================================================================
// INTEGRATION & AUTOMATION DATABASES (5)
// ============================================================================

/**
 * DB-36: API Gateway
 * API keys, rate limits, usage tracking
 */
export const apiGatewayDb = createDatabaseClient('API_GATEWAY');

/**
 * DB-37: Workflow Engine
 * Workflow definitions, executions
 */
export const workflowDb = createDatabaseClient('WORKFLOW');

/**
 * DB-38: Event Store
 * Event sourcing, domain events
 */
export const eventStoreDb = createDatabaseClient('EVENT_STORE');

/**
 * DB-39: Integration Hub
 * External system integrations, mappings
 */
export const integrationDb = createDatabaseClient('INTEGRATION');

/**
 * DB-40: Job Scheduler
 * Scheduled jobs, cron definitions
 */
export const jobSchedulerDb = createDatabaseClient('JOB_SCHEDULER');

/**
 * All database clients registry
 */
export const allDatabases = {
  // Core Business
  policies: policiesDb,
  claims: claimsDb,
  customers: customersDb,
  finance: financeDb,
  documents: documentsDb,
  quotes: quotesDb,

  // Insurance Specialized
  autoInsurance: autoInsuranceDb,
  homeInsurance: homeInsuranceDb,
  healthInsurance: healthInsuranceDb,
  lifeInsurance: lifeInsuranceDb,
  businessInsurance: businessInsuranceDb,
  travelInsurance: travelInsuranceDb,
  liabilityInsurance: liabilityInsuranceDb,
  marineInsurance: marineInsuranceDb,
  agriculturalInsurance: agriculturalInsuranceDb,
  constructionInsurance: constructionInsuranceDb,
  cyberInsurance: cyberInsuranceDb,
  petInsurance: petInsuranceDb,

  // Marketing & Sales
  campaigns: campaignsDb,
  leads: leadsDb,
  salesPipeline: salesPipelineDb,
  referrals: referralsDb,
  loyalty: loyaltyDb,

  // Analytics & Intelligence
  analytics: analyticsDb,
  reporting: reportingDb,
  actuarial: actuarialDb,
  fraudDetection: fraudDetectionDb,
  predictiveModels: predictiveModelsDb,

  // Security & Compliance
  auth: authDb,
  audit: auditDb,
  compliance: complianceDb,

  // Infrastructure
  notifications: notificationsDb,
  emailQueue: emailQueueDb,
  fileStorage: fileStorageDb,
  cache: cacheDb,

  // Integration & Automation
  apiGateway: apiGatewayDb,
  workflow: workflowDb,
  eventStore: eventStoreDb,
  integration: integrationDb,
  jobScheduler: jobSchedulerDb,
} as const;

export type DatabaseName = keyof typeof allDatabases;
