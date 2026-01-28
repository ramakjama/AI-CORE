import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimState } from '../enums/claim-state.enum';
import { Claim } from '../entities/claim.entity';
import { Logger } from '@nestjs/common';

/**
 * Definición de transiciones permitidas entre estados
 */
export const claimTransitions: Record<ClaimState, ClaimState[]> = {
  [ClaimState.DRAFT]: [ClaimState.SUBMITTED],

  [ClaimState.SUBMITTED]: [
    ClaimState.UNDER_REVIEW,
    ClaimState.REJECTED,
    ClaimState.DRAFT, // Puede volver a draft para correcciones
  ],

  [ClaimState.UNDER_REVIEW]: [
    ClaimState.PENDING_DOCUMENTS,
    ClaimState.INVESTIGATING,
    ClaimState.APPROVED,
    ClaimState.REJECTED,
  ],

  [ClaimState.PENDING_DOCUMENTS]: [
    ClaimState.UNDER_REVIEW, // Cuando se suben documentos
    ClaimState.REJECTED, // Si no se entregan documentos a tiempo
    ClaimState.CLOSED, // Auto-cierre por timeout
  ],

  [ClaimState.INVESTIGATING]: [
    ClaimState.APPROVED,
    ClaimState.REJECTED,
    ClaimState.PENDING_DOCUMENTS, // Puede necesitar más docs
  ],

  [ClaimState.APPROVED]: [
    ClaimState.PAYMENT_PENDING,
    ClaimState.REJECTED, // Puede revertirse
  ],

  [ClaimState.REJECTED]: [
    ClaimState.UNDER_REVIEW, // Apelación
    ClaimState.CLOSED,
  ],

  [ClaimState.PAYMENT_PENDING]: [
    ClaimState.PAID,
    ClaimState.REJECTED, // Si hay problemas con el pago
  ],

  [ClaimState.PAID]: [
    ClaimState.CLOSED,
  ],

  [ClaimState.CLOSED]: [
    ClaimState.UNDER_REVIEW, // Reapertura
  ],
};

/**
 * Razones predefinidas para transiciones
 */
export interface TransitionReason {
  code: string;
  description: string;
}

export const transitionReasons: Record<string, TransitionReason[]> = {
  SUBMIT: [
    { code: 'INITIAL_SUBMISSION', description: 'Primera presentación del siniestro' },
  ],
  REVIEW: [
    { code: 'STANDARD_REVIEW', description: 'Revisión estándar del caso' },
    { code: 'ESCALATED_REVIEW', description: 'Revisión escalada por monto alto' },
  ],
  APPROVE: [
    { code: 'WITHIN_POLICY', description: 'Cobertura confirmada dentro de póliza' },
    { code: 'MANAGER_OVERRIDE', description: 'Aprobación especial del gerente' },
  ],
  REJECT: [
    { code: 'POLICY_EXCLUSION', description: 'Excluido por términos de la póliza' },
    { code: 'INSUFFICIENT_EVIDENCE', description: 'Evidencia insuficiente' },
    { code: 'FRAUD_DETECTED', description: 'Fraude detectado' },
    { code: 'DUPLICATE_CLAIM', description: 'Siniestro duplicado' },
    { code: 'POLICY_LAPSED', description: 'Póliza vencida al momento del siniestro' },
  ],
  REQUEST_DOCS: [
    { code: 'MISSING_INVOICE', description: 'Falta factura o recibo' },
    { code: 'MISSING_REPORT', description: 'Falta reporte policial/médico' },
    { code: 'MISSING_PHOTOS', description: 'Faltan fotografías de daños' },
    { code: 'INCOMPLETE_INFO', description: 'Información incompleta' },
  ],
};

/**
 * Historial de transiciones de estado
 */
export interface StateTransitionLog {
  id: string;
  claimId: string;
  fromState: ClaimState;
  toState: ClaimState;
  reason?: string;
  reasonCode?: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * State Machine para gestión de estados de Claims
 */
@Injectable()
export class ClaimStateMachine {
  private readonly logger = new Logger(ClaimStateMachine.name);

  /**
   * Verifica si una transición es válida
   */
  canTransition(fromState: ClaimState, toState: ClaimState): boolean {
    const allowedTransitions = claimTransitions[fromState];
    return allowedTransitions?.includes(toState) ?? false;
  }

  /**
   * Obtiene las transiciones disponibles desde un estado
   */
  getAvailableTransitions(state: ClaimState): ClaimState[] {
    return claimTransitions[state] || [];
  }

