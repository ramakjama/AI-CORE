/**
 * SORIANO MEDIADORES - Insurers Router
 * CRUD operations for insurance companies (compañías aseguradoras)
 */

import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================
// MOCK DATA
// ============================================

const mockInsurers = [
  {
    id: 'ins-mapfre',
    code: 'MAPFRE',
    name: 'MAPFRE España',
    shortName: 'MAPFRE',
    taxId: 'A28141935',
    email: 'mediadores@mapfre.com',
    phone: '+34 91 123 45 67',
    website: 'https://www.mapfre.es',
    address: 'Paseo de Recoletos 25, 28004 Madrid',
    city: 'Madrid',
    postalCode: '28004',
    apiEnabled: true,
    apiEndpoint: 'https://api.mapfre.es/v1',
    defaultCommission: 18.5,
    status: 'ACTIVE',
    logo: '/logos/mapfre.png',
    products: [
      { id: 'prod-mapfre-auto', name: 'Auto', branches: ['AUTO'], commissionRate: 18.5 },
      { id: 'prod-mapfre-hogar', name: 'Hogar', branches: ['HOME'], commissionRate: 22.0 },
      { id: 'prod-mapfre-vida', name: 'Vida', branches: ['LIFE'], commissionRate: 30.0 },
      { id: 'prod-mapfre-salud', name: 'Salud', branches: ['HEALTH'], commissionRate: 15.0 },
    ],
    stats: {
      totalPolicies: 245,
      activePolicies: 218,
      totalPremium: 156890.00,
      totalCommissions: 28345.60,
    },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'ins-allianz',
    code: 'ALLIANZ',
    name: 'Allianz Seguros',
    shortName: 'Allianz',
    taxId: 'A28007798',
    email: 'agentes@allianz.es',
    phone: '+34 91 596 90 00',
    website: 'https://www.allianz.es',
    address: 'Calle Ramírez de Arellano 35, 28043 Madrid',
    city: 'Madrid',
    postalCode: '28043',
    apiEnabled: true,
    apiEndpoint: 'https://api.allianz.es/v2',
    defaultCommission: 20.0,
    status: 'ACTIVE',
    logo: '/logos/allianz.png',
    products: [
      { id: 'prod-allianz-auto', name: 'Auto', branches: ['AUTO'], commissionRate: 19.0 },
      { id: 'prod-allianz-hogar', name: 'Hogar Confort', branches: ['HOME'], commissionRate: 22.0 },
      { id: 'prod-allianz-pyme', name: 'Pymes', branches: ['BUSINESS'], commissionRate: 18.0 },
    ],
    stats: {
      totalPolicies: 189,
      activePolicies: 172,
      totalPremium: 123450.00,
      totalCommissions: 24690.00,
    },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'ins-axa',
    code: 'AXA',
    name: 'AXA Seguros e Inversiones',
    shortName: 'AXA',
    taxId: 'A60917978',
    email: 'mediadores@axa.es',
    phone: '+34 93 404 40 00',
    website: 'https://www.axa.es',
    address: 'Paseo de la Castellana 79, 28046 Madrid',
    city: 'Madrid',
    postalCode: '28046',
    apiEnabled: true,
    apiEndpoint: 'https://api.axa.es/v1',
    defaultCommission: 17.0,
    status: 'ACTIVE',
    logo: '/logos/axa.png',
    products: [
      { id: 'prod-axa-auto', name: 'Auto', branches: ['AUTO'], commissionRate: 17.0 },
      { id: 'prod-axa-hogar', name: 'Hogar', branches: ['HOME'], commissionRate: 20.0 },
      { id: 'prod-axa-rc', name: 'RC Profesional', branches: ['LIABILITY'], commissionRate: 15.0 },
      { id: 'prod-axa-salud', name: 'Salud', branches: ['HEALTH'], commissionRate: 14.0 },
    ],
    stats: {
      totalPolicies: 156,
      activePolicies: 142,
      totalPremium: 98670.00,
      totalCommissions: 17760.60,
    },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'ins-generali',
    code: 'GENERALI',
    name: 'Generali España',
    shortName: 'Generali',
    taxId: 'A28007268',
    email: 'agentes@generali.es',
    phone: '+34 91 330 95 00',
    website: 'https://www.generali.es',
    address: 'Calle Orense 2, 28020 Madrid',
    city: 'Madrid',
    postalCode: '28020',
    apiEnabled: false,
    defaultCommission: 19.0,
    status: 'ACTIVE',
    logo: '/logos/generali.png',
    products: [
      { id: 'prod-generali-auto', name: 'Auto', branches: ['AUTO'], commissionRate: 18.0 },
      { id: 'prod-generali-vida', name: 'Vida Ahorro', branches: ['LIFE'], commissionRate: 28.0 },
    ],
    stats: {
      totalPolicies: 98,
      activePolicies: 89,
      totalPremium: 67890.00,
      totalCommissions: 12900.10,
    },
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: 'ins-zurich',
    code: 'ZURICH',
    name: 'Zurich Insurance',
    shortName: 'Zurich',
    taxId: 'A28024633',
    email: 'intermediarios@zurich.es',
    phone: '+34 91 749 93 00',
    website: 'https://www.zurich.es',
    address: 'Vía Augusta 200, 08021 Barcelona',
    city: 'Barcelona',
    postalCode: '08021',
    apiEnabled: true,
    apiEndpoint: 'https://api.zurich.es/v1',
    defaultCommission: 18.0,
    status: 'ACTIVE',
    logo: '/logos/zurich.png',
    products: [
      { id: 'prod-zurich-auto', name: 'Auto', branches: ['AUTO'], commissionRate: 17.5 },
      { id: 'prod-zurich-pyme', name: 'Pymes y Comercios', branches: ['BUSINESS'], commissionRate: 20.0 },
    ],
    stats: {
      totalPolicies: 76,
      activePolicies: 68,
      totalPremium: 54320.00,
      totalCommissions: 9777.60,
    },
    createdAt: new Date('2021-03-15'),
    updatedAt: new Date('2024-01-05'),
  },
];

