/**
 * CORS Configuration
 * Cross-Origin Resource Sharing policies for API security
 *
 * @module config/cors
 * @description Production-ready CORS configuration with environment-based policies
 */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Production CORS Configuration
 * Strict whitelist of allowed origins
 */
const productionOrigins = [
  'https://sorianomediadore.com',
  'https://www.sorianomediadore.com',
  'https://app.sorianomediadore.com',
  'https://admin.sorianomediadore.com',
  'https://api.sorianomediadore.com',
];

/**
 * Development CORS Configuration
 * More permissive for local development
 */
const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:4200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:4200',
];

/**
 * Staging CORS Configuration
 */
const stagingOrigins = [
  'https://staging.sorianomediadore.com',
  'https://staging-app.sorianomediadore.com',
  'https://staging-admin.sorianomediadore.com',
];

/**
 * CORS Configuration Factory
 */
export function getCorsConfig(environment: string): CorsOptions {
  const baseConfig: CorsOptions = {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-API-Key',
      'X-Client-Version',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Number',
      'X-Page-Size',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, Postman, etc.)
          if (!origin) {
            return callback(null, true);
          }

          if (productionOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS policy'));
          }
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        origin: [...productionOrigins, ...stagingOrigins],
      };

    case 'development':
    case 'test':
      return {
        ...baseConfig,
        origin: [...developmentOrigins, ...stagingOrigins],
      };

    default:
      return {
        ...baseConfig,
        origin: false, // Deny all if environment unknown
      };
  }
}

/**
 * Dynamic Origin Validator
 * For scenarios where you need pattern-based origin validation
 */
export function createOriginValidator(allowedPatterns: RegExp[]) {
  return (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  };
}

/**
 * Subdomain-based CORS validation
 * Example: Allow all subdomains of sorianomediadore.com
 */
export const subdomainValidator = createOriginValidator([
  /^https:\/\/([a-z0-9-]+\.)?sorianomediadore\.com$/,
  /^http:\/\/localhost:\d+$/,
]);

/**
 * API Key-based CORS bypass (for trusted internal services)
 */
export function createApiKeyCorsValidator(trustedApiKeys: string[]) {
  return (req: any, callback: (err: Error | null, allow?: boolean) => void) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey && trustedApiKeys.includes(apiKey)) {
      callback(null, true);
    } else {
      const origin = req.headers.origin;
      // Fall back to normal origin validation
      callback(null, origin ? productionOrigins.includes(origin) : false);
    }
  };
}
