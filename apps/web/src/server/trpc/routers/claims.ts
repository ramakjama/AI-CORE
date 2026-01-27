/**
 * SORIANO MEDIADORES - Claims Router
 * CRUD operations for insurance claims/siniestros
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================
// SCHEMAS
// ============================================

const ClaimStatusSchema = z.enum([
  'OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'PENDING_EXPERT',
  'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID', 'CLOSED', 'REOPENED'
]);

const ClaimCreateSchema = z.object({
  policyId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  claimType: z.string().optional(),
  occurrenceDate: z.date(),
  claimedAmount: z.number().optional(),
  incidentAddress: z.string().optional(),
  incidentCity: z.string().optional(),
  thirdPartyInvolved: z.boolean().default(false),
  thirdPartyDetails: z.object({
    name: z.string().optional(),
    nif: z.string().optional(),
    insurerName: z.string().optional(),
    policyNumber: z.string().optional(),
  }).optional(),
});

const ClaimUpdateSchema = ClaimCreateSchema.partial();

const ClaimSearchSchema = z.object({
  query: z.string().optional(),
  policyId: z.string().optional(),
  clientId: z.string().optional(),
  status: ClaimStatusSchema.optional(),
  handlerId: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  hasExpert: z.boolean().optional(),
  fraudSuspected: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('occurrenceDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// MOCK DATA
// ============================================

const mockClaims = [
  {
    id: 'clm-001',
    claimNumber: 'SIN-2024-00001',
    policyId: 'pol-001',
    policyNumber: 'SS-2024-00001',
    clientId: 'cli-001',
    clientName: 'Juan García López',
    insurerName: 'MAPFRE',
    status: 'IN_PROGRESS' as const,
    title: 'Colisión en intersección',
    description: 'Colisión con otro vehículo en cruce con semáforo. Daños en parte frontal izquierda.',
    claimType: 'Accidente de tráfico',
    occurrenceDate: new Date('2024-01-10'),
    reportDate: new Date('2024-01-10'),
    claimedAmount: 3500.00,
    reserveAmount: 4000.00,
    paidAmount: 0,
    deductible: 150.00,
    handlerId: 'user-001',
    handlerName: 'María López',
    expertId: 'exp-001',
    expertName: 'Peritaciones Madrid S.L.',
    thirdPartyInvolved: true,
    thirdPartyDetails: {
      name: 'Pedro Martínez',
      insurerName: 'AXA',
      policyNumber: 'AXA-123456',
    },
    hasExpertReport: true,
    faultIndicator: 'NOT_AT_FAULT',
    faultPercentage: 0,
    incidentAddress: 'Calle Gran Vía, Madrid',
    incidentCity: 'Madrid',
    fraudSuspected: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'clm-002',
    claimNumber: 'SIN-2024-00002',
    policyId: 'pol-002',
    policyNumber: 'SS-2024-00002',
    clientId: 'cli-001',
    clientName: 'Juan García López',
    insurerName: 'Allianz',
    status: 'CLOSED' as const,
    title: 'Rotura de tubería',
    description: 'Rotura de tubería de agua en baño principal, daños por agua en suelo y muebles.',
    claimType: 'Daños por agua',
    occurrenceDate: new Date('2023-11-20'),
    reportDate: new Date('2023-11-20'),
    claimedAmount: 1800.00,
    reserveAmount: 1800.00,
    paidAmount: 1650.00,
    deductible: 150.00,
    handlerId: 'user-002',
    handlerName: 'Carlos Ruiz',
    thirdPartyInvolved: false,
    hasExpertReport: false,
    incidentAddress: 'Calle Mayor 123, 28001 Madrid',
    incidentCity: 'Madrid',
    fraudSuspected: false,
    closedDate: new Date('2023-12-15'),
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2023-12-15'),
  },
  {
    id: 'clm-003',
    claimNumber: 'SIN-2024-00003',
    policyId: 'pol-003',
    policyNumber: 'SS-2024-00003',
    clientId: 'cli-002',
    clientName: 'Construcciones García S.L.',
    insurerName: 'AXA',
    status: 'PENDING_DOCS' as const,
    title: 'Daños a terceros en obra',
    description: 'Daños causados a vehículo estacionado por caída de material de construcción.',
    claimType: 'RC Profesional',
    occurrenceDate: new Date('2024-01-18'),
    reportDate: new Date('2024-01-18'),
    claimedAmount: 8500.00,
    reserveAmount: 10000.00,
    paidAmount: 0,
    deductible: 300.00,
    handlerId: 'user-001',
    handlerName: 'María López',
    thirdPartyInvolved: true,
    thirdPartyDetails: {
      name: 'Ana Fernández',
      nif: '87654321B',
    },
    hasExpertReport: false,
    incidentAddress: 'Obra en C/ Serrano 45, Madrid',
    incidentCity: 'Madrid',
    fraudSuspected: false,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-20'),
  },
];

// ============================================
// ROUTER
// ============================================

export const claimsRouter = router({
  // List claims with pagination and filtering
  list: protectedProcedure
    .input(ClaimSearchSchema)
    .query(async ({ input, ctx }) => {
      let filtered = [...mockClaims];

      // Apply filters
      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(
          c =>
            c.claimNumber.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.clientName.toLowerCase().includes(q) ||
            c.policyNumber.toLowerCase().includes(q)
        );
      }
      if (input.policyId) {
        filtered = filtered.filter(c => c.policyId === input.policyId);
      }
      if (input.clientId) {
        filtered = filtered.filter(c => c.clientId === input.clientId);
      }
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }
      if (input.handlerId) {
        filtered = filtered.filter(c => c.handlerId === input.handlerId);
      }
      if (input.fraudSuspected !== undefined) {
        filtered = filtered.filter(c => c.fraudSuspected === input.fraudSuspected);
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

  // Get single claim by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }
      return claim;
    }),

  // Get claim by number
  getByNumber: protectedProcedure
    .input(z.object({ claimNumber: z.string() }))
    .query(async ({ input }) => {
      const claim = mockClaims.find(
        c => c.claimNumber.toLowerCase() === input.claimNumber.toLowerCase()
      );
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }
      return claim;
    }),

  // Create new claim (report)
  create: protectedProcedure
    .input(ClaimCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const newClaim = {
        id: `clm-${Date.now()}`,
        claimNumber: `SIN-${new Date().getFullYear()}-${String(mockClaims.length + 1).padStart(5, '0')}`,
        ...input,
        policyNumber: 'SS-2024-00001', // TODO: Get from policy
        clientId: 'cli-001', // TODO: Get from policy
        clientName: 'Cliente', // TODO: Get from client
        insurerName: 'Aseguradora', // TODO: Get from policy
        status: 'OPEN' as const,
        reportDate: new Date(),
        reserveAmount: input.claimedAmount || 0,
        paidAmount: 0,
        hasExpertReport: false,
        fraudSuspected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClaims.push(newClaim);
      return newClaim;
    }),

  // Update claim
  update: protectedProcedure
    .input(z.object({ id: z.string(), data: ClaimUpdateSchema }))
    .mutation(async ({ input }) => {
      const index = mockClaims.findIndex(c => c.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      mockClaims[index] = {
        ...mockClaims[index],
        ...input.data,
        updatedAt: new Date(),
      };

      return mockClaims[index];
    }),

  // Change claim status
  changeStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: ClaimStatusSchema,
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.status = input.status;
      if (input.status === 'CLOSED') {
        claim.closedDate = new Date();
      }
      claim.updatedAt = new Date();

      return claim;
    }),

  // Assign handler
  assignHandler: managerProcedure
    .input(z.object({
      id: z.string(),
      handlerId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.handlerId = input.handlerId;
      claim.updatedAt = new Date();

      return claim;
    }),

  // Assign expert
  assignExpert: protectedProcedure
    .input(z.object({
      id: z.string(),
      expertId: z.string(),
      expertName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.expertId = input.expertId;
      claim.expertName = input.expertName;
      claim.status = 'PENDING_EXPERT';
      claim.updatedAt = new Date();

      return claim;
    }),

  // Update reserve amount
  updateReserve: protectedProcedure
    .input(z.object({
      id: z.string(),
      reserveAmount: z.number().min(0),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.reserveAmount = input.reserveAmount;
      claim.updatedAt = new Date();

      return claim;
    }),

  // Register payment
  registerPayment: managerProcedure
    .input(z.object({
      id: z.string(),
      amount: z.number().positive(),
      paymentType: z.string(),
      beneficiary: z.string(),
      reference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.paidAmount = (claim.paidAmount || 0) + input.amount;
      claim.updatedAt = new Date();

      // If fully paid, update status
      if (claim.paidAmount >= (claim.claimedAmount || 0)) {
        claim.status = 'PAID';
      }

      return claim;
    }),

  // Mark as suspected fraud
  markFraudSuspected: managerProcedure
    .input(z.object({
      id: z.string(),
      suspected: z.boolean(),
      indicators: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const claim = mockClaims.find(c => c.id === input.id);
      if (!claim) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Siniestro no encontrado' });
      }

      claim.fraudSuspected = input.suspected;
      claim.updatedAt = new Date();

      return claim;
    }),

  // Get claim statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = mockClaims.length;
    const open = mockClaims.filter(c => ['OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'PENDING_EXPERT'].includes(c.status)).length;
    const closed = mockClaims.filter(c => c.status === 'CLOSED').length;

    const totalClaimed = mockClaims.reduce((acc, c) => acc + (c.claimedAmount || 0), 0);
    const totalPaid = mockClaims.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
    const totalReserve = mockClaims.reduce((acc, c) => acc + (c.reserveAmount || 0), 0);

    const avgResolutionDays = mockClaims
      .filter(c => c.closedDate)
      .reduce((acc, c) => {
        const days = Math.ceil((c.closedDate!.getTime() - c.reportDate.getTime()) / (1000 * 60 * 60 * 24));
        return acc + days;
      }, 0) / (closed || 1);

    return {
      total,
      open,
      closed,
      pendingDocuments: mockClaims.filter(c => c.status === 'PENDING_DOCS').length,
      pendingExpert: mockClaims.filter(c => c.status === 'PENDING_EXPERT').length,
      approved: mockClaims.filter(c => c.status === 'APPROVED').length,
      rejected: mockClaims.filter(c => c.status === 'REJECTED').length,
      fraudSuspected: mockClaims.filter(c => c.fraudSuspected).length,
      totalClaimed,
      totalPaid,
      totalReserve,
      avgResolutionDays: Math.round(avgResolutionDays),
    };
  }),

  // Get claims by policy
  getByPolicy: protectedProcedure
    .input(z.object({ policyId: z.string() }))
    .query(async ({ input }) => {
      return mockClaims.filter(c => c.policyId === input.policyId);
    }),

  // Get claims by client
  getByClient: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      return mockClaims.filter(c => c.clientId === input.clientId);
    }),

  // Add movement/activity to claim
  addMovement: protectedProcedure
    .input(z.object({
      claimId: z.string(),
      movementType: z.enum(['NOTE', 'DOCUMENT', 'STATUS_CHANGE', 'PAYMENT', 'RESERVE_CHANGE']),
      description: z.string(),
      amount: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Add to claim movements table
      return {
        id: `mov-${Date.now()}`,
        claimId: input.claimId,
        ...input,
        createdAt: new Date(),
      };
    }),

  // Get claim timeline
  getTimeline: protectedProcedure
    .input(z.object({ claimId: z.string() }))
    .query(async ({ input }) => {
      // TODO: Get from actual movements table
      return [
        { id: 'mov-001', type: 'CREATED', description: 'Siniestro reportado', createdAt: new Date('2024-01-10') },
        { id: 'mov-002', type: 'ASSIGNED', description: 'Asignado a María López', createdAt: new Date('2024-01-10') },
        { id: 'mov-003', type: 'EXPERT_ASSIGNED', description: 'Perito asignado', createdAt: new Date('2024-01-12') },
        { id: 'mov-004', type: 'DOCUMENT', description: 'Informe pericial recibido', createdAt: new Date('2024-01-15') },
      ];
    }),
});

export type ClaimsRouter = typeof claimsRouter;
