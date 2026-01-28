import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenvConfig();

// Configuration schema with validation
const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  host: z.string().default('0.0.0.0'),

  // Database
  databaseUrl: z.string().url(),

  // Redis (optional)
  redisUrl: z.string().url().optional(),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiry: z.string().default('15m'),

  // CORS
  corsOrigins: z.string().transform((val) => val.split(',')).default('http://localhost:3000'),

  // Rate Limiting
  rateLimitMax: z.coerce.number().int().positive().default(10000),
  rateLimitWindowMs: z.coerce.number().int().positive().default(60000),

  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFile: z.string().default('logs/ait-nerve.log'),

  // Prometheus
  prometheusEnabled: z.coerce.boolean().default(true),
  prometheusPort: z.coerce.number().int().min(1).max(65535).default(9090),

  // Monitoring
  healthCheckInterval: z.coerce.number().int().positive().default(30000), // 30s
  metricsRetentionDays: z.coerce.number().int().positive().default(90),

  // Security
  encryptionKey: z.string().min(32),
  bcryptRounds: z.coerce.number().int().min(10).max(15).default(12),

  // Performance
  cacheEnabled: z.coerce.boolean().default(true),
  cacheTtl: z.coerce.number().int().positive().default(3600), // 1 hour

  // Features
  websocketEnabled: z.coerce.boolean().default(true),
  auditLogEnabled: z.coerce.boolean().default(true),
});

// Parse and validate configuration
const parsedConfig = configSchema.parse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY,
  corsOrigins: process.env.CORS_ORIGINS,
  rateLimitMax: process.env.RATE_LIMIT_MAX,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  logLevel: process.env.LOG_LEVEL,
  logFile: process.env.LOG_FILE,
  prometheusEnabled: process.env.PROMETHEUS_ENABLED,
  prometheusPort: process.env.PROMETHEUS_PORT,
  healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL,
  metricsRetentionDays: process.env.METRICS_RETENTION_DAYS,
  encryptionKey: process.env.ENCRYPTION_KEY,
  bcryptRounds: process.env.BCRYPT_ROUNDS,
  cacheEnabled: process.env.CACHE_ENABLED,
  cacheTtl: process.env.CACHE_TTL,
  websocketEnabled: process.env.WEBSOCKET_ENABLED,
  auditLogEnabled: process.env.AUDIT_LOG_ENABLED,
});

export const config = parsedConfig;

export type Config = z.infer<typeof configSchema>;

// Export individual config values for convenience
export const {
  nodeEnv,
  port,
  host,
  databaseUrl,
  redisUrl,
  jwtSecret,
  jwtExpiry,
  corsOrigins,
  rateLimitMax,
  rateLimitWindowMs,
  logLevel,
  logFile,
  prometheusEnabled,
  prometheusPort,
  healthCheckInterval,
  metricsRetentionDays,
  encryptionKey,
  bcryptRounds,
  cacheEnabled,
  cacheTtl,
  websocketEnabled,
  auditLogEnabled,
} = parsedConfig;
