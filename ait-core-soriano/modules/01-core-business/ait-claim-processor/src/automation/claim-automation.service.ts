import { Injectable, Logger } from '@nestjs/common';
import { Claim } from '../entities/claim.entity';
import { ClaimState, FraudRiskLevel } from '../enums/claim-state.enum';
import { ClaimStateMachine } from '../workflow/claim-state-machine';

/**
 * Regla de automatización
 */
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: number;
}

/**
 * Condición de automatización
 */
export interface AutomationCondition {
  type: 'AMOUNT' | 'DOCUMENTS' | 'FRAUD_SCORE' | 'DURATION' | 'STATE';
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: any;
}

/**
 * Acción de automatización
 */
export interface AutomationAction {
  type: 'APPROVE' | 'REJECT' | 'CLOSE' | 'ASSIGN' | 'NOTIFY' | 'ESCALATE' | 'FLAG';
  parameters?: Record<string, any>;
}

/**
 * Resultado de automatización
 */
export interface AutomationResult {
  claimId: string;
  rulesApplied: string[];
  actionsExecuted: string[];
  success: boolean;
  errors?: string[];
}

/**
 * Servicio de automatización de claims
 *
 * Reglas implementadas:
 * 1. Auto-aprobar claims < €500 con documentos válidos
 * 2. Auto-rechazar claims con score de fraude >80%
 * 3. Auto-cerrar claims sin documentos por >7 días
 * 4. Auto-flag duplicados
 * 5. Auto-asignar ajustadores según carga de trabajo
 * 6. Auto-calcular estimaciones iniciales
 * 7. Auto-notificar delays
 */
@Injectable()
export class ClaimAutomationService {
  private readonly logger = new Logger(ClaimAutomationService.name);
  private rules: AutomationRule[] = [];

  constructor(private readonly stateMachine: ClaimStateMachine) {
    this.initializeRules();
  }

  /**
   * Inicializa las reglas de automatización
   */
  private initializeRules(): void {
    this.rules = [
      {
        id: 'auto_approve_low_value',
        name: 'Auto-approve low value claims',
        description: 'Auto-aprobar claims < €500 con documentos válidos',
        enabled: true,
        priority: 1,
        conditions: [
          { type: 'AMOUNT', operator: '<', value: 500 },
          { type: 'DOCUMENTS', operator: '=', value: true }, // has valid documents
          { type: 'FRAUD_SCORE', operator: '<', value: 30 },
        ],
        actions: [
          { type: 'APPROVE', parameters: { amount: 'claimed', reason: 'Auto-approved (low value)' } },
        ],
      },
      {
        id: 'auto_reject_high_fraud',
        name: 'Auto-reject high fraud risk',
        description: 'Auto-rechazar claims con score de fraude >80%',
        enabled: true,
        priority: 2,
        conditions: [
          { type: 'FRAUD_SCORE', operator: '>', value: 80 },
        ],
        actions: [
          { type: 'REJECT', parameters: { reason: 'High fraud risk detected', reasonCode: 'FRAUD_DETECTED' } },
        ],
      },
      {
        id: 'auto_close_no_documents',
        name: 'Auto-close claims without documents',
        description: 'Auto-cerrar claims sin documentos por >7 días',
        enabled: true,
        priority: 3,
        conditions: [
          { type: 'STATE', operator: '=', value: ClaimState.PENDING_DOCUMENTS },
          { type: 'DURATION', operator: '>', value: 7 }, // días
        ],
        actions: [
          { type: 'CLOSE', parameters: { reason: 'Auto-closed: documents not provided within deadline' } },
        ],
      },
      {
        id: 'auto_escalate_high_value',
        name: 'Auto-escalate high value claims',
        description: 'Escalar automáticamente claims >€10,000',
        enabled: true,
        priority: 4,
        conditions: [
          { type: 'AMOUNT', operator: '>', value: 10000 },
        ],
        actions: [
          { type: 'ESCALATE', parameters: { reason: 'High value claim - requires senior approval' } },
        ],
      },
      {
        id: 'auto_flag_quick_claim',
        name: 'Flag claims reported too quickly',
        description: 'Marcar claims reportados muy rápido después del incidente',
        enabled: true,
        priority: 5,
        conditions: [
          { type: 'DURATION', operator: '<', value: 0.5 }, // < 12 horas
        ],
        actions: [
          { type: 'FLAG', parameters: { type: 'SUSPICIOUS_TIMING', severity: 'MEDIUM' } },
        ],
      },
    ];

    this.logger.log(`Initialized ${this.rules.length} automation rules`);
  }

