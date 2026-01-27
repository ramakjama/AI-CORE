/**
 * Policy DataLoader
 * Batches and caches policy entity fetches to prevent N+1 queries
 */

import DataLoader from 'dataloader';
import { Policy, Coverage, Receipt } from '../types';

// ============================================================================
// Types
// ============================================================================

interface PolicyServiceInterface {
  findByIds(ids: readonly string[]): Promise<(Policy | null)[]>;
}

interface CoverageServiceInterface {
  findByPolicyIds(policyIds: readonly string[]): Promise<Coverage[][]>;
}

interface ReceiptServiceInterface {
  findByPolicyIds(policyIds: readonly string[]): Promise<Receipt[][]>;
}

// ============================================================================
// Mock Services (replace with actual implementations)
// ============================================================================

const PolicyService: PolicyServiceInterface = {
  async findByIds(ids: readonly string[]): Promise<(Policy | null)[]> {
    console.log(`[PolicyLoader] Batching ${ids.length} policy requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM policies WHERE id IN (...)

    // Ensure results are in the same order as input ids
    const results: (Policy | null)[] = ids.map(() => null);

    return results;
  },
};

const CoverageService: CoverageServiceInterface = {
  async findByPolicyIds(policyIds: readonly string[]): Promise<Coverage[][]> {
    console.log(`[CoverageLoader] Batching ${policyIds.length} coverage requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM coverages WHERE policy_id IN (...)

    return policyIds.map(() => []);
  },
};

const ReceiptService: ReceiptServiceInterface = {
  async findByPolicyIds(policyIds: readonly string[]): Promise<Receipt[][]> {
    console.log(`[ReceiptLoader] Batching ${policyIds.length} receipt requests`);

    // TODO: Replace with actual batch query
    // Example: SELECT * FROM receipts WHERE policy_id IN (...)

    return policyIds.map(() => []);
  },
};

// ============================================================================
// DataLoader Factory Functions
// ============================================================================

/**
 * Create a new Policy DataLoader instance
 * Should be created per-request to ensure proper caching scope
 */
export function createPolicyLoader(): DataLoader<string, Policy | null> {
  return new DataLoader<string, Policy | null>(
    async (ids) => {
      try {
        return await PolicyService.findByIds(ids);
      } catch (error) {
        console.error('[PolicyLoader] Batch fetch error:', error);
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
 * Create a loader for policy by policy number
 */
export function createPolicyByNumberLoader(): DataLoader<string, Policy | null> {
  return new DataLoader<string, Policy | null>(
    async (policyNumbers) => {
      console.log(`[PolicyByNumberLoader] Batching ${policyNumbers.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM policies WHERE policy_number IN (...)

      return policyNumbers.map(() => null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for policies by holder ID
 */
export function createPoliciesByHolderLoader(): DataLoader<string, Policy[]> {
  return new DataLoader<string, Policy[]>(
    async (holderIds) => {
      console.log(`[PoliciesByHolderLoader] Batching ${holderIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM policies WHERE holder_id IN (...)

      return holderIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for policy coverages
 */
export function createCoveragesLoader(): DataLoader<string, Coverage[]> {
  return new DataLoader<string, Coverage[]>(
    async (policyIds) => {
      try {
        return await CoverageService.findByPolicyIds(policyIds);
      } catch (error) {
        console.error('[CoverageLoader] Batch fetch error:', error);
        return policyIds.map(() => []);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for policy receipts
 */
export function createReceiptsLoader(): DataLoader<string, Receipt[]> {
  return new DataLoader<string, Receipt[]>(
    async (policyIds) => {
      try {
        return await ReceiptService.findByPolicyIds(policyIds);
      } catch (error) {
        console.error('[ReceiptLoader] Batch fetch error:', error);
        return policyIds.map(() => []);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for pending receipts by policy
 */
export function createPendingReceiptsLoader(): DataLoader<string, Receipt[]> {
  return new DataLoader<string, Receipt[]>(
    async (policyIds) => {
      console.log(`[PendingReceiptsLoader] Batching ${policyIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM receipts WHERE policy_id IN (...) AND status = 'PENDING'

      return policyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for policy documents
 */
export function createPolicyDocumentsLoader(): DataLoader<string, unknown[]> {
  return new DataLoader<string, unknown[]>(
    async (policyIds) => {
      console.log(`[PolicyDocumentsLoader] Batching ${policyIds.length} requests`);

      // TODO: Replace with actual batch query

      return policyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for policy endorsements
 */
export function createEndorsementsLoader(): DataLoader<string, unknown[]> {
  return new DataLoader<string, unknown[]>(
    async (policyIds) => {
      console.log(`[EndorsementsLoader] Batching ${policyIds.length} requests`);

      // TODO: Replace with actual batch query

      return policyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a composite loader for policy with all related data
 */
export function createPolicyWithRelationsLoader(): DataLoader<string, {
  policy: Policy | null;
  coverages: Coverage[];
  receipts: Receipt[];
}> {
  return new DataLoader(
    async (ids) => {
      console.log(`[PolicyWithRelationsLoader] Batching ${ids.length} requests`);

      // Batch fetch all data in parallel
      const [policies, coverages, receipts] = await Promise.all([
        PolicyService.findByIds(ids),
        CoverageService.findByPolicyIds(ids),
        ReceiptService.findByPolicyIds(ids),
      ]);

      // Combine results
      return ids.map((_, index) => ({
        policy: policies[index],
        coverages: coverages[index] || [],
        receipts: receipts[index] || [],
      }));
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prime the policy cache with known data
 */
export function primePolicyLoader(
  loader: DataLoader<string, Policy | null>,
  policies: Policy[]
): void {
  for (const policy of policies) {
    loader.prime(policy.id, policy);
  }
}

/**
 * Clear specific entries from the cache
 */
export function clearPolicyFromCache(
  loader: DataLoader<string, Policy | null>,
  policyId: string
): void {
  loader.clear(policyId);
}

/**
 * Clear all entries from the cache
 */
export function clearAllPolicies(
  loader: DataLoader<string, Policy | null>
): void {
  loader.clearAll();
}

// ============================================================================
// Export
// ============================================================================

export default {
  createPolicyLoader,
  createPolicyByNumberLoader,
  createPoliciesByHolderLoader,
  createCoveragesLoader,
  createReceiptsLoader,
  createPendingReceiptsLoader,
  createPolicyDocumentsLoader,
  createEndorsementsLoader,
  createPolicyWithRelationsLoader,
  primePolicyLoader,
  clearPolicyFromCache,
  clearAllPolicies,
};
