import { Injectable } from '@nestjs/common';
import { prisma } from '@ai-core/database';

import { AgentRun, AgentRunList, RunAgentInput } from './agents.types';

const DEFAULT_TENANT = process.env.TENANT_ID ?? 'default';
const DEFAULT_LIMIT = 25;

@Injectable()
export class AgentsService {
  async runAgent(input: RunAgentInput): Promise<AgentRun> {
    const output = `Processed by ${input.agentName}`;
    return prisma.agentRun.create({
      data: {
        tenantId: input.tenantId ?? DEFAULT_TENANT,
        agentName: input.agentName,
        status: 'COMPLETED',
        input: input.input,
        output,
      },
    });
  }

  async getAgentRun(id: string): Promise<AgentRun | null> {
    return prisma.agentRun.findUnique({ where: { id } });
  }

  async listAgentRuns(
    tenantId?: string,
    limit?: number,
    offset?: number
  ): Promise<AgentRunList> {
    const where = { tenantId: tenantId ?? DEFAULT_TENANT };
    const take = limit ?? DEFAULT_LIMIT;
    const skip = offset ?? 0;

    const [items, total] = await prisma.$transaction([
      prisma.agentRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.agentRun.count({ where }),
    ]);

    return { items, total };
  }
}
