/**
 * AI-CORE Configuration Loader & Validator
 * Central configuration management with validation
 */

import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { databaseConfig, DatabaseConfigSchema } from './databases.config';
import { integrationsConfig, IntegrationsConfigSchema } from './integrations.config';
import { aiConfig, AIConfigSchema } from './ai.config';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

// -----------------------------------------------------------------------------
// Environment Schema
// -----------------------------------------------------------------------------
const EnvironmentSchema = z.enum(['development', 'staging', 'production', 'test']);

// -----------------------------------------------------------------------------
// Application Schema
// -----------------------------------------------------------------------------
const AppConfigSchema = z.object({
  name: z.string().default('AI-CORE'),
  version: z.string().default('1.0.0'),
  env: EnvironmentSchema.default('development'),
  nodeEnv: EnvironmentSchema.default('development'),
  debug: z.boolean().default(false),
  logLevel: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  port: z.number().int().positive().default(3000),
  host: z.string().default('localhost'),
  url: z.string().url().optional(),
  apiPrefix: z.string().default('/api/v1'),
});

// -----------------------------------------------------------------------------
// JWT & Auth Schema
// -----------------------------------------------------------------------------
const JWTConfigSchema = z.object({
  secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
  accessTokenExpiresIn: z.string().default('15m'),
  refreshTokenExpiresIn: z.string().default('7d'),
  issuer: z.string().default('ai-core'),
  audience: z.string().default('ai-core-users'),
  algorithm: z.enum(['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512']).default('HS256'),
});

const PasswordConfigSchema = z.object({
  bcryptRounds: z.number().int().min(10).max(15).default(12),
  minLength: z.number().int().min(8).default(8),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumber: z.boolean().default(true),
  requireSpecial: z.boolean().default(true),
});

const SessionConfigSchema = z.object({
  secret: z.string().min(32, 'Session secret must be at least 32 characters'),
  name: z.string().default('ai_core_session'),
  maxAge: z.number().int().positive().default(86400000),
  secure: z.boolean().default(false),
  httpOnly: z.boolean().default(true),
  sameSite: z.enum(['strict', 'lax', 'none']).default('lax'),
});

// -----------------------------------------------------------------------------
// Security Schema
// -----------------------------------------------------------------------------
const CORSConfigSchema = z.object({
  origin: z.array(z.string()).default(['http://localhost:3000']),
  methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  credentials: z.boolean().default(true),
  maxAge: z.number().int().positive().default(86400),
});

