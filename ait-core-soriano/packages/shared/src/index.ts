/**
 * @ait-core/shared - Shared package for AIT-CORE ecosystem
 *
 * Exports:
 * - Types: All shared TypeScript types
 * - Clients: API clients for all services
 * - EventBus: Distributed event system
 */

// Export all types
export * from './types';

// Export event bus
export * from './event-bus';

// Export API clients
export * from './clients';

// Re-export commonly used items
export type {
  User,
  Customer,
  Policy,
  Call,
  Interaction,
  Task,
  Quote,
  Claim,
  Event,
  CallContext
} from './types';

export {
  EventBus,
  CallEventBus,
  CustomerEventBus,
  PolicyEventBus
} from './event-bus';

export {
  ERPClient,
  CommsClient,
  QuoteClient,
  AuthClient,
  DataHubClient,
  AITCoreClient
} from './clients';