// ============================================
// ROUTER
// ============================================

export const insurersRouter = router({
  // List all insurers
  list: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      apiEnabled: z.boolean().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      let filtered = [...mockInsurers];

      if (input.query) {
        const q = input.query.toLowerCase();
        filtered = filtered.filter(
          i =>
            i.name.toLowerCase().includes(q) ||
            i.code.toLowerCase().includes(q) ||
            i.shortName?.toLowerCase().includes(q)
        );
      }
      if (input.status) {
        filtered = filtered.filter(i => i.status === input.status);
      }
      if (input.apiEnabled !== undefined) {
        filtered = filtered.filter(i => i.apiEnabled === input.apiEnabled);
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

  // Get insurer by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const insurer = mockInsurers.find(i => i.id === input.id);
      if (!insurer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }
      return insurer;
    }),

  // Get all active insurers (for dropdowns)
  getActive: protectedProcedure.query(async () => {
    return mockInsurers
      .filter(i => i.status === 'ACTIVE')
      .map(i => ({
        id: i.id,
        code: i.code,
        name: i.name,
        shortName: i.shortName,
        logo: i.logo,
      }));
  }),

  // Get insurer products
  getProducts: protectedProcedure
    .input(z.object({ insurerId: z.string() }))
    .query(async ({ input }) => {
      const insurer = mockInsurers.find(i => i.id === input.insurerId);
      if (!insurer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }
      return insurer.products;
    }),

  // Get insurer statistics
  getStats: protectedProcedure
    .input(z.object({ insurerId: z.string() }))
    .query(async ({ input }) => {
      const insurer = mockInsurers.find(i => i.id === input.insurerId);
      if (!insurer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }
      return insurer.stats;
    }),

  // Create new insurer
  create: adminProcedure
    .input(z.object({
      code: z.string().min(2).max(20),
      name: z.string().min(2),
      shortName: z.string().optional(),
      taxId: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      apiEnabled: z.boolean().default(false),
      apiEndpoint: z.string().optional(),
      defaultCommission: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      const newInsurer = {
        id: `ins-${input.code.toLowerCase()}`,
        ...input,
        status: 'ACTIVE',
        products: [],
        stats: {
          totalPolicies: 0,
          activePolicies: 0,
          totalPremium: 0,
          totalCommissions: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsurers.push(newInsurer);
      return newInsurer;
    }),

  // Update insurer
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        shortName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        apiEnabled: z.boolean().optional(),
        apiEndpoint: z.string().optional(),
        defaultCommission: z.number().min(0).max(100).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const index = mockInsurers.findIndex(i => i.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }

      mockInsurers[index] = {
        ...mockInsurers[index],
        ...input.data,
        updatedAt: new Date(),
      };

      return mockInsurers[index];
    }),

  // Add product to insurer
  addProduct: adminProcedure
    .input(z.object({
      insurerId: z.string(),
      product: z.object({
        name: z.string(),
        code: z.string().optional(),
        branches: z.array(z.string()),
        commissionRate: z.number().min(0).max(100),
        description: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const insurer = mockInsurers.find(i => i.id === input.insurerId);
      if (!insurer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }

      const newProduct = {
        id: `prod-${insurer.code.toLowerCase()}-${Date.now()}`,
        ...input.product,
      };

      insurer.products.push(newProduct);
      insurer.updatedAt = new Date();

      return newProduct;
    }),

  // Test API connection
  testApiConnection: adminProcedure
    .input(z.object({ insurerId: z.string() }))
    .mutation(async ({ input }) => {
      const insurer = mockInsurers.find(i => i.id === input.insurerId);
      if (!insurer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Aseguradora no encontrada' });
      }

      if (!insurer.apiEnabled || !insurer.apiEndpoint) {
        return { success: false, message: 'API no configurada para esta aseguradora' };
      }

      // TODO: Test actual API connection
      return {
        success: true,
        message: 'Conexión exitosa',
        latencyMs: 145,
      };
    }),

  // Get global statistics across all insurers
  getGlobalStats: protectedProcedure.query(async () => {
    const totalPolicies = mockInsurers.reduce((acc, i) => acc + i.stats.totalPolicies, 0);
    const activePolicies = mockInsurers.reduce((acc, i) => acc + i.stats.activePolicies, 0);
    const totalPremium = mockInsurers.reduce((acc, i) => acc + i.stats.totalPremium, 0);
    const totalCommissions = mockInsurers.reduce((acc, i) => acc + i.stats.totalCommissions, 0);

    const byInsurer = mockInsurers.map(i => ({
      id: i.id,
      name: i.shortName || i.name,
      policies: i.stats.activePolicies,
      premium: i.stats.totalPremium,
      commissions: i.stats.totalCommissions,
      share: (i.stats.totalPremium / totalPremium) * 100,
    }));

    return {
      totalInsurers: mockInsurers.length,
      activeInsurers: mockInsurers.filter(i => i.status === 'ACTIVE').length,
      totalPolicies,
      activePolicies,
      totalPremium,
      totalCommissions,
      avgCommissionRate: (totalCommissions / totalPremium) * 100,
      byInsurer: byInsurer.sort((a, b) => b.premium - a.premium),
    };
  }),
});

export type InsurersRouter = typeof insurersRouter;
