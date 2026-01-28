/**
 * @ait-core/schemas
 *
 * Shared Zod schemas for the entire AIT-CORE ecosystem
 * Provides runtime validation, type inference, and consistent data validation
 */

// Utils and common validators
export * from './utils';

// Auth & User schemas
export * from './auth';

// Policy schemas
export * from './policy';

// Claim schemas
export * from './claim';

// Invoice schemas
export * from './invoice';

// Customer schemas
export * from './customer';

// Decorators and framework integrations
export * from './decorators';

// Re-export Zod for convenience
export { z } from 'zod';
