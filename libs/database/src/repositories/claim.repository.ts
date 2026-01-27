/**
 * Claim Repository
 * Manages Insurance Claims in SS_INSURANCE database
 */

import { BaseRepository } from './base.repository';
import { Claim, PaginatedResult, PaginationOptions } from '../types';
import { getDatabase, connectionPool } from '../connections';

// ============================================
// CLAIM TYPES
// ============================================

export type ClaimStatus = 'OPEN' | 'IN_PROGRESS' | 'APPROVED' | 'DENIED' | 'CLOSED';

export interface ClaimCreateInput {
  claimNumber: string;
  policyId: string;
  status?: ClaimStatus;
  type: string;
  description: string;
  incidentDate: Date;
  reportedDate?: Date;
  claimAmount: number;
  documents?: string[];
}

export interface ClaimUpdateInput {
  status?: ClaimStatus;
  type?: string;
  description?: string;
  claimAmount?: number;
  approvedAmount?: number | null;
  documents?: string[];
}

export interface ClaimSearchCriteria {
  claimNumber?: string;
  policyId?: string;
  status?: ClaimStatus;
  type?: string;
  incidentDateFrom?: Date;
  incidentDateTo?: Date;
  reportedDateFrom?: Date;
  reportedDateTo?: Date;
  claimAmountMin?: number;
  claimAmountMax?: number;
}

export interface ClaimStatusUpdate {
  status: ClaimStatus;
  notes?: string;
  approvedAmount?: number;
  updatedBy: string;
}

// ============================================
// CLAIM REPOSITORY
// ============================================

export class ClaimRepository extends BaseRepository<Claim, ClaimCreateInput, ClaimUpdateInput> {
  constructor() {
    super('ss_insurance', 'claim', 'id');
  }

