import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AgentsService } from './agents.service';
import { AgentRun, AgentRunList, RunAgentInput } from './agents.types';

@Resolver(() => AgentRun)
export class AgentsResolver {
  constructor(private readonly agentsService: AgentsService) {}

  @Query(() => AgentRun, { nullable: true })
  agentRun(@Args('id') id: string) {
    return this.agentsService.getAgentRun(id);
  }

  @Query(() => AgentRunList)
  agentRuns(
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.agentsService.listAgentRuns(tenantId, limit, offset);
  }

  @Mutation(() => AgentRun)
  runAgent(@Args('input') input: RunAgentInput) {
    return this.agentsService.runAgent(input);
  }
}
