import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AnalyticsService } from './analytics.service';
import { AnalyticsEvent, AnalyticsEventList, TrackEventInput } from './analytics.types';

@Resolver(() => AnalyticsEvent)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => AnalyticsEvent, { nullable: true })
  analyticsEvent(@Args('id') id: string) {
    return this.analyticsService.getEvent(id);
  }

  @Query(() => AnalyticsEventList)
  analyticsEvents(
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.analyticsService.listEvents(tenantId, limit, offset);
  }

  @Mutation(() => AnalyticsEvent)
  trackEvent(@Args('input') input: TrackEventInput) {
    return this.analyticsService.trackEvent(input);
  }
}
