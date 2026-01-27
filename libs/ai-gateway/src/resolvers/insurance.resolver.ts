/**
 * Insurance Resolver
 * GraphQL resolvers for Policy, Claim, Quote, and Receipt operations
 */

import {
  GraphQLContext,
  AuthenticatedContext,
  Policy,
  Claim,
  Quote,
  Receipt,
  PolicyStatus,
  ClaimStatus,
  Role,
  Paginated,
  PaginationInput,
  Money,
} from '../types';
import { requireAuth, checkPermission, hasRole, canAccessResource } from '../middleware/auth.middleware';
import { getOrSet } from '../middleware/cache.middleware';

// ============================================================================
// Types for Resolver Arguments
// ============================================================================

interface PolicyArgs {
  id: string;
}

interface PolicyByNumberArgs {
  number: string;
}

interface MyPoliciesArgs {
  status?: PolicyStatus[];
  pagination?: PaginationInput;
}

interface SearchPoliciesArgs {
  query: string;
  filter?: {
    productCodes?: string[];
    statuses?: PolicyStatus[];
    holderId?: string;
    effectiveDate?: { from?: Date; to?: Date };
    expirationDate?: { from?: Date; to?: Date };
    hasClaims?: boolean;
  };
  pagination?: PaginationInput;
}

interface ClaimArgs {
  id: string;
}

interface ClaimByNumberArgs {
  number: string;
}

interface MyClaimsArgs {
  status?: ClaimStatus[];
  pagination?: PaginationInput;
}

interface SearchClaimsArgs {
  query: string;
  filter?: {
    statuses?: ClaimStatus[];
    lossTypes?: string[];
    policyId?: string;
    claimantId?: string;
    lossDate?: { from?: Date; to?: Date };
    reportedDate?: { from?: Date; to?: Date };
    adjusterId?: string;
  };
  pagination?: PaginationInput;
}

interface QuoteInput {
  productCode: string;
  holderId?: string;
  holderData?: Record<string, unknown>;
  coverages: Array<{
    code: string;
    limit?: { amount: number; currency: string };
    deductible?: { amount: number; currency: string };
  }>;
  effectiveDate: Date;
  riskInfo?: {
    address?: Record<string, unknown>;
    details: Record<string, unknown>;
  };
  discountCodes?: string[];
}

interface CreateQuoteArgs {
  input: QuoteInput;
}

interface UpdateQuoteArgs {
  id: string;
  input: Partial<QuoteInput>;
}

interface ConvertQuoteArgs {
  quoteId: string;
  paymentMethod: {
    type: string;
    cardToken?: string;
    bankAccount?: string;
    saveForFuture?: boolean;
  };
}

interface ClaimInput {
  policyId: string;
  lossDate: Date;
  lossType: string;
  description: string;
  lossLocation?: Record<string, unknown>;
  estimatedAmount?: { amount: number; currency: string };
  documents?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
  thirdParties?: Array<{
    name: string;
    role: string;
    contact?: string;
    insuranceCompany?: string;
    policyNumber?: string;
  }>;
}

interface SubmitClaimArgs {
  input: ClaimInput;
}

interface UpdateClaimArgs {
  id: string;
  input: Partial<ClaimInput>;
}

interface UploadDocumentArgs {
  claimId: string;
  file: unknown; // Upload type
  documentType: string;
}

interface AddClaimNoteArgs {
  claimId: string;
  content: string;
  isInternal?: boolean;
}

interface ApproveClaimArgs {
  id: string;
  approvedAmount: { amount: number; currency: string };
  notes?: string;
}

interface RejectClaimArgs {
  id: string;
  reason: string;
  code: string;
}

interface ProcessPaymentArgs {
  claimId: string;
  payment: {
    amount: { amount: number; currency: string };
    method: string;
    reference?: string;
    payee: {
      name: string;
      bankAccount?: string;
      iban?: string;
    };
  };
}

interface RenewPolicyArgs {
  policyId: string;
  options?: {
    coverages?: Array<{
      code: string;
      limit?: { amount: number; currency: string };
      deductible?: { amount: number; currency: string };
    }>;
    effectiveDate?: Date;
    discountCodes?: string[];
  };
}

interface CancelPolicyArgs {
  policyId: string;
  reason: string;
  effectiveDate: Date;
}