const RateLimitConfigSchema = z.object({
  windowMs: z.number().int().positive().default(60000),
  maxRequests: z.number().int().positive().default(100),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

const EncryptionConfigSchema = z.object({
  key: z.string().length(32, 'Encryption key must be exactly 32 characters'),
  algorithm: z.string().default('aes-256-gcm'),
  ivLength: z.number().int().default(16),
});

// -----------------------------------------------------------------------------
// Redis Schema
// -----------------------------------------------------------------------------
const RedisConfigSchema = z.object({
  url: z.string().default('redis://localhost:6379'),
  host: z.string().default('localhost'),
  port: z.number().int().positive().default(6379),
  password: z.string().optional(),
  db: z.number().int().min(0).max(15).default(0),
  tlsEnabled: z.boolean().default(false),
  clusterMode: z.boolean().default(false),
  sentinelMaster: z.string().optional(),
  sentinelNodes: z.array(z.string()).optional(),
});

// -----------------------------------------------------------------------------
// Kafka Schema
// -----------------------------------------------------------------------------
const KafkaConfigSchema = z.object({
  brokers: z.array(z.string()).default(['localhost:9092']),
  clientId: z.string().default('ai-core-client'),
  groupId: z.string().default('ai-core-group'),
  sslEnabled: z.boolean().default(false),
  sasl: z.object({
    mechanism: z.enum(['plain', 'scram-sha-256', 'scram-sha-512']).optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }).optional(),
  schemaRegistryUrl: z.string().optional(),
  consumer: z.object({
    sessionTimeout: z.number().int().positive().default(30000),
    heartbeatInterval: z.number().int().positive().default(3000),
  }).default({}),
});

// -----------------------------------------------------------------------------
// Monitoring Schema
// -----------------------------------------------------------------------------
const MonitoringConfigSchema = z.object({
  sentry: z.object({
    dsn: z.string().optional(),
    environment: z.string().optional(),
    tracesSampleRate: z.number().min(0).max(1).default(0.1),
  }).optional(),
  datadog: z.object({
    apiKey: z.string().optional(),
    appKey: z.string().optional(),
    site: z.string().default('datadoghq.eu'),
  }).optional(),
  prometheus: z.object({
    enabled: z.boolean().default(true),
    port: z.number().int().positive().default(9090),
    path: z.string().default('/metrics'),
  }).default({}),
  openTelemetry: z.object({
    endpoint: z.string().optional(),
    serviceName: z.string().default('ai-core'),
    tracesSampler: z.string().default('parentbased_traceidratio'),
    tracesSamplerArg: z.number().min(0).max(1).default(0.1),
  }).optional(),
});

// -----------------------------------------------------------------------------
// Feature Flags Schema
// -----------------------------------------------------------------------------
const FeatureFlagsSchema = z.object({
  aiAgents: z.boolean().default(true),
  voiceCalls: z.boolean().default(true),
  whatsapp: z.boolean().default(true),
  analytics: z.boolean().default(true),
  multiTenant: z.boolean().default(true),
  sso: z.boolean().default(true),
  auditLog: z.boolean().default(true),
});

// -----------------------------------------------------------------------------
// Development Schema
// -----------------------------------------------------------------------------
const DevConfigSchema = z.object({
  disableAuth: z.boolean().default(false),
  disableRateLimit: z.boolean().default(false),
  mockExternalApis: z.boolean().default(false),
  seedDatabase: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Complete Configuration Schema
// -----------------------------------------------------------------------------
const ConfigSchema = z.object({
  app: AppConfigSchema,
  databases: DatabaseConfigSchema,
  jwt: JWTConfigSchema,
  password: PasswordConfigSchema,
  session: SessionConfigSchema,
  cors: CORSConfigSchema,
  rateLimit: RateLimitConfigSchema,
  encryption: EncryptionConfigSchema,
  redis: RedisConfigSchema,
  kafka: KafkaConfigSchema,
  integrations: IntegrationsConfigSchema,
  ai: AIConfigSchema,
  monitoring: MonitoringConfigSchema,
  features: FeatureFlagsSchema,
  dev: DevConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;

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

function parseFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

// -----------------------------------------------------------------------------
// Configuration Builder
// -----------------------------------------------------------------------------
function buildConfig(): Config {
  const env = process.env;

  const rawConfig = {
    app: {
      name: env.APP_NAME || 'AI-CORE',
      version: env.APP_VERSION || '1.0.0',
      env: env.APP_ENV || 'development',
      nodeEnv: env.NODE_ENV || 'development',
      debug: parseBoolean(env.DEBUG),
      logLevel: env.LOG_LEVEL || 'info',
      port: parseNumber(env.APP_PORT, 3000),
      host: env.APP_HOST || 'localhost',
      url: env.APP_URL,
      apiPrefix: env.API_PREFIX || '/api/v1',
    },
    databases: databaseConfig,
    jwt: {
      secret: env.JWT_SECRET || 'change-this-secret-in-production-min-32-chars',
      accessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
      refreshTokenExpiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
      issuer: env.JWT_ISSUER || 'ai-core',
      audience: env.JWT_AUDIENCE || 'ai-core-users',
      algorithm: env.JWT_ALGORITHM || 'HS256',
    },
    password: {
      bcryptRounds: parseNumber(env.BCRYPT_ROUNDS, 12),
      minLength: parseNumber(env.PASSWORD_MIN_LENGTH, 8),
      requireUppercase: parseBoolean(env.PASSWORD_REQUIRE_UPPERCASE, true),
      requireLowercase: parseBoolean(env.PASSWORD_REQUIRE_LOWERCASE, true),
      requireNumber: parseBoolean(env.PASSWORD_REQUIRE_NUMBER, true),
      requireSpecial: parseBoolean(env.PASSWORD_REQUIRE_SPECIAL, true),
    },
    session: {
      secret: env.SESSION_SECRET || 'change-this-session-secret-in-production',
      name: env.SESSION_NAME || 'ai_core_session',
      maxAge: parseNumber(env.SESSION_MAX_AGE, 86400000),
      secure: parseBoolean(env.SESSION_SECURE),
      httpOnly: parseBoolean(env.SESSION_HTTP_ONLY, true),
      sameSite: env.SESSION_SAME_SITE || 'lax',
    },
    cors: {
      origin: parseArray(env.CORS_ORIGIN, ['http://localhost:3000']),
      methods: parseArray(env.CORS_METHODS, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
      credentials: parseBoolean(env.CORS_CREDENTIALS, true),
      maxAge: parseNumber(env.CORS_MAX_AGE, 86400),
    },
    rateLimit: {
      windowMs: parseNumber(env.RATE_LIMIT_WINDOW_MS, 60000),
      maxRequests: parseNumber(env.RATE_LIMIT_MAX_REQUESTS, 100),
      skipSuccessfulRequests: parseBoolean(env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS),
      skipFailedRequests: parseBoolean(env.RATE_LIMIT_SKIP_FAILED_REQUESTS),
    },
    encryption: {
      key: env.ENCRYPTION_KEY || 'change-this-32-char-key-now!!!!',
      algorithm: env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      ivLength: parseNumber(env.ENCRYPTION_IV_LENGTH, 16),
    },
    redis: {
      url: env.REDIS_URL || 'redis://localhost:6379',
      host: env.REDIS_HOST || 'localhost',
      port: parseNumber(env.REDIS_PORT, 6379),
      password: env.REDIS_PASSWORD,
      db: parseNumber(env.REDIS_DB, 0),
      tlsEnabled: parseBoolean(env.REDIS_TLS_ENABLED),
      clusterMode: parseBoolean(env.REDIS_CLUSTER_MODE),
      sentinelMaster: env.REDIS_SENTINEL_MASTER,
      sentinelNodes: env.REDIS_SENTINEL_NODES ? parseArray(env.REDIS_SENTINEL_NODES) : undefined,
    },
    kafka: {
      brokers: parseArray(env.KAFKA_BROKERS, ['localhost:9092']),
      clientId: env.KAFKA_CLIENT_ID || 'ai-core-client',
      groupId: env.KAFKA_GROUP_ID || 'ai-core-group',
      sslEnabled: parseBoolean(env.KAFKA_SSL_ENABLED),
      sasl: env.KAFKA_SASL_USERNAME ? {
        mechanism: env.KAFKA_SASL_MECHANISM || 'plain',
        username: env.KAFKA_SASL_USERNAME,
        password: env.KAFKA_SASL_PASSWORD,
      } : undefined,
      schemaRegistryUrl: env.KAFKA_SCHEMA_REGISTRY_URL,
      consumer: {
        sessionTimeout: parseNumber(env.KAFKA_CONSUMER_SESSION_TIMEOUT, 30000),
        heartbeatInterval: parseNumber(env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL, 3000),
      },
    },
    integrations: integrationsConfig,
    ai: aiConfig,
    monitoring: {
      sentry: env.SENTRY_DSN ? {
        dsn: env.SENTRY_DSN,
        environment: env.SENTRY_ENVIRONMENT,
        tracesSampleRate: parseFloat(env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
      } : undefined,
      datadog: env.DATADOG_API_KEY ? {
        apiKey: env.DATADOG_API_KEY,
        appKey: env.DATADOG_APP_KEY,
        site: env.DATADOG_SITE || 'datadoghq.eu',
      } : undefined,
      prometheus: {
        enabled: parseBoolean(env.PROMETHEUS_ENABLED, true),
        port: parseNumber(env.PROMETHEUS_PORT, 9090),
        path: env.PROMETHEUS_PATH || '/metrics',
      },
      openTelemetry: env.OTEL_EXPORTER_OTLP_ENDPOINT ? {
        endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
        serviceName: env.OTEL_SERVICE_NAME || 'ai-core',
        tracesSampler: env.OTEL_TRACES_SAMPLER || 'parentbased_traceidratio',
        tracesSamplerArg: parseFloat(env.OTEL_TRACES_SAMPLER_ARG, 0.1),
      } : undefined,
    },
    features: {
      aiAgents: parseBoolean(env.FEATURE_AI_AGENTS, true),
      voiceCalls: parseBoolean(env.FEATURE_VOICE_CALLS, true),
      whatsapp: parseBoolean(env.FEATURE_WHATSAPP, true),
      analytics: parseBoolean(env.FEATURE_ANALYTICS, true),
      multiTenant: parseBoolean(env.FEATURE_MULTI_TENANT, true),
      sso: parseBoolean(env.FEATURE_SSO, true),
      auditLog: parseBoolean(env.FEATURE_AUDIT_LOG, true),
    },
    dev: {
      disableAuth: parseBoolean(env.DEV_DISABLE_AUTH),
      disableRateLimit: parseBoolean(env.DEV_DISABLE_RATE_LIMIT),
      mockExternalApis: parseBoolean(env.DEV_MOCK_EXTERNAL_APIS),
      seedDatabase: parseBoolean(env.DEV_SEED_DATABASE),
    },
  };

  return rawConfig as Config;
}

// -----------------------------------------------------------------------------
// Validation & Export
// -----------------------------------------------------------------------------
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = buildConfig();

  // In development, we use softer validation
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    cachedConfig = rawConfig;
    return cachedConfig;
  }

  // In production, validate strictly
  const result = ConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    console.error('Configuration validation failed:');
    console.error(result.error.format());
    throw new Error('Invalid configuration. Check environment variables.');
  }

  cachedConfig = result.data;
  return cachedConfig;
}

export function validateConfig(): { valid: boolean; errors: string[] } {
  const rawConfig = buildConfig();
  const result = ConfigSchema.safeParse(rawConfig);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  );

  return { valid: false, errors };
}

export function isProduction(): boolean {
  return getConfig().app.env === 'production';
}

export function isDevelopment(): boolean {
  return getConfig().app.env === 'development';
}

export function isTest(): boolean {
  return getConfig().app.env === 'test';
}

// Export singleton config
export const config = getConfig();

// Re-export sub-configs for convenience
export { databaseConfig } from './databases.config';
export { integrationsConfig } from './integrations.config';
export { aiConfig } from './ai.config';

export default config;
