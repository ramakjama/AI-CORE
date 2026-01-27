import { Field, Float, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Policy {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field({ nullable: true })
  policyNumber?: string;

  @Field()
  status!: string;

  @Field()
  type!: string;

  @Field()
  holderName!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  premium?: number;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class Claim {
  @Field()
  id!: string;

  @Field({ nullable: true })
  policyId?: string;

  @Field()
  status!: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class PolicyList {
  @Field(() => [Policy])
  items!: Policy[];

  @Field(() => Int)
  total!: number;
}

@ObjectType()
export class ClaimList {
  @Field(() => [Claim])
  items!: Claim[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class CreatePolicyInput {
  @Field({ nullable: true })
  tenantId?: string;

  @Field({ nullable: true })
  policyNumber?: string;

  @Field({ nullable: true })
  status?: string;

  @Field()
  type!: string;

  @Field()
  holderName!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  premium?: number;
}

@InputType()
export class UpdatePolicyInput {
  @Field({ nullable: true })
  policyNumber?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  holderName?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startDate?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  premium?: number;
}

@InputType()
export class CreateClaimInput {
  @Field({ nullable: true })
  policyId?: string;

  @Field({ nullable: true })
  status?: string;

  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  amount?: number;
}

@InputType()
export class UpdateClaimInput {
  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  amount?: number;
}
