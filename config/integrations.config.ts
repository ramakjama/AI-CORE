/**
 * AI-CORE External Integrations Configuration
 * Configuration for all external APIs and services
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Twilio Configuration Schema
// -----------------------------------------------------------------------------
const TwilioConfigSchema = z.object({
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  phoneNumber: z.string().optional(),
  messagingServiceSid: z.string().optional(),
  verifyServiceSid: z.string().optional(),
  voiceUrl: z.string().url().optional(),
  smsUrl: z.string().url().optional(),
  statusCallbackUrl: z.string().url().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// WhatsApp Configuration Schema
// -----------------------------------------------------------------------------
const WhatsAppConfigSchema = z.object({
  accessToken: z.string().optional(),
  phoneNumberId: z.string().optional(),
  businessAccountId: z.string().optional(),
  verifyToken: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  apiVersion: z.string().default('v18.0'),
  templateNamespace: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// SMTP Configuration Schema
// -----------------------------------------------------------------------------
const SMTPConfigSchema = z.object({
  host: z.string().default('smtp.gmail.com'),
  port: z.number().int().positive().default(587),
  secure: z.boolean().default(false),
  user: z.string().optional(),
  password: z.string().optional(),
  fromName: z.string().default('AI-CORE Platform'),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// AWS SES Configuration Schema
// -----------------------------------------------------------------------------
const AWSSESConfigSchema = z.object({
  region: z.string().default('eu-west-1'),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// SendGrid Configuration Schema
// -----------------------------------------------------------------------------
const SendGridConfigSchema = z.object({
  apiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// SSO Providers Configuration Schemas
// -----------------------------------------------------------------------------
const AzureADConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  redirectUri: z.string().url().optional(),
  scopes: z.array(z.string()).default(['openid', 'profile', 'email', 'User.Read']),
  enabled: z.boolean().default(false),
});

const GoogleOAuthConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url().optional(),
  enabled: z.boolean().default(false),
});

const OktaConfigSchema = z.object({
  domain: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url().optional(),
  issuer: z.string().optional(),
  enabled: z.boolean().default(false),
});

const Auth0ConfigSchema = z.object({
  domain: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  redirectUri: z.string().url().optional(),
  audience: z.string().optional(),
  enabled: z.boolean().default(false),
});

const SAMLConfigSchema = z.object({
  entryPoint: z.string().url().optional(),
  issuer: z.string().optional(),
  certPath: z.string().optional(),
  privateKeyPath: z.string().optional(),
  callbackUrl: z.string().url().optional(),
  enabled: z.boolean().default(false),
});

const LDAPConfigSchema = z.object({
  url: z.string().optional(),
  bindDn: z.string().optional(),
  bindPassword: z.string().optional(),
  searchBase: z.string().optional(),
  searchFilter: z.string().default('(uid={{username}})'),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Storage Configuration Schemas
// -----------------------------------------------------------------------------
const AWSS3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().default('eu-west-1'),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  endpoint: z.string().optional(),
  enabled: z.boolean().default(false),
});

const MinIOConfigSchema = z.object({
  endpoint: z.string().default('localhost'),
  port: z.number().int().positive().default(9000),
  useSSL: z.boolean().default(false),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

const AzureBlobConfigSchema = z.object({
  connectionString: z.string().optional(),
  container: z.string().optional(),
  enabled: z.boolean().default(false),
});

const GCSConfigSchema = z.object({
  projectId: z.string().optional(),
  bucket: z.string().optional(),
  keyFilePath: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Payment Providers Configuration Schemas
// -----------------------------------------------------------------------------
const StripeConfigSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  enabled: z.boolean().default(false),
});

const PlaidConfigSchema = z.object({
  clientId: z.string().optional(),
  secret: z.string().optional(),
  env: z.enum(['sandbox', 'development', 'production']).default('sandbox'),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Search & Analytics Configuration Schemas
// -----------------------------------------------------------------------------
const ElasticsearchConfigSchema = z.object({
  node: z.string().default('http://localhost:9200'),
  username: z.string().optional(),
  password: z.string().optional(),
  indexPrefix: z.string().default('ai_core_'),
  enabled: z.boolean().default(false),
});

const MapboxConfigSchema = z.object({
  accessToken: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Vector Databases Configuration Schemas
// -----------------------------------------------------------------------------
const PineconeConfigSchema = z.object({
  apiKey: z.string().optional(),
  environment: z.string().optional(),
  indexName: z.string().optional(),
  enabled: z.boolean().default(false),
});

const WeaviateConfigSchema = z.object({
  url: z.string().default('http://localhost:8080'),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

const QdrantConfigSchema = z.object({
  url: z.string().default('http://localhost:6333'),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Insurance APIs Configuration Schema
// -----------------------------------------------------------------------------
const InsuranceAPIConfigSchema = z.object({
  apiUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

const InsuranceProvidersSchema = z.object({
  caser: InsuranceAPIConfigSchema,
  mapfre: InsuranceAPIConfigSchema,
  axa: InsuranceAPIConfigSchema,
  allianz: InsuranceAPIConfigSchema,
  generali: InsuranceAPIConfigSchema,
});

// -----------------------------------------------------------------------------
// Complete Integrations Configuration Schema
// -----------------------------------------------------------------------------
export const IntegrationsConfigSchema = z.object({
  // Communications
  twilio: TwilioConfigSchema,
  whatsapp: WhatsAppConfigSchema,
  smtp: SMTPConfigSchema,
  awsSes: AWSSESConfigSchema,
  sendgrid: SendGridConfigSchema,

  // SSO Providers
  sso: z.object({
    azureAd: AzureADConfigSchema,
    google: GoogleOAuthConfigSchema,
    okta: OktaConfigSchema,
    auth0: Auth0ConfigSchema,
    saml: SAMLConfigSchema,
    ldap: LDAPConfigSchema,
  }),

  // Storage
  storage: z.object({
    awsS3: AWSS3ConfigSchema,
    minio: MinIOConfigSchema,
    azureBlob: AzureBlobConfigSchema,
    gcs: GCSConfigSchema,
  }),

  // Payments
  payments: z.object({
    stripe: StripeConfigSchema,
    plaid: PlaidConfigSchema,
  }),

  // Search & Analytics
  elasticsearch: ElasticsearchConfigSchema,
  mapbox: MapboxConfigSchema,

  // Vector Databases
  vectorDb: z.object({
    pinecone: PineconeConfigSchema,
    weaviate: WeaviateConfigSchema,
    qdrant: QdrantConfigSchema,
  }),

  // Insurance Providers
  insurance: InsuranceProvidersSchema,
});

export type IntegrationsConfig = z.infer<typeof IntegrationsConfigSchema>;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// -----------------------------------------------------------------------------
// Build Integrations Configuration
// -----------------------------------------------------------------------------
export const integrationsConfig: IntegrationsConfig = {
  // === TWILIO ===
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    voiceUrl: process.env.TWILIO_VOICE_URL,
    smsUrl: process.env.TWILIO_SMS_URL,
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL,
    enabled: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
  },

  // === WHATSAPP (META) ===
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    templateNamespace: process.env.WHATSAPP_TEMPLATE_NAMESPACE,
    enabled: !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID,
  },

  // === SMTP ===
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || 'AI-CORE Platform',
    fromEmail: process.env.SMTP_FROM_EMAIL,
    replyTo: process.env.SMTP_REPLY_TO,
    enabled: !!process.env.SMTP_HOST && !!process.env.SMTP_USER,
  },

  // === AWS SES ===
  awsSes: {
    region: process.env.AWS_SES_REGION || 'eu-west-1',
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    enabled: !!process.env.AWS_SES_ACCESS_KEY_ID,
  },

  // === SENDGRID ===
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    enabled: !!process.env.SENDGRID_API_KEY,
  },

  // === SSO PROVIDERS ===
  sso: {
    azureAd: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      redirectUri: process.env.AZURE_AD_REDIRECT_URI,
      scopes: parseArray(process.env.AZURE_AD_SCOPES, ['openid', 'profile', 'email', 'User.Read']),
      enabled: !!process.env.AZURE_AD_CLIENT_ID && !!process.env.AZURE_AD_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
    okta: {
      domain: process.env.OKTA_DOMAIN,
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      redirectUri: process.env.OKTA_REDIRECT_URI,
      issuer: process.env.OKTA_ISSUER,
      enabled: !!process.env.OKTA_CLIENT_ID && !!process.env.OKTA_CLIENT_SECRET,
    },
    auth0: {
      domain: process.env.AUTH0_DOMAIN,
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      redirectUri: process.env.AUTH0_REDIRECT_URI,
      audience: process.env.AUTH0_AUDIENCE,
      enabled: !!process.env.AUTH0_CLIENT_ID && !!process.env.AUTH0_CLIENT_SECRET,
    },
    saml: {
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      certPath: process.env.SAML_CERT_PATH,
      privateKeyPath: process.env.SAML_PRIVATE_KEY_PATH,
      callbackUrl: process.env.SAML_CALLBACK_URL,
      enabled: !!process.env.SAML_ENTRY_POINT && !!process.env.SAML_ISSUER,
    },
    ldap: {
      url: process.env.LDAP_URL,
      bindDn: process.env.LDAP_BIND_DN,
      bindPassword: process.env.LDAP_BIND_PASSWORD,
      searchBase: process.env.LDAP_SEARCH_BASE,
      searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
      enabled: !!process.env.LDAP_URL && !!process.env.LDAP_BIND_DN,
    },
  },

  // === STORAGE ===
  storage: {
    awsS3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION || 'eu-west-1',
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      enabled: !!process.env.AWS_S3_BUCKET && !!process.env.AWS_S3_ACCESS_KEY_ID,
    },
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseNumber(process.env.MINIO_PORT, 9000),
      useSSL: parseBoolean(process.env.MINIO_USE_SSL),
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      enabled: !!process.env.MINIO_ACCESS_KEY && !!process.env.MINIO_SECRET_KEY,
    },
    azureBlob: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      container: process.env.AZURE_STORAGE_CONTAINER,
      enabled: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
    },
    gcs: {
      projectId: process.env.GCS_PROJECT_ID,
      bucket: process.env.GCS_BUCKET,
      keyFilePath: process.env.GCS_KEY_FILE_PATH,
      enabled: !!process.env.GCS_PROJECT_ID && !!process.env.GCS_BUCKET,
    },
  },

  // === PAYMENTS ===
  payments: {
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      enabled: !!process.env.STRIPE_SECRET_KEY,
    },
    plaid: {
      clientId: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      env: (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
      enabled: !!process.env.PLAID_CLIENT_ID && !!process.env.PLAID_SECRET,
    },
  },

  // === ELASTICSEARCH ===
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'ai_core_',
    enabled: !!process.env.ELASTICSEARCH_NODE,
  },

  // === MAPBOX ===
  mapbox: {
    accessToken: process.env.MAPBOX_ACCESS_TOKEN,
    enabled: !!process.env.MAPBOX_ACCESS_TOKEN,
  },

  // === VECTOR DATABASES ===
  vectorDb: {
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
      indexName: process.env.PINECONE_INDEX_NAME,
      enabled: !!process.env.PINECONE_API_KEY,
    },
    weaviate: {
      url: process.env.WEAVIATE_URL || 'http://localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY,
      enabled: !!process.env.WEAVIATE_URL,
    },
    qdrant: {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      enabled: !!process.env.QDRANT_URL,
    },
  },

  // === INSURANCE PROVIDERS ===
  insurance: {
    caser: {
      apiUrl: process.env.CASER_API_URL,
      apiKey: process.env.CASER_API_KEY,
      enabled: !!process.env.CASER_API_KEY,
    },
    mapfre: {
      apiUrl: process.env.MAPFRE_API_URL,
      apiKey: process.env.MAPFRE_API_KEY,
      enabled: !!process.env.MAPFRE_API_KEY,
    },
    axa: {
      apiUrl: process.env.AXA_API_URL,
      apiKey: process.env.AXA_API_KEY,
      enabled: !!process.env.AXA_API_KEY,
    },
    allianz: {
      apiUrl: process.env.ALLIANZ_API_URL,
      apiKey: process.env.ALLIANZ_API_KEY,
      enabled: !!process.env.ALLIANZ_API_KEY,
    },
    generali: {
      apiUrl: process.env.GENERALI_API_URL,
      apiKey: process.env.GENERALI_API_KEY,
      enabled: !!process.env.GENERALI_API_KEY,
    },
  },
};

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Get enabled integrations
 */
