import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreatePartyInput, Party, PartyList, UpdatePartyInput } from './party.types';
import { PartyService } from './party.service';

@Resolver(() => Party)
export class PartyResolver {
  constructor(private readonly partyService: PartyService) {}

  @Query(() => Party, { nullable: true })
  party(@Args('id') id: string) {
    return this.partyService.getById(id);
  }

  @Query(() => PartyList)
  parties(
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.partyService.list(tenantId, limit, offset);
  }

  @Mutation(() => Party)
  createParty(@Args('input') input: CreatePartyInput) {
    return this.partyService.create(input);
  }

  @Mutation(() => Party)
  updateParty(@Args('id') id: string, @Args('input') input: UpdatePartyInput) {
    return this.partyService.update(id, input);
  }

  @Mutation(() => Party)
  removeParty(@Args('id') id: string) {
    return this.partyService.remove(id);
  }
}
