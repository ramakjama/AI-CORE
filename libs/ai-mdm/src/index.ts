/**
 * AI-MDM - Master Data Management Module
 *
 * Provides comprehensive party management including:
 * - Party canonical model (individuals and organizations)
 * - Golden Record management with conflict resolution
 * - Deduplication with fuzzy matching
 * - Reversible merge/unmerge operations
 * - Household and family relationship management
 * - Bidirectional sync with external systems
 * - Complete data versioning and audit trail
 *
 * @packageDocumentation
 */

// =============================================================================
// TYPES - All interfaces, enums, and type definitions
// =============================================================================
export {
  // Enums
  PartyType,
  IdentifierType,
  RelationshipType,
  MatchConfidence,
  ContactType,
  AddressType,
  SourceSystem,
  SyncStatus,
  MergeStatus,
  Gender,

  // Party interfaces
  Party,
  PartyIdentifier,
  PartyVersion,
  IndividualData,
  OrganizationData,
  CreatePartyInput,
  UpdatePartyInput,
  PartyWithRelations,

  // Address interfaces
  Address,
  NormalizedAddress,

  // Contact interfaces
  Contact,
  ContactPreference,

  // Household interfaces
  Household,
  HouseholdMember,

  // Relationship interfaces
  PartyRelationship,
  RelationshipGraphNode,
  RelationshipPath,

  // Golden Record interfaces
  GoldenRecord,
  GoldenRecordFieldSource,
  GoldenRecordConflict,

  // Deduplication interfaces
  DuplicateMatch,
  MatchScore,
  MergeCandidate,
  MergeResult,
  MergeHistory,

  // Sync interfaces
  SyncRecord,
  SyncConflict,
  ChangelogEntry,

  // Search interfaces
  PartySearchQuery,
  PartySearchResult,

  // Batch operation interfaces
  BatchDeduplicationOptions,
  BatchOperationResult,

  // Data quality
  DataQualityMetrics
} from './types';

// =============================================================================
// SERVICES - Core business logic
// =============================================================================

// Party Service
import {
  PartyService as _PartyService,
  partyService as _partyService,
  getPartiesStore as _getPartiesStore,
  getVersionsStore as _getVersionsStore
} from './services/party.service';
export {
  _PartyService as PartyService,
  _partyService as partyService,
  _getPartiesStore as getPartiesStore,
  _getVersionsStore as getVersionsStore
};

// Golden Record Service
import {
  GoldenRecordService as _GoldenRecordService,
  goldenRecordService as _goldenRecordService,
  getGoldenRecordsStore as _getGoldenRecordsStore
} from './services/golden-record.service';
export {
  _GoldenRecordService as GoldenRecordService,
  _goldenRecordService as goldenRecordService,
  _getGoldenRecordsStore as getGoldenRecordsStore
};

// Deduplication Service
import {
  DeduplicationService as _DeduplicationService,
  deduplicationService as _deduplicationService,
  getDuplicateMatchesStore as _getDuplicateMatchesStore,
  getMergeResultsStore as _getMergeResultsStore,
  getMergeHistoryStore as _getMergeHistoryStore
} from './services/deduplication.service';
export {
  _DeduplicationService as DeduplicationService,
  _deduplicationService as deduplicationService,
  _getDuplicateMatchesStore as getDuplicateMatchesStore,
  _getMergeResultsStore as getMergeResultsStore,
  _getMergeHistoryStore as getMergeHistoryStore
};

// Household Service
import {
  HouseholdService as _HouseholdService,
  householdService as _householdService,
  getHouseholdsStore as _getHouseholdsStore,
  getMembershipIndex as _getMembershipIndex
} from './services/household.service';
export {
  _HouseholdService as HouseholdService,
  _householdService as householdService,
  _getHouseholdsStore as getHouseholdsStore,
  _getMembershipIndex as getMembershipIndex
};

// Relationship Service
import {
  RelationshipService as _RelationshipService,
  relationshipService as _relationshipService,
  getRelationshipsStore as _getRelationshipsStore,
  getRelationshipsByPartyIndex as _getRelationshipsByPartyIndex
} from './services/relationship.service';
export {
  _RelationshipService as RelationshipService,
  _relationshipService as relationshipService,
  _getRelationshipsStore as getRelationshipsStore,
  _getRelationshipsByPartyIndex as getRelationshipsByPartyIndex
};

