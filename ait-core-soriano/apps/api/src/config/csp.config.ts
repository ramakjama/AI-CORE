/**
 * Content Security Policy Configuration
 * Advanced CSP directives for XSS prevention
 *
 * @module config/csp
 * @description Comprehensive CSP configuration for different application contexts
 */

/**
 * Strict Content Security Policy (Recommended for Production)
 */
export const strictCSP = {
  defaultSrc: ["'none'"],
  scriptSrc: ["'self'", "'strict-dynamic'"],
  scriptSrcElem: ["'self'"],
  styleSrc: ["'self'"],
  styleSrcElem: ["'self'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: ["'self'", 'https://api.sorianomediadore.com'],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  childSrc: ["'none'"],
  frameSrc: ["'none'"],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: [],
  blockAllMixedContent: [],
};

/**
 * Balanced CSP (Production with Third-party Integrations)
 */
export const balancedCSP = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Only if absolutely necessary
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
  ],
  scriptSrcElem: [
    "'self'",
    'https://cdn.jsdelivr.net',
    'https://cdnjs.cloudflare.com',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  styleSrcElem: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
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
    'blob:',
    'https:',
    'https://www.google-analytics.com',
  ],
  connectSrc: [
    "'self'",
    'https://api.sorianomediadore.com',
    'wss://api.sorianomediadore.com',
    'https://www.google-analytics.com',
  ],
  mediaSrc: ["'self'", 'blob:', 'https:'],
  objectSrc: ["'none'"],
  childSrc: ["'self'", 'blob:'],
  frameSrc: [
    "'self'",
    'https://www.youtube.com',
    'https://player.vimeo.com',
  ],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: [],
  blockAllMixedContent: [],
};

/**
 * API-Only CSP (Minimal CSP for API endpoints)
 */
export const apiOnlyCSP = {
  defaultSrc: ["'none'"],
  scriptSrc: ["'none'"],
  styleSrc: ["'none'"],
  imgSrc: ["'none'"],
  fontSrc: ["'none'"],
  connectSrc: ["'self'"],
  mediaSrc: ["'none'"],
  objectSrc: ["'none'"],
  childSrc: ["'none'"],
  frameSrc: ["'none'"],
  workerSrc: ["'none'"],
  formAction: ["'none'"],
  frameAncestors: ["'none'"],
  baseUri: ["'none'"],
  upgradeInsecureRequests: [],
};

/**
 * Admin Dashboard CSP
 */
export const adminCSP = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // For admin dashboard scripts
    "'unsafe-eval'", // For chart libraries
    'https://cdn.jsdelivr.net',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  imgSrc: [
    "'self'",
    'data:',
    'blob:',
    'https:',
  ],
  connectSrc: [
    "'self'",
    'https://api.sorianomediadore.com',
    'wss://api.sorianomediadore.com',
  ],
  mediaSrc: ["'self'", 'blob:'],
  objectSrc: ["'none'"],
  childSrc: ["'self'", 'blob:'],
  frameSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: [],
};

/**
 * Development CSP (More permissive)
 */
export const developmentCSP = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
  fontSrc: ["'self'", 'data:'],
  connectSrc: [
    "'self'",
    'http://localhost:*',
    'ws://localhost:*',
    'https://localhost:*',
    'wss://localhost:*',
  ],
  mediaSrc: ["'self'", 'blob:'],
  objectSrc: ["'self'"],
  childSrc: ["'self'", 'blob:'],
  frameSrc: ["'self'"],
  workerSrc: ["'self'", 'blob:'],
  formAction: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
};

/**
 * CSP Report Configuration
 */
export const cspReportConfig = {
  reportUri: '/api/csp-report',
  reportOnly: false, // Set to true for testing before enforcement
};

/**
 * CSP Nonce Generator
 * For inline scripts and styles
 */
export function generateCSPNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Get CSP configuration based on context
 */
export function getCSPConfig(context: 'strict' | 'balanced' | 'api' | 'admin' | 'development') {
  const configs = {
    strict: strictCSP,
    balanced: balancedCSP,
    api: apiOnlyCSP,
    admin: adminCSP,
    development: developmentCSP,
  };

  return configs[context] || balancedCSP;
}

/**
 * Format CSP directives to string
 */
export function formatCSPDirectives(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * CSP Violation Report Handler
 */
export interface CSPViolationReport {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  'status-code': number;
  disposition: 'enforce' | 'report';
}

/**
 * Process CSP Violation Report
 */
export function processCSPReport(report: CSPViolationReport): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldAlert: boolean;
} {
  const criticalDirectives = ['script-src', 'object-src', 'base-uri'];
  const isCritical = criticalDirectives.some(
    directive => report['violated-directive'].includes(directive)
  );

  return {
    severity: isCritical ? 'critical' : 'medium',
    shouldAlert: isCritical,
  };
}
