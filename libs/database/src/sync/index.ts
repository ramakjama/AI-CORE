/**
 * Sync Module Index
 * Exports all synchronization components
 */

// Sync Manager
export {
  SyncManager,
  getSyncManager,
  type SyncResult,
  type SyncManagerConfig,
} from './sync-manager';

// Change Tracker
export {
  ChangeTracker,
  type ChangeTrackerConfig,
  type ChangeSnapshot,
} from './change-tracker';

// Conflict Resolver
export {
  ConflictResolver,
  getConflictResolver,
  type ConflictResolverConfig,
  type ConflictDetails,
  type MergeResult,
} from './conflict-resolver';

// Event Publisher
export {
  EventPublisher,
  getEventPublisher,
  type EventPublisherConfig,
  type EventHandler,
  type EventSubscription,
} from './event-publisher';
