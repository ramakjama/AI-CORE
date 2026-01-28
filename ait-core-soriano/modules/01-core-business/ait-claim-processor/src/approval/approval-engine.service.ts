import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Claim, Approver } from '../entities/claim.entity';
import { ClaimType } from '../enums/claim-state.enum';

/**
 * Configuración de aprobación
 */
export interface ApprovalConfig {
  rules: ApprovalRule[];
  escalationRules: EscalationRule[];
}

/**
 * Regla de aprobación
 */
export interface ApprovalRule {
  id?: string;
  name?: string;
  level: number;
  amount?: {
    min?: number;
    max?: number;
  };
  claimType?: ClaimType;
  approvers: string[]; // Roles requeridos
  requiresAll?: boolean; // Todos deben aprobar o solo uno
}

/**
 * Regla de escalación
 */
export interface EscalationRule {
  condition: 'AMOUNT' | 'DURATION' | 'FRAUD_RISK' | 'CUSTOM';
  threshold: number;
  escalateToLevel: number;
}

/**
 * Solicitud de aprobación
 */
export interface ApprovalRequest {
  id: string;
  claimId: string;
  level: number;
  approvers: Approver[];
  requestedAt: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt?: Date;
}

/**
 * Motor de aprobaciones multinivel
 *
 * Sistema de aprobación basado en reglas configurables:
 * - Nivel 1: Claims hasta €1,000 - Ajustador
 * - Nivel 2: €1,000 - €5,000 - Ajustador + Supervisor
 * - Nivel 3: €5,000 - €20,000 - Ajustador + Supervisor + Gerente
 * - Nivel 4: €20,000+ - Ajustador + Supervisor + Gerente + Director
 */
@Injectable()
export class ApprovalEngineService {
  private readonly logger = new Logger(ApprovalEngineService.name);
  private approvalRequests: Map<string, ApprovalRequest> = new Map();

  /**
   * Obtiene la configuración de aprobaciones
   */
  async configure(): Promise<ApprovalConfig> {
    return {
      rules: [
        {
          id: 'rule_1',
          name: 'Low value claims',
          level: 1,
          amount: { max: 1000 },
          approvers: ['adjuster'],
          requiresAll: false,
        },
        {
          id: 'rule_2',
          name: 'Medium value claims',
          level: 2,
          amount: { min: 1000, max: 5000 },
          approvers: ['adjuster', 'supervisor'],
          requiresAll: true,
        },
        {
          id: 'rule_3',
          name: 'High value claims',
          level: 3,
          amount: { min: 5000, max: 20000 },
          approvers: ['adjuster', 'supervisor', 'manager'],
          requiresAll: true,
        },
        {
          id: 'rule_4',
          name: 'Very high value claims',
          level: 4,
          amount: { min: 20000 },
          approvers: ['adjuster', 'supervisor', 'manager', 'director'],
          requiresAll: true,
        },
        {
          id: 'rule_5',
          name: 'Health claims - special approval',
          level: 2,
          claimType: ClaimType.HEALTH,
          amount: { min: 2000 },
          approvers: ['health_specialist', 'supervisor'],
          requiresAll: true,
        },
      ],
      escalationRules: [
        {
          condition: 'AMOUNT',
          threshold: 50000,
          escalateToLevel: 4,
        },
        {
          condition: 'FRAUD_RISK',
          threshold: 70,
          escalateToLevel: 3,
        },
        {
          condition: 'DURATION',
          threshold: 14, // días sin resolver
          escalateToLevel: 3,
        },
      ],
    };
  }

  /**
   * Verifica si un claim requiere aprobación
   */
  async requiresApproval(claim: Claim): Promise<boolean> {
    // Claims siempre requieren al menos aprobación nivel 1
    return true;
  }