  /**
   * Find claim by claim number
   */
  async findByClaimNumber(claimNumber: string): Promise<Claim | null> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      return delegate.findUnique({
        where: { claimNumber },
      });
    });
  }

  /**
   * Find all claims for a policy
   */
  async findByPolicy(
    policyId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Claim>> {
    return this.findMany({
      where: { policyId },
      ...options,
    });
  }

  /**
   * Find open claims for a policy
   */
  async findOpenByPolicy(policyId: string): Promise<Claim[]> {
    const result = await this.findMany({
      where: {
        policyId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
    return result.data;
  }

  /**
   * Search claims with multiple criteria
   */
  async search(
    criteria: ClaimSearchCriteria,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Claim>> {
    const where: Record<string, unknown> = {};

    if (criteria.claimNumber) {
      where.claimNumber = { contains: criteria.claimNumber };
    }
    if (criteria.policyId) {
      where.policyId = criteria.policyId;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.type) {
      where.type = criteria.type;
    }
    if (criteria.incidentDateFrom || criteria.incidentDateTo) {
      where.incidentDate = {
        ...(criteria.incidentDateFrom && { gte: criteria.incidentDateFrom }),
        ...(criteria.incidentDateTo && { lte: criteria.incidentDateTo }),
      };
    }
    if (criteria.reportedDateFrom || criteria.reportedDateTo) {
      where.reportedDate = {
        ...(criteria.reportedDateFrom && { gte: criteria.reportedDateFrom }),
        ...(criteria.reportedDateTo && { lte: criteria.reportedDateTo }),
      };
    }
    if (criteria.claimAmountMin !== undefined || criteria.claimAmountMax !== undefined) {
      where.claimAmount = {
        ...(criteria.claimAmountMin !== undefined && { gte: criteria.claimAmountMin }),
        ...(criteria.claimAmountMax !== undefined && { lte: criteria.claimAmountMax }),
      };
    }

    return this.findMany({ where, ...options });
  }

  /**
   * Update claim status with history tracking
   */
  async updateStatus(id: string, statusUpdate: ClaimStatusUpdate): Promise<Claim> {
    return this.transaction(async (tx) => {
      const claim = await tx.claim.findUnique({ where: { id } });
      if (!claim) {
        throw new Error('Claim not found');
      }

      // Create status history entry
      await tx.claimStatusHistory.create({
        data: {
          claimId: id,
          previousStatus: claim.status,
          newStatus: statusUpdate.status,
          notes: statusUpdate.notes,
          updatedBy: statusUpdate.updatedBy,
          updatedAt: new Date(),
        },
      });

      // Update claim
      return tx.claim.update({
        where: { id },
        data: {
          status: statusUpdate.status,
          approvedAmount: statusUpdate.approvedAmount,
        },
      });
    });
  }

  /**
   * Approve a claim
   */
  async approve(id: string, approvedAmount: number, approvedBy: string): Promise<Claim> {
    return this.updateStatus(id, {
      status: 'APPROVED',
      approvedAmount,
      updatedBy: approvedBy,
      notes: `Claim approved for ${approvedAmount}`,
    });
  }

  /**
   * Deny a claim
   */
  async deny(id: string, reason: string, deniedBy: string): Promise<Claim> {
    return this.updateStatus(id, {
      status: 'DENIED',
      updatedBy: deniedBy,
      notes: `Claim denied: ${reason}`,
    });
  }

  /**
   * Close a claim
   */
  async close(id: string, closedBy: string, notes?: string): Promise<Claim> {
    return this.updateStatus(id, {
      status: 'CLOSED',
      updatedBy: closedBy,
      notes: notes ?? 'Claim closed',
    });
  }

  /**
   * Add document to claim
   */
  async addDocument(claimId: string, documentId: string): Promise<Claim> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      const claim = await delegate.findUnique({ where: { id: claimId } });
      if (!claim) {
        throw new Error('Claim not found');
      }

      const documents = [...(claim.documents || []), documentId];
      return delegate.update({
        where: { id: claimId },
        data: { documents },
      });
    });
  }

  /**
   * Remove document from claim
   */
  async removeDocument(claimId: string, documentId: string): Promise<Claim> {
    return this.executeWithRetry(async () => {
      const delegate = await this.getDelegate();
      const claim = await delegate.findUnique({ where: { id: claimId } });
      if (!claim) {
        throw new Error('Claim not found');
      }

      const documents = (claim.documents || []).filter((d: string) => d !== documentId);
      return delegate.update({
        where: { id: claimId },
        data: { documents },
      });
    });
  }

  /**
   * Get claim statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ClaimStatus, number>;
    totalClaimAmount: number;
    totalApprovedAmount: number;
    averageClaimAmount: number;
    approvalRate: number;
  }> {
    const delegate = await this.getDelegate();

    const [total, byStatus, amountStats, approvedCount] = await Promise.all([
      delegate.count(),
      delegate.groupBy({
        by: ['status'],
        _count: true,
      }),
      delegate.aggregate({
        _sum: { claimAmount: true, approvedAmount: true },
        _avg: { claimAmount: true },
      }),
      delegate.count({
        where: { status: 'APPROVED' },
      }),
    ]);

    const processedCount = await delegate.count({
      where: { status: { in: ['APPROVED', 'DENIED'] } },
    });

    return {
      total,
      byStatus: byStatus.reduce((acc: Record<ClaimStatus, number>, item: any) => {
        acc[item.status as ClaimStatus] = item._count;
        return acc;
      }, {} as Record<ClaimStatus, number>),
      totalClaimAmount: amountStats._sum.claimAmount ?? 0,
      totalApprovedAmount: amountStats._sum.approvedAmount ?? 0,
      averageClaimAmount: amountStats._avg.claimAmount ?? 0,
      approvalRate: processedCount > 0 ? (approvedCount / processedCount) * 100 : 0,
    };
  }

  /**
   * Get claims by date range with aggregation
   */
  async getByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{
    claims: Claim[];
    summary: {
      count: number;
      totalAmount: number;
      averageAmount: number;
    };
  }> {
    const delegate = await this.getDelegate();

    const [claims, summary] = await Promise.all([
      delegate.findMany({
        where: {
          incidentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { incidentDate: 'desc' },
      }),
      delegate.aggregate({
        where: {
          incidentDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
        _sum: { claimAmount: true },
        _avg: { claimAmount: true },
      }),
    ]);

    return {
      claims,
      summary: {
        count: summary._count,
        totalAmount: summary._sum.claimAmount ?? 0,
        averageAmount: summary._avg.claimAmount ?? 0,
      },
    };
  }

  /**
   * Get claim with full context from multiple databases
   */
  async findWithFullContext(id: string): Promise<{
    claim: Claim;
    policy: unknown;
    party: unknown;
    documents: unknown[];
    statusHistory: unknown[];
  } | null> {
    const claim = await this.findById(id);
    if (!claim) return null;

    const delegate = await this.getDelegate();

    // Fetch related data from multiple databases
    const [policy, statusHistory] = await Promise.all([
      delegate.policy?.findUnique({ where: { id: claim.policyId } }),
      delegate.claimStatusHistory?.findMany({
        where: { claimId: id },
        orderBy: { updatedAt: 'desc' },
      }) ?? [],
    ]);

    // Fetch party from SM_GLOBAL
    let party = null;
    if (policy?.partyId) {
      const globalClient = await getDatabase('sm_global');
      try {
        party = await (globalClient as any).party.findUnique({
          where: { id: policy.partyId },
        });
      } finally {
        connectionPool.releaseConnection('sm_global');
      }
    }

    // Fetch documents from SM_DOCUMENTS
    const documentsClient = await getDatabase('sm_documents');
    let documents: unknown[] = [];
    try {
      documents = await (documentsClient as any).document.findMany({
        where: { entityType: 'CLAIM', entityId: id },
      });
    } finally {
      connectionPool.releaseConnection('sm_documents');
    }

    return { claim, policy, party, documents, statusHistory };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let claimRepositoryInstance: ClaimRepository | null = null;

export function getClaimRepository(): ClaimRepository {
  if (!claimRepositoryInstance) {
    claimRepositoryInstance = new ClaimRepository();
  }
  return claimRepositoryInstance;
}
