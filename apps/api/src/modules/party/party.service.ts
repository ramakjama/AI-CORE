import { Injectable } from '@nestjs/common';
import { prisma } from '@ai-core/database';

import { CreatePartyInput, Party, PartyList, UpdatePartyInput } from './party.types';

const DEFAULT_TENANT = process.env.TENANT_ID ?? 'default';
const DEFAULT_LIMIT = 25;

@Injectable()
export class PartyService {
  async create(input: CreatePartyInput): Promise<Party> {
    const party = await prisma.party.create({
      data: {
        tenantId: input.tenantId ?? DEFAULT_TENANT,
        partyType: input.partyType,
        displayName: input.displayName,
        firstName: input.firstName,
        lastName: input.lastName,
        legalName: input.legalName,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        isVip: input.isVip ?? false,
      },
    });
    return party;
  }

  async update(id: string, input: UpdatePartyInput): Promise<Party> {
    return prisma.party.update({
      where: { id },
      data: {
        partyType: input.partyType,
        displayName: input.displayName,
        firstName: input.firstName,
        lastName: input.lastName,
        legalName: input.legalName,
        documentType: input.documentType,
        documentNumber: input.documentNumber,
        isVip: input.isVip,
        isBlacklisted: input.isBlacklisted,
      },
    });
  }

  async getById(id: string): Promise<Party | null> {
    return prisma.party.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async list(tenantId?: string, limit?: number, offset?: number): Promise<PartyList> {
    const where = {
      tenantId: tenantId ?? DEFAULT_TENANT,
      deletedAt: null,
    };

    const take = limit ?? DEFAULT_LIMIT;
    const skip = offset ?? 0;

    const [items, total] = await prisma.$transaction([
      prisma.party.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.party.count({ where }),
    ]);

    return { items, total };
  }

  async remove(id: string): Promise<Party> {
    return prisma.party.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
