import { Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AgentRun {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  agentName!: string;

  @Field()
  status!: string;

  @Field()
  input!: string;

  @Field({ nullable: true })
  output?: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class AgentRunList {
  @Field(() => [AgentRun])
  items!: AgentRun[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class RunAgentInput {
  @Field({ nullable: true })
  tenantId?: string;

  @Field()
  agentName!: string;

  @Field()
  input!: string;
}
