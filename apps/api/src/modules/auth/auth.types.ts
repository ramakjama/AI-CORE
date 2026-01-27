import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  firstName!: string;

  @Field()
  lastName!: string;

  @Field()
  status!: string;

  @Field()
  tenantId!: string;

  @Field(() => [String])
  roles!: string[];

  @Field(() => [String])
  permissions!: string[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastLoginAt?: Date;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class AuthPayload {
  @Field(() => AuthUser)
  user!: AuthUser;

  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => Int)
  expiresIn!: number;
}