  /**
   * Obtiene los aprobadores requeridos para un claim
   */
  async getRequiredApprovers(claim: Claim): Promise<string[]> {
    const config = await this.configure();
    const amount = claim.estimatedAmount;

    // Buscar la regla aplicable
    let applicableRule: ApprovalRule | undefined;

    // Primero buscar por tipo específico
    for (const rule of config.rules) {
      if (rule.claimType === claim.type) {
        if (this.isAmountInRange(amount, rule.amount)) {
          applicableRule = rule;
          break;
        }
      }
    }

    // Si no hay regla específica, buscar por monto general
    if (!applicableRule) {
      for (const rule of config.rules) {
        if (!rule.claimType && this.isAmountInRange(amount, rule.amount)) {
          applicableRule = rule;
          break;
        }
      }
    }

    if (!applicableRule) {
      // Default: level 1
      return ['adjuster'];
    }

    return applicableRule.approvers;
  }

  /**
   * Obtiene el nivel de aprobación requerido
   */
  async getApprovalLevel(claim: Claim): Promise<number> {
    const config = await this.configure();
    const amount = claim.estimatedAmount;

    for (const rule of config.rules) {
      if (this.isAmountInRange(amount, rule.amount)) {
        if (!rule.claimType || rule.claimType === claim.type) {
          return rule.level;
        }
      }
    }

    return 1; // Default
  }

  /**
   * Solicita aprobación para un claim
   */
  async requestApproval(claim: Claim, approver: string): Promise<ApprovalRequest> {
    this.logger.log(`Requesting approval for claim ${claim.claimNumber} from ${approver}`);

    const level = await this.getApprovalLevel(claim);
    const requiredApprovers = await this.getRequiredApprovers(claim);

    // Crear approvers
    const approvers: Approver[] = requiredApprovers.map(role => ({
      userId: `user_${role}`,
      userName: role.charAt(0).toUpperCase() + role.slice(1),
      role,
      level,
      status: 'PENDING',
    }));

    const request: ApprovalRequest = {
      id: this.generateId(),
      claimId: claim.id,
      level,
      approvers,
      requestedAt: new Date(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    };

    this.approvalRequests.set(request.id, request);

    // Actualizar claim
    claim.requiresApproval = true;
    claim.approvalLevel = level;
    claim.approvers = approvers;

    this.logger.log(`Approval request ${request.id} created - Level ${level}, ${approvers.length} approvers`);

    return request;
  }

  /**
   * Aprueba una solicitud de aprobación
   */
  async approve(requestId: string, approverId: string, notes: string): Promise<void> {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      throw new BadRequestException(`Approval request ${requestId} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Approval request is not pending (status: ${request.status})`);
    }

    // Buscar el approver
    const approver = request.approvers.find(a => a.userId === approverId);

    if (!approver) {
      throw new BadRequestException(`Approver ${approverId} not found in request`);
    }

    if (approver.status !== 'PENDING') {
      throw new BadRequestException(`Approver has already responded: ${approver.status}`);
    }

    // Marcar como aprobado
    approver.status = 'APPROVED';
    approver.approvedAt = new Date();
    approver.notes = notes;

    this.logger.log(`Approver ${approverId} approved request ${requestId}`);

    // Verificar si todos aprobaron
    const allApproved = request.approvers.every(a => a.status === 'APPROVED');

    if (allApproved) {
      request.status = 'APPROVED';
      this.logger.log(`Approval request ${requestId} fully approved`);
    }
  }

  /**
   * Rechaza una solicitud de aprobación
   */
  async reject(requestId: string, approverId: string, reason: string): Promise<void> {
    const request = this.approvalRequests.get(requestId);

    if (!request) {
      throw new BadRequestException(`Approval request ${requestId} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Approval request is not pending`);
    }

    // Buscar el approver
    const approver = request.approvers.find(a => a.userId === approverId);

    if (!approver) {
      throw new BadRequestException(`Approver ${approverId} not found`);
    }

    // Marcar como rechazado
    approver.status = 'REJECTED';
    approver.rejectedAt = new Date();
    approver.notes = reason;

    // Una sola persona rechazando es suficiente para rechazar todo
    request.status = 'REJECTED';

    this.logger.log(`Approver ${approverId} rejected request ${requestId}: ${reason}`);
  }

