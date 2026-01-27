/**
 * SORIANO MEDIADORES - CRM Clients Router
 * CRUD operations for clients/customers
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================
// SCHEMAS
// ============================================

const ClientTypeSchema = z.enum(['INDIVIDUAL', 'COMPANY', 'SELF_EMPLOYED']);
const ClientStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'FORMER']);
const DocumentTypeSchema = z.enum(['DNI', 'NIE', 'CIF', 'PASSPORT', 'OTHER']);

const ClientCreateSchema = z.object({
  type: ClientTypeSchema.default('INDIVIDUAL'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  displayName: z.string().min(1),
  documentType: DocumentTypeSchema.optional(),
  documentNumber: z.string().optional(),
  taxId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('ES'),
  segment: z.string().optional(),
  source: z.string().optional(),
  birthDate: z.date().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedAgentId: z.string().optional(),
});

const ClientUpdateSchema = ClientCreateSchema.partial();

const ClientSearchSchema = z.object({
  query: z.string().optional(),
  type: ClientTypeSchema.optional(),
  status: ClientStatusSchema.optional(),
  segment: z.string().optional(),
  assignedAgentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isVip: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// MOCK DATA (Replace with actual DB calls)
// ============================================

const mockClients = [
  {
    id: 'cli-001',
    clientNumber: 'SM-00001',
    type: 'INDIVIDUAL' as const,
    status: 'ACTIVE' as const,
    firstName: 'Juan',
    lastName: 'García López',
    displayName: 'Juan García López',
    documentType: 'DNI' as const,
    documentNumber: '12345678A',
    email: 'juan.garcia@email.com',
    phone: '+34 666 123 456',
    mobile: '+34 666 123 456',
    address: 'Calle Mayor 123',
    city: 'Madrid',
    province: 'Madrid',
    postalCode: '28001',
    country: 'ES',
    segment: 'Premium',
    source: 'Referido',
    isVip: true,
    isBlacklisted: false,
    riskScore: 85,
    birthDate: new Date('1975-05-15'),
    totalPolicies: 5,
    totalPremium: 2450.00,
    createdAt: new Date('2020-03-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'cli-002',
    clientNumber: 'SM-00002',
    type: 'COMPANY' as const,
    status: 'ACTIVE' as const,
    companyName: 'Construcciones García S.L.',
    displayName: 'Construcciones García S.L.',
    documentType: 'CIF' as const,
    documentNumber: 'B12345678',
    taxId: 'B12345678',
    email: 'info@construccionesgarcia.es',
    phone: '+34 91 123 45 67',
    address: 'Polígono Industrial Norte 45',
    city: 'Alcobendas',
    province: 'Madrid',
    postalCode: '28108',
    country: 'ES',
    segment: 'Empresas',
    source: 'Web',
    isVip: false,
    isBlacklisted: false,
    riskScore: 72,
    totalPolicies: 8,
    totalPremium: 15680.00,
    createdAt: new Date('2019-06-22'),
    updatedAt: new Date('2024-01-18'),
  },
];

// ============================================
// ROUTER
// ============================================

export const clientsRouter = router({
  // List clients with pagination and filtering
  list: protectedProcedure
    .input(ClientSearchSchema)
    .query(async ({ input, ctx }) => {
      // TODO: Replace with actual database query
      let filtered = [...mockClients];

      // Apply filters
      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(
          c =>
            c.displayName.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.documentNumber?.toLowerCase().includes(q) ||
            c.clientNumber?.toLowerCase().includes(q)
        );
      }
      if (input.type) {
        filtered = filtered.filter(c => c.type === input.type);
      }
      if (input.status) {
        filtered = filtered.filter(c => c.status === input.status);
      }
      if (input.isVip !== undefined) {
        filtered = filtered.filter(c => c.isVip === input.isVip);
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

  // Get single client by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const client = mockClients.find(c => c.id === input.id);
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }
      return client;
    }),

  // Get client by document number
  getByDocument: protectedProcedure
    .input(z.object({ documentNumber: z.string() }))
    .query(async ({ input }) => {
      const client = mockClients.find(
        c => c.documentNumber?.toLowerCase() === input.documentNumber.toLowerCase()
      );
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }
      return client;
    }),

  // Create new client
  create: protectedProcedure
    .input(ClientCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: Replace with actual database insert
      const newClient = {
        id: `cli-${Date.now()}`,
        clientNumber: `SM-${String(mockClients.length + 1).padStart(5, '0')}`,
        ...input,
        status: 'ACTIVE' as const,
        isVip: false,
        isBlacklisted: false,
        totalPolicies: 0,
        totalPremium: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClients.push(newClient);

      return newClient;
    }),

  // Update client
  update: protectedProcedure
    .input(z.object({ id: z.string(), data: ClientUpdateSchema }))
    .mutation(async ({ input }) => {
      const index = mockClients.findIndex(c => c.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      mockClients[index] = {
        ...mockClients[index],
        ...input.data,
        updatedAt: new Date(),
      };

      return mockClients[index];
    }),

  // Delete client (soft delete)
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const index = mockClients.findIndex(c => c.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      // Soft delete - change status to INACTIVE
      mockClients[index].status = 'INACTIVE';
      mockClients[index].updatedAt = new Date();

      return { success: true };
    }),

  // Mark as VIP
  markAsVip: protectedProcedure
    .input(z.object({ id: z.string(), isVip: z.boolean() }))
    .mutation(async ({ input }) => {
      const client = mockClients.find(c => c.id === input.id);
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente no encontrado' });
      }

      client.isVip = input.isVip;
      client.updatedAt = new Date();

      return client;
    }),

  // Get client statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = mockClients.length;
    const active = mockClients.filter(c => c.status === 'ACTIVE').length;
    const vip = mockClients.filter(c => c.isVip).length;
    const companies = mockClients.filter(c => c.type === 'COMPANY').length;
    const individuals = mockClients.filter(c => c.type === 'INDIVIDUAL').length;

    return {
      total,
      active,
      inactive: total - active,
      vip,
      companies,
      individuals,
      avgPoliciesPerClient: mockClients.reduce((acc, c) => acc + (c.totalPolicies || 0), 0) / total,
      totalPremium: mockClients.reduce((acc, c) => acc + (c.totalPremium || 0), 0),
    };
  }),

  // Search clients (autocomplete)
  search: protectedProcedure
    .input(z.object({ query: z.string().min(2), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const q = input.query.toLowerCase();
      return mockClients
        .filter(
          c =>
            c.displayName.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.documentNumber?.toLowerCase().includes(q)
        )
        .slice(0, input.limit)
        .map(c => ({
          id: c.id,
          displayName: c.displayName,
          documentNumber: c.documentNumber,
          email: c.email,
          type: c.type,
        }));
    }),

  // Get client activity/timeline
  getActivity: protectedProcedure
    .input(z.object({ clientId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      // TODO: Implement with actual activity log
      return [
        {
          id: 'act-001',
          type: 'POLICY_CREATED',
          description: 'Nueva póliza de auto contratada',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 'act-002',
          type: 'COMMUNICATION_SENT',
          description: 'Email de renovación enviado',
          createdAt: new Date('2024-01-10'),
        },
        {
          id: 'act-003',
          type: 'RECEIPT_PAID',
          description: 'Recibo de póliza hogar cobrado',
          createdAt: new Date('2024-01-05'),
        },
      ];
    }),

  // Import clients from CSV
  import: adminProcedure
    .input(
      z.object({
        data: z.array(ClientCreateSchema),
        options: z.object({
          skipDuplicates: z.boolean().default(true),
          updateExisting: z.boolean().default(false),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement bulk import
      return {
        imported: input.data.length,
        skipped: 0,
        errors: [],
      };
    }),

  // Export clients
  export: protectedProcedure
    .input(ClientSearchSchema.extend({ format: z.enum(['csv', 'xlsx', 'json']).default('csv') }))
    .mutation(async ({ input }) => {
      // TODO: Implement export
      return {
        url: '/api/exports/clients-export.csv',
        format: input.format,
        count: mockClients.length,
      };
    }),

  // Merge duplicate clients
  merge: adminProcedure
    .input(
      z.object({
        primaryId: z.string(),
        duplicateIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implement client merge logic
      return { success: true, mergedId: input.primaryId };
    }),
});

export type ClientsRouter = typeof clientsRouter;
