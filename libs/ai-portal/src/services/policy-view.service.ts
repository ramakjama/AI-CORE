/**
 * Policy View Service
 * Provides simplified policy views for portal users
 * Handles policy information, documents, and change requests
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PolicySummary,
  PolicyCategory,
  PolicyStatus,
  PolicyAlert,
  PolicyChangeRequest,
  PolicyChangeType,
  ChangeRequestStatus,
  PolicyDocument,
  PolicyDocumentType,
  InsuredItemSummary,
  CoverageSummary,
  MoneyAmount,
  ServiceResult,
  PaginatedResult,
} from '../types';

// In-memory storage (replace with database in production)
const policies: Map<string, PolicySummary> = new Map();
const policyUserMap: Map<string, string[]> = new Map(); // userId -> policyIds
const changeRequests: Map<string, PolicyChangeRequest> = new Map();
const policyDocuments: Map<string, PolicyDocument[]> = new Map();

/**
 * Policy View Service
 */
export class PolicyViewService {
  /**
   * Get all policies for a user
   */
  async getMyPolicies(
    userId: string,
    options?: {
      status?: PolicyStatus;
      category?: PolicyCategory;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<PaginatedResult<PolicySummary>>> {
    try {
      const policyIds = policyUserMap.get(userId) || [];
      let userPolicies: PolicySummary[] = [];

      for (const policyId of policyIds) {
        const policy = policies.get(policyId);
        if (policy) {
          userPolicies.push(policy);
        }
      }

      // Apply filters
      if (options?.status) {
        userPolicies = userPolicies.filter(p => p.status === options.status);
      }

      if (options?.category) {
        userPolicies = userPolicies.filter(p => p.productCategory === options.category);
      }

      // Sort by expiration date (nearest first)
      userPolicies.sort((a, b) =>
        new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
      );

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;
      const totalCount = userPolicies.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedPolicies = userPolicies.slice(start, end);

      // Add alerts to each policy
      const policiesWithAlerts = paginatedPolicies.map(policy => ({
        ...policy,
        alerts: this.generatePolicyAlerts(policy),
      }));

      return {
        success: true,
        data: {
          items: policiesWithAlerts,
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las pólizas',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Get detailed policy information
   */
  async getPolicyDetails(
    userId: string,
    policyId: string
  ): Promise<ServiceResult<PolicySummary>> {
    try {
      // Verify user has access to this policy
      const userPolicyIds = policyUserMap.get(userId) || [];
      if (!userPolicyIds.includes(policyId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta póliza',
          },
        };
      }

      const policy = policies.get(policyId);
      if (!policy) {
        return {
          success: false,
          error: {
            code: 'POLICY_NOT_FOUND',
            message: 'Póliza no encontrada',
          },
        };
      }

      // Add alerts
      const policyWithAlerts = {
        ...policy,
        alerts: this.generatePolicyAlerts(policy),
      };

      return {
        success: true,
        data: policyWithAlerts,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener los detalles de la póliza',
        },
      };
    }
  }

  /**
   * Download policy document
   */
  async downloadPolicyDocument(
    userId: string,
    policyId: string,
    docType: PolicyDocumentType
  ): Promise<ServiceResult<PolicyDocument>> {
    try {
      // Verify user has access to this policy
      const userPolicyIds = policyUserMap.get(userId) || [];
      if (!userPolicyIds.includes(policyId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta póliza',
          },
        };
      }

      const docs = policyDocuments.get(policyId) || [];
      const document = docs.find(d => d.type === docType);

      if (!document) {
        // Generate document on-demand
        const newDoc = await this.generateDocument(policyId, docType);
        return {
          success: true,
          data: newDoc,
        };
      }

      // Check if document is expired
      if (document.expiresAt && new Date() > document.expiresAt) {
        const newDoc = await this.generateDocument(policyId, docType);
        return {
          success: true,
          data: newDoc,
        };
      }

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOCUMENT_ERROR',
          message: 'Error al obtener el documento',
        },
      };
    }
  }

  /**
   * Request a policy change
   */
  async requestPolicyChange(
    userId: string,
    policyId: string,
    changeType: PolicyChangeType,
    data: Record<string, unknown>
  ): Promise<ServiceResult<PolicyChangeRequest>> {
    try {
      // Verify user has access to this policy
      const userPolicyIds = policyUserMap.get(userId) || [];
      if (!userPolicyIds.includes(policyId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta póliza',
          },
        };
      }

      const policy = policies.get(policyId);
      if (!policy) {
        return {
          success: false,
          error: {
            code: 'POLICY_NOT_FOUND',
            message: 'Póliza no encontrada',
          },
        };
      }

      // Check if policy allows changes
      if (policy.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'POLICY_INACTIVE',
            message: 'No se pueden solicitar cambios en pólizas inactivas',
          },
        };
      }

