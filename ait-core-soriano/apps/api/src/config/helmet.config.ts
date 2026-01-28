/**
 * Helmet Security Configuration
 * Comprehensive security headers for production environment
 *
 * @module config/helmet
 * @description Production-grade security headers using Helmet middleware
 */

import { HelmetOptions } from 'helmet';

/**
 * Helmet Configuration for Production
 * Implements OWASP security best practices
 */
export const helmetConfig: HelmetOptions = {
  // Content Security Policy (CSP)
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Only for development, remove in strict production
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
        'data:',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:',
      ],
      connectSrc: [
        "'self'",
        'https://api.sorianomediadore.com',
        'wss://api.sorianomediadore.com',
      ],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      childSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: {
    policy: 'require-corp',
  },

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'same-origin',
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400,
    enforce: true,
  },

  // Frameguard (X-Frame-Options)
  frameguard: {
    action: 'deny', // Prevent clickjacking attacks
  },

  // Hide Powered By
  hidePoweredBy: true,

  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // IE No Open
  ieNoOpen: true,

  // No Sniff (X-Content-Type-Options)
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-XSS-Protection
  xssFilter: true,
};

/**
 * Helmet Configuration for Development
 * Less strict for easier development
 */
export const helmetConfigDev: HelmetOptions = {
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 0,
  },
};

/**
 * Get Helmet configuration based on environment
 */
export function getHelmetConfig(environment: string): HelmetOptions {
  return environment === 'production' ? helmetConfig : helmetConfigDev;
}
