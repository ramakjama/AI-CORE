/**
 * SORIANO MEDIADORES - Commissions Router
 * CRUD operations for commissions management
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================
// SCHEMAS
// ============================================

const CommissionStatusSchema = z.enum(['PENDING', 'COLLECTED', 'RECONCILED', 'DISPUTED', 'CANCELLED']);

const CommissionSearchSchema = z.object({
  query: z.string().optional(),
  insurerId: z.string().optional(),
  agentId: z.string().optional(),
  status: CommissionStatusSchema.optional(),
  periodFrom: z.string().optional(), // YYYY-MM
  periodTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('period'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// MOCK DATA
// ============================================

const mockCommissions = [
  {
    id: 'com-001',
    policyId: 'pol-001',
    policyNumber: 'SS-2024-00001',
    receiptId: 'rec-001',
    receiptNumber: 'REC-2024-00001',
    agentId: 'agent-001',
    agentName: 'Carlos Martín',
    insurerId: 'ins-mapfre',
    insurerName: 'MAPFRE',
    clientName: 'Juan García López',
    type: 'NEW',
    period: '2024-01',
    premium: 485.50,
    commissionRate: 18.5,
    commissionAmount: 89.82,
    status: 'COLLECTED' as const,
    collectedAt: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'com-002',
    policyId: 'pol-002',
    policyNumber: 'SS-2024-00002',
    receiptId: 'rec-002',
    receiptNumber: 'REC-2024-00002',
    agentId: 'agent-001',
    agentName: 'Carlos Martín',
    insurerId: 'ins-allianz',
    insurerName: 'Allianz',
    clientName: 'Juan García López',
    type: 'RENEWAL',
    period: '2024-01',
    premium: 320.00,
    commissionRate: 22.0,
    commissionAmount: 70.40,
    status: 'PENDING' as const,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'com-003',
    policyId: 'pol-003',
    policyNumber: 'SS-2024-00003',
    receiptId: 'rec-003',
    receiptNumber: 'REC-2024-00003',
    agentId: 'agent-002',
    agentName: 'María López',
    insurerId: 'ins-axa',
    insurerName: 'AXA',
    clientName: 'Construcciones García S.L.',
    type: 'NEW',
    period: '2024-01',
    premium: 2850.00,
    commissionRate: 15.0,
    commissionAmount: 427.50,
    status: 'PENDING' as const,
    createdAt: new Date('2024-01-22'),
  },
];

const mockStatements = [
  {
    id: 'stm-001',
    insurerId: 'ins-mapfre',
    insurerName: 'MAPFRE',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    totalPremium: 125680.00,
    totalCommissionGross: 22345.80,
    totalCommissionNet: 19892.36,
    totalRetentions: 2453.44,
    totalPayable: 19892.36,
    receiptCount: 156,
    matchedCount: 148,
    unmatchedCount: 8,
    discrepancyAmount: 234.56,
    status: 'RECONCILED' as const,
    receivedAt: new Date('2024-02-05'),
    reconciledAt: new Date('2024-02-10'),
  },
  {
    id: 'stm-002',
    insurerId: 'ins-allianz',
    insurerName: 'Allianz',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    totalPremium: 89450.00,
    totalCommissionGross: 18678.50,
    totalCommissionNet: 16234.80,
    totalRetentions: 2443.70,
    totalPayable: 16234.80,
    receiptCount: 98,
    matchedCount: 95,
    unmatchedCount: 3,
    discrepancyAmount: 45.23,
    status: 'IN_PROGRESS' as const,
    receivedAt: new Date('2024-02-08'),
  },
];

// ============================================
// ROUTER
// ============================================

export const commissionsRouter = router({
  // List commission records
  list: protectedProcedure
    .input(CommissionSearchSchema)
    .query(async ({ input, ctx }) => {
      let filtered = [...mockCommissions];

      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(
          c =>
            c.policyNumber.toLowerCase().includes(q) ||
            c.clientName.toLowerCase().includes(q) ||
            c.insurerName.toLowerCase().includes(q) ||
            c.agentName.toLowerCase().includes(q)
        );
      }
      if (input.insurerId) {
        filtered = filtered.filter(c => c.insurerId === input.insurerId);
      }
      if (input.agentId) {
        filtered = filtered.filter(c => c.agentId === input.agentId);
      }
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }
      if (input.periodFrom) {
        filtered = filtered.filter(c => c.period >= input.periodFrom!);
      }
      if (input.periodTo) {
        filtered = filtered.filter(c => c.period <= input.periodTo!);
      }

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

  // Get commission by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const commission = mockCommissions.find(c => c.id === input.id);
      if (!commission) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Comisión no encontrada' });
      }
      return commission;
    }),

  // Get commissions by agent
  getByAgent: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      period: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = mockCommissions.filter(c => c.agentId === input.agentId);
      if (input.period) {
        filtered = filtered.filter(c => c.period === input.period);
      }
      return filtered;
    }),

  // Get commissions by insurer
  getByInsurer: protectedProcedure
    .input(z.object({
      insurerId: z.string(),
      period: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = mockCommissions.filter(c => c.insurerId === input.insurerId);
      if (input.period) {
        filtered = filtered.filter(c => c.period === input.period);
      }
      return filtered;
    }),

  // Mark commission as collected
  markCollected: managerProcedure
    .input(z.object({
      ids: z.array(z.string()),
      bankReference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updated = [];
      for (const id of input.ids) {
        const commission = mockCommissions.find(c => c.id === id);
        if (commission) {
          commission.status = 'COLLECTED';
          commission.collectedAt = new Date();
          updated.push(commission);
        }
      }
      return { updated: updated.length };
    }),

  // Get commission statements (liquidaciones)
  getStatements: protectedProcedure
    .input(z.object({
      insurerId: z.string().optional(),
      status: z.enum(['RECEIVED', 'IN_PROGRESS', 'RECONCILED', 'DISPUTED', 'CLOSED']).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockStatements];

      if (input.insurerId) {
        filtered = filtered.filter(s => s.insurerId === input.insurerId);
      }
      if (input.status) {
        filtered = filtered.filter(s => s.status === input.status);
      }

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

  // Get statement by ID
  getStatementById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const statement = mockStatements.find(s => s.id === input.id);
      if (!statement) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Liquidación no encontrada' });
      }
      return statement;
    }),

  // Upload commission statement
  uploadStatement: adminProcedure
    .input(z.object({
      insurerId: z.string(),
      periodStart: z.date(),
      periodEnd: z.date(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Process uploaded statement file
      return {
        id: `stm-${Date.now()}`,
        ...input,
        status: 'RECEIVED' as const,
        receivedAt: new Date(),
      };
    }),

  // Reconcile statement
  reconcileStatement: managerProcedure
    .input(z.object({
      statementId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const statement = mockStatements.find(s => s.id === input.statementId);
      if (!statement) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Liquidación no encontrada' });
      }

      statement.status = 'RECONCILED';
      statement.reconciledAt = new Date();

      return statement;
    }),

  // Get commission statistics
  getStats: protectedProcedure
    .input(z.object({
      period: z.string().optional(),
      agentId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockCommissions];

      if (input.period) {
        filtered = filtered.filter(c => c.period === input.period);
      }
      if (input.agentId) {
        filtered = filtered.filter(c => c.agentId === input.agentId);
      }

      const totalPending = filtered
        .filter(c => c.status === 'PENDING')
        .reduce((acc, c) => acc + c.commissionAmount, 0);

      const totalCollected = filtered
        .filter(c => c.status === 'COLLECTED')
        .reduce((acc, c) => acc + c.commissionAmount, 0);

      const totalAmount = filtered.reduce((acc, c) => acc + c.commissionAmount, 0);

      const byInsurer = filtered.reduce((acc, c) => {
        if (!acc[c.insurerName]) {
          acc[c.insurerName] = { count: 0, amount: 0 };
        }
        acc[c.insurerName].count++;
        acc[c.insurerName].amount += c.commissionAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const byAgent = filtered.reduce((acc, c) => {
        if (!acc[c.agentName]) {
          acc[c.agentName] = { count: 0, amount: 0 };
        }
        acc[c.agentName].count++;
        acc[c.agentName].amount += c.commissionAmount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      return {
        total: filtered.length,
        pending: filtered.filter(c => c.status === 'PENDING').length,
        collected: filtered.filter(c => c.status === 'COLLECTED').length,
        disputed: filtered.filter(c => c.status === 'DISPUTED').length,
        totalAmount,
        totalPending,
        totalCollected,
        avgCommissionRate: filtered.reduce((acc, c) => acc + c.commissionRate, 0) / filtered.length,
        byInsurer,
        byAgent,
      };
    }),

  // Get rappels (bonificaciones por objetivos)
  getRappels: protectedProcedure
    .input(z.object({
      insurerId: z.string().optional(),
      year: z.number().optional(),
    }))
    .query(async ({ input }) => {
      // TODO: Implement rappels logic
      return [
        {
          id: 'rap-001',
          insurerId: 'ins-mapfre',
          insurerName: 'MAPFRE',
          year: 2024,
          targetPremium: 500000,
          achievedPremium: 345000,
          progress: 69,
          rappelRate: 2.5,
          estimatedRappel: 8625,
          status: 'IN_PROGRESS',
        },
        {
          id: 'rap-002',
          insurerId: 'ins-allianz',
          insurerName: 'Allianz',
          year: 2024,
          targetPremium: 350000,
          achievedPremium: 180000,
          progress: 51.4,
          rappelRate: 2.0,
          estimatedRappel: 3600,
          status: 'IN_PROGRESS',
        },
      ];
    }),

  // Export commissions report
  exportReport: protectedProcedure
    .input(z.object({
      periodFrom: z.string(),
      periodTo: z.string(),
      insurerId: z.string().optional(),
      agentId: z.string().optional(),
      format: z.enum(['csv', 'xlsx', 'pdf']).default('xlsx'),
    }))
    .mutation(async ({ input }) => {
      // TODO: Generate export file
      return {
        url: `/api/exports/commissions-${input.periodFrom}-${input.periodTo}.${input.format}`,
        format: input.format,
      };
    }),
});

export type CommissionsRouter = typeof commissionsRouter;
