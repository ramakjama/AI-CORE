/**
 * Claim View Service
 * Provides simplified claim views for portal users
 * Handles claim submission, tracking, and document upload
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ClaimSummary,
  ClaimStatus,
  ClaimTimelineEvent,
  ClaimEventType,
  ClaimDocument,
  ClaimDocumentType,
  NewClaimData,
  ClaimHandlerInfo,
  MoneyAmount,
  ServiceResult,
  PaginatedResult,
} from '../types';

// In-memory storage (replace with database in production)
const claims: Map<string, ClaimSummary> = new Map();
const claimUserMap: Map<string, string[]> = new Map(); // userId -> claimIds
const claimTimelines: Map<string, ClaimTimelineEvent[]> = new Map();
const claimDocuments: Map<string, ClaimDocument[]> = new Map();

// Claim number sequence
let claimSequence = 1000;

/**
 * Claim View Service
 */
export class ClaimViewService {
  /**
   * Get all claims for a user
   */
  async getMyClaims(
    userId: string,
    options?: {
      status?: ClaimStatus;
      policyId?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<ServiceResult<PaginatedResult<ClaimSummary>>> {
    try {
      const claimIds = claimUserMap.get(userId) || [];
      let userClaims: ClaimSummary[] = [];

      for (const claimId of claimIds) {
        const claim = claims.get(claimId);
        if (claim) {
          userClaims.push(claim);
        }
      }

      // Apply filters
      if (options?.status) {
        userClaims = userClaims.filter(c => c.status === options.status);
      }

      if (options?.policyId) {
        userClaims = userClaims.filter(c => c.policyId === options.policyId);
      }

      // Sort by reported date (most recent first)
      userClaims.sort((a, b) =>
        new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
      );

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 10;
      const totalCount = userClaims.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedClaims = userClaims.slice(start, end);

      return {
        success: true,
        data: {
          items: paginatedClaims,
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
          message: 'Error al obtener los siniestros',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Get claim status and details
   */
  async getClaimStatus(
    userId: string,
    claimId: string
  ): Promise<ServiceResult<ClaimSummary>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const claim = claims.get(claimId);
      if (!claim) {
        return {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Siniestro no encontrado',
          },
        };
      }

      // Add next step based on status
      const claimWithNextStep = {
        ...claim,
        nextStep: this.getNextStep(claim),
      };

      return {
        success: true,
        data: claimWithNextStep,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el estado del siniestro',
        },
      };
    }
  }

  /**
   * Submit a new claim
   */
  async submitNewClaim(
    userId: string,
    claimData: NewClaimData
  ): Promise<ServiceResult<ClaimSummary>> {
    try {
      // TODO: Verify user has access to the policy
      // This would integrate with policy-view.service

      const claimId = uuidv4();
      const claimNumber = `SIN-${new Date().getFullYear()}-${String(++claimSequence).padStart(6, '0')}`;
      const now = new Date();

      const newClaim: ClaimSummary = {
        id: claimId,
        claimNumber,
        policyId: claimData.policyId,
        policyNumber: '', // Would be fetched from policy
        productName: '', // Would be fetched from policy
        status: 'submitted',
        type: claimData.type,
        description: claimData.description,
        incidentDate: claimData.incidentDate,
        reportedDate: now,
        estimatedAmount: claimData.estimatedLoss,
        lastUpdate: now,
      };

      // Store claim
      claims.set(claimId, newClaim);

      // Update user-claim mapping
      const userClaims = claimUserMap.get(userId) || [];
      userClaims.push(claimId);
      claimUserMap.set(userId, userClaims);

      // Create initial timeline events
      const timelineEvents: ClaimTimelineEvent[] = [
        {
          id: uuidv4(),
          claimId,
          eventType: 'created',
          title: 'Siniestro Creado',
          description: 'Se ha registrado el siniestro en el sistema.',
          occurredAt: now,
          actor: 'Portal Cliente',
        },
        {
          id: uuidv4(),
          claimId,
          eventType: 'submitted',
          title: 'Siniestro Enviado',
          description: 'El siniestro ha sido enviado para revisión.',
          occurredAt: now,
          actor: 'Portal Cliente',
        },
      ];

      claimTimelines.set(claimId, timelineEvents);

      // Add next step
      const claimWithNextStep = {
        ...newClaim,
        nextStep: this.getNextStep(newClaim),
      };

      return {
        success: true,
        data: claimWithNextStep,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUBMISSION_ERROR',
          message: 'Error al enviar el siniestro',
          details: { error: String(error) },
        },
      };
    }
  }

  /**
   * Upload a document for a claim
   */
  async uploadClaimDocument(
    userId: string,
    claimId: string,
    file: {
      name: string;
      type: ClaimDocumentType;
      url: string;
      mimeType: string;
    }
  ): Promise<ServiceResult<ClaimDocument>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const claim = claims.get(claimId);
      if (!claim) {
        return {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Siniestro no encontrado',
          },
        };
      }

