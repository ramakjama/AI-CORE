import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { AuthPayload, AuthUser } from './auth.types';

@Resolver(() => AuthUser)
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthUser)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('firstName') firstName: string,
    @Args('lastName') lastName: string,
    @Args('tenantId', { nullable: true }) tenantId?: string,
  ) {
    return this.authService.register(email, password, firstName, lastName, tenantId);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(@Args('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Query(() => AuthUser, { nullable: true })
  async me(@Context() context: { req?: { headers?: Record<string, string> } }) {
    const authHeader = context?.req?.headers?.authorization ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';
    if (!token) return null;

    const payload = await this.authService.validateToken(token);
    if (!payload?.sub) return null;
    return this.authService.getUserById(payload.sub);
  }
}
