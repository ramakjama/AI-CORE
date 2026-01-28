import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  // Kafka
  KAFKA_BROKERS: Joi.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: Joi.string().default('ait-core-api'),
  KAFKA_GROUP_ID: Joi.string().default('ait-core-group'),

  // WebSocket
  WS_PORT: Joi.number().default(3001),
  WS_PATH: Joi.string().default('/ws'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
  LOG_FILE_PATH: Joi.string().default('./logs'),

  // Health Check
  HEALTH_CHECK_DATABASE_TIMEOUT_MS: Joi.number().default(3000),

  // Swagger
  SWAGGER_ENABLED: Joi.boolean().default(true),
  SWAGGER_PATH: Joi.string().default('api-docs'),
  SWAGGER_TITLE: Joi.string().default('AIT-CORE API'),
  SWAGGER_DESCRIPTION: Joi.string().default(
    'Enterprise API for AIT-CORE Platform',
  ),
  SWAGGER_VERSION: Joi.string().default('1.0'),

  // Security
  BCRYPT_ROUNDS: Joi.number().default(10),
});
