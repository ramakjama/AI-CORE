import { Field, GraphQLISODateTime, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field()
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  channel!: string;

  @Field()
  status!: string;

  @Field()
  to!: string;

  @Field()
  body!: string;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt!: Date;
}

@ObjectType()
export class MessageList {
  @Field(() => [Message])
  items!: Message[];

  @Field(() => Int)
  total!: number;
}

@InputType()
export class SendMessageInput {
  @Field({ nullable: true })
  tenantId?: string;

  @Field()
  channel!: string;

  @Field()
  to!: string;

  @Field()
  body!: string;
}

@InputType()
export class UpdateMessageStatusInput {
  @Field()
  status!: string;
}