      // Check if claim accepts documents
      const closedStatuses: ClaimStatus[] = ['paid', 'closed', 'rejected'];
      if (closedStatuses.includes(claim.status)) {
        return {
          success: false,
          error: {
            code: 'CLAIM_CLOSED',
            message: 'No se pueden añadir documentos a un siniestro cerrado',
          },
        };
      }

      const now = new Date();
      const docId = uuidv4();

      const document: ClaimDocument = {
        id: docId,
        claimId,
        type: file.type,
        name: file.name,
        url: file.url,
        uploadedAt: now,
        uploadedBy: userId,
        status: 'pending',
      };

      // Store document
      const docs = claimDocuments.get(claimId) || [];
      docs.push(document);
      claimDocuments.set(claimId, docs);

      // Add timeline event
      await this.addTimelineEvent(claimId, {
        eventType: 'document_uploaded',
        title: 'Documento Subido',
        description: `Se ha subido el documento: ${file.name}`,
        actor: 'Cliente',
      });

      // Update claim last update
      claim.lastUpdate = now;
      claims.set(claimId, claim);

      return {
        success: true,
        data: document,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Error al subir el documento',
        },
      };
    }
  }

  /**
   * Get claim timeline
   */
  async getClaimTimeline(
    userId: string,
    claimId: string
  ): Promise<ServiceResult<ClaimTimelineEvent[]>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const timeline = claimTimelines.get(claimId) || [];

      // Sort by date (most recent first)
      const sortedTimeline = [...timeline].sort((a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );

      return {
        success: true,
        data: sortedTimeline,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener el historial del siniestro',
        },
      };
    }
  }

  /**
   * Get claim documents
   */
  async getClaimDocuments(
    userId: string,
    claimId: string
  ): Promise<ServiceResult<ClaimDocument[]>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const docs = claimDocuments.get(claimId) || [];

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
   * Add message/comment to claim
   */
  async addClaimMessage(
    userId: string,
    claimId: string,
    message: string
  ): Promise<ServiceResult<ClaimTimelineEvent>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const claim = claims.get(claimId);
      if (!claim) {
        return {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Siniestro no encontrado',
          },
        };
      }

      const event = await this.addTimelineEvent(claimId, {
        eventType: 'message_sent',
        title: 'Mensaje del Cliente',
        description: message,
        actor: 'Cliente',
      });

      // Update claim last update
      claim.lastUpdate = new Date();
      claims.set(claimId, claim);

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MESSAGE_ERROR',
          message: 'Error al enviar el mensaje',
        },
      };
    }
  }

  /**
   * Get claim summary statistics for dashboard
   */
  async getClaimSummaryStats(userId: string): Promise<ServiceResult<{
    totalClaims: number;
    openClaims: number;
    pendingDocuments: number;
    totalPaid: MoneyAmount;
    claimsByStatus: Record<ClaimStatus, number>;
  }>> {
    try {
      const claimIds = claimUserMap.get(userId) || [];
      let totalClaims = 0;
      let openClaims = 0;
      let pendingDocuments = 0;
      let totalPaidAmount = 0;
      const claimsByStatus: Record<string, number> = {};

      const openStatuses: ClaimStatus[] = [
        'submitted',
        'under_review',
        'documentation_required',
        'assessment',
      ];

      for (const claimId of claimIds) {
        const claim = claims.get(claimId);
        if (claim) {
          totalClaims++;

          if (openStatuses.includes(claim.status)) {
            openClaims++;
          }

          if (claim.status === 'documentation_required') {
            pendingDocuments++;
          }

          if (claim.paidAmount) {
            totalPaidAmount += claim.paidAmount.amount;
          }

          claimsByStatus[claim.status] = (claimsByStatus[claim.status] || 0) + 1;
        }
      }

      return {
        success: true,
        data: {
          totalClaims,
          openClaims,
          pendingDocuments,
          totalPaid: { amount: totalPaidAmount, currency: 'EUR' },
          claimsByStatus: claimsByStatus as Record<ClaimStatus, number>,
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

  /**
   * Get required documents for a claim
   */
  async getRequiredDocuments(
    userId: string,
    claimId: string
  ): Promise<ServiceResult<{
    required: ClaimDocumentType[];
    uploaded: ClaimDocumentType[];
    missing: ClaimDocumentType[];
  }>> {
    try {
      // Verify user has access to this claim
      const userClaimIds = claimUserMap.get(userId) || [];
      if (!userClaimIds.includes(claimId)) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'No tiene acceso a este siniestro',
          },
        };
      }

      const claim = claims.get(claimId);
      if (!claim) {
        return {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Siniestro no encontrado',
          },
        };
      }

      // Determine required documents based on claim type
      const required = this.getRequiredDocumentTypes(claim.type);

      // Get uploaded documents
      const docs = claimDocuments.get(claimId) || [];
      const uploaded = [...new Set(docs.map(d => d.type))];

      // Calculate missing
      const missing = required.filter(r => !uploaded.includes(r));

      return {
        success: true,
        data: { required, uploaded, missing },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Error al obtener los documentos requeridos',
        },
      };
    }
  }

  // ============================================================================
  // ADMIN/SYNC METHODS (for syncing from core claim system)
  // ============================================================================

  /**
   * Sync claim data from core system
   */
  async syncClaim(
    userId: string,
    claimData: ClaimSummary
  ): Promise<ServiceResult<ClaimSummary>> {
    try {
      claims.set(claimData.id, claimData);

      // Update user-claim mapping
      const userClaims = claimUserMap.get(userId) || [];
      if (!userClaims.includes(claimData.id)) {
        userClaims.push(claimData.id);
        claimUserMap.set(userId, userClaims);
      }

      return {
        success: true,
        data: claimData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: 'Error al sincronizar el siniestro',
        },
      };
    }
  }

  /**
   * Update claim status (from core system)
   */
  async updateClaimStatus(
    claimId: string,
    newStatus: ClaimStatus,
    handler?: ClaimHandlerInfo,
    notes?: string
  ): Promise<ServiceResult<ClaimSummary>> {
    try {
      const claim = claims.get(claimId);
      if (!claim) {
        return {
          success: false,
          error: {
            code: 'CLAIM_NOT_FOUND',
            message: 'Siniestro no encontrado',
          },
        };
      }

      const oldStatus = claim.status;
      claim.status = newStatus;
      claim.lastUpdate = new Date();

      if (handler) {
        claim.handler = handler;
      }

      claims.set(claimId, claim);

      // Add timeline event
      await this.addTimelineEvent(claimId, {
        eventType: 'status_changed',
        title: 'Estado Actualizado',
        description: `El estado del siniestro ha cambiado de "${this.getStatusLabel(oldStatus)}" a "${this.getStatusLabel(newStatus)}".${notes ? ` Notas: ${notes}` : ''}`,
        actor: handler?.name || 'Sistema',
        metadata: { oldStatus, newStatus },
      });

      return {
        success: true,
        data: claim,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Error al actualizar el estado',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async addTimelineEvent(
    claimId: string,
    eventData: {
      eventType: ClaimEventType;
      title: string;
      description: string;
      actor?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ClaimTimelineEvent> {
    const event: ClaimTimelineEvent = {
      id: uuidv4(),
      claimId,
      eventType: eventData.eventType,
      title: eventData.title,
      description: eventData.description,
      occurredAt: new Date(),
      actor: eventData.actor,
      metadata: eventData.metadata,
    };

    const timeline = claimTimelines.get(claimId) || [];
    timeline.push(event);
    claimTimelines.set(claimId, timeline);

    return event;
  }

  private getNextStep(claim: ClaimSummary): string {
    const nextSteps: Record<ClaimStatus, string> = {
      draft: 'Complete y envíe el formulario de siniestro',
      submitted: 'Su siniestro está siendo revisado por nuestro equipo',
      under_review: 'Un gestor está evaluando su caso',
      documentation_required: 'Por favor, suba los documentos solicitados',
      assessment: 'Se está realizando la peritación del siniestro',
      approved: 'Su siniestro ha sido aprobado. El pago está en proceso',
      partially_approved: 'Parte de su reclamación ha sido aprobada',
      rejected: 'Puede contactar con nosotros si desea más información',
      paid: 'El pago ha sido realizado',
      closed: 'Este siniestro ha sido cerrado',
    };

    return nextSteps[claim.status] || 'Contacte con nosotros para más información';
  }

  private getStatusLabel(status: ClaimStatus): string {
    const labels: Record<ClaimStatus, string> = {
      draft: 'Borrador',
      submitted: 'Enviado',
      under_review: 'En Revisión',
      documentation_required: 'Documentación Requerida',
      assessment: 'En Peritación',
      approved: 'Aprobado',
      partially_approved: 'Parcialmente Aprobado',
      rejected: 'Rechazado',
      paid: 'Pagado',
      closed: 'Cerrado',
    };

    return labels[status] || status;
  }

  private getRequiredDocumentTypes(claimType: string): ClaimDocumentType[] {
    // Base requirements for all claims
    const baseRequirements: ClaimDocumentType[] = ['photo', 'id_document'];

    // Type-specific requirements
    const typeRequirements: Record<string, ClaimDocumentType[]> = {
      auto_accident: ['photo', 'police_report', 'id_document', 'repair_estimate'],
      auto_theft: ['photo', 'police_report', 'id_document'],
      home_damage: ['photo', 'id_document', 'invoice'],
      home_theft: ['photo', 'police_report', 'id_document', 'invoice'],
      health: ['medical_report', 'invoice', 'id_document'],
      travel: ['invoice', 'id_document'],
      default: baseRequirements,
    };

    return typeRequirements[claimType] || typeRequirements.default;
  }
}

// Export singleton instance
export const claimViewService = new ClaimViewService();