interface ModifyCoveragesArgs {
  policyId: string;
  modifications: {
    add?: Array<{
      code: string;
      limit?: { amount: number; currency: string };
      deductible?: { amount: number; currency: string };
    }>;
    remove?: string[];
    modify?: Array<{
      code: string;
      limit?: { amount: number; currency: string };
      deductible?: { amount: number; currency: string };
    }>;
    effectiveDate: Date;
  };
}

interface PayReceiptArgs {
  receiptId: string;
  paymentMethod: {
    type: string;
    cardToken?: string;
    bankAccount?: string;
    saveForFuture?: boolean;
  };
}

// ============================================================================
// Mock Data Services (replace with actual service calls)
// ============================================================================

class PolicyService {
  static async findById(id: string): Promise<Policy | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async findByNumber(number: string): Promise<Policy | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async findByHolder(
    holderId: string,
    status?: PolicyStatus[],
    pagination?: PaginationInput
  ): Promise<Paginated<Policy>> {
    // TODO: Implement actual service call
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      hasNext: false,
      hasPrevious: false,
    };
  }

  static async search(
    query: string,
    filter: SearchPoliciesArgs['filter'],
    pagination?: PaginationInput
  ): Promise<Paginated<Policy>> {
    // TODO: Implement actual service call
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      hasNext: false,
      hasPrevious: false,
    };
  }

  static async renew(policyId: string, options?: RenewPolicyArgs['options']): Promise<Policy> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async cancel(policyId: string, reason: string, effectiveDate: Date): Promise<Policy> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async modifyCoverages(
    policyId: string,
    modifications: ModifyCoveragesArgs['modifications']
  ): Promise<Policy> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

class ClaimService {
  static async findById(id: string): Promise<Claim | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async findByNumber(number: string): Promise<Claim | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async findByClaimant(
    claimantId: string,
    status?: ClaimStatus[],
    pagination?: PaginationInput
  ): Promise<Paginated<Claim>> {
    // TODO: Implement actual service call
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      hasNext: false,
      hasPrevious: false,
    };
  }

  static async search(
    query: string,
    filter: SearchClaimsArgs['filter'],
    pagination?: PaginationInput
  ): Promise<Paginated<Claim>> {
    // TODO: Implement actual service call
    return {
      items: [],
      total: 0,
      page: pagination?.page || 1,
      pageSize: pagination?.pageSize || 20,
      hasNext: false,
      hasPrevious: false,
    };
  }

  static async submit(input: ClaimInput): Promise<Claim> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async update(id: string, input: Partial<ClaimInput>): Promise<Claim> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async approve(
    id: string,
    approvedAmount: Money,
    notes?: string
  ): Promise<Claim> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async reject(id: string, reason: string, code: string): Promise<Claim> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async addNote(
    claimId: string,
    content: string,
    authorId: string,
    isInternal: boolean
  ): Promise<Claim> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async uploadDocument(
    claimId: string,
    file: unknown,
    documentType: string,
    uploadedBy: string
  ): Promise<{ id: string; name: string; url: string }> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

class QuoteService {
  static async findById(id: string): Promise<Quote | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async create(input: QuoteInput): Promise<Quote> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async update(id: string, input: Partial<QuoteInput>): Promise<Quote> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async convertToPolicy(
    quoteId: string,
    paymentMethod: ConvertQuoteArgs['paymentMethod']
  ): Promise<Policy> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }

  static async calculatePremium(input: QuoteInput): Promise<{
    premium: Money;
    breakdown: Record<string, unknown>;
    riskFactors: Array<{ name: string; value: string; impact: number }>;
    discountsApplied: Array<{ code: string; name: string; amount: Money }>;
    isIndicative: boolean;
    validForMinutes: number;
  }> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

class ProductService {
  static async list(type?: string, activeOnly: boolean = true): Promise<unknown[]> {
    // TODO: Implement actual service call
    return [];
  }

  static async findByCode(code: string): Promise<unknown | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async recommendCoverages(
    productCode: string,
    riskProfile: Record<string, unknown>
  ): Promise<unknown[]> {
    // TODO: Implement actual service call
    return [];
  }
}

class ReceiptService {
  static async findById(id: string): Promise<Receipt | null> {
    // TODO: Implement actual service call
    return null;
  }

  static async findPending(
    policyId?: string,
    dueDate?: { from?: Date; to?: Date }
  ): Promise<Receipt[]> {
    // TODO: Implement actual service call
    return [];
  }

