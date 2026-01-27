/**
 * Party Repository
 * Manages Party entities (Clients, Companies, Organizations)
 */

import { BaseRepository } from './base.repository';
import { Party, PaginatedResult, FilterOptions, PaginationOptions } from '../types';
import { getDatabase, connectionPool } from '../connections';

// ============================================
// PARTY TYPES
// ============================================

export interface PartyCreateInput {
  type: 'PERSON' | 'COMPANY' | 'ORGANIZATION';
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  metadata?: Record<string, unknown>;
}

export interface PartyUpdateInput {
  type?: 'PERSON' | 'COMPANY' | 'ORGANIZATION';
  name?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  metadata?: Record<string, unknown>;
}

export interface PartySearchCriteria {
  name?: string;
  taxId?: string;
  email?: string;
  type?: 'PERSON' | 'COMPANY' | 'ORGANIZATION';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  city?: string;
  state?: string;
  country?: string;
}

// ============================================
// PARTY REPOSITORY
// ============================================

export class PartyRepository extends BaseRepository<Party, PartyCreateInput, PartyUpdateInput> {
  constructor() {
    super('sm_global', 'party', 'id');
  }

  /**
   * Find party by Tax ID
   */
  async findByTaxId(taxId: string): Promise<Party | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findUnique({
        where: { taxId },
      });
    });
  }

  /**
   * Find party by email
   */
  async findByEmail(email: string): Promise<Party | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findFirst({
        where: { email },
      });
    });
  }

  /**
   * Search parties with multiple criteria
   */
  async search(
    criteria: PartySearchCriteria,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Party>> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }
    if (criteria.taxId) {
      where.taxId = criteria.taxId;
    }
    if (criteria.email) {
      where.email = { contains: criteria.email, mode: 'insensitive' };
    }
    if (criteria.type) {
      where.type = criteria.type;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.city || criteria.state || criteria.country) {
      where.address = {
        path: [],
        ...(criteria.city && { city: criteria.city }),
        ...(criteria.state && { state: criteria.state }),
        ...(criteria.country && { country: criteria.country }),
      };
    }

    return this.findMany({ where, ...options });
  }

  /**
   * Find all active parties
   */
  async findActive(options?: PaginationOptions): Promise<PaginatedResult<Party>> {
    return this.findMany({
      where: { status: 'ACTIVE' },
      ...options,
    });
  }

  /**
   * Find parties by type
   */
  async findByType(
    type: 'PERSON' | 'COMPANY' | 'ORGANIZATION',
    options?: PaginationOptions
  ): Promise<PaginatedResult<Party>> {
    return this.findMany({
      where: { type },
      ...options,
    });
  }

  /**
   * Suspend a party
   */
  async suspend(id: string, reason?: string): Promise<Party> {
    return this.update(id, {
      status: 'SUSPENDED',
      metadata: { suspendedAt: new Date(), suspendReason: reason },
    });
  }

  /**
   * Activate a party
   */
  async activate(id: string): Promise<Party> {
    return this.update(id, {
      status: 'ACTIVE',
      metadata: { activatedAt: new Date() },
    });
  }

  /**
   * Get party with all related policies from SS_INSURANCE
   */
  async findWithPolicies(id: string): Promise<Party & { policies: unknown[] } | null> {
    const party = await this.findById(id);
    if (!party) return null;

    // Fetch policies from SS_INSURANCE database
    const insuranceClient = await getDatabase('ss_insurance');
    try {
      const policies = await (insuranceClient as any).policy.findMany({
        where: { partyId: id },
      });
      return { ...party, policies };
    } finally {
      connectionPool.releaseConnection('ss_insurance');
    }
  }

  /**
   * Get party statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const delegate = await this.getDelegate();

    const [total, byType, byStatus] = await Promise.all([
      delegate.count(),
      delegate.groupBy({
        by: ['type'],
        _count: true,
      }),
      delegate.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
    };
  }

  /**
   * Merge two party records
   */
  async merge(sourceId: string, targetId: string): Promise<Party> {
    return this.transaction(async (tx) => {
      const source = await tx.party.findUnique({ where: { id: sourceId } });
      const target = await tx.party.findUnique({ where: { id: targetId } });

      if (!source || !target) {
        throw new Error('Source or target party not found');
      }

      // Merge metadata
      const mergedMetadata = {
        ...source.metadata,
        ...target.metadata,
        mergedFrom: sourceId,
        mergedAt: new Date(),
      };

      // Update target with merged data
      const merged = await tx.party.update({
        where: { id: targetId },
        data: { metadata: mergedMetadata },
      });

      // Soft delete source
      await tx.party.update({
        where: { id: sourceId },
        data: {
          status: 'INACTIVE',
          metadata: { mergedInto: targetId, mergedAt: new Date() },
        },
      });

      return merged;
    });
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let partyRepositoryInstance: PartyRepository | null = null;

export function getPartyRepository(): PartyRepository {
  if (!partyRepositoryInstance) {
    partyRepositoryInstance = new PartyRepository();
  }
  return partyRepositoryInstance;
}
