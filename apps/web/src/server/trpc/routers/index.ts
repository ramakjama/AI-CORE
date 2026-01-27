/**
 * SORIANO MEDIADORES - AI-CORE ERP
 * Main tRPC Router - Combines all module routers
 */

import { router, publicProcedure, protectedProcedure } from '../trpc';
import { clientsRouter } from './clients';
import { policiesRouter } from './policies';
import { claimsRouter } from './claims';
import { commissionsRouter } from './commissions';
import { insurersRouter } from './insurers';

// ============================================
// MAIN APP ROUTER
// ============================================

export const appRouter = router({
  // ========================================
  // Health & Status
  // ========================================
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  })),

  // Current user info
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  // ========================================
  // CRM Module
  // ========================================
  clients: clientsRouter,

  // ========================================
  // Insurance Module
  // ========================================
  policies: policiesRouter,
  claims: claimsRouter,
  insurers: insurersRouter,

  // ========================================
  // Finance Module
  // ========================================
  commissions: commissionsRouter,

  // ========================================
  // Dashboard Data
  // ========================================
  dashboard: router({
    // Get dashboard KPIs
    getKpis: protectedProcedure.query(async ({ ctx }) => {
      // TODO: Get from actual database
      return {
        clients: {
          total: 1245,
          active: 1156,
          new30Days: 23,
          trend: 3.5,
        },
        policies: {
          total: 2456,
          active: 2234,
          expiringThisMonth: 45,
          trend: 2.1,
        },
        claims: {
          open: 34,
          inProgress: 18,
          pendingDocs: 8,
          avgResolutionDays: 12,
        },
        commissions: {
          pending: 45680.50,
          collectedThisMonth: 28450.00,
          projectedMonth: 52000.00,
          trend: 5.2,
        },
        production: {
          newPoliciesMonth: 67,
          newPremiumMonth: 34560.00,
          renewalsMonth: 123,
          renewalRate: 89.5,
        },
      };
    }),

    // Get recent activity
    getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
      return [
        {
          id: 'act-001',
          type: 'POLICY_CREATED',
          title: 'Nueva póliza de auto',
          description: 'Juan García - MAPFRE Auto',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        },
        {
          id: 'act-002',
          type: 'CLAIM_OPENED',
          title: 'Nuevo siniestro reportado',
          description: 'María López - Daños por agua',
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
        },
        {
          id: 'act-003',
          type: 'RECEIPT_PAID',
          title: 'Recibo cobrado',
          description: 'Construcciones García - RC Profesional',
          timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        },
        {
          id: 'act-004',
          type: 'CLIENT_CREATED',
          title: 'Nuevo cliente registrado',
          description: 'Ana Martínez Ruiz',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        },
        {
          id: 'act-005',
          type: 'RENEWAL_REMINDER',
          title: 'Recordatorio de renovación enviado',
          description: '15 pólizas próximas a vencer',
          timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
        },
      ];
    }),

    // Get upcoming tasks
    getUpcomingTasks: protectedProcedure.query(async ({ ctx }) => {
      return [
        {
          id: 'task-001',
          type: 'RENEWAL',
          title: 'Renovación póliza SS-2024-00045',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
          priority: 'HIGH',
          clientName: 'Pedro Sánchez',
        },
        {
          id: 'task-002',
          type: 'FOLLOW_UP',
          title: 'Seguimiento cotización auto',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
          priority: 'MEDIUM',
          clientName: 'Laura Gómez',
        },
        {
          id: 'task-003',
          type: 'CLAIM',
          title: 'Revisar documentación siniestro',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8), // 8 hours
          priority: 'HIGH',
          clientName: 'Empresa XYZ S.L.',
        },
        {
          id: 'task-004',
          type: 'CALL',
          title: 'Llamar cliente - consulta cobertura',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
          priority: 'LOW',
          clientName: 'Miguel Torres',
        },
      ];
    }),

    // Get charts data
    getChartsData: protectedProcedure.query(async ({ ctx }) => {
      // Production by month
      const productionByMonth = [
        { month: 'Ago', newBusiness: 45600, renewals: 78900 },
        { month: 'Sep', newBusiness: 52300, renewals: 82100 },
        { month: 'Oct', newBusiness: 48700, renewals: 79500 },
        { month: 'Nov', newBusiness: 56200, renewals: 85600 },
        { month: 'Dic', newBusiness: 62100, renewals: 91200 },
        { month: 'Ene', newBusiness: 58400, renewals: 88300 },
      ];

      // Portfolio by branch
      const portfolioByBranch = [
        { branch: 'Auto', count: 456, premium: 234500 },
        { branch: 'Hogar', count: 389, premium: 156800 },
        { branch: 'Vida', count: 234, premium: 189600 },
        { branch: 'Salud', count: 178, premium: 145200 },
        { branch: 'RC', count: 156, premium: 234100 },
        { branch: 'Otros', count: 98, premium: 67800 },
      ];

      // Claims by status
      const claimsByStatus = [
        { status: 'Abiertos', count: 12 },
        { status: 'En trámite', count: 18 },
        { status: 'Pend. docs', count: 8 },
        { status: 'Pend. perito', count: 5 },
        { status: 'Cerrados mes', count: 24 },
      ];

      // Top insurers
      const topInsurers = [
        { name: 'MAPFRE', premium: 156890, share: 31.2 },
        { name: 'Allianz', premium: 123450, share: 24.5 },
        { name: 'AXA', premium: 98670, share: 19.6 },
        { name: 'Generali', premium: 67890, share: 13.5 },
        { name: 'Zurich', premium: 54320, share: 10.8 },
      ];

      return {
        productionByMonth,
        portfolioByBranch,
        claimsByStatus,
        topInsurers,
      };
    }),
  }),

  // ========================================
  // Notifications
  // ========================================
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [
        {
          id: 'notif-001',
          type: 'WARNING',
          title: '5 pólizas próximas a vencer',
          message: 'Hay 5 pólizas que vencen en los próximos 7 días',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
        {
          id: 'notif-002',
          type: 'INFO',
          title: 'Nueva liquidación recibida',
          message: 'MAPFRE ha enviado la liquidación de Enero 2024',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          id: 'notif-003',
          type: 'SUCCESS',
          title: 'Siniestro cerrado',
          message: 'El siniestro SIN-2024-00045 ha sido cerrado',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ];
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async () => {
      return { success: true };
    }),
  }),
});

// Export type for client
export type AppRouter = typeof appRouter;

// Import z for notifications
import { z } from 'zod';
