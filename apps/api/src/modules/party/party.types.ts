import { Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Party {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  partyType!: string;

  @Field()
  displayName!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  legalName?: string;

  @Field({ nullable: true })
  documentType?: string;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field()
  isVip!: boolean;

  @Field()
  isBlacklisted!: boolean;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class PartyList {
  @Field(() => [Party])
  items!: Party[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class CreatePartyInput {
  @Field({ nullable: true })
  tenantId?: string;

  @Field()
  partyType!: string;

  @Field()
  displayName!: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  legalName?: string;

  @Field({ nullable: true })
  documentType?: string;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field({ nullable: true })
  isVip?: boolean;
}

@InputType()
export class UpdatePartyInput {
  @Field({ nullable: true })
  partyType?: string;

  @Field({ nullable: true })
  displayName?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  legalName?: string;

  @Field({ nullable: true })
  documentType?: string;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field({ nullable: true })
  isVip?: boolean;

  @Field({ nullable: true })
  isBlacklisted?: boolean;
}
