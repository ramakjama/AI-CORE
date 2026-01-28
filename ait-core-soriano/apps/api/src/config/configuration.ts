export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },

  // Kafka
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'ait-core-api',
    groupId: process.env.KAFKA_GROUP_ID || 'ait-core-group',
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3001,
    path: process.env.WS_PATH || '/ws',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Health Check
  healthCheck: {
    databaseTimeoutMs:
      parseInt(process.env.HEALTH_CHECK_DATABASE_TIMEOUT_MS, 10) || 3000,
  },

  // Swagger
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || 'api-docs',
    title: process.env.SWAGGER_TITLE || 'AIT-CORE API',
    description:
      process.env.SWAGGER_DESCRIPTION || 'Enterprise API for AIT-CORE Platform',
    version: process.env.SWAGGER_VERSION || '1.0',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  },
});