export function getEnabledIntegrations(): string[] {
  const enabled: string[] = [];

  if (integrationsConfig.twilio.enabled) enabled.push('twilio');
  if (integrationsConfig.whatsapp.enabled) enabled.push('whatsapp');
  if (integrationsConfig.smtp.enabled) enabled.push('smtp');
  if (integrationsConfig.awsSes.enabled) enabled.push('aws-ses');
  if (integrationsConfig.sendgrid.enabled) enabled.push('sendgrid');

  if (integrationsConfig.sso.azureAd.enabled) enabled.push('azure-ad');
  if (integrationsConfig.sso.google.enabled) enabled.push('google-oauth');
  if (integrationsConfig.sso.okta.enabled) enabled.push('okta');
  if (integrationsConfig.sso.auth0.enabled) enabled.push('auth0');
  if (integrationsConfig.sso.saml.enabled) enabled.push('saml');
  if (integrationsConfig.sso.ldap.enabled) enabled.push('ldap');

  if (integrationsConfig.storage.awsS3.enabled) enabled.push('aws-s3');
  if (integrationsConfig.storage.minio.enabled) enabled.push('minio');
  if (integrationsConfig.storage.azureBlob.enabled) enabled.push('azure-blob');
  if (integrationsConfig.storage.gcs.enabled) enabled.push('gcs');

  if (integrationsConfig.payments.stripe.enabled) enabled.push('stripe');
  if (integrationsConfig.payments.plaid.enabled) enabled.push('plaid');

  if (integrationsConfig.elasticsearch.enabled) enabled.push('elasticsearch');
  if (integrationsConfig.mapbox.enabled) enabled.push('mapbox');

  if (integrationsConfig.vectorDb.pinecone.enabled) enabled.push('pinecone');
  if (integrationsConfig.vectorDb.weaviate.enabled) enabled.push('weaviate');
  if (integrationsConfig.vectorDb.qdrant.enabled) enabled.push('qdrant');

  if (integrationsConfig.insurance.caser.enabled) enabled.push('caser');
  if (integrationsConfig.insurance.mapfre.enabled) enabled.push('mapfre');
  if (integrationsConfig.insurance.axa.enabled) enabled.push('axa');
  if (integrationsConfig.insurance.allianz.enabled) enabled.push('allianz');
  if (integrationsConfig.insurance.generali.enabled) enabled.push('generali');

  return enabled;
}

