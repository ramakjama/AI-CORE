/**
 * DataLoaders Index
 * Factory for creating per-request DataLoader instances
 */

import DataLoader from 'dataloader';
import {
  Party,
  Policy,
  Claim,
  Household,
  Document,
  DataLoaderRegistry,
} from '../types';

import {
  createPartyLoader,
  createHouseholdLoader,
  createPartyByIdentifierLoader,
  createPartyAddressesLoader,
  createPartyContactsLoader,
  createHouseholdMembersLoader,
  createPartyHouseholdsLoader,
} from './party.loader';

import {
  createPolicyLoader,
  createPolicyByNumberLoader,
  createPoliciesByHolderLoader,
  createCoveragesLoader,
  createReceiptsLoader,
  createPendingReceiptsLoader,
  createPolicyDocumentsLoader,
} from './policy.loader';

import {
  createClaimLoader,
  createClaimByNumberLoader,
  createClaimsByPolicyLoader,
  createClaimsByClaimantLoader,
  createClaimDocumentsLoader,
  createClaimNotesLoader,
  createClaimTimelineLoader,
} from './claim.loader';

// ============================================================================
// Extended DataLoader Registry
// ============================================================================

export interface ExtendedDataLoaderRegistry extends DataLoaderRegistry {
  // Party loaders
  partyByIdentifier: DataLoader<string, Party | null>;
  partyAddresses: DataLoader<string, Party['addresses']>;
  partyContacts: DataLoader<string, Party['contacts']>;
  householdMembers: DataLoader<string, Party[]>;
  partyHouseholds: DataLoader<string, Household[]>;

  // Policy loaders
  policyByNumber: DataLoader<string, Policy | null>;
  policiesByHolder: DataLoader<string, Policy[]>;
  coverages: DataLoader<string, Policy['coverages']>;
  receipts: DataLoader<string, unknown[]>;
  pendingReceipts: DataLoader<string, unknown[]>;
  policyDocuments: DataLoader<string, Document[]>;

  // Claim loaders
  claimByNumber: DataLoader<string, Claim | null>;
  claimsByPolicy: DataLoader<string, Claim[]>;
  claimsByClaimant: DataLoader<string, Claim[]>;
  claimDocuments: DataLoader<string, Document[]>;
  claimNotes: DataLoader<string, unknown[]>;
  claimTimeline: DataLoader<string, unknown[]>;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new set of DataLoaders for a request
 * This should be called once per request to ensure proper batching and caching
 */
export function createDataLoaders(): ExtendedDataLoaderRegistry {
  return {
    // Core loaders (from DataLoaderRegistry)
    party: createPartyLoader(),
    policy: createPolicyLoader(),
    claim: createClaimLoader(),
    household: createHouseholdLoader(),
    document: createDocumentLoader(),

    // Extended party loaders
    partyByIdentifier: createPartyByIdentifierLoader(),
    partyAddresses: createPartyAddressesLoader(),
    partyContacts: createPartyContactsLoader(),
    householdMembers: createHouseholdMembersLoader(),
    partyHouseholds: createPartyHouseholdsLoader(),

    // Extended policy loaders
    policyByNumber: createPolicyByNumberLoader(),
    policiesByHolder: createPoliciesByHolderLoader(),
    coverages: createCoveragesLoader(),
    receipts: createReceiptsLoader(),
    pendingReceipts: createPendingReceiptsLoader(),
    policyDocuments: createPolicyDocumentsLoader() as DataLoader<string, Document[]>,

    // Extended claim loaders
    claimByNumber: createClaimByNumberLoader(),
    claimsByPolicy: createClaimsByPolicyLoader(),
    claimsByClaimant: createClaimsByClaimantLoader(),
    claimDocuments: createClaimDocumentsLoader(),
    claimNotes: createClaimNotesLoader() as DataLoader<string, unknown[]>,
    claimTimeline: createClaimTimelineLoader(),
  };
}

/**
 * Create basic DataLoader registry (implements DataLoaderRegistry interface)
 */
export function createBasicDataLoaders(): DataLoaderRegistry {
  return {
    party: createPartyLoader(),
    policy: createPolicyLoader(),
    claim: createClaimLoader(),
    household: createHouseholdLoader(),
    document: createDocumentLoader(),
  };
}

// ============================================================================
// Document Loader
// ============================================================================

function createDocumentLoader(): DataLoader<string, Document | null> {
  return new DataLoader<string, Document | null>(
    async (ids) => {
      console.log(`[DocumentLoader] Batching ${ids.length} document requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM documents WHERE id IN (...)

      return ids.map(() => null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all caches in the registry
 */
export function clearAllLoaders(loaders: DataLoaderRegistry | ExtendedDataLoaderRegistry): void {
  Object.values(loaders).forEach(loader => {
    if (loader && typeof loader.clearAll === 'function') {
      loader.clearAll();
    }
  });
}

/**
 * Prime multiple loaders with data
 */
export function primeLoaders(
  loaders: DataLoaderRegistry,
  data: {
    parties?: Party[];
    policies?: Policy[];
    claims?: Claim[];
    households?: Household[];
    documents?: Document[];
  }
): void {
  if (data.parties) {
    data.parties.forEach(party => loaders.party.prime(party.id, party));
  }
  if (data.policies) {
    data.policies.forEach(policy => loaders.policy.prime(policy.id, policy));
  }
  if (data.claims) {
    data.claims.forEach(claim => loaders.claim.prime(claim.id, claim));
  }
  if (data.households) {
    data.households.forEach(household => loaders.household.prime(household.id, household));
  }
  if (data.documents) {
    data.documents.forEach(doc => loaders.document.prime(doc.id, doc));
  }
}

// ============================================================================
// Re-exports
// ============================================================================

export * from './party.loader';
export * from './policy.loader';
export * from './claim.loader';

export default createDataLoaders;
