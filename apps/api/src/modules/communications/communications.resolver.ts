import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  Message,
  MessageList,
  SendMessageInput,
  UpdateMessageStatusInput,
} from './communications.types';
import { CommunicationsService } from './communications.service';

@Resolver(() => Message)
export class CommunicationsResolver {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Query(() => Message, { nullable: true })
  message(@Args('id') id: string) {
    return this.communicationsService.getMessage(id);
  }

  @Query(() => MessageList)
  messages(
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.communicationsService.listMessages(tenantId, limit, offset);
  }

  @Mutation(() => Message)
  sendMessage(@Args('input') input: SendMessageInput) {
    return this.communicationsService.sendMessage(input);
  }

  @Mutation(() => Message)
  updateMessageStatus(@Args('id') id: string, @Args('input') input: UpdateMessageStatusInput) {
    return this.communicationsService.updateMessageStatus(id, input);
  }
}
