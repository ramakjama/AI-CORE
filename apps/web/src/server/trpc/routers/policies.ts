/**
 * SORIANO MEDIADORES - Insurance Policies Router
 * CRUD operations for insurance policies
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================
// SCHEMAS
// ============================================

const PolicyStatusSchema = z.enum([
  'DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED', 'RENEWED'
]);

const InsuranceBranchSchema = z.enum([
  'AUTO', 'HOME', 'LIFE', 'HEALTH', 'BUSINESS', 'LIABILITY',
  'ACCIDENT', 'TRAVEL', 'PET', 'CYBER', 'AGRICULTURAL',
  'TRANSPORT', 'CREDIT', 'LEGAL', 'FUNERAL', 'OTHER'
]);

const PaymentFrequencySchema = z.enum([
  'SINGLE', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'
]);

const PolicyCreateSchema = z.object({
  clientId: z.string(),
  insurerId: z.string(),
  productId: z.string().optional(),
  branch: InsuranceBranchSchema,
  type: z.string().optional(),
  holderName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  premium: z.number().positive(),
  premiumFrequency: PaymentFrequencySchema.default('ANNUAL'),
  netPremium: z.number().optional(),
  taxes: z.number().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  riskAddress: z.string().optional(),
  riskCity: z.string().optional(),
  riskPostalCode: z.string().optional(),
  riskDetails: z.record(z.any()).optional(),
  coverages: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    sumInsured: z.number().optional(),
    deductible: z.number().optional(),
  })).optional(),
  notes: z.string().optional(),
});

const PolicyUpdateSchema = PolicyCreateSchema.partial();

const PolicySearchSchema = z.object({
  query: z.string().optional(),
  clientId: z.string().optional(),
  insurerId: z.string().optional(),
  status: PolicyStatusSchema.optional(),
  branch: InsuranceBranchSchema.optional(),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  endDateFrom: z.date().optional(),
  endDateTo: z.date().optional(),
  premiumMin: z.number().optional(),
  premiumMax: z.number().optional(),
  expiringInDays: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// MOCK DATA
// ============================================

const mockPolicies = [
  {
    id: 'pol-001',
    policyNumber: 'SS-2024-00001',
    clientId: 'cli-001',
    clientName: 'Juan García López',
    insurerId: 'ins-mapfre',
    insurerName: 'MAPFRE',
    productId: 'prod-auto-001',
    productName: 'Auto Todo Riesgo',
    branch: 'AUTO' as const,
    type: 'Todo Riesgo',
    holderName: 'Juan García López',
    status: 'ACTIVE' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    premium: 485.50,
    premiumFrequency: 'ANNUAL' as const,
    netPremium: 401.24,
    taxes: 84.26,
    commissionRate: 18.5,
    commissionAmount: 74.23,
    riskAddress: 'Madrid',
    riskDetails: {
      vehicleBrand: 'Seat',
      vehicleModel: 'León',
      vehicleYear: 2021,
      licensePlate: '1234ABC',
    },
    coverages: [
      { name: 'Responsabilidad Civil', sumInsured: 50000000 },
      { name: 'Daños Propios', sumInsured: 25000 },
      { name: 'Robo', sumInsured: 25000 },
      { name: 'Asistencia en Viaje', sumInsured: null },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'pol-002',
    policyNumber: 'SS-2024-00002',
    clientId: 'cli-001',
    clientName: 'Juan García López',
    insurerId: 'ins-allianz',
    insurerName: 'Allianz',
    productId: 'prod-home-001',
    productName: 'Hogar Confort',
    branch: 'HOME' as const,
    type: 'Hogar Multirriesgo',
    holderName: 'Juan García López',
    status: 'ACTIVE' as const,
    startDate: new Date('2023-06-15'),
    endDate: new Date('2024-06-15'),
    premium: 320.00,
    premiumFrequency: 'ANNUAL' as const,
    netPremium: 264.46,
    taxes: 55.54,
    commissionRate: 22.0,
    commissionAmount: 58.18,
    riskAddress: 'Calle Mayor 123, 28001 Madrid',
    riskCity: 'Madrid',
    riskPostalCode: '28001',
    riskDetails: {
      propertyType: 'Piso',
      squareMeters: 95,
      yearBuilt: 1990,
      numberOfRooms: 3,
    },
    coverages: [
      { name: 'Continente', sumInsured: 150000 },
      { name: 'Contenido', sumInsured: 45000 },
      { name: 'Responsabilidad Civil', sumInsured: 300000 },
      { name: 'Asistencia Hogar', sumInsured: null },
    ],
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'pol-003',
    policyNumber: 'SS-2024-00003',
    clientId: 'cli-002',
    clientName: 'Construcciones García S.L.',
    insurerId: 'ins-axa',
    insurerName: 'AXA',
    productId: 'prod-rc-001',
    productName: 'RC Profesional',
    branch: 'LIABILITY' as const,
    type: 'RC Profesional Construcción',
    holderName: 'Construcciones García S.L.',
    status: 'ACTIVE' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-01-01'),
    premium: 2850.00,
    premiumFrequency: 'ANNUAL' as const,
    netPremium: 2355.37,
    taxes: 494.63,
    commissionRate: 15.0,
    commissionAmount: 353.31,
    riskAddress: 'Polígono Industrial Norte 45, Alcobendas',
    riskDetails: {
      activity: 'Construcción de edificios residenciales',
      employees: 25,
      annualRevenue: 2500000,
    },
    coverages: [
      { name: 'RC Profesional', sumInsured: 600000 },
      { name: 'RC Explotación', sumInsured: 300000 },
      { name: 'Defensa Jurídica', sumInsured: 30000 },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// ============================================
// ROUTER
// ============================================

export const policiesRouter = router({
  // List policies with pagination and filtering
  list: protectedProcedure
    .input(PolicySearchSchema)
    .query(async ({ input, ctx }) => {
      let filtered = [...mockPolicies];

      // Apply filters
      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(
          p =>
            p.policyNumber.toLowerCase().includes(q) ||
            p.clientName.toLowerCase().includes(q) ||
            p.holderName.toLowerCase().includes(q) ||
            p.insurerName.toLowerCase().includes(q)
        );
      }
      if (input.clientId) {
        filtered = filtered.filter(p => p.clientId === input.clientId);
      }
      if (input.insurerId) {
        filtered = filtered.filter(p => p.insurerId === input.insurerId);
      }
      if (input.status) {
        filtered = filtered.filter(p => p.status === input.status);
      }
      if (input.branch) {
        filtered = filtered.filter(p => p.branch === input.branch);
      }
      if (input.expiringInDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + input.expiringInDays);
        filtered = filtered.filter(p => p.endDate <= cutoff && p.endDate >= new Date());
      }

      // Pagination
      const total = filtered.length;
      const start = (input.page - 1) * input.limit;
      const items = filtered.slice(start, start + input.limit);

      return {
        items,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // Get single policy by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const policy = mockPolicies.find(p => p.id === input.id);
      if (!policy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }
      return policy;
    }),

  // Get policy by number
  getByNumber: protectedProcedure
    .input(z.object({ policyNumber: z.string() }))
    .query(async ({ input }) => {
      const policy = mockPolicies.find(
        p => p.policyNumber.toLowerCase() === input.policyNumber.toLowerCase()
      );
      if (!policy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }
      return policy;
    }),

  // Create new policy
  create: protectedProcedure
    .input(PolicyCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const newPolicy = {
        id: `pol-${Date.now()}`,
        policyNumber: `SS-${new Date().getFullYear()}-${String(mockPolicies.length + 1).padStart(5, '0')}`,
        ...input,
        clientName: 'Cliente', // TODO: Get from client
        insurerName: 'Aseguradora', // TODO: Get from insurer
        productName: 'Producto', // TODO: Get from product
        status: 'PENDING' as const,
        commissionAmount: input.commissionRate ? (input.netPremium || input.premium) * (input.commissionRate / 100) : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPolicies.push(newPolicy);
      return newPolicy;
    }),

  // Update policy
  update: protectedProcedure
    .input(z.object({ id: z.string(), data: PolicyUpdateSchema }))
    .mutation(async ({ input }) => {
      const index = mockPolicies.findIndex(p => p.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }

      mockPolicies[index] = {
        ...mockPolicies[index],
        ...input.data,
        updatedAt: new Date(),
      };

      return mockPolicies[index];
    }),

  // Change policy status
  changeStatus: managerProcedure
    .input(z.object({
      id: z.string(),
      status: PolicyStatusSchema,
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const policy = mockPolicies.find(p => p.id === input.id);
      if (!policy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }

      policy.status = input.status;
      policy.updatedAt = new Date();

      return policy;
    }),

  // Cancel policy
  cancel: managerProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
      effectiveDate: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const policy = mockPolicies.find(p => p.id === input.id);
      if (!policy) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }

      policy.status = 'CANCELLED';
      policy.updatedAt = new Date();

      return policy;
    }),

  // Renew policy
  renew: protectedProcedure
    .input(z.object({
      id: z.string(),
      newPremium: z.number().positive().optional(),
      newEndDate: z.date(),
    }))
    .mutation(async ({ input }) => {
      const original = mockPolicies.find(p => p.id === input.id);
      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Póliza no encontrada' });
      }

      // Create new policy as renewal
      const renewed = {
        ...original,
        id: `pol-${Date.now()}`,
        policyNumber: `SS-${new Date().getFullYear()}-${String(mockPolicies.length + 1).padStart(5, '0')}`,
        startDate: original.endDate,
        endDate: input.newEndDate,
        premium: input.newPremium || original.premium,
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mark original as renewed
      original.status = 'RENEWED';
      original.updatedAt = new Date();

      mockPolicies.push(renewed);

      return renewed;
    }),

  // Get policy statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = mockPolicies.length;
    const active = mockPolicies.filter(p => p.status === 'ACTIVE').length;
    const pending = mockPolicies.filter(p => p.status === 'PENDING').length;
    const expiringThisMonth = mockPolicies.filter(p => {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return p.endDate >= now && p.endDate <= endOfMonth;
    }).length;

    const totalPremium = mockPolicies
      .filter(p => p.status === 'ACTIVE')
      .reduce((acc, p) => acc + p.premium, 0);

    const totalCommission = mockPolicies
      .filter(p => p.status === 'ACTIVE')
      .reduce((acc, p) => acc + (p.commissionAmount || 0), 0);

    const byBranch = mockPolicies.reduce((acc, p) => {
      acc[p.branch] = (acc[p.branch] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      pending,
      expired: mockPolicies.filter(p => p.status === 'EXPIRED').length,
      cancelled: mockPolicies.filter(p => p.status === 'CANCELLED').length,
      expiringThisMonth,
      totalPremium,
      totalCommission,
      avgPremium: totalPremium / active,
      byBranch,
    };
  }),

  // Get policies expiring soon
  getExpiringPolicies: protectedProcedure
    .input(z.object({ days: z.number().default(30), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + input.days);

      return mockPolicies
        .filter(p => p.status === 'ACTIVE' && p.endDate >= now && p.endDate <= cutoff)
        .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
        .slice(0, input.limit);
    }),

  // Get client's policies
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      return mockPolicies.filter(p => p.clientId === input.clientId);
    }),

  // Calculate quote
  calculateQuote: protectedProcedure
    .input(z.object({
      branch: InsuranceBranchSchema,
      insurerId: z.string().optional(),
      riskDetails: z.record(z.any()),
      coverages: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement actual quote calculation with rating APIs
      return {
        quoteId: `QUO-${Date.now()}`,
        branch: input.branch,
        estimatedPremium: Math.random() * 500 + 200,
        coveragesIncluded: input.coverages || [],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }),

  // Import policies from CSV
  import: adminProcedure
    .input(z.object({
      data: z.array(PolicyCreateSchema),
      options: z.object({
        skipDuplicates: z.boolean().default(true),
      }),
    }))
    .mutation(async ({ input }) => {
      return {
        imported: input.data.length,
        skipped: 0,
        errors: [],
      };
    }),
});

export type PoliciesRouter = typeof policiesRouter;