  /**
   * Procesa un claim con todas las reglas de automatización
   */
  async autoProcess(claim: Claim): Promise<AutomationResult> {
    this.logger.log(`Running automation rules for claim ${claim.claimNumber}`);

    const result: AutomationResult = {
      claimId: claim.id,
      rulesApplied: [],
      actionsExecuted: [],
      success: true,
      errors: [],
    };

    // Ordenar reglas por prioridad
    const sortedRules = [...this.rules].sort((a, b) => a.priority - b.priority);

    // Evaluar cada regla
    for (const rule of sortedRules) {
      if (!rule.enabled) continue;

      try {
        const matches = await this.evaluateRule(claim, rule);

        if (matches) {
          this.logger.log(`Rule ${rule.id} matched for claim ${claim.claimNumber}`);
          result.rulesApplied.push(rule.id);

          // Ejecutar acciones
          for (const action of rule.actions) {
            try {
              await this.executeAction(claim, action);
              result.actionsExecuted.push(`${rule.id}:${action.type}`);
            } catch (error) {
              this.logger.error(`Failed to execute action ${action.type}`, error);
              result.errors?.push(`Action ${action.type} failed: ${error.message}`);
              result.success = false;
            }
          }
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id}`, error);
        result.errors?.push(`Rule ${rule.id} evaluation failed: ${error.message}`);
      }
    }

    this.logger.log(
      `Automation complete for ${claim.claimNumber}: ${result.rulesApplied.length} rules applied, ${result.actionsExecuted.length} actions executed`,
    );

    return result;
  }

  /**
   * Auto-asigna un ajustador basado en carga de trabajo
   */
  async autoAssignAdjuster(claim: Claim): Promise<string> {
    this.logger.log(`Auto-assigning adjuster for claim ${claim.claimNumber}`);

    // En producción: consultar sistema de workforce management
    // para obtener el ajustador con menor carga

    // Simulación: asignar basado en tipo de claim
    const adjustersByType: Record<string, string> = {
      AUTO_ACCIDENT: 'adj_auto_001',
      PROPERTY_DAMAGE: 'adj_property_001',
      HEALTH: 'adj_health_001',
      THEFT: 'adj_theft_001',
      FIRE: 'adj_fire_001',
      WATER_DAMAGE: 'adj_water_001',
    };

    const adjusterId = adjustersByType[claim.type] || 'adj_general_001';

    this.logger.log(`Assigned adjuster ${adjusterId} to claim ${claim.claimNumber}`);

    return adjusterId;
  }

  /**
   * Auto-calcula estimación inicial de costo
   */
  async autoCalculateEstimate(claim: Claim): Promise<number> {
    this.logger.log(`Auto-calculating estimate for claim ${claim.claimNumber}`);

    // En producción: usar ML model entrenado con datos históricos
    // Considerar: tipo de claim, ubicación, severidad, etc.

    let estimate = claim.estimatedAmount;

    // Ajustes basados en tipo
    const adjustmentFactors: Record<string, number> = {
      AUTO_ACCIDENT: 1.2,
      PROPERTY_DAMAGE: 1.15,
      HEALTH: 1.1,
      THEFT: 1.0,
      FIRE: 1.5,
      WATER_DAMAGE: 1.3,
    };

    const factor = adjustmentFactors[claim.type] || 1.0;
    estimate *= factor;

    // Ajustar por prioridad
    if (claim.priority === 'URGENT' || claim.priority === 'CRITICAL') {
      estimate *= 1.1;
    }

    this.logger.log(`Calculated estimate: €${estimate.toFixed(2)}`);

    return Math.round(estimate * 100) / 100;
  }

  /**
   * Detecta y marca claims duplicados
   */
  async autoDetectDuplicates(claim: Claim, allClaims: Claim[]): Promise<Claim[]> {
    this.logger.log(`Detecting duplicates for claim ${claim.claimNumber}`);

    const duplicates: Claim[] = [];

    for (const other of allClaims) {
      if (other.id === claim.id) continue;

      // Criterios de duplicado:
      // 1. Mismo cliente
      // 2. Mismo tipo
      // 3. Fecha de incidente cercana (dentro de 7 días)
      // 4. Monto similar (±10%)

      const sameCustomer = other.customerId === claim.customerId;
      const sameType = other.type === claim.type;

      const daysDiff = Math.abs(
        (other.incidentDate.getTime() - claim.incidentDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const nearDate = daysDiff <= 7;

      const amountDiff = Math.abs(other.estimatedAmount - claim.estimatedAmount);
      const similarAmount = amountDiff <= claim.estimatedAmount * 0.1;

      if (sameCustomer && sameType && nearDate && similarAmount) {
        duplicates.push(other);
        this.logger.warn(
          `Potential duplicate detected: ${claim.claimNumber} and ${other.claimNumber}`,
        );
      }
    }

    return duplicates;
  }

  /**
   * Auto-marca claims con alto valor
   */
  async autoFlagHighValue(claim: Claim, threshold: number = 10000): Promise<void> {
    if (claim.estimatedAmount >= threshold) {
      this.logger.log(`Flagging high-value claim ${claim.claimNumber}: €${claim.estimatedAmount}`);

      // Marcar en metadata
      claim.metadata = claim.metadata || {};
      claim.metadata.highValue = true;
      claim.metadata.flaggedAt = new Date().toISOString();
    }
  }

  /**
   * Notifica automáticamente sobre delays
   */
  async autoNotifyDelays(claim: Claim): Promise<void> {
    if (!claim.submittedDate) return;

    const daysSinceSubmission = (Date.now() - claim.submittedDate.getTime()) / (1000 * 60 * 60 * 24);

    // Definir thresholds según estado
    const delayThresholds: Record<ClaimState, number> = {
      [ClaimState.SUBMITTED]: 2,
      [ClaimState.UNDER_REVIEW]: 5,
      [ClaimState.PENDING_DOCUMENTS]: 7,
      [ClaimState.INVESTIGATING]: 10,
      [ClaimState.APPROVED]: 3,
      [ClaimState.PAYMENT_PENDING]: 2,
      [ClaimState.DRAFT]: 0,
      [ClaimState.REJECTED]: 0,
      [ClaimState.PAID]: 0,
      [ClaimState.CLOSED]: 0,
    };

    const threshold = delayThresholds[claim.state];

    if (threshold > 0 && daysSinceSubmission > threshold) {
      this.logger.warn(
        `Claim ${claim.claimNumber} delayed: ${daysSinceSubmission.toFixed(1)} days in ${claim.state}`,
      );

      // En producción: enviar notificaciones
      // await notificationService.notifyDelay(claim);

      // Marcar en metadata
      claim.metadata = claim.metadata || {};
      claim.metadata.delayed = true;
      claim.metadata.delayDays = daysSinceSubmission;
    }
  }

  /**
   * Ejecuta proceso de auto-cierre para claims antiguos
   */
  async autoCloseStaleClaims(claims: Claim[], daysThreshold: number = 90): Promise<number> {
    this.logger.log(`Checking for stale claims (threshold: ${daysThreshold} days)`);

    let closedCount = 0;

    for (const claim of claims) {
      // Solo cerrar claims en ciertos estados
      const closableStates = [ClaimState.PENDING_DOCUMENTS, ClaimState.REJECTED];

      if (!closableStates.includes(claim.state)) continue;

      const daysSinceUpdate = (Date.now() - claim.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate > daysThreshold) {
        try {
          await this.stateMachine.transition(
            claim,
            ClaimState.CLOSED,
            `Auto-closed: no activity for ${daysSinceUpdate.toFixed(0)} days`,
            'AUTO_CLOSURE',
          );

          closedCount++;
          this.logger.log(`Auto-closed stale claim ${claim.claimNumber}`);
        } catch (error) {
          this.logger.error(`Failed to auto-close claim ${claim.claimNumber}`, error);
        }
      }
    }

    this.logger.log(`Auto-closed ${closedCount} stale claims`);

    return closedCount;
  }

  /**
   * Verifica y ejecuta reglas de SLA
   */
  async checkSLA(claim: Claim): Promise<{ breached: boolean; daysRemaining: number }> {
    const slaTargets: Record<string, number> = {
      AUTO_ACCIDENT: 10,
      PROPERTY_DAMAGE: 15,
      HEALTH: 7,
      THEFT: 14,
      FIRE: 20,
      WATER_DAMAGE: 15,
      LIFE: 30,
      LIABILITY: 20,
      OTHER: 14,
    };

    const targetDays = slaTargets[claim.type] || 14;
    const submittedDate = claim.submittedDate || claim.createdAt;
    const daysSinceSubmission = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = targetDays - daysSinceSubmission;
    const breached = daysRemaining < 0;

    if (breached) {
      this.logger.warn(
        `SLA breached for claim ${claim.claimNumber}: ${Math.abs(daysRemaining).toFixed(1)} days overdue`,
      );
    }

    return {
      breached,
      daysRemaining: Math.round(daysRemaining * 10) / 10,
    };
  }

  // ==================== HELPERS ====================

  /**
   * Evalúa si un claim cumple las condiciones de una regla
   */
  private async evaluateRule(claim: Claim, rule: AutomationRule): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(claim, condition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evalúa una condición específica
   */
  private evaluateCondition(claim: Claim, condition: AutomationCondition): boolean {
    let actualValue: any;

    switch (condition.type) {
      case 'AMOUNT':
        actualValue = claim.estimatedAmount;
        break;

      case 'DOCUMENTS':
        actualValue = claim.hasRequiredDocuments;
        break;

      case 'FRAUD_SCORE':
        actualValue = claim.fraudScore || 0;
        break;

      case 'DURATION':
        // Días desde el incidente
        actualValue = (Date.now() - claim.incidentDate.getTime()) / (1000 * 60 * 60 * 24);
        break;

      case 'STATE':
        actualValue = claim.state;
        break;

      default:
        return false;
    }

    return this.compareValues(actualValue, condition.operator, condition.value);
  }

  /**
   * Compara valores según operador
   */
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '=':
        return actual === expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '!=':
        return actual !== expected;
      default:
        return false;
    }
  }

  /**
   * Ejecuta una acción de automatización
   */
  private async executeAction(claim: Claim, action: AutomationAction): Promise<void> {
    this.logger.log(`Executing action ${action.type} for claim ${claim.claimNumber}`);

    switch (action.type) {
      case 'APPROVE':
        await this.executeApprove(claim, action.parameters);
        break;

      case 'REJECT':
        await this.executeReject(claim, action.parameters);
        break;

      case 'CLOSE':
        await this.executeClose(claim, action.parameters);
        break;

      case 'ASSIGN':
        await this.executeAssign(claim, action.parameters);
        break;

      case 'ESCALATE':
        await this.executeEscalate(claim, action.parameters);
        break;

      case 'FLAG':
        await this.executeFlag(claim, action.parameters);
        break;

      case 'NOTIFY':
        await this.executeNotify(claim, action.parameters);
        break;
    }
  }

  private async executeApprove(claim: Claim, params: any): Promise<void> {
    const amount = params.amount === 'claimed' ? claim.claimedAmount : params.amount;

    await this.stateMachine.transition(
      claim,
      ClaimState.APPROVED,
      params.reason || 'Auto-approved',
      'AUTO_APPROVAL',
    );

    claim.approvedAmount = amount;
    claim.approvedDate = new Date();
  }

  private async executeReject(claim: Claim, params: any): Promise<void> {
    await this.stateMachine.transition(
      claim,
      ClaimState.REJECTED,
      params.reason || 'Auto-rejected',
      params.reasonCode || 'AUTO_REJECTION',
    );

    claim.rejectedDate = new Date();
  }

  private async executeClose(claim: Claim, params: any): Promise<void> {
    await this.stateMachine.transition(
      claim,
      ClaimState.CLOSED,
      params.reason || 'Auto-closed',
      'AUTO_CLOSURE',
    );

    claim.closedDate = new Date();
  }

  private async executeAssign(claim: Claim, params: any): Promise<void> {
    const adjusterId = params.adjusterId || (await this.autoAssignAdjuster(claim));
    claim.adjusterId = adjusterId;
  }

  private async executeEscalate(claim: Claim, params: any): Promise<void> {
    claim.priority = 'URGENT';
    claim.metadata = claim.metadata || {};
    claim.metadata.escalated = true;
    claim.metadata.escalationReason = params.reason;
  }

  private async executeFlag(claim: Claim, params: any): Promise<void> {
    claim.metadata = claim.metadata || {};
    claim.metadata.flags = claim.metadata.flags || [];
    claim.metadata.flags.push({
      type: params.type,
      severity: params.severity,
      timestamp: new Date().toISOString(),
    });
  }

  private async executeNotify(claim: Claim, params: any): Promise<void> {
    // En producción: enviar notificaciones reales
    this.logger.log(`Notification sent for claim ${claim.claimNumber}: ${params.message}`);
  }
}
