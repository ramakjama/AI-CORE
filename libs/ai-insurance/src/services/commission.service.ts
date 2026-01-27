/**
 * Commission Service
 * Servicio de gestión de comisiones de mediadores
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { format, startOfMonth, endOfMonth, addMonths, isWithinInterval } from 'date-fns';

import {
  Commission,
  CommissionRule,
  CommissionCondition,
  Settlement,
  SettlementStatus,
  CommissionStatement,
  CommissionSummary,
  BranchCommissionDetail,
  OperationCommissionDetail,
  Policy,
  Receipt,
  InsuranceBranch,
  OperationType,
  ReceiptStatus,
  SPAIN_TAX_RATES,
  STANDARD_COMMISSION_RATES,
} from '../types';

import { policyService } from './policy.service';
import { receiptService } from './receipt.service';

// ============================================================================
// Datos simulados
// ============================================================================

const commissions: Map<string, Commission> = new Map();
const commissionRules: Map<string, CommissionRule> = new Map();
const settlements: Map<string, Settlement> = new Map();

// Inicializar reglas estándar
function initializeStandardRules(): void {
  const branches = Object.values(InsuranceBranch);
  const operations = [OperationType.NEW_BUSINESS, OperationType.RENEWAL, OperationType.ENDORSEMENT];

  for (const branch of branches) {
    for (const operation of operations) {
      const rateConfig = (STANDARD_COMMISSION_RATES as Record<string, Record<string, number>>)[branch];
      const rate = rateConfig?.[operation] || 0.10;

      const rule: CommissionRule = {
        id: uuidv4(),
        name: `Comisión ${branch} - ${operation}`,
        description: `Comisión estándar para ${branch} en operación ${operation}`,
        branch: branch as InsuranceBranch,
        operationType: operation,
        commissionRate: rate,
        validFrom: new Date('2020-01-01'),
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      commissionRules.set(rule.id, rule);
    }
  }
}

// Inicializar reglas al cargar el módulo
initializeStandardRules();

// ============================================================================
// Tipos internos
// ============================================================================

export interface CommissionCalculationResult {
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  withholdingTax: number;
  withholdingRate: number;
  netAmount: number;
  appliedRule?: CommissionRule;
}

interface AdjustmentData {
  reason: string;
  amount: number;
  type: 'INCREASE' | 'DECREASE';
}

// ============================================================================
// Clase CommissionService
// ============================================================================

export class CommissionService {
  /**
   * Genera un número de liquidación único
   */
  private generateSettlementNumber(agentId: string, period: string): string {
    const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `LIQ-${agentId.slice(0, 6).toUpperCase()}-${period}-${sequence}`;
  }

  /**
   * Calcula la comisión para una póliza
   */
  async calculateCommission(
    policyId: string,
    operationType: OperationType = OperationType.NEW_BUSINESS,
    receiptId?: string
  ): Promise<Commission> {
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (!policy.agentId) {
      throw new Error('La póliza no tiene mediador asignado');
    }

    // Obtener recibo si se proporciona, o usar prima total
    let baseAmount: number;
    let receipt: Receipt | null = null;

    if (receiptId) {
      receipt = await receiptService.getReceiptById(receiptId);
      if (!receipt) {
        throw new Error(`Recibo no encontrado: ${receiptId}`);
      }
      baseAmount = receipt.netAmount; // Comisión sobre prima neta
    } else {
      baseAmount = policy.premium.netPremium;
    }

    // Buscar reglas aplicables
    const applicableRules = await this.findApplicableRules(policy, operationType);

    if (applicableRules.length === 0) {
      throw new Error(`No hay reglas de comisión aplicables para ${policy.branch} - ${operationType}`);
    }

    // Aplicar reglas y obtener resultado
    const calculationResult = this.applyCommissionRules(policy, applicableRules, baseAmount);

    // Crear registro de comisión
    const commission: Commission = {
      id: uuidv4(),
      policyId,
      policyNumber: policy.policyNumber,
      receiptId: receiptId || '',
      receiptNumber: receipt?.receiptNumber || '',
      agentId: policy.agentId,
      agentName: '', // Se obtendría del servicio de partes
      branch: policy.branch,
      operationType,
      baseAmount: calculationResult.baseAmount,
      commissionRate: calculationResult.commissionRate,
      commissionAmount: calculationResult.commissionAmount,
      withholdingTax: calculationResult.withholdingTax,
      withholdingRate: calculationResult.withholdingRate,
      netAmount: calculationResult.netAmount,
      currency: 'EUR',
      status: 'CALCULATED',
      calculatedAt: new Date(),
      createdAt: new Date(),
    };

    commissions.set(commission.id, commission);

    return commission;
  }

  /**
   * Busca reglas de comisión aplicables
   */
  private async findApplicableRules(
    policy: Policy,
    operationType: OperationType
  ): Promise<CommissionRule[]> {
    const applicableRules: CommissionRule[] = [];
    const now = new Date();

    for (const rule of commissionRules.values()) {
      // Verificar que la regla está activa
      if (!rule.active) continue;

      // Verificar vigencia
      if (rule.validFrom > now) continue;
      if (rule.validTo && rule.validTo < now) continue;

      // Verificar ramo
      if (rule.branch !== policy.branch) continue;

      // Verificar tipo de operación
      if (rule.operationType !== operationType) continue;

      // Verificar código de producto (si está especificado)
      if (rule.productCode && rule.productCode !== policy.productCode) continue;

      // Evaluar condiciones adicionales
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(rule.conditions, policy);
        if (!conditionsMet) continue;
      }

      applicableRules.push(rule);
    }

    // Ordenar por especificidad (más específico primero)
    return applicableRules.sort((a, b) => {
      // Priorizar reglas con código de producto
      if (a.productCode && !b.productCode) return -1;
      if (!a.productCode && b.productCode) return 1;
      // Priorizar reglas con más condiciones
      const aConditions = a.conditions?.length || 0;
      const bConditions = b.conditions?.length || 0;
      return bConditions - aConditions;
    });
  }

  /**
   * Evalúa condiciones de una regla
   */
  private evaluateConditions(conditions: CommissionCondition[], policy: Policy): boolean {
    for (const condition of conditions) {
      const value = this.getFieldValue(policy, condition.field);

      switch (condition.operator) {
        case 'EQ':
          if (value !== condition.value) return false;
          break;
        case 'NEQ':
          if (value === condition.value) return false;
          break;
        case 'GT':
          if (typeof value !== 'number' || value <= (condition.value as number)) return false;
          break;
        case 'GTE':
          if (typeof value !== 'number' || value < (condition.value as number)) return false;
          break;
        case 'LT':
          if (typeof value !== 'number' || value >= (condition.value as number)) return false;
          break;
        case 'LTE':
          if (typeof value !== 'number' || value > (condition.value as number)) return false;
          break;
        case 'IN':
          if (!Array.isArray(condition.value) || !condition.value.includes(value)) return false;
          break;
        case 'CONTAINS':
          if (typeof value !== 'string' || !value.includes(condition.value as string)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Obtiene el valor de un campo de la póliza
   */
  private getFieldValue(policy: Policy, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = policy;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Aplica reglas de comisión y calcula el resultado
   */
  applyCommissionRules(
    policy: Policy,
    rules: CommissionRule[],
    baseAmount: number
  ): CommissionCalculationResult {
    // Usar la primera regla aplicable (la más específica)
    const rule = rules[0];

    if (!rule) {
      throw new Error('No hay reglas aplicables');
    }

    // Calcular comisión
    const commissionAmount = new Decimal(baseAmount)
      .mul(rule.commissionRate)
      .toDecimalPlaces(2)
      .toNumber();

    // Aplicar límites si existen
    let finalCommission = commissionAmount;
    if (rule.minAmount && finalCommission < rule.minAmount) {
      finalCommission = rule.minAmount;
    }
    if (rule.maxAmount && finalCommission > rule.maxAmount) {
      finalCommission = rule.maxAmount;
    }

    // Calcular retención IRPF (15% estándar para mediadores)
    const withholdingRate = SPAIN_TAX_RATES.WITHHOLDING_COMMISSION;
    const withholdingTax = new Decimal(finalCommission)
      .mul(withholdingRate)
      .toDecimalPlaces(2)
      .toNumber();

    const netAmount = new Decimal(finalCommission)
      .minus(withholdingTax)
      .toDecimalPlaces(2)
      .toNumber();

    return {
      baseAmount,
      commissionRate: rule.commissionRate,
      commissionAmount: finalCommission,
      withholdingTax,
      withholdingRate,
      netAmount,
      appliedRule: rule,
    };
  }

  /**
   * Genera liquidación de comisiones para un agente
   */
  async generateSettlement(
    agentId: string,
    period: string, // Formato: YYYY-MM
    options?: {
      includeUnpaidReceipts?: boolean;
      autoApprove?: boolean;
    }
  ): Promise<Settlement> {
    // Parsear período
    const [year, month] = period.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(periodStart);

    // Buscar comisiones del agente en el período
    const agentCommissions: Commission[] = [];
    let totalCommissions = new Decimal(0);
    let totalWithholdings = new Decimal(0);

    for (const commission of commissions.values()) {
      if (commission.agentId !== agentId) continue;
      if (commission.status === 'SETTLED' || commission.status === 'PAID') continue;

      // Verificar si está en el período
      if (!isWithinInterval(commission.calculatedAt, { start: periodStart, end: periodEnd })) {
        continue;
      }

      // Verificar estado del recibo (si aplica)
      if (!options?.includeUnpaidReceipts && commission.receiptId) {
        const receipt = await receiptService.getReceiptById(commission.receiptId);
        if (receipt && receipt.status !== ReceiptStatus.PAID) {
          continue; // Solo liquidar comisiones de recibos cobrados
        }
      }

      agentCommissions.push(commission);
      totalCommissions = totalCommissions.plus(commission.commissionAmount);
      totalWithholdings = totalWithholdings.plus(commission.withholdingTax);
    }

    if (agentCommissions.length === 0) {
      throw new Error(`No hay comisiones pendientes para el agente ${agentId} en el período ${period}`);
    }

    const netAmount = totalCommissions.minus(totalWithholdings).toDecimalPlaces(2).toNumber();

    const settlement: Settlement = {
      id: uuidv4(),
      settlementNumber: this.generateSettlementNumber(agentId, period),
      agentId,
      agentName: '', // Se obtendría del servicio de partes
      agentDocument: '', // Se obtendría del servicio de partes
      period,
      periodStart,
      periodEnd,
      totalCommissions: totalCommissions.toDecimalPlaces(2).toNumber(),
      totalAdjustments: 0,
      totalWithholdings: totalWithholdings.toDecimalPlaces(2).toNumber(),
      netAmount,
      currency: 'EUR',
      status: options?.autoApprove ? SettlementStatus.APPROVED : SettlementStatus.DRAFT,
      commissions: agentCommissions,
      createdAt: new Date(),
      approvedAt: options?.autoApprove ? new Date() : undefined,
    };

    settlements.set(settlement.id, settlement);

    // Marcar comisiones como liquidadas
    for (const commission of agentCommissions) {
      commission.status = 'SETTLED';
      commission.settlementId = settlement.id;
    }

    return settlement;
  }

  /**
   * Obtiene el extracto de comisiones de un agente
   */
  async getCommissionStatement(
    agentId: string,
    period: string
  ): Promise<CommissionStatement> {
    // Parsear período
    const [year, month] = period.split('-').map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(periodStart);

    // Buscar comisiones del agente en el período
    const agentCommissions: Commission[] = [];
    const detailByBranch: Map<InsuranceBranch, BranchCommissionDetail> = new Map();
    const detailByOperation: Map<OperationType, OperationCommissionDetail> = new Map();

    let newBusinessTotal = new Decimal(0);
    let renewalTotal = new Decimal(0);
    let endorsementTotal = new Decimal(0);
    let cancellationTotal = new Decimal(0);
    let totalGross = new Decimal(0);
    let totalWithholdings = new Decimal(0);

    for (const commission of commissions.values()) {
      if (commission.agentId !== agentId) continue;

      // Verificar si está en el período
      if (!isWithinInterval(commission.calculatedAt, { start: periodStart, end: periodEnd })) {
        continue;
      }

      agentCommissions.push(commission);
      totalGross = totalGross.plus(commission.commissionAmount);
      totalWithholdings = totalWithholdings.plus(commission.withholdingTax);

      // Acumular por tipo de operación
      switch (commission.operationType) {
        case OperationType.NEW_BUSINESS:
          newBusinessTotal = newBusinessTotal.plus(commission.commissionAmount);
          break;
        case OperationType.RENEWAL:
          renewalTotal = renewalTotal.plus(commission.commissionAmount);
          break;
        case OperationType.ENDORSEMENT:
          endorsementTotal = endorsementTotal.plus(commission.commissionAmount);
          break;
        case OperationType.CANCELLATION:
          cancellationTotal = cancellationTotal.plus(commission.commissionAmount);
          break;
      }

      // Acumular por ramo
      const branchDetail = detailByBranch.get(commission.branch) || {
        branch: commission.branch,
        policies: 0,
        premiumVolume: 0,
        commissionAmount: 0,
        averageRate: 0,
      };
      branchDetail.policies++;
      branchDetail.premiumVolume = new Decimal(branchDetail.premiumVolume)
        .plus(commission.baseAmount)
        .toNumber();
      branchDetail.commissionAmount = new Decimal(branchDetail.commissionAmount)
        .plus(commission.commissionAmount)
        .toNumber();
      detailByBranch.set(commission.branch, branchDetail);

      // Acumular por operación
      const opDetail = detailByOperation.get(commission.operationType) || {
        operationType: commission.operationType,
        transactions: 0,
        premiumVolume: 0,
        commissionAmount: 0,
      };
      opDetail.transactions++;
      opDetail.premiumVolume = new Decimal(opDetail.premiumVolume)
        .plus(commission.baseAmount)
        .toNumber();
      opDetail.commissionAmount = new Decimal(opDetail.commissionAmount)
        .plus(commission.commissionAmount)
        .toNumber();
      detailByOperation.set(commission.operationType, opDetail);
    }

    // Calcular tasas medias por ramo
    for (const detail of detailByBranch.values()) {
      if (detail.premiumVolume > 0) {
        detail.averageRate = new Decimal(detail.commissionAmount)
          .div(detail.premiumVolume)
          .toDecimalPlaces(4)
          .toNumber();
      }
    }

    const summary: CommissionSummary = {
      newBusinessCommissions: newBusinessTotal.toDecimalPlaces(2).toNumber(),
      renewalCommissions: renewalTotal.toDecimalPlaces(2).toNumber(),
      endorsementCommissions: endorsementTotal.toDecimalPlaces(2).toNumber(),
      cancellationCommissions: cancellationTotal.toDecimalPlaces(2).toNumber(),
      totalGross: totalGross.toDecimalPlaces(2).toNumber(),
      totalWithholdings: totalWithholdings.toDecimalPlaces(2).toNumber(),
      totalNet: totalGross.minus(totalWithholdings).toDecimalPlaces(2).toNumber(),
    };

    return {
      agentId,
      agentName: '', // Se obtendría del servicio de partes
      period,
      periodStart,
      periodEnd,
      summary,
      detailByBranch: Array.from(detailByBranch.values()),
      detailByOperation: Array.from(detailByOperation.values()),
      commissions: agentCommissions,
    };
  }

  /**
   * Ajusta una comisión
   */
  async adjustCommission(
    commissionId: string,
    reason: string,
    amount: number
  ): Promise<Commission> {
    const commission = commissions.get(commissionId);
    if (!commission) {
      throw new Error(`Comisión no encontrada: ${commissionId}`);
    }

    if (commission.status === 'PAID') {
      throw new Error('No se puede ajustar una comisión ya pagada');
    }

    const previousAmount = commission.commissionAmount;
    const adjustment = new Decimal(amount);

    // Actualizar comisión
    commission.commissionAmount = adjustment.toDecimalPlaces(2).toNumber();

    // Recalcular retención
    commission.withholdingTax = adjustment
      .mul(commission.withholdingRate)
      .toDecimalPlaces(2)
      .toNumber();

    commission.netAmount = adjustment
      .minus(commission.withholdingTax)
      .toDecimalPlaces(2)
      .toNumber();

    commission.status = 'ADJUSTED';

    // Registrar el ajuste (en producción se guardaría en una tabla de histórico)
    console.log(`Ajuste de comisión ${commissionId}: ${previousAmount} -> ${amount}. Motivo: ${reason}`);

    return commission;
  }

  /**
   * Aprueba una liquidación
   */
  async approveSettlement(settlementId: string, approvedBy: string): Promise<Settlement> {
    const settlement = settlements.get(settlementId);
    if (!settlement) {
      throw new Error(`Liquidación no encontrada: ${settlementId}`);
    }

    if (settlement.status !== SettlementStatus.DRAFT && settlement.status !== SettlementStatus.PENDING) {
      throw new Error(`La liquidación no se puede aprobar en estado: ${settlement.status}`);
    }

    settlement.status = SettlementStatus.APPROVED;
    settlement.approvedAt = new Date();

    return settlement;
  }

  /**
   * Marca una liquidación como pagada
   */
  async markSettlementAsPaid(
    settlementId: string,
    paymentData: {
      paymentDate: Date;
      paymentReference: string;
      iban?: string;
    }
  ): Promise<Settlement> {
    const settlement = settlements.get(settlementId);
    if (!settlement) {
      throw new Error(`Liquidación no encontrada: ${settlementId}`);
    }

    if (settlement.status !== SettlementStatus.APPROVED) {
      throw new Error('La liquidación debe estar aprobada para marcarla como pagada');
    }

    settlement.status = SettlementStatus.PAID;
    settlement.paymentDate = paymentData.paymentDate;
    settlement.paymentReference = paymentData.paymentReference;
    settlement.paidAt = new Date();

    if (paymentData.iban) {
      settlement.iban = paymentData.iban;
    }

    // Marcar comisiones como pagadas
    for (const commission of settlement.commissions) {
      commission.status = 'PAID';
    }

    return settlement;
  }

  /**
   * Cancela una liquidación
   */
  async cancelSettlement(settlementId: string, reason: string): Promise<Settlement> {
    const settlement = settlements.get(settlementId);
    if (!settlement) {
      throw new Error(`Liquidación no encontrada: ${settlementId}`);
    }

    if (settlement.status === SettlementStatus.PAID) {
      throw new Error('No se puede cancelar una liquidación ya pagada');
    }

    settlement.status = SettlementStatus.CANCELLED;

    // Revertir estado de comisiones
    for (const commission of settlement.commissions) {
      commission.status = 'CALCULATED';
      commission.settlementId = undefined;
    }

    return settlement;
  }

  /**
   * Crea una regla de comisión personalizada
   */
  async createCommissionRule(
    ruleData: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CommissionRule> {
    const rule: CommissionRule = {
      ...ruleData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commissionRules.set(rule.id, rule);

    return rule;
  }

  /**
   * Actualiza una regla de comisión
   */
  async updateCommissionRule(
    ruleId: string,
    updates: Partial<Omit<CommissionRule, 'id' | 'createdAt'>>
  ): Promise<CommissionRule> {
    const rule = commissionRules.get(ruleId);
    if (!rule) {
      throw new Error(`Regla no encontrada: ${ruleId}`);
    }

    Object.assign(rule, updates, { updatedAt: new Date() });

    return rule;
  }

  /**
   * Desactiva una regla de comisión
   */
  async deactivateCommissionRule(ruleId: string): Promise<CommissionRule> {
    const rule = commissionRules.get(ruleId);
    if (!rule) {
      throw new Error(`Regla no encontrada: ${ruleId}`);
    }

    rule.active = false;
    rule.validTo = new Date();
    rule.updatedAt = new Date();

    return rule;
  }

  /**
   * Obtiene comisiones por agente
   */
  async getCommissionsByAgent(agentId: string): Promise<Commission[]> {
    const result: Commission[] = [];
    for (const commission of commissions.values()) {
      if (commission.agentId === agentId) {
        result.push(commission);
      }
    }
    return result.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }

  /**
   * Obtiene comisiones por póliza
   */
  async getCommissionsByPolicy(policyId: string): Promise<Commission[]> {
    const result: Commission[] = [];
    for (const commission of commissions.values()) {
      if (commission.policyId === policyId) {
        result.push(commission);
      }
    }
    return result;
  }

  /**
   * Obtiene liquidaciones por agente
   */
  async getSettlementsByAgent(agentId: string): Promise<Settlement[]> {
    const result: Settlement[] = [];
    for (const settlement of settlements.values()) {
      if (settlement.agentId === agentId) {
        result.push(settlement);
      }
    }
    return result.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
  }

  /**
   * Obtiene una liquidación por ID
   */
  async getSettlementById(settlementId: string): Promise<Settlement | null> {
    return settlements.get(settlementId) || null;
  }

  /**
   * Obtiene reglas de comisión activas
   */
  async getActiveCommissionRules(branch?: InsuranceBranch): Promise<CommissionRule[]> {
    const result: CommissionRule[] = [];
    const now = new Date();

    for (const rule of commissionRules.values()) {
      if (!rule.active) continue;
      if (rule.validFrom > now) continue;
      if (rule.validTo && rule.validTo < now) continue;
      if (branch && rule.branch !== branch) continue;

      result.push(rule);
    }

    return result;
  }

  /**
   * Genera informe de comisiones
   */
  async getCommissionsReport(
    startDate: Date,
    endDate: Date,
    groupBy?: 'agent' | 'branch' | 'operation'
  ): Promise<{
    totalCommissions: number;
    totalWithholdings: number;
    totalNet: number;
    commissionsCount: number;
    breakdown: Array<{
      key: string;
      commissions: number;
      amount: number;
      percentage: number;
    }>;
  }> {
    let totalCommissions = new Decimal(0);
    let totalWithholdings = new Decimal(0);
    let commissionsCount = 0;

    const breakdown: Map<string, { commissions: number; amount: Decimal }> = new Map();

    for (const commission of commissions.values()) {
      if (!isWithinInterval(commission.calculatedAt, { start: startDate, end: endDate })) {
        continue;
      }

      commissionsCount++;
      totalCommissions = totalCommissions.plus(commission.commissionAmount);
      totalWithholdings = totalWithholdings.plus(commission.withholdingTax);

      // Agrupar
      let key: string;
      switch (groupBy) {
        case 'agent':
          key = commission.agentId;
          break;
        case 'branch':
          key = commission.branch;
          break;
        case 'operation':
          key = commission.operationType;
          break;
        default:
          key = 'total';
      }

      const current = breakdown.get(key) || { commissions: 0, amount: new Decimal(0) };
      current.commissions++;
      current.amount = current.amount.plus(commission.commissionAmount);
      breakdown.set(key, current);
    }

    const breakdownArray = Array.from(breakdown.entries()).map(([key, value]) => ({
      key,
      commissions: value.commissions,
      amount: value.amount.toDecimalPlaces(2).toNumber(),
      percentage: totalCommissions.isZero()
        ? 0
        : value.amount.div(totalCommissions).mul(100).toDecimalPlaces(2).toNumber(),
    }));

    return {
      totalCommissions: totalCommissions.toDecimalPlaces(2).toNumber(),
      totalWithholdings: totalWithholdings.toDecimalPlaces(2).toNumber(),
      totalNet: totalCommissions.minus(totalWithholdings).toDecimalPlaces(2).toNumber(),
      commissionsCount,
      breakdown: breakdownArray.sort((a, b) => b.amount - a.amount),
    };
  }
}

// Exportar instancia singleton
export const commissionService = new CommissionService();