  /**
   * Ejecuta una transición de estado
   */
  async transition(
    claim: Claim,
    toState: ClaimState,
    reason?: string,
    reasonCode?: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<Claim> {
    const fromState = claim.state;

    // Verificar que la transición sea válida
    if (!this.canTransition(fromState, toState)) {
      throw new BadRequestException(
        `Transición inválida: no se puede cambiar de ${fromState} a ${toState}`,
      );
    }

    // Registrar la transición
    this.logger.log(
      `Transición de claim ${claim.id}: ${fromState} -> ${toState}${reason ? ` (${reason})` : ''}`,
    );

    // Crear registro en el historial
    const transitionLog: StateTransitionLog = {
      id: this.generateId(),
      claimId: claim.id,
      fromState,
      toState,
      reason,
      reasonCode,
      userId: userId || 'system',
      timestamp: new Date(),
      metadata,
    };

    // Actualizar claim
    claim.state = toState;
    claim.lastStateChange = new Date();
    claim.stateHistory = claim.stateHistory || [];
    claim.stateHistory.push(transitionLog);

    // Ejecutar acciones post-transición
    await this.executePostTransitionActions(claim, toState, transitionLog);

    return claim;
  }

  /**
   * Valida si un claim puede transicionar a un estado específico
   */
  async canTransitionAsync(claim: Claim, toState: ClaimState): Promise<boolean> {
    // Verificación básica de transición
    if (!this.canTransition(claim.state, toState)) {
      return false;
    }

    // Validaciones adicionales según el estado destino
    switch (toState) {
      case ClaimState.APPROVED:
        // Debe tener todos los documentos requeridos
        if (!claim.hasRequiredDocuments) {
          return false;
        }
        // No debe tener banderas de fraude críticas
        if (claim.fraudRiskLevel === 'CRITICAL') {
          return false;
        }
        break;

      case ClaimState.PAYMENT_PENDING:
        // Debe estar aprobado
        if (claim.state !== ClaimState.APPROVED) {
          return false;
        }
        // Debe tener un monto aprobado
        if (!claim.approvedAmount || claim.approvedAmount <= 0) {
          return false;
        }
        break;

      case ClaimState.PAID:
        // Debe estar en pago pendiente
        if (claim.state !== ClaimState.PAYMENT_PENDING) {
          return false;
        }
        break;

      case ClaimState.CLOSED:
        // Debe estar en un estado final
        const validClosureStates = [
          ClaimState.PAID,
          ClaimState.REJECTED,
          ClaimState.PENDING_DOCUMENTS,
        ];
        if (!validClosureStates.includes(claim.state)) {
          return false;
        }
        break;
    }

    return true;
  }

  /**
   * Obtiene transiciones disponibles para un claim específico
   */
  async getAvailableTransitionsForClaim(claim: Claim): Promise<ClaimState[]> {
    const possibleStates = this.getAvailableTransitions(claim.state);
    const availableStates: ClaimState[] = [];

    for (const state of possibleStates) {
      if (await this.canTransitionAsync(claim, state)) {
        availableStates.push(state);
      }
    }

    return availableStates;
  }

  /**
   * Ejecuta acciones automáticas después de una transición
   */
  private async executePostTransitionActions(
    claim: Claim,
    newState: ClaimState,
    transitionLog: StateTransitionLog,
  ): Promise<void> {
    switch (newState) {
      case ClaimState.SUBMITTED:
        // Asignar automáticamente un ajustador
        // Enviar notificación a la aseguradora
        this.logger.log(`Claim ${claim.id} submitted - auto-assigning adjuster`);
        break;

      case ClaimState.APPROVED:
        // Generar orden de pago
        // Notificar al cliente
        this.logger.log(`Claim ${claim.id} approved - amount: €${claim.approvedAmount}`);
        break;

      case ClaimState.REJECTED:
        // Notificar rechazo con razones
        this.logger.log(`Claim ${claim.id} rejected - reason: ${transitionLog.reason}`);
        break;

      case ClaimState.PAYMENT_PENDING:
        // Iniciar proceso de pago
        this.logger.log(`Claim ${claim.id} payment pending - processing payment`);
        break;

      case ClaimState.PAID:
        // Actualizar contabilidad
        // Cerrar automáticamente después de X días
        this.logger.log(`Claim ${claim.id} paid - payment completed`);
        break;

      case ClaimState.CLOSED:
        // Archivar documentos
        // Generar reporte final
        this.logger.log(`Claim ${claim.id} closed`);
        break;
    }
  }

  /**
   * Genera un ID único para transiciones
   */
  private generateId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene el historial de estados de un claim
   */
  getStateHistory(claim: Claim): StateTransitionLog[] {
    return claim.stateHistory || [];
  }

  /**
   * Calcula el tiempo promedio en un estado específico
   */
  calculateTimeInState(claim: Claim, state: ClaimState): number {
    const history = this.getStateHistory(claim);
    let totalTime = 0;
    let count = 0;

    for (let i = 0; i < history.length; i++) {
      if (history[i].toState === state) {
        const startTime = history[i].timestamp.getTime();
        const endTime =
          i < history.length - 1
            ? history[i + 1].timestamp.getTime()
            : Date.now();
        totalTime += endTime - startTime;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 0;
  }

  /**
   * Verifica si un claim está estancado (stuck) en un estado
   */
  isStuck(claim: Claim, maxDaysInState: number = 7): boolean {
    if (!claim.lastStateChange) {
      return false;
    }

    const daysSinceLastChange =
      (Date.now() - claim.lastStateChange.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceLastChange > maxDaysInState;
  }
}