      // Create change request
      const requestId = uuidv4();
      const now = new Date();

      const changeRequest: PolicyChangeRequest = {
        id: requestId,
        policyId,
        userId,
        changeType,
        requestData: data,
        status: 'pending',
        submittedAt: now,
      };

      changeRequests.set(requestId, changeRequest);

      return {
        success: true,
        data: changeRequest,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: 'Error al solicitar el cambio',
        },
      };
    }
  }

  /**
   * Get upcoming policy renewals
   */
  async getUpcomingRenewals(
    userId: string,
    daysAhead: number = 60
  ): Promise<ServiceResult<PolicySummary[]>> {
    try {
      const policyIds = policyUserMap.get(userId) || [];
      const upcomingRenewals: PolicySummary[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      for (const policyId of policyIds) {
        const policy = policies.get(policyId);
        if (policy && policy.status === 'active') {
          const expirationDate = new Date(policy.expirationDate);
          if (expirationDate <= cutoffDate) {
            upcomingRenewals.push({
              ...policy,
              alerts: this.generatePolicyAlerts(policy),
            });
          }
        }
      }

      // Sort by expiration date
      upcomingRenewals.sort((a, b) =>
        new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
      );

      return {
        success: true,
        data: upcomingRenewals,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las renovaciones pendientes',
        },
      };
    }
  }

  /**
   * Get change request status
   */
  async getChangeRequestStatus(
    userId: string,
    requestId: string
  ): Promise<ServiceResult<PolicyChangeRequest>> {
    try {
      const request = changeRequests.get(requestId);

      if (!request) {
        return {
          success: false,
          error: {
            code: 'REQUEST_NOT_FOUND',
            message: 'Solicitud no encontrada',
          },
        };
      }

      if (request.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta solicitud',
          },
        };
      }

      return {
        success: true,
        data: request,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el estado de la solicitud',
        },
      };
    }
  }

  /**
   * Get all change requests for user
   */
  async getMyChangeRequests(
    userId: string,
    status?: ChangeRequestStatus
  ): Promise<ServiceResult<PolicyChangeRequest[]>> {
    try {
      const userRequests: PolicyChangeRequest[] = [];

      for (const request of changeRequests.values()) {
        if (request.userId === userId) {
          if (!status || request.status === status) {
            userRequests.push(request);
          }
        }
      }

      // Sort by submission date (most recent first)
      userRequests.sort((a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      return {
        success: true,
        data: userRequests,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener las solicitudes',
        },
      };
    }
  }

  /**
   * Get policy documents list
   */
  async getPolicyDocuments(
    userId: string,
    policyId: string
  ): Promise<ServiceResult<PolicyDocument[]>> {
    try {
      // Verify user has access to this policy
      const userPolicyIds = policyUserMap.get(userId) || [];
      if (!userPolicyIds.includes(policyId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a esta póliza',
          },
        };
      }

      const docs = policyDocuments.get(policyId) || [];

      return {
        success: true,
        data: docs,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener los documentos',
        },
      };
    }
  }

  /**
   * Get policy summary statistics for dashboard
   */
  async getPolicySummaryStats(userId: string): Promise<ServiceResult<{
    totalPolicies: number;
    activePolicies: number;
    pendingRenewals: number;
    totalPremium: MoneyAmount;
    policiesByCategory: Record<PolicyCategory, number>;
  }>> {
    try {
      const policyIds = policyUserMap.get(userId) || [];
      let totalPolicies = 0;
      let activePolicies = 0;
      let pendingRenewals = 0;
      let totalPremiumAmount = 0;
      const policiesByCategory: Record<string, number> = {};

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      for (const policyId of policyIds) {
        const policy = policies.get(policyId);
        if (policy) {
          totalPolicies++;

          if (policy.status === 'active') {
            activePolicies++;
            totalPremiumAmount += policy.premium.amount;

            const expirationDate = new Date(policy.expirationDate);
            if (expirationDate <= thirtyDaysFromNow) {
              pendingRenewals++;
            }
          }

          policiesByCategory[policy.productCategory] =
            (policiesByCategory[policy.productCategory] || 0) + 1;
        }
      }

      return {
        success: true,
        data: {
          totalPolicies,
          activePolicies,
          pendingRenewals,
          totalPremium: { amount: totalPremiumAmount, currency: 'EUR' },
          policiesByCategory: policiesByCategory as Record<PolicyCategory, number>,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Error al obtener las estadísticas',
        },
      };
    }
  }

  // ============================================================================
  // ADMIN/SYNC METHODS (for syncing from core policy system)
  // ============================================================================

  /**
   * Sync policy data from core system
   */
  async syncPolicy(
    userId: string,
    policyData: PolicySummary
  ): Promise<ServiceResult<PolicySummary>> {
    try {
      policies.set(policyData.id, policyData);

      // Update user-policy mapping
      const userPolicies = policyUserMap.get(userId) || [];
      if (!userPolicies.includes(policyData.id)) {
        userPolicies.push(policyData.id);
        policyUserMap.set(userId, userPolicies);
      }

      return {
        success: true,
        data: policyData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: 'Error al sincronizar la póliza',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generatePolicyAlerts(policy: PolicySummary): PolicyAlert[] {
    const alerts: PolicyAlert[] = [];
    const now = new Date();
    const expirationDate = new Date(policy.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Renewal alert
    if (daysUntilExpiration <= 30 && daysUntilExpiration > 0 && policy.status === 'active') {
      alerts.push({
        type: 'renewal',
        message: `Su póliza expira en ${daysUntilExpiration} días. Renueve ahora para mantener su cobertura.`,
        severity: daysUntilExpiration <= 7 ? 'urgent' : 'warning',
        actionUrl: `/policies/${policy.id}/renew`,
      });
    }

    // Payment due alert
    if (policy.nextPaymentDate) {
      const nextPayment = new Date(policy.nextPaymentDate);
      const daysUntilPayment = Math.ceil(
        (nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilPayment <= 7 && daysUntilPayment >= 0) {
        alerts.push({
          type: 'payment_due',
          message: `Próximo pago de ${policy.premium.amount.toFixed(2)}${policy.premium.currency} en ${daysUntilPayment} días.`,
          severity: daysUntilPayment <= 2 ? 'urgent' : 'warning',
          actionUrl: `/payments`,
        });
      } else if (daysUntilPayment < 0) {
        alerts.push({
          type: 'payment_due',
          message: `Pago de ${policy.premium.amount.toFixed(2)}${policy.premium.currency} vencido.`,
          severity: 'urgent',
          actionUrl: `/payments`,
        });
      }
    }

    return alerts;
  }

  private async generateDocument(
    policyId: string,
    docType: PolicyDocumentType
  ): Promise<PolicyDocument> {
    const docId = uuidv4();
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry for download URLs

    const docNames: Record<PolicyDocumentType, string> = {
      policy_schedule: 'Condiciones Particulares',
      certificate: 'Certificado de Seguro',
      conditions: 'Condiciones Generales',
      receipt: 'Recibo',
      endorsement: 'Suplemento',
      renewal_offer: 'Oferta de Renovación',
    };

    const document: PolicyDocument = {
      id: docId,
      policyId,
      type: docType,
      name: docNames[docType],
      url: `/api/documents/${docId}/download`,
      generatedAt: now,
      expiresAt,
    };

    // Store document
    const docs = policyDocuments.get(policyId) || [];
    // Remove old document of same type
    const filteredDocs = docs.filter(d => d.type !== docType);
    filteredDocs.push(document);
    policyDocuments.set(policyId, filteredDocs);

    return document;
  }
}

// Export singleton instance
export const policyViewService = new PolicyViewService();
