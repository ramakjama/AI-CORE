import { Injectable } from '@nestjs/common';
import { prisma } from '@ai-core/database';

import {
  Claim,
  ClaimList,
  CreateClaimInput,
  CreatePolicyInput,
  Policy,
  PolicyList,
  UpdateClaimInput,
  UpdatePolicyInput,
} from './insurance.types';

const DEFAULT_TENANT = process.env.TENANT_ID ?? 'default';
const DEFAULT_LIMIT = 25;

@Injectable()
export class InsuranceService {
  async createPolicy(input: CreatePolicyInput): Promise<Policy> {
    return prisma.policy.create({
      data: {
        tenantId: input.tenantId ?? DEFAULT_TENANT,
        policyNumber: input.policyNumber,
        status: input.status ?? 'DRAFT',
        type: input.type,
        holderName: input.holderName,
        startDate: input.startDate,
        endDate: input.endDate,
        premium: input.premium,
      },
    });
  }

  async updatePolicy(id: string, input: UpdatePolicyInput): Promise<Policy> {
    return prisma.policy.update({
      where: { id },
      data: {
        policyNumber: input.policyNumber,
        status: input.status,
        type: input.type,
        holderName: input.holderName,
        startDate: input.startDate,
        endDate: input.endDate,
        premium: input.premium,
      },
    });
  }

  async getPolicy(id: string): Promise<Policy | null> {
    return prisma.policy.findUnique({ where: { id } });
  }

  async listPolicies(tenantId?: string, limit?: number, offset?: number): Promise<PolicyList> {
    const where = { tenantId: tenantId ?? DEFAULT_TENANT };
    const take = limit ?? DEFAULT_LIMIT;
    const skip = offset ?? 0;

    const [items, total] = await prisma.$transaction([
      prisma.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.policy.count({ where }),
    ]);

    return { items, total };
  }

  async createClaim(input: CreateClaimInput): Promise<Claim> {
    return prisma.claim.create({
      data: {
        policyId: input.policyId,
        status: input.status ?? 'OPEN',
        title: input.title,
        description: input.description,
        amount: input.amount,
      },
    });
  }

  async updateClaim(id: string, input: UpdateClaimInput): Promise<Claim> {
    return prisma.claim.update({
      where: { id },
      data: {
        status: input.status,
        title: input.title,
        description: input.description,
        amount: input.amount,
      },
    });
  }

  async getClaim(id: string): Promise<Claim | null> {
    return prisma.claim.findUnique({ where: { id } });
  }

  async listClaims(
    policyId?: string,
    limit?: number,
    offset?: number
  ): Promise<ClaimList> {
    const where = policyId ? { policyId } : {};
    const take = limit ?? DEFAULT_LIMIT;
    const skip = offset ?? 0;

    const [items, total] = await prisma.$transaction([
      prisma.claim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.claim.count({ where }),
    ]);

    return { items, total };
  }

  async removeClaim(id: string): Promise<Claim> {
    return prisma.claim.delete({ where: { id } });
  }
}