// Sync Service
import {
  SyncService as _SyncService,
  syncService as _syncService,
  getSyncRecordsStore as _getSyncRecordsStore,
  getSyncConflictsStore as _getSyncConflictsStore,
  getChangelogStore as _getChangelogStore
} from './services/sync.service';
export {
  _SyncService as SyncService,
  _syncService as syncService,
  _getSyncRecordsStore as getSyncRecordsStore,
  _getSyncConflictsStore as getSyncConflictsStore,
  _getChangelogStore as getChangelogStore
};

// =============================================================================
// MATCHING - Fuzzy matching utilities
// =============================================================================
import {
  FuzzyMatcher as _FuzzyMatcher,
  fuzzyMatcher as _fuzzyMatcher,
  MatchConfig as _MatchConfig
} from './matching/fuzzy-matcher';
export {
  _FuzzyMatcher as FuzzyMatcher,
  _fuzzyMatcher as fuzzyMatcher,
  _MatchConfig as MatchConfig
};

// =============================================================================
// FACTORY - Convenience factory for creating configured instances
// =============================================================================

/**
 * Configuration for MDM module
 */
export interface MDMConfig {
  currentUser?: string;
  matchConfig?: import('./matching/fuzzy-matcher').MatchConfig;
}

/**
 * MDM Module instance with all services
 */
export interface MDMModule {
  party: import('./services/party.service').PartyService;
  goldenRecord: import('./services/golden-record.service').GoldenRecordService;
  deduplication: import('./services/deduplication.service').DeduplicationService;
  household: import('./services/household.service').HouseholdService;
  relationship: import('./services/relationship.service').RelationshipService;
  sync: import('./services/sync.service').SyncService;
  matcher: import('./matching/fuzzy-matcher').FuzzyMatcher;
}

/**
 * Create a configured MDM module instance
 *
 * @example
 * ```typescript
 * import { createMDM } from '@ai-core/ai-mdm';
 *
 * const mdm = createMDM({ currentUser: 'user-123' });
 *
 * // Create a party
 * const party = await mdm.party.create({
 *   type: PartyType.INDIVIDUAL,
 *   individual: {
 *     firstName: 'John',
 *     lastName: 'Doe'
 *   },
 *   sourceSystem: SourceSystem.CRM
 * });
 *
 * // Find duplicates
 * const duplicates = await mdm.deduplication.findDuplicates(party.id);
 *
 * // Build golden record
 * const goldenRecord = await mdm.goldenRecord.buildGoldenRecord(party.id);
 * ```
 */
export function createMDM(config: MDMConfig = {}): MDMModule {
  const { currentUser = 'system', matchConfig } = config;

  // Import services
  const { PartyService } = require('./services/party.service');
  const { GoldenRecordService } = require('./services/golden-record.service');
  const { DeduplicationService } = require('./services/deduplication.service');
  const { HouseholdService } = require('./services/household.service');
  const { RelationshipService } = require('./services/relationship.service');
  const { SyncService } = require('./services/sync.service');
  const { FuzzyMatcher } = require('./matching/fuzzy-matcher');

  // Create instances
  const party = new PartyService(currentUser);
  const goldenRecord = new GoldenRecordService(currentUser);
  const deduplication = new DeduplicationService(currentUser);
  const household = new HouseholdService(currentUser);
  const relationship = new RelationshipService(currentUser);
  const sync = new SyncService(currentUser);
  const matcher = new FuzzyMatcher(matchConfig);

  return {
    party,
    goldenRecord,
    deduplication,
    household,
    relationship,
    sync,
    matcher
  };
}

// =============================================================================
// DEFAULT EXPORT - Pre-configured singleton services
// =============================================================================

/**
 * Default MDM module with singleton services
 * Use this for simple applications or when you don't need custom configuration
 */
export default {
  party: _partyService,
  goldenRecord: _goldenRecordService,
  deduplication: _deduplicationService,
  household: _householdService,
  relationship: _relationshipService,
  sync: _syncService,
  matcher: _fuzzyMatcher,

  // Factory for custom instances
  create: createMDM
};
