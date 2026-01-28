/**
 * Security Decorators
 * Custom decorators for security configurations
 *
 * @module decorators/security
 * @description Reusable decorators for security features
 */

import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { RolesGuard, PermissionsGuard, ApiKeyGuard } from '../guards/security.guards';
import { Throttle } from '@nestjs/throttler';

/**
 * Roles decorator
 * Specify required roles for endpoint access
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Permissions decorator
 * Specify required permissions for endpoint access
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Public decorator
 * Mark endpoint as publicly accessible (skip authentication)
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Requires Auth decorator
 * Combine authentication and authorization
 */
export const RequiresAuth = (roles?: string[], permissions?: string[]) => {
  const decorators = [
    ApiSecurity('bearer'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (roles) {
    decorators.push(Roles(...roles), UseGuards(RolesGuard));
  }

  if (permissions) {
    decorators.push(Permissions(...permissions), UseGuards(PermissionsGuard));
  }

  return applyDecorators(...decorators);
};

/**
 * Admin Only decorator
 * Restrict endpoint to admin users only
 */
export const AdminOnly = () => {
  return applyDecorators(
    Roles('admin'),
    UseGuards(RolesGuard),
    ApiSecurity('bearer'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Admin access required' })
  );
};

/**
 * Requires API Key decorator
 */
export const RequiresApiKey = () => {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiSecurity('api_key'),
    ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  );
};

/**
 * Rate Limited decorator
 * Apply custom rate limiting to specific endpoints
 */
export const RateLimited = (ttl: number, limit: number) => {
  return applyDecorators(Throttle({ default: { ttl, limit } }));
};

/**
 * Strict Rate Limit decorator
 * Very strict rate limiting for sensitive operations
 */
export const StrictRateLimit = () => {
  return applyDecorators(Throttle({ default: { ttl: 60000, limit: 5 } }));
};

/**
 * Audit Log decorator
 * Mark endpoints that should be audit logged
 */
export const AuditLog = (action: string) => SetMetadata('auditLog', action);

/**
 * Sensitive Operation decorator
 * Mark endpoints that perform sensitive operations
 */
export const SensitiveOperation = (description?: string) => {
  return applyDecorators(
    SetMetadata('sensitive', true),
    SetMetadata('sensitiveDescription', description || 'Sensitive operation'),
    AuditLog('sensitive_operation'),
    StrictRateLimit()
  );
};

/**
 * IP Restricted decorator
 * Restrict access to specific IP addresses
 */
export const IPRestricted = () => SetMetadata('ipRestricted', true);

/**
 * Requires MFA decorator
 * Require multi-factor authentication
 */
export const RequiresMFA = () => SetMetadata('requiresMFA', true);

/**
 * Email Verified Required decorator
 */
export const EmailVerifiedRequired = () => SetMetadata('emailVerified', true);

/**
 * Subscription Required decorator
 */
export const SubscriptionRequired = (tier?: 'basic' | 'premium' | 'enterprise') => {
  return SetMetadata('subscriptionRequired', tier || true);
};

/**
 * GDPR Compliant decorator
 * Mark endpoints that handle personal data
 */
export const GDPRCompliant = () => SetMetadata('gdprCompliant', true);

/**
 * PCI DSS Compliant decorator
 * Mark endpoints that handle payment data
 */
export const PCIDSSCompliant = () => SetMetadata('pciDssCompliant', true);

/**
 * Cacheable decorator
 * Mark endpoints whose responses can be cached
 */
export const Cacheable = (ttl: number = 300) => {
  return SetMetadata('cacheable', { ttl });
};

/**
 * No Cache decorator
 * Explicitly disable caching for sensitive endpoints
 */
export const NoCache = () => SetMetadata('noCache', true);

/**
 * CORS Origin decorator
 * Specify allowed origins for specific endpoints
 */
export const AllowOrigins = (...origins: string[]) => {
  return SetMetadata('allowedOrigins', origins);
};

/**
 * Content Type decorator
 * Restrict allowed content types
 */
export const AllowContentTypes = (...contentTypes: string[]) => {
  return SetMetadata('allowedContentTypes', contentTypes);
};

/**
 * Max Request Size decorator
 * Set maximum request body size for endpoint
 */
export const MaxRequestSize = (bytes: number) => {
  return SetMetadata('maxRequestSize', bytes);
};

/**
 * Idempotent decorator
 * Mark operations as idempotent
 */
export const Idempotent = () => SetMetadata('idempotent', true);

/**
 * Encrypted Response decorator
 * Mark responses that should be encrypted
 */
export const EncryptedResponse = () => SetMetadata('encryptedResponse', true);