  static async pay(
    receiptId: string,
    paymentMethod: PayReceiptArgs['paymentMethod']
  ): Promise<{
    success: boolean;
    transactionId?: string;
    status: string;
    receipt?: Receipt;
    error?: string;
  }> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

class PaymentService {
  static async processClaimPayment(
    claimId: string,
    payment: ProcessPaymentArgs['payment']
  ): Promise<{
    success: boolean;
    transactionId?: string;
    status: string;
    error?: string;
  }> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

class DocumentService {
  static async generatePolicyDocument(
    policyId: string,
    type: string
  ): Promise<{
    success: boolean;
    document?: { id: string; name: string; url: string };
    error?: string;
  }> {
    // TODO: Implement actual service call
    throw new Error('Not implemented');
  }
}

// ============================================================================
// Query Resolvers
// ============================================================================

export const insuranceQueryResolvers = {
  policy: async (
    _parent: unknown,
    args: PolicyArgs,
    context: GraphQLContext
  ): Promise<Policy | null> => {
    return context.dataloaders.policy.load(args.id);
  },

  policyByNumber: async (
    _parent: unknown,
    args: PolicyByNumberArgs,
    context: GraphQLContext
  ): Promise<Policy | null> => {
    return getOrSet(
      `policy:number:${args.number}`,
      () => PolicyService.findByNumber(args.number),
      60
    );
  },

  myPolicies: async (
    _parent: unknown,
    args: MyPoliciesArgs,
    context: GraphQLContext
  ): Promise<Paginated<Policy>> => {
    const authContext = await requireAuth(context);

    if (!authContext.user.partyId) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasNext: false,
        hasPrevious: false,
      };
    }

    return PolicyService.findByHolder(
      authContext.user.partyId,
      args.status,
      args.pagination
    );
  },

  searchPolicies: async (
    _parent: unknown,
    args: SearchPoliciesArgs,
    context: GraphQLContext
  ): Promise<Paginated<Policy>> => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.AGENT);

    return PolicyService.search(args.query, args.filter, args.pagination);
  },

  claim: async (
    _parent: unknown,
    args: ClaimArgs,
    context: GraphQLContext
  ): Promise<Claim | null> => {
    await requireAuth(context);
    return context.dataloaders.claim.load(args.id);
  },

  claimByNumber: async (
    _parent: unknown,
    args: ClaimByNumberArgs,
    context: GraphQLContext
  ): Promise<Claim | null> => {
    await requireAuth(context);
    return ClaimService.findByNumber(args.number);
  },

  myClaims: async (
    _parent: unknown,
    args: MyClaimsArgs,
    context: GraphQLContext
  ): Promise<Paginated<Claim>> => {
    const authContext = await requireAuth(context);

    if (!authContext.user.partyId) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasNext: false,
        hasPrevious: false,
      };
    }

    return ClaimService.findByClaimant(
      authContext.user.partyId,
      args.status,
      args.pagination
    );
  },

  searchClaims: async (
    _parent: unknown,
    args: SearchClaimsArgs,
    context: GraphQLContext
  ): Promise<Paginated<Claim>> => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.AGENT);

    return ClaimService.search(args.query, args.filter, args.pagination);
  },

  quote: async (
    _parent: unknown,
    args: { id: string },
    _context: GraphQLContext
  ): Promise<Quote | null> => {
    return QuoteService.findById(args.id);
  },

  products: async (
    _parent: unknown,
    args: { type?: string; activeOnly?: boolean },
    _context: GraphQLContext
  ): Promise<unknown[]> => {
    return getOrSet(
      `products:${args.type || 'all'}:${args.activeOnly}`,
      () => ProductService.list(args.type, args.activeOnly ?? true),
      3600 // 1 hour cache
    );
  },

  product: async (
    _parent: unknown,
    args: { code: string },
    _context: GraphQLContext
  ): Promise<unknown | null> => {
    return getOrSet(
      `product:${args.code}`,
      () => ProductService.findByCode(args.code),
      3600
    );
  },

  receipt: async (
    _parent: unknown,
    args: { id: string },
    context: GraphQLContext
  ): Promise<Receipt | null> => {
    await requireAuth(context);
    return ReceiptService.findById(args.id);
  },

  pendingReceipts: async (
    _parent: unknown,
    args: { policyId?: string; dueDate?: { from?: Date; to?: Date } },
    context: GraphQLContext
  ): Promise<Receipt[]> => {
    await requireAuth(context);
    return ReceiptService.findPending(args.policyId, args.dueDate);
  },

  calculatePremium: async (
    _parent: unknown,
    args: { input: QuoteInput },
    _context: GraphQLContext
  ) => {
    return QuoteService.calculatePremium(args.input);
  },

  recommendCoverages: async (
    _parent: unknown,
    args: { productCode: string; riskProfile: Record<string, unknown> },
    _context: GraphQLContext
  ) => {
    return getOrSet(
      `coverages:recommend:${args.productCode}:${JSON.stringify(args.riskProfile)}`,
      () => ProductService.recommendCoverages(args.productCode, args.riskProfile),
      1800 // 30 minutes cache
    );
  },
};