/**
 * Check if any SSO provider is enabled
 */
export function isSSOEnabled(): boolean {
  return (
    integrationsConfig.sso.azureAd.enabled ||
    integrationsConfig.sso.google.enabled ||
    integrationsConfig.sso.okta.enabled ||
    integrationsConfig.sso.auth0.enabled ||
    integrationsConfig.sso.saml.enabled ||
    integrationsConfig.sso.ldap.enabled
  );
}

/**
 * Get primary email provider
 */
export function getPrimaryEmailProvider(): 'smtp' | 'aws-ses' | 'sendgrid' | null {
  if (integrationsConfig.sendgrid.enabled) return 'sendgrid';
  if (integrationsConfig.awsSes.enabled) return 'aws-ses';
  if (integrationsConfig.smtp.enabled) return 'smtp';
  return null;
}

/**
 * Get primary storage provider
 */
export function getPrimaryStorageProvider(): 'aws-s3' | 'azure-blob' | 'gcs' | 'minio' | null {
  if (integrationsConfig.storage.awsS3.enabled) return 'aws-s3';
  if (integrationsConfig.storage.azureBlob.enabled) return 'azure-blob';
  if (integrationsConfig.storage.gcs.enabled) return 'gcs';
  if (integrationsConfig.storage.minio.enabled) return 'minio';
  return null;
}

/**
 * Get primary vector database provider
 */
export function getPrimaryVectorDb(): 'pinecone' | 'weaviate' | 'qdrant' | null {
  if (integrationsConfig.vectorDb.pinecone.enabled) return 'pinecone';
  if (integrationsConfig.vectorDb.weaviate.enabled) return 'weaviate';
  if (integrationsConfig.vectorDb.qdrant.enabled) return 'qdrant';
  return null;
}

export default integrationsConfig;
