import { Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AnalyticsEvent {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  eventType!: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  payload?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class AnalyticsEventList {
  @Field(() => [AnalyticsEvent])
  items!: AnalyticsEvent[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class TrackEventInput {
  @Field({ nullable: true })
  tenantId?: string;

  @Field()
  eventType!: string;

  @Field({ nullable: true })
  source?: string;

  @Field({ nullable: true })
  payload?: string;
}
