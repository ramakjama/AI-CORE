/**
 * Claim DataLoader
 * Batches and caches claim entity fetches to prevent N+1 queries
 */

import DataLoader from 'dataloader';
import { Claim, Document, ClaimNote } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ClaimServiceInterface {
  findByIds(ids: readonly string[]): Promise<(Claim | null)[]>;
}

interface ClaimDocumentServiceInterface {
  findByClaimIds(claimIds: readonly string[]): Promise<Document[][]>;
}

interface ClaimNoteServiceInterface {
  findByClaimIds(claimIds: readonly string[]): Promise<ClaimNote[][]>;
}

// ============================================================================
// Mock Services (replace with actual implementations)
// ============================================================================

const ClaimService: ClaimServiceInterface = {
  async findByIds(ids: readonly string[]): Promise<(Claim | null)[]> {
    console.log(`[ClaimLoader] Batching ${ids.length} claim requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM claims WHERE id IN (...)

    return ids.map(() => null);
  },
};

const ClaimDocumentService: ClaimDocumentServiceInterface = {
  async findByClaimIds(claimIds: readonly string[]): Promise<Document[][]> {
    console.log(`[ClaimDocumentLoader] Batching ${claimIds.length} document requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM documents WHERE claim_id IN (...)

    return claimIds.map(() => []);
  },
};

const ClaimNoteService: ClaimNoteServiceInterface = {
  async findByClaimIds(claimIds: readonly string[]): Promise<ClaimNote[][]> {
    console.log(`[ClaimNoteLoader] Batching ${claimIds.length} note requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM claim_notes WHERE claim_id IN (...)

    return claimIds.map(() => []);
  },
};

// ============================================================================
// DataLoader Factory Functions
// ============================================================================

/**
 * Create a new Claim DataLoader instance
 * Should be created per-request to ensure proper caching scope
 */
export function createClaimLoader(): DataLoader<string, Claim | null> {
  return new DataLoader<string, Claim | null>(
    async (ids) => {
      try {
        return await ClaimService.findByIds(ids);
      } catch (error) {
        console.error('[ClaimLoader] Batch fetch error:', error);
        return ids.map(() => null);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for claim by claim number
 */
export function createClaimByNumberLoader(): DataLoader<string, Claim | null> {
  return new DataLoader<string, Claim | null>(
    async (claimNumbers) => {
      console.log(`[ClaimByNumberLoader] Batching ${claimNumbers.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM claims WHERE claim_number IN (...)

      return claimNumbers.map(() => null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for claims by policy ID
 */
export function createClaimsByPolicyLoader(): DataLoader<string, Claim[]> {
  return new DataLoader<string, Claim[]>(
    async (policyIds) => {
      console.log(`[ClaimsByPolicyLoader] Batching ${policyIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM claims WHERE policy_id IN (...)

      return policyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for claims by claimant ID
 */
export function createClaimsByClaimantLoader(): DataLoader<string, Claim[]> {
  return new DataLoader<string, Claim[]>(
    async (claimantIds) => {
      console.log(`[ClaimsByClaimantLoader] Batching ${claimantIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM claims WHERE claimant_id IN (...)

      return claimantIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for claim documents
 */
export function createClaimDocumentsLoader(): DataLoader<string, Document[]> {
  return new DataLoader<string, Document[]>(
    async (claimIds) => {
      try {
        return await ClaimDocumentService.findByClaimIds(claimIds);
      } catch (error) {
        console.error('[ClaimDocumentLoader] Batch fetch error:', error);
        return claimIds.map(() => []);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for claim notes
 */
export function createClaimNotesLoader(): DataLoader<string, ClaimNote[]> {
  return new DataLoader<string, ClaimNote[]>(
    async (claimIds) => {
      try {
        return await ClaimNoteService.findByClaimIds(claimIds);
      } catch (error) {
        console.error('[ClaimNoteLoader] Batch fetch error:', error);
        return claimIds.map(() => []);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for claim timeline events
 */
export function createClaimTimelineLoader(): DataLoader<string, unknown[]> {
  return new DataLoader<string, unknown[]>(
    async (claimIds) => {
      console.log(`[ClaimTimelineLoader] Batching ${claimIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM claim_events WHERE claim_id IN (...) ORDER BY timestamp

      return claimIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for claim third parties
 */
export function createClaimThirdPartiesLoader(): DataLoader<string, unknown[]> {
  return new DataLoader<string, unknown[]>(
    async (claimIds) => {
      console.log(`[ClaimThirdPartiesLoader] Batching ${claimIds.length} requests`);

      // TODO: Replace with actual batch query

      return claimIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for claim payments
 */
export function createClaimPaymentsLoader(): DataLoader<string, unknown[]> {
  return new DataLoader<string, unknown[]>(
    async (claimIds) => {
      console.log(`[ClaimPaymentsLoader] Batching ${claimIds.length} requests`);

      // TODO: Replace with actual batch query

      return claimIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a composite loader for claim with all related data
 */
export function createClaimWithRelationsLoader(): DataLoader<string, {
  claim: Claim | null;
  documents: Document[];
  notes: ClaimNote[];
}> {
  return new DataLoader(
    async (ids) => {
      console.log(`[ClaimWithRelationsLoader] Batching ${ids.length} requests`);

      // Batch fetch all data in parallel
      const [claims, documents, notes] = await Promise.all([
        ClaimService.findByIds(ids),
        ClaimDocumentService.findByClaimIds(ids),
        ClaimNoteService.findByClaimIds(ids),
      ]);

      // Combine results
      return ids.map((_, index) => ({
        claim: claims[index],
        documents: documents[index] || [],
        notes: notes[index] || [],
      }));
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for claims by adjuster ID
 */
export function createClaimsByAdjusterLoader(): DataLoader<string, Claim[]> {
  return new DataLoader<string, Claim[]>(
    async (adjusterIds) => {
      console.log(`[ClaimsByAdjusterLoader] Batching ${adjusterIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM claims WHERE adjuster_id IN (...)

      return adjusterIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for claim counts by status
 */
export function createClaimCountsByStatusLoader(): DataLoader<string, Record<string, number>> {
  return new DataLoader<string, Record<string, number>>(
    async (policyIds) => {
      console.log(`[ClaimCountsByStatusLoader] Batching ${policyIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT policy_id, status, COUNT(*) FROM claims
      //          WHERE policy_id IN (...) GROUP BY policy_id, status

      return policyIds.map(() => ({}));
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
 * Prime the claim cache with known data
 */
export function primeClaimLoader(
  loader: DataLoader<string, Claim | null>,
  claims: Claim[]
): void {
  for (const claim of claims) {
    loader.prime(claim.id, claim);
  }
}

/**
 * Clear specific entries from the cache
 */
export function clearClaimFromCache(
  loader: DataLoader<string, Claim | null>,
  claimId: string
): void {
  loader.clear(claimId);
}

/**
 * Clear all entries from the cache
 */
export function clearAllClaims(
  loader: DataLoader<string, Claim | null>
): void {
  loader.clearAll();
}

// ============================================================================
// Export
// ============================================================================

export default {
  createClaimLoader,
  createClaimByNumberLoader,
  createClaimsByPolicyLoader,
  createClaimsByClaimantLoader,
  createClaimDocumentsLoader,
  createClaimNotesLoader,
  createClaimTimelineLoader,
  createClaimThirdPartiesLoader,
  createClaimPaymentsLoader,
  createClaimWithRelationsLoader,
  createClaimsByAdjusterLoader,
  createClaimCountsByStatusLoader,
  primeClaimLoader,
  clearClaimFromCache,
  clearAllClaims,
};
