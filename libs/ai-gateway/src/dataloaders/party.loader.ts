/**
 * Party DataLoader
 * Batches and caches party entity fetches to prevent N+1 queries
 */

import DataLoader from 'dataloader';
import { Party, Household } from '../types';

// ============================================================================
// Types
// ============================================================================

interface PartyServiceInterface {
  findByIds(ids: readonly string[]): Promise<(Party | null)[]>;
}

interface HouseholdServiceInterface {
  findByIds(ids: readonly string[]): Promise<(Household | null)[]>;
}

// ============================================================================
// Mock Services (replace with actual implementations)
// ============================================================================

// These would be replaced with actual service calls to your Party microservice
const PartyService: PartyServiceInterface = {
  async findByIds(ids: readonly string[]): Promise<(Party | null)[]> {
    // TODO: Replace with actual batch query
    // Example: SELECT * FROM parties WHERE id IN (...)
    console.log(`[PartyLoader] Batching ${ids.length} party requests`);

    // Simulate batch fetch
    // In production, this would be a single database or service call
    const results = await Promise.all(
      ids.map(async (id) => {
        // Simulated fetch - replace with actual service call
        return null as Party | null;
      })
    );

    // Ensure results are in the same order as input ids
    const partyMap = new Map<string, Party | null>();
    results.forEach((party, index) => {
      partyMap.set(ids[index], party);
    });

    return ids.map(id => partyMap.get(id) ?? null);
  },
};

const HouseholdService: HouseholdServiceInterface = {
  async findByIds(ids: readonly string[]): Promise<(Household | null)[]> {
    // TODO: Replace with actual batch query
    console.log(`[HouseholdLoader] Batching ${ids.length} household requests`);

    // Simulate batch fetch
    const results = await Promise.all(
      ids.map(async (id) => {
        return null as Household | null;
      })
    );

    const householdMap = new Map<string, Household | null>();
    results.forEach((household, index) => {
      householdMap.set(ids[index], household);
    });

    return ids.map(id => householdMap.get(id) ?? null);
  },
};

// ============================================================================
// DataLoader Factory Functions
// ============================================================================

/**
 * Create a new Party DataLoader instance
 * Should be created per-request to ensure proper caching scope
 */
export function createPartyLoader(): DataLoader<string, Party | null> {
  return new DataLoader<string, Party | null>(
    async (ids) => {
      try {
        return await PartyService.findByIds(ids);
      } catch (error) {
        console.error('[PartyLoader] Batch fetch error:', error);
        // Return nulls for all ids on error
        return ids.map(() => null);
      }
    },
    {
      // Cache configuration
      cache: true,

      // Optional: Custom cache key function
      cacheKeyFn: (key) => key,

      // Optional: Max batch size (default is unlimited)
      maxBatchSize: 100,

      // Optional: Batch scheduling function
      // batchScheduleFn: (callback) => setTimeout(callback, 10),
    }
  );
}

/**
 * Create a new Household DataLoader instance
 */
export function createHouseholdLoader(): DataLoader<string, Household | null> {
  return new DataLoader<string, Household | null>(
    async (ids) => {
      try {
        return await HouseholdService.findByIds(ids);
      } catch (error) {
        console.error('[HouseholdLoader] Batch fetch error:', error);
        return ids.map(() => null);
      }
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

// ============================================================================
// Advanced Party Loaders
// ============================================================================

/**
 * Create a loader for parties by identifier
 * Key format: "type:value" (e.g., "DNI:12345678A")
 */
export function createPartyByIdentifierLoader(): DataLoader<string, Party | null> {
  return new DataLoader<string, Party | null>(
    async (keys) => {
      console.log(`[PartyByIdentifierLoader] Batching ${keys.length} requests`);

      // Parse keys into type/value pairs
      const identifiers = keys.map(key => {
        const [type, value] = key.split(':');
        return { type, value };
      });

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM parties p JOIN identifiers i ON p.id = i.party_id
      //          WHERE (i.type, i.value) IN (...)

      return keys.map(() => null);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for party addresses
 */
export function createPartyAddressesLoader(): DataLoader<string, Party['addresses']> {
  return new DataLoader<string, Party['addresses']>(
    async (partyIds) => {
      console.log(`[PartyAddressesLoader] Batching ${partyIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT * FROM addresses WHERE party_id IN (...)

      return partyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for party contacts
 */
export function createPartyContactsLoader(): DataLoader<string, Party['contacts']> {
  return new DataLoader<string, Party['contacts']>(
    async (partyIds) => {
      console.log(`[PartyContactsLoader] Batching ${partyIds.length} requests`);

      // TODO: Replace with actual batch query

      return partyIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 100,
    }
  );
}

/**
 * Create a loader for household members
 */
export function createHouseholdMembersLoader(): DataLoader<string, Party[]> {
  return new DataLoader<string, Party[]>(
    async (householdIds) => {
      console.log(`[HouseholdMembersLoader] Batching ${householdIds.length} requests`);

      // TODO: Replace with actual batch query
      // Example: SELECT p.* FROM parties p
      //          JOIN household_members hm ON p.id = hm.party_id
      //          WHERE hm.household_id IN (...)

      return householdIds.map(() => []);
    },
    {
      cache: true,
      maxBatchSize: 50,
    }
  );
}

/**
 * Create a loader for party's households
 */
export function createPartyHouseholdsLoader(): DataLoader<string, Household[]> {
  return new DataLoader<string, Household[]>(
    async (partyIds) => {
      console.log(`[PartyHouseholdsLoader] Batching ${partyIds.length} requests`);

      // TODO: Replace with actual batch query

      return partyIds.map(() => []);
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
 * Prime the cache with known data
 * Useful when you already have party data from a previous query
 */
export function primePartyLoader(
  loader: DataLoader<string, Party | null>,
  parties: Party[]
): void {
  for (const party of parties) {
    loader.prime(party.id, party);
  }
}

/**
 * Clear specific entries from the cache
 */
export function clearPartyFromCache(
  loader: DataLoader<string, Party | null>,
  partyId: string
): void {
  loader.clear(partyId);
}

/**
 * Clear all entries from the cache
 */
export function clearAllParties(
  loader: DataLoader<string, Party | null>
): void {
  loader.clearAll();
}

// ============================================================================
// Export
// ============================================================================

export default {
  createPartyLoader,
  createHouseholdLoader,
  createPartyByIdentifierLoader,
  createPartyAddressesLoader,
  createPartyContactsLoader,
  createHouseholdMembersLoader,
  createPartyHouseholdsLoader,
  primePartyLoader,
  clearPartyFromCache,
  clearAllParties,
};