  /**
   * Verifica si un claim está completamente aprobado
   */
  async isFullyApproved(claim: Claim): Promise<boolean> {
    if (!claim.requiresApproval) {
      return true;
    }

    if (!claim.approvers || claim.approvers.length === 0) {
      return false;
    }

    return claim.approvers.every(a => a.status === 'APPROVED');
  }

  /**
   * Verifica si algún aprobador rechazó
   */
  async isRejected(claim: Claim): Promise<boolean> {
    if (!claim.approvers || claim.approvers.length === 0) {
      return false;
    }

    return claim.approvers.some(a => a.status === 'REJECTED');
  }

  /**
   * Obtiene aprobadores pendientes
   */
  async getPendingApprovers(claim: Claim): Promise<Approver[]> {
    if (!claim.approvers) {
      return [];
    }

    return claim.approvers.filter(a => a.status === 'PENDING');
  }

  /**
   * Verifica si se debe escalar
   */
  async shouldEscalate(claim: Claim): Promise<boolean> {
    const config = await this.configure();

    for (const rule of config.escalationRules) {
      switch (rule.condition) {
        case 'AMOUNT':
          if (claim.estimatedAmount >= rule.threshold) {
            return true;
          }
          break;

        case 'FRAUD_RISK':
          if (claim.fraudScore && claim.fraudScore >= rule.threshold) {
            return true;
          }
          break;

        case 'DURATION':
          if (claim.submittedDate) {
            const daysSinceSubmission = (Date.now() - claim.submittedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceSubmission >= rule.threshold) {
              return true;
            }
          }
          break;
      }
    }

    return false;
  }

  /**
   * Escala un claim a nivel superior
   */
  async escalate(claim: Claim, reason: string): Promise<void> {
    const currentLevel = claim.approvalLevel || 1;
    const newLevel = currentLevel + 1;

    this.logger.log(`Escalating claim ${claim.claimNumber} from level ${currentLevel} to ${newLevel}`);

    claim.approvalLevel = newLevel;

    // Añadir más aprobadores según el nuevo nivel
    const config = await this.configure();
    const newRule = config.rules.find(r => r.level === newLevel);

    if (newRule) {
      const additionalApprovers = newRule.approvers
        .filter(role => !claim.approvers?.some(a => a.role === role))
        .map(role => ({
          userId: `user_${role}`,
          userName: role.charAt(0).toUpperCase() + role.slice(1),
          role,
          level: newLevel,
          status: 'PENDING' as const,
        }));

      claim.approvers = [...(claim.approvers || []), ...additionalApprovers];
    }
  }

  /**
   * Obtiene todas las solicitudes de aprobación de un claim
   */
  async getApprovalRequests(claimId: string): Promise<ApprovalRequest[]> {
    const requests: ApprovalRequest[] = [];

    for (const request of this.approvalRequests.values()) {
      if (request.claimId === claimId) {
        requests.push(request);
      }
    }

    return requests;
  }

  /**
   * Obtiene solicitudes pendientes de un aprobador específico
   */
  async getPendingRequestsForApprover(approverId: string): Promise<ApprovalRequest[]> {
    const pending: ApprovalRequest[] = [];

    for (const request of this.approvalRequests.values()) {
      if (request.status === 'PENDING') {
        const hasApprover = request.approvers.some(
          a => a.userId === approverId && a.status === 'PENDING',
        );

        if (hasApprover) {
          pending.push(request);
        }
      }
    }

    return pending;
  }

  /**
   * Expira solicitudes antiguas
   */
  async expireOldRequests(): Promise<number> {
    let expiredCount = 0;
    const now = Date.now();

    for (const request of this.approvalRequests.values()) {
      if (request.status === 'PENDING' && request.expiresAt && request.expiresAt.getTime() < now) {
        request.status = 'EXPIRED';
        expiredCount++;
        this.logger.log(`Approval request ${request.id} expired`);
      }
    }

    return expiredCount;
  }

  // ==================== HELPERS ====================

  private isAmountInRange(amount: number, range?: { min?: number; max?: number }): boolean {
    if (!range) return true;

    if (range.min !== undefined && amount < range.min) return false;
    if (range.max !== undefined && amount > range.max) return false;

    return true;
  }

  private generateId(): string {
    return `appr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
