/**
 * Proxy Configuration
 * Defines routing rules for microservices
 */

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  enabled: boolean;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    enabled: boolean;
    threshold: number; // failures before opening circuit
    timeout: number; // ms to wait before trying again
  };
  healthCheck?: {
    enabled: boolean;
    endpoint: string;
    interval: number; // ms
  };
}

export const PROXY_CONFIG: Record<string, ServiceConfig> = {
  'pgc-engine': {
    name: 'AI-PGC-ENGINE',
    baseUrl: process.env.PGC_ENGINE_URL || 'http://ai-pgc-engine:3001',
    enabled: true,
    timeout: 30000, // 30 seconds
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000, // 1 minute
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000, // 30 seconds
    },
  },
  accountant: {
    name: 'AI-ACCOUNTANT',
    baseUrl: process.env.ACCOUNTANT_URL || 'http://ai-accountant:3010',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
  treasury: {
    name: 'AI-TREASURY',
    baseUrl: process.env.TREASURY_URL || 'http://ai-treasury:3011',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
  billing: {
    name: 'AI-BILLING',
    baseUrl: process.env.BILLING_URL || 'http://ai-billing:3012',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
  'policy-manager': {
    name: 'AI-POLICY-MANAGER',
    baseUrl: process.env.POLICY_MANAGER_URL || 'http://ai-policy-manager:3013',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
  'claims-processor': {
    name: 'AI-CLAIMS-PROCESSOR',
    baseUrl: process.env.CLAIMS_PROCESSOR_URL || 'http://ai-claims-processor:3014',
    enabled: false, // Not yet implemented
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
    healthCheck: {
      enabled: true,
      endpoint: '/health',
      interval: 30000,
    },
  },
};

/**
 * Route mapping: API Gateway path prefix → Service key
 */
export const ROUTE_MAPPING: Record<string, string> = {
  '/pgc-engine': 'pgc-engine',
  '/accountant': 'accountant',
  '/treasury': 'treasury',
  '/billing': 'billing',
  '/policies': 'policy-manager',
  '/claims': 'claims-processor',
};

/**
 * Get service config by route prefix
 */
export function getServiceByRoute(path: string): ServiceConfig | null {
  for (const [prefix, serviceKey] of Object.entries(ROUTE_MAPPING)) {
    if (path.startsWith(prefix)) {
      return PROXY_CONFIG[serviceKey] || null;
    }
  }
  return null;
}

/**
 * Get all enabled services
 */
export function getEnabledServices(): ServiceConfig[] {
  return Object.values(PROXY_CONFIG).filter((service) => service.enabled);
}
