/**
 * Policy Repository
 * Manages Insurance Policies in SS_INSURANCE database
 */

import { BaseRepository } from './base.repository';
import { Policy, Coverage, PaginatedResult, PaginationOptions } from '../types';
import { getDatabase, connectionPool } from '../connections';

// ============================================
// POLICY TYPES
// ============================================

export type PolicyStatus = 'QUOTE' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';

export interface PolicyCreateInput {
  policyNumber: string;
  productId: string;
  partyId: string;
  status?: PolicyStatus;
  effectiveDate: Date;
  expirationDate: Date;
  premium: number;
  currency?: string;
  coverages: CoverageInput[];
}

export interface CoverageInput {
  name: string;
  code: string;
  limit: number;
  deductible: number;
  premium: number;
}

export interface PolicyUpdateInput {
  status?: PolicyStatus;
  effectiveDate?: Date;
  expirationDate?: Date;
  premium?: number;
  coverages?: CoverageInput[];
}

export interface PolicySearchCriteria {
  policyNumber?: string;
  partyId?: string;
  productId?: string;
  status?: PolicyStatus;
  effectiveDateFrom?: Date;
  effectiveDateTo?: Date;
  expirationDateFrom?: Date;
  expirationDateTo?: Date;
  premiumMin?: number;
  premiumMax?: number;
}

// ============================================
// POLICY REPOSITORY
// ============================================

export class PolicyRepository extends BaseRepository<Policy, PolicyCreateInput, PolicyUpdateInput> {
  constructor() {
    super('ss_insurance', 'policy', 'id');
  }

