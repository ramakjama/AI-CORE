import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
  Claim,
  ClaimList,
  CreateClaimInput,
  CreatePolicyInput,
  Policy,
  PolicyList,
  UpdateClaimInput,
  UpdatePolicyInput,
} from './insurance.types';
import { InsuranceService } from './insurance.service';

@Resolver(() => Policy)
export class InsuranceResolver {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Query(() => Policy, { nullable: true })
  policy(@Args('id') id: string) {
    return this.insuranceService.getPolicy(id);
  }

  @Query(() => PolicyList)
  policies(
    @Args('tenantId', { nullable: true }) tenantId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.insuranceService.listPolicies(tenantId, limit, offset);
  }

  @Mutation(() => Policy)
  createPolicy(@Args('input') input: CreatePolicyInput) {
    return this.insuranceService.createPolicy(input);
  }

  @Mutation(() => Policy)
  updatePolicy(@Args('id') id: string, @Args('input') input: UpdatePolicyInput) {
    return this.insuranceService.updatePolicy(id, input);
  }

  @Query(() => Claim, { nullable: true })
  claim(@Args('id') id: string) {
    return this.insuranceService.getClaim(id);
  }

  @Query(() => ClaimList)
  claims(
    @Args('policyId', { nullable: true }) policyId?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number
  ) {
    return this.insuranceService.listClaims(policyId, limit, offset);
  }

  @Mutation(() => Claim)
  createClaim(@Args('input') input: CreateClaimInput) {
    return this.insuranceService.createClaim(input);
  }

  @Mutation(() => Claim)
  updateClaim(@Args('id') id: string, @Args('input') input: UpdateClaimInput) {
    return this.insuranceService.updateClaim(id, input);
  }

  @Mutation(() => Claim)
  removeClaim(@Args('id') id: string) {
    return this.insuranceService.removeClaim(id);
  }
}