// ============================================================================
// Mutation Resolvers
// ============================================================================

export const insuranceMutationResolvers = {
  createQuote: async (
    _parent: unknown,
    args: CreateQuoteArgs,
    _context: GraphQLContext
  ) => {
    try {
      const quote = await QuoteService.create(args.input);
      return {
        success: true,
        quote,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        quote: null,
        errors: [
          {
            code: 'QUOTE_CREATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  updateQuote: async (
    _parent: unknown,
    args: UpdateQuoteArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const quote = await QuoteService.update(args.id, args.input);
      return {
        success: true,
        quote,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        quote: null,
        errors: [
          {
            code: 'QUOTE_UPDATE_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  convertQuoteToPoliciy: async (
    _parent: unknown,
    args: ConvertQuoteArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const policy = await QuoteService.convertToPolicy(args.quoteId, args.paymentMethod);
      return {
        success: true,
        policy,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        policy: null,
        errors: [
          {
            code: 'CONVERSION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  submitClaim: async (
    _parent: unknown,
    args: SubmitClaimArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const claim = await ClaimService.submit(args.input);
      return {
        success: true,
        claim,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        claim: null,
        errors: [
          {
            code: 'CLAIM_SUBMISSION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  updateClaim: async (
    _parent: unknown,
    args: UpdateClaimArgs,
    context: GraphQLContext
  ) => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.AGENT);

    try {
      const claim = await ClaimService.update(args.id, args.input);
      context.dataloaders.claim.clear(args.id);
      return {
        success: true,
        claim,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        claim: null,
        errors: [
          {
            code: 'CLAIM_UPDATE_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  uploadClaimDocument: async (
    _parent: unknown,
    args: UploadDocumentArgs,
    context: GraphQLContext
  ) => {
    const authContext = await requireAuth(context);

    try {
      const document = await ClaimService.uploadDocument(
        args.claimId,
        args.file,
        args.documentType,
        authContext.user.id
      );
      return {
        success: true,
        document,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        document: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  addClaimNote: async (
    _parent: unknown,
    args: AddClaimNoteArgs,
    context: GraphQLContext
  ): Promise<Claim> => {
    const authContext = await requireAuth(context);

    return ClaimService.addNote(
      args.claimId,
      args.content,
      authContext.user.id,
      args.isInternal ?? false
    );
  },

  approveClaim: async (
    _parent: unknown,
    args: ApproveClaimArgs,
    context: GraphQLContext
  ) => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.MANAGER);

    try {
      const claim = await ClaimService.approve(
        args.id,
        {
          amount: args.approvedAmount.amount,
          currency: args.approvedAmount.currency,
        },
        args.notes
      );
      context.dataloaders.claim.clear(args.id);
      return {
        success: true,
        claim,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        claim: null,
        errors: [
          {
            code: 'APPROVAL_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  rejectClaim: async (
    _parent: unknown,
    args: RejectClaimArgs,
    context: GraphQLContext
  ) => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.MANAGER);

    try {
      const claim = await ClaimService.reject(args.id, args.reason, args.code);
      context.dataloaders.claim.clear(args.id);
      return {
        success: true,
        claim,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        claim: null,
        errors: [
          {
            code: 'REJECTION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  processClaimPayment: async (
    _parent: unknown,
    args: ProcessPaymentArgs,
    context: GraphQLContext
  ) => {
    const authContext = await requireAuth(context);
    checkPermission(authContext.user, Role.MANAGER);

    try {
      const result = await PaymentService.processClaimPayment(args.claimId, args.payment);
      return result;
    } catch (error) {
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        receipt: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  renewPolicy: async (
    _parent: unknown,
    args: RenewPolicyArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const policy = await PolicyService.renew(args.policyId, args.options);
      context.dataloaders.policy.clear(args.policyId);
      return {
        success: true,
        policy,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        policy: null,
        errors: [
          {
            code: 'RENEWAL_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  cancelPolicy: async (
    _parent: unknown,
    args: CancelPolicyArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const policy = await PolicyService.cancel(args.policyId, args.reason, args.effectiveDate);
      context.dataloaders.policy.clear(args.policyId);
      return {
        success: true,
        policy,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        policy: null,
        errors: [
          {
            code: 'CANCELLATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  modifyPolicyCoverages: async (
    _parent: unknown,
    args: ModifyCoveragesArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      const policy = await PolicyService.modifyCoverages(args.policyId, args.modifications);
      context.dataloaders.policy.clear(args.policyId);
      return {
        success: true,
        policy,
        errors: null,
        warnings: null,
      };
    } catch (error) {
      return {
        success: false,
        policy: null,
        errors: [
          {
            code: 'MODIFICATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            path: null,
            details: null,
          },
        ],
        warnings: null,
      };
    }
  },

  payReceipt: async (
    _parent: unknown,
    args: PayReceiptArgs,
    context: GraphQLContext
  ) => {
    await requireAuth(context);

    try {
      return await ReceiptService.pay(args.receiptId, args.paymentMethod);
    } catch (error) {
      return {
        success: false,
        transactionId: null,
        status: 'FAILED',
        receipt: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  generatePolicyDocument: async (
    _parent: unknown,
    args: { policyId: string; type: string },
    context: GraphQLContext
  ) => {
    await requireAuth(context);
    return DocumentService.generatePolicyDocument(args.policyId, args.type);
  },
};

// ============================================================================
// Type Resolvers (for federated types)
// ============================================================================

export const insuranceTypeResolvers = {
  Policy: {
    __resolveReference: async (
      reference: { id: string },
      context: GraphQLContext
    ): Promise<Policy | null> => {
      return context.dataloaders.policy.load(reference.id);
    },

    holder: async (policy: Policy, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.party.load(policy.holderId);
    },

    product: async (policy: Policy) => {
      return ProductService.findByCode(policy.productCode);
    },

    claims: async (policy: Policy, _args: unknown, _context: GraphQLContext) => {
      const result = await ClaimService.search('', { policyId: policy.id });
      return result.items;
    },

    premiumBreakdown: (policy: Policy) => {
      // Compute premium breakdown
      return {
        basePremium: policy.premium,
        taxes: { amount: 0, currency: policy.premium.currency },
        fees: { amount: 0, currency: policy.premium.currency },
        discounts: { amount: 0, currency: policy.premium.currency },
        surcharges: { amount: 0, currency: policy.premium.currency },
        total: policy.premium,
        lineItems: [],
      };
    },
  },

  Claim: {
    __resolveReference: async (
      reference: { id: string },
      context: GraphQLContext
    ): Promise<Claim | null> => {
      return context.dataloaders.claim.load(reference.id);
    },

    policy: async (claim: Claim, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.policy.load(claim.policyId);
    },

    claimant: async (claim: Claim, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.party.load(claim.claimantId);
    },
  },

  Quote: {
    holder: async (quote: Quote, _args: unknown, context: GraphQLContext) => {
      const holderId = (quote as { holderId?: string }).holderId;
      if (holderId) {
        return context.dataloaders.party.load(holderId);
      }
      return quote.holder;
    },

    product: async (quote: Quote) => {
      return ProductService.findByCode(quote.productCode);
    },

    isExpired: (quote: Quote): boolean => {
      return new Date(quote.validUntil) < new Date();
    },
  },

  Receipt: {
    policy: async (receipt: Receipt, _args: unknown, context: GraphQLContext) => {
      return context.dataloaders.policy.load(receipt.policyId);
    },
  },

  Money: {
    formatted: (money: Money): string => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: money.currency,
      }).format(money.amount / 100); // Assuming amount is in cents
    },
  },
};

// ============================================================================
// Combined Resolvers Export
// ============================================================================

export const insuranceResolvers = {
  Query: insuranceQueryResolvers,
  Mutation: insuranceMutationResolvers,
  ...insuranceTypeResolvers,
};

export default insuranceResolvers;