  /**
   * Find policy by policy number
   */
  async findByPolicyNumber(policyNumber: string): Promise<Policy | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findUnique({
        where: { policyNumber },
        include: { coverages: true },
      });
    });
  }

  /**
   * Find all policies for a party
   */
  async findByParty(
    partyId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Policy>> {
    return this.findMany({
      where: { partyId },
      include: { coverages: true },
      ...options,
    });
  }

  /**
   * Find active policies for a party
   */
  async findActiveByParty(partyId: string): Promise<Policy[]> {
    const result = await this.findMany({
      where: {
        partyId,
        status: 'ACTIVE',
        expirationDate: { gte: new Date() },
      },
      include: { coverages: true },
    });
    return result.data;
  }

  /**
   * Search policies with multiple criteria
   */
  async search(
    criteria: PolicySearchCriteria,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Policy>> {
    const where: Record<string, unknown> = {};

    if (criteria.policyNumber) {
      where.policyNumber = { contains: criteria.policyNumber };
    }
    if (criteria.partyId) {
      where.partyId = criteria.partyId;
    }
    if (criteria.productId) {
      where.productId = criteria.productId;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.effectiveDateFrom || criteria.effectiveDateTo) {
      where.effectiveDate = {
        ...(criteria.effectiveDateFrom && { gte: criteria.effectiveDateFrom }),
        ...(criteria.effectiveDateTo && { lte: criteria.effectiveDateTo }),
      };
    }
    if (criteria.expirationDateFrom || criteria.expirationDateTo) {
      where.expirationDate = {
        ...(criteria.expirationDateFrom && { gte: criteria.expirationDateFrom }),
        ...(criteria.expirationDateTo && { lte: criteria.expirationDateTo }),
      };
    }
    if (criteria.premiumMin !== undefined || criteria.premiumMax !== undefined) {
      where.premium = {
        ...(criteria.premiumMin !== undefined && { gte: criteria.premiumMin }),
        ...(criteria.premiumMax !== undefined && { lte: criteria.premiumMax }),
      };
    }

    return this.findMany({
      where,
      include: { coverages: true },
      ...options,
    });
  }

  /**
   * Find policies expiring soon
   */
  async findExpiringWithinDays(days: number): Promise<Policy[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const result = await this.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: { coverages: true },
    });
    return result.data;
  }

  /**
   * Renew a policy
   */
  async renew(id: string, newExpirationDate: Date, newPremium?: number): Promise<Policy> {
    return this.transaction(async (tx) => {
      const policy = await tx.policy.findUnique({ where: { id } });
      if (!policy) {
        throw new Error('Policy not found');
      }

      // Create new policy number (append -R for renewal)
      const renewalNumber = `${policy.policyNumber}-R${Date.now().toString().slice(-4)}`;

      // Create new policy as renewal
      const renewed = await tx.policy.create({
        data: {
          policyNumber: renewalNumber,
          productId: policy.productId,
          partyId: policy.partyId,
          status: 'ACTIVE',
          effectiveDate: policy.expirationDate,
          expirationDate: newExpirationDate,
          premium: newPremium ?? policy.premium,
          currency: policy.currency,
          coverages: { create: policy.coverages },
        },
        include: { coverages: true },
      });

      // Update original policy status
      await tx.policy.update({
        where: { id },
        data: { status: 'EXPIRED' },
      });

      return renewed;
    });
  }

  /**
   * Cancel a policy
   */
  async cancel(id: string, reason: string, effectiveDate?: Date): Promise<Policy> {
    return this.update(id, {
      status: 'CANCELLED',
    });
  }

  /**
   * Add coverage to policy
   */
  async addCoverage(policyId: string, coverage: CoverageInput): Promise<Policy> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.update({
        where: { id: policyId },
        data: {
          coverages: {
            create: coverage,
          },
        },
        include: { coverages: true },
      });
    });
  }

  /**
   * Remove coverage from policy
   */
  async removeCoverage(policyId: string, coverageId: string): Promise<Policy> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.update({
        where: { id: policyId },
        data: {
          coverages: {
            delete: { id: coverageId },
          },
        },
        include: { coverages: true },
      });
    });
  }

  /**
   * Calculate total premium for all coverages
   */
  async calculateTotalPremium(policyId: string): Promise<number> {
    const policy = await this.findById(policyId, { include: { coverages: true } });
    if (!policy) return 0;

    return (policy as Policy & { coverages: Coverage[] }).coverages.reduce(
      (sum, coverage) => sum + coverage.premium,
      0
    );
  }

  /**
   * Get policy statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<PolicyStatus, number>;
    totalPremium: number;
    averagePremium: number;
    expiringNext30Days: number;
  }> {
    const delegate = await this.getDelegate();

    const [total, byStatus, premiumStats, expiringCount] = await Promise.all([
      delegate.count(),
      delegate.groupBy({
        by: ['status'],
        _count: true,
      }),
      delegate.aggregate({
        _sum: { premium: true },
        _avg: { premium: true },
      }),
      delegate.count({
        where: {
          status: 'ACTIVE',
          expirationDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<PolicyStatus, number>, item: any) => {
        acc[item.status as PolicyStatus] = item._count;
        return acc;
      }, {} as Record<PolicyStatus, number>),
      totalPremium: premiumStats._sum.premium ?? 0,
      averagePremium: premiumStats._avg.premium ?? 0,
      expiringNext30Days: expiringCount,
    };
  }

  /**
   * Get policy with related data from multiple databases
   */
  async findWithRelatedData(id: string): Promise<{
    policy: Policy;
    party: unknown;
    claims: unknown[];
    documents: unknown[];
  } | null> {
    const policy = await this.findById(id, { include: { coverages: true } });
    if (!policy) return null;

    // Fetch related data from other databases in parallel
    const [party, claims, documents] = await Promise.all([
      // Party from SM_GLOBAL
      (async () => {
        const client = await getDatabase('sm_global');
        try {
          return await (client as any).party.findUnique({
            where: { id: policy.partyId },
          });
        } finally {
          connectionPool.releaseConnection('sm_global');
        }
      })(),
      // Claims from SS_INSURANCE
      (async () => {
        const client = await getDatabase('ss_insurance');
        try {
          return await (client as any).claim.findMany({
            where: { policyId: id },
          });
        } finally {
          connectionPool.releaseConnection('ss_insurance');
        }
      })(),
      // Documents from SM_DOCUMENTS
      (async () => {
        const client = await getDatabase('sm_documents');
        try {
          return await (client as any).document.findMany({
            where: { entityType: 'POLICY', entityId: id },
          });
        } finally {
          connectionPool.releaseConnection('sm_documents');
        }
      })(),
    ]);

    return { policy, party, claims, documents };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let policyRepositoryInstance: PolicyRepository | null = null;

export function getPolicyRepository(): PolicyRepository {
  if (!policyRepositoryInstance) {
    policyRepositoryInstance = new PolicyRepository();
  }
  return policyRepositoryInstance;
}
