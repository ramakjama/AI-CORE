/**
 * Claim Service
 * Servicio de gestión de siniestros
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { format, differenceInDays, isWithinInterval } from 'date-fns';

import {
  Claim,
  ClaimStatus,
  ClaimType,
  ClaimReserve,
  ClaimPayment,
  ReserveType,
  IncidentData,
  Coverage,
  CoverageType,
  Policy,
  PolicyStatus,
  PaymentMethod,
} from '../types';

import { policyService } from './policy.service';

// ============================================================================
// Datos simulados
// ============================================================================

const claims: Map<string, Claim> = new Map();
const claimReserves: Map<string, ClaimReserve[]> = new Map();
const claimPayments: Map<string, ClaimPayment[]> = new Map();

// ============================================================================
// Tipos internos
// ============================================================================

export interface CoverageCheckResult {
  covered: boolean;
  coverage?: Coverage;
  reason?: string;
  sumInsured?: number;
  deductible?: number;
  remainingLimit?: number;
}

export interface DeductibleCalculation {
  deductibleType: 'FIXED' | 'PERCENTAGE' | 'DAYS';
  deductibleValue: number;
  claimAmount: number;
  deductibleAmount: number;
  payableAmount: number;
}

// ============================================================================
// Mapeo de tipos de siniestro a coberturas
// ============================================================================

const CLAIM_TYPE_TO_COVERAGE: Partial<Record<ClaimType, CoverageType[]>> = {
  [ClaimType.COLLISION]: [CoverageType.DANOS_PROPIOS, CoverageType.RC_OBLIGATORIO, CoverageType.RC_VOLUNTARIO],
  [ClaimType.THEFT]: [CoverageType.ROBO],
  [ClaimType.VANDALISM]: [CoverageType.DANOS_PROPIOS],
  [ClaimType.FIRE]: [CoverageType.INCENDIO],
  [ClaimType.NATURAL_DISASTER]: [CoverageType.DANOS_PROPIOS, CoverageType.CONTINENTE, CoverageType.CONTENIDO],
  [ClaimType.GLASS_BREAKAGE]: [CoverageType.LUNAS, CoverageType.ROTURA_CRISTALES],
  [ClaimType.ROADSIDE_ASSISTANCE]: [CoverageType.ASISTENCIA_VIAJE],
  [ClaimType.WATER_DAMAGE]: [CoverageType.AGUA, CoverageType.CONTINENTE, CoverageType.CONTENIDO],
  [ClaimType.ELECTRICAL]: [CoverageType.CONTINENTE, CoverageType.CONTENIDO],
  [ClaimType.BURGLARY]: [CoverageType.ROBO, CoverageType.CONTENIDO],
  [ClaimType.LIABILITY]: [CoverageType.RC_FAMILIAR, CoverageType.RC_OBLIGATORIO, CoverageType.RC_VOLUNTARIO],
  [ClaimType.DEATH]: [CoverageType.FALLECIMIENTO],
  [ClaimType.DISABILITY]: [CoverageType.IPA, CoverageType.IPT],
  [ClaimType.HOSPITALIZATION]: [CoverageType.HOSPITALIZACION],
  [ClaimType.MEDICAL]: [CoverageType.AMBULATORIO],
};

// ============================================================================
// Clase ClaimService
// ============================================================================

export class ClaimService {
  /**
   * Genera un número de siniestro único
   */
  private generateClaimNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    return `SIN${year}${sequence}`;
  }

  /**
   * Genera un número de pago único
   */
  private generatePaymentNumber(claimNumber: string, sequence: number): string {
    return `${claimNumber}-P${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Abre un nuevo siniestro
   */
  async openClaim(policyId: string, incidentData: IncidentData): Promise<Claim> {
    // Verificar póliza
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    // Verificar que la póliza está activa
    if (policy.status !== PolicyStatus.ACTIVE && policy.status !== PolicyStatus.SUSPENDED) {
      throw new Error(`No se puede abrir siniestro para póliza en estado: ${policy.status}`);
    }

    // Verificar que la fecha del siniestro está dentro del período de cobertura
    const incidentDate = new Date(incidentData.incidentDate);
    if (!isWithinInterval(incidentDate, {
      start: policy.effectiveDate,
      end: policy.expirationDate,
    })) {
      throw new Error('La fecha del siniestro no está dentro del período de cobertura');
    }

    // Verificar cobertura
    const coverageCheck = await this.checkCoverage(policyId, incidentData.type);
    if (!coverageCheck.covered) {
      throw new Error(`Siniestro no cubierto: ${coverageCheck.reason}`);
    }

    const claimId = uuidv4();
    const claimNumber = this.generateClaimNumber();

    // Establecer reserva inicial (estimación o valor por defecto)
    const initialReserve = incidentData.estimatedAmount || this.getDefaultReserve(incidentData.type);

    const claim: Claim = {
      id: claimId,
      claimNumber,
      policyId,
      policyNumber: policy.policyNumber,
      coverageId: coverageCheck.coverage!.id,
      type: incidentData.type,
      status: ClaimStatus.REPORTED,
      incidentDate,
      reportedDate: new Date(),
      description: incidentData.description,
      location: incidentData.location,
      circumstances: incidentData.circumstances,
      currentReserve: initialReserve,
      totalPaid: 0,
      recoveries: 0,
      deductibleApplied: 0,
      hasThirdParties: incidentData.hasThirdParties || false,
      thirdParties: incidentData.thirdParties,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    claims.set(claimId, claim);

    // Crear reserva inicial
    await this.updateReserve(claimId, initialReserve, ReserveType.INITIAL, 'Reserva inicial automática');

    return claim;
  }

  /**
   * Obtiene reserva por defecto según tipo de siniestro
   */
  private getDefaultReserve(type: ClaimType): number {
    const defaults: Partial<Record<ClaimType, number>> = {
      [ClaimType.COLLISION]: 2000,
      [ClaimType.THEFT]: 5000,
      [ClaimType.VANDALISM]: 500,
      [ClaimType.FIRE]: 10000,
      [ClaimType.NATURAL_DISASTER]: 15000,
      [ClaimType.GLASS_BREAKAGE]: 300,
      [ClaimType.ROADSIDE_ASSISTANCE]: 150,
      [ClaimType.WATER_DAMAGE]: 1500,
      [ClaimType.ELECTRICAL]: 800,
      [ClaimType.BURGLARY]: 3000,
      [ClaimType.LIABILITY]: 5000,
      [ClaimType.DEATH]: 50000,
      [ClaimType.DISABILITY]: 30000,
      [ClaimType.HOSPITALIZATION]: 2000,
      [ClaimType.MEDICAL]: 500,
    };
    return defaults[type] || 1000;
  }

  /**
   * Asigna un perito/tramitador al siniestro
   */
  async assignAdjuster(claimId: string, adjusterId: string, adjusterName?: string): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (claim.status === ClaimStatus.CLOSED) {
      throw new Error('No se puede asignar perito a un siniestro cerrado');
    }

    claim.adjusterId = adjusterId;
    claim.adjusterName = adjusterName;
    claim.status = ClaimStatus.ASSIGNED;
    claim.updatedAt = new Date();

    return claim;
  }

  /**
   * Actualiza la reserva del siniestro
   */
  async updateReserve(
    claimId: string,
    amount: number,
    type: ReserveType,
    reason?: string
  ): Promise<ClaimReserve> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (claim.status === ClaimStatus.CLOSED) {
      throw new Error('No se puede modificar la reserva de un siniestro cerrado');
    }

    if (amount < 0) {
      throw new Error('La reserva no puede ser negativa');
    }

    const previousAmount = claim.currentReserve;

    const reserve: ClaimReserve = {
      id: uuidv4(),
      claimId,
      type,
      amount,
      previousAmount,
      reason: reason || `Ajuste de reserva: ${type}`,
      createdAt: new Date(),
      createdBy: 'system',
    };

    // Guardar historial de reservas
    const reserves = claimReserves.get(claimId) || [];
    reserves.push(reserve);
    claimReserves.set(claimId, reserves);

    // Actualizar reserva actual en el siniestro
    claim.currentReserve = amount;
    claim.updatedAt = new Date();

    return reserve;
  }

  /**
   * Procesa un pago del siniestro
   */
  async processPayment(
    claimId: string,
    amount: number,
    beneficiary: string,
    options?: {
      beneficiaryType?: 'INSURED' | 'THIRD_PARTY' | 'PROVIDER' | 'OTHER';
      concept?: string;
      paymentMethod?: PaymentMethod;
      iban?: string;
      taxes?: number;
      retentions?: number;
    }
  ): Promise<ClaimPayment> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (claim.status === ClaimStatus.CLOSED || claim.status === ClaimStatus.REJECTED) {
      throw new Error(`No se puede procesar pago para siniestro en estado: ${claim.status}`);
    }

    if (amount <= 0) {
      throw new Error('El importe del pago debe ser positivo');
    }

    // Verificar que no se supera la reserva
    const totalAfterPayment = claim.totalPaid + amount;
    if (totalAfterPayment > claim.currentReserve) {
      // Ajustar reserva automáticamente
      await this.updateReserve(
        claimId,
        totalAfterPayment,
        ReserveType.ADJUSTED,
        `Ajuste por pago que supera reserva. Pago: ${amount} EUR`
      );
    }

    // Calcular neto
    const taxes = options?.taxes || 0;
    const retentions = options?.retentions || 0;
    const netAmount = new Decimal(amount).minus(taxes).minus(retentions).toDecimalPlaces(2).toNumber();

    // Obtener secuencia de pago
    const existingPayments = claimPayments.get(claimId) || [];
    const paymentSequence = existingPayments.length + 1;

    const payment: ClaimPayment = {
      id: uuidv4(),
      claimId,
      paymentNumber: this.generatePaymentNumber(claim.claimNumber, paymentSequence),
      beneficiary,
      beneficiaryType: options?.beneficiaryType || 'INSURED',
      concept: options?.concept || `Pago siniestro ${claim.claimNumber}`,
      amount,
      taxes,
      retentions,
      netAmount,
      paymentMethod: options?.paymentMethod || PaymentMethod.BANK_TRANSFER,
      iban: options?.iban,
      paymentDate: new Date(),
      status: 'PENDING',
      createdAt: new Date(),
    };

    existingPayments.push(payment);
    claimPayments.set(claimId, existingPayments);

    // Actualizar total pagado en el siniestro
    claim.totalPaid = new Decimal(claim.totalPaid).plus(amount).toDecimalPlaces(2).toNumber();
    claim.status = ClaimStatus.IN_PROGRESS;
    claim.updatedAt = new Date();

    return payment;
  }

  /**
   * Aprueba un pago pendiente
   */
  async approvePayment(claimId: string, paymentId: string, approvedBy: string): Promise<ClaimPayment> {
    const payments = claimPayments.get(claimId);
    if (!payments) {
      throw new Error(`No hay pagos para el siniestro: ${claimId}`);
    }

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error(`Pago no encontrado: ${paymentId}`);
    }

    if (payment.status !== 'PENDING') {
      throw new Error(`El pago no está pendiente de aprobación: ${payment.status}`);
    }

    payment.status = 'APPROVED';
    payment.approvedBy = approvedBy;
    payment.approvedAt = new Date();

    return payment;
  }

  /**
   * Marca un pago como realizado
   */
  async markPaymentAsPaid(claimId: string, paymentId: string, reference?: string): Promise<ClaimPayment> {
    const payments = claimPayments.get(claimId);
    if (!payments) {
      throw new Error(`No hay pagos para el siniestro: ${claimId}`);
    }

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error(`Pago no encontrado: ${paymentId}`);
    }

    if (payment.status !== 'APPROVED') {
      throw new Error('El pago debe estar aprobado antes de marcarlo como pagado');
    }

    payment.status = 'PAID';
    payment.paymentDate = new Date();

    return payment;
  }

  /**
   * Registra un recobro
   */
  async registerRecovery(claimId: string, amount: number, source: string): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (amount <= 0) {
      throw new Error('El importe del recobro debe ser positivo');
    }

    claim.recoveries = new Decimal(claim.recoveries).plus(amount).toDecimalPlaces(2).toNumber();
    claim.updatedAt = new Date();

    // Crear registro de reserva de recobro
    await this.updateReserve(
      claimId,
      claim.currentReserve,
      ReserveType.RECOVERY,
      `Recobro de ${source}: ${amount} EUR`
    );

    return claim;
  }

  /**
   * Cierra un siniestro
   */
  async closeClaim(
    claimId: string,
    resolution: string,
    finalStatus?: ClaimStatus.CLOSED | ClaimStatus.REJECTED
  ): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (claim.status === ClaimStatus.CLOSED || claim.status === ClaimStatus.REJECTED) {
      throw new Error('El siniestro ya está cerrado');
    }

    // Verificar si hay pagos pendientes
    const payments = claimPayments.get(claimId) || [];
    const pendingPayments = payments.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED');
    if (pendingPayments.length > 0) {
      throw new Error(`Hay ${pendingPayments.length} pago(s) pendientes. Procese los pagos antes de cerrar.`);
    }

    // Ajustar reserva final al total pagado (menos recobros)
    const finalReserve = new Decimal(claim.totalPaid).minus(claim.recoveries).toDecimalPlaces(2).toNumber();
    if (finalReserve !== claim.currentReserve) {
      await this.updateReserve(claimId, Math.max(0, finalReserve), ReserveType.FINAL, 'Reserva final al cierre');
    }

    claim.status = finalStatus || ClaimStatus.CLOSED;
    claim.resolution = resolution;
    claim.closedDate = new Date();
    claim.updatedAt = new Date();

    return claim;
  }

  /**
   * Reabre un siniestro cerrado
   */
  async reopenClaim(claimId: string, reason: string): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    if (claim.status !== ClaimStatus.CLOSED && claim.status !== ClaimStatus.REJECTED) {
      throw new Error('Solo se pueden reabrir siniestros cerrados o rechazados');
    }

    claim.status = ClaimStatus.REOPENED;
    claim.resolution = `${claim.resolution}\n\n[REABIERTO: ${format(new Date(), 'dd/MM/yyyy')}] ${reason}`;
    claim.closedDate = undefined;
    claim.updatedAt = new Date();

    return claim;
  }

  /**
   * Verifica la cobertura para un tipo de siniestro
   */
  async checkCoverage(policyId: string, claimType: ClaimType): Promise<CoverageCheckResult> {
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      return {
        covered: false,
        reason: 'Póliza no encontrada',
      };
    }

    // Obtener coberturas aplicables al tipo de siniestro
    const applicableCoverages = CLAIM_TYPE_TO_COVERAGE[claimType] || [];

    if (applicableCoverages.length === 0) {
      return {
        covered: false,
        reason: `Tipo de siniestro no reconocido: ${claimType}`,
      };
    }

    // Buscar cobertura activa en la póliza
    for (const coverageType of applicableCoverages) {
      const coverage = policy.coverages.find(
        (c) => c.type === coverageType && c.active
      );

      if (coverage) {
        // Calcular límite restante (si hay límite anual)
        let remainingLimit = coverage.sumInsured;
        if (coverage.annualLimit) {
          // En producción, se consultaría el total pagado en el año
          remainingLimit = coverage.annualLimit;
        }

        return {
          covered: true,
          coverage,
          sumInsured: coverage.sumInsured,
          deductible: coverage.deductible,
          remainingLimit,
        };
      }
    }

    return {
      covered: false,
      reason: `La póliza no incluye cobertura para ${claimType}. Coberturas requeridas: ${applicableCoverages.join(', ')}`,
    };
  }

  /**
   * Calcula la franquicia aplicable
   */
  async calculateDeductible(claimId: string, claimAmount?: number): Promise<DeductibleCalculation> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    const policy = await policyService.getPolicyById(claim.policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${claim.policyId}`);
    }

    const coverage = policy.coverages.find((c) => c.id === claim.coverageId);
    if (!coverage) {
      throw new Error('Cobertura no encontrada en la póliza');
    }

    const amount = claimAmount || claim.currentReserve;
    let deductibleAmount = 0;

    const deductibleType = coverage.deductibleType || 'FIXED';
    const deductibleValue = coverage.deductible || 0;

    switch (deductibleType) {
      case 'FIXED':
        deductibleAmount = Math.min(deductibleValue, amount);
        break;
      case 'PERCENTAGE':
        deductibleAmount = new Decimal(amount).mul(deductibleValue / 100).toDecimalPlaces(2).toNumber();
        break;
      case 'DAYS':
        // Para coberturas de hospitalización/baja
        // deductibleValue = días de franquicia
        // Aquí necesitaríamos la duración del evento
        deductibleAmount = 0; // Simplificado
        break;
    }

    const payableAmount = Math.max(0, new Decimal(amount).minus(deductibleAmount).toNumber());

    // Actualizar franquicia en el siniestro
    claim.deductibleApplied = deductibleAmount;
    claim.updatedAt = new Date();

    return {
      deductibleType,
      deductibleValue,
      claimAmount: amount,
      deductibleAmount,
      payableAmount,
    };
  }

  /**
   * Marca siniestro como sospecha de fraude
   */
  async flagAsFraud(claimId: string, reason: string): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    claim.status = ClaimStatus.FRAUD_SUSPECTED;
    claim.circumstances = `${claim.circumstances || ''}\n\n[SOSPECHA DE FRAUDE: ${format(new Date(), 'dd/MM/yyyy')}] ${reason}`;
    claim.updatedAt = new Date();

    return claim;
  }

  /**
   * Pasa siniestro a litigio
   */
  async sendToLitigation(claimId: string, reason: string): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    claim.status = ClaimStatus.IN_LITIGATION;
    claim.circumstances = `${claim.circumstances || ''}\n\n[EN LITIGIO: ${format(new Date(), 'dd/MM/yyyy')}] ${reason}`;
    claim.updatedAt = new Date();

    // Crear reserva de litigio (suele aumentar)
    const litigationReserve = new Decimal(claim.currentReserve).mul(1.5).toDecimalPlaces(2).toNumber();
    await this.updateReserve(claimId, litigationReserve, ReserveType.LITIGATION, 'Incremento por litigio');

    return claim;
  }

  /**
   * Solicita documentación adicional
   */
  async requestDocumentation(claimId: string, documents: string[]): Promise<Claim> {
    const claim = claims.get(claimId);
    if (!claim) {
      throw new Error(`Siniestro no encontrado: ${claimId}`);
    }

    claim.status = ClaimStatus.PENDING_DOCS;
    claim.circumstances = `${claim.circumstances || ''}\n\n[DOCUMENTACIÓN SOLICITADA: ${format(new Date(), 'dd/MM/yyyy')}]\n- ${documents.join('\n- ')}`;
    claim.updatedAt = new Date();

    return claim;
  }

  /**
   * Obtiene siniestro por ID
   */
  async getClaimById(claimId: string): Promise<Claim | null> {
    return claims.get(claimId) || null;
  }

  /**
   * Obtiene siniestro por número
   */
  async getClaimByNumber(claimNumber: string): Promise<Claim | null> {
    for (const claim of claims.values()) {
      if (claim.claimNumber === claimNumber) {
        return claim;
      }
    }
    return null;
  }

  /**
   * Obtiene siniestros de una póliza
   */
  async getClaimsByPolicy(policyId: string): Promise<Claim[]> {
    const result: Claim[] = [];
    for (const claim of claims.values()) {
      if (claim.policyId === policyId) {
        result.push(claim);
      }
    }
    return result.sort((a, b) => b.reportedDate.getTime() - a.reportedDate.getTime());
  }

  /**
   * Obtiene siniestros por estado
   */
  async getClaimsByStatus(status: ClaimStatus): Promise<Claim[]> {
    const result: Claim[] = [];
    for (const claim of claims.values()) {
      if (claim.status === status) {
        result.push(claim);
      }
    }
    return result;
  }

  /**
   * Obtiene siniestros asignados a un perito
   */
  async getClaimsByAdjuster(adjusterId: string): Promise<Claim[]> {
    const result: Claim[] = [];
    for (const claim of claims.values()) {
      if (claim.adjusterId === adjusterId) {
        result.push(claim);
      }
    }
    return result;
  }

  /**
   * Obtiene historial de reservas
   */
  async getReserveHistory(claimId: string): Promise<ClaimReserve[]> {
    return claimReserves.get(claimId) || [];
  }

  /**
   * Obtiene pagos del siniestro
   */
  async getClaimPayments(claimId: string): Promise<ClaimPayment[]> {
    return claimPayments.get(claimId) || [];
  }

  /**
   * Genera estadísticas de siniestros
   */
  async getClaimStatistics(startDate?: Date, endDate?: Date): Promise<{
    totalClaims: number;
    claimsByStatus: Record<ClaimStatus, number>;
    claimsByType: Record<ClaimType, number>;
    totalReserves: number;
    totalPaid: number;
    totalRecoveries: number;
    averageClaimDuration: number;
    lossRatio?: number;
  }> {
    const claimsByStatus: Record<ClaimStatus, number> = {} as Record<ClaimStatus, number>;
    const claimsByType: Record<ClaimType, number> = {} as Record<ClaimType, number>;
    let totalReserves = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalRecoveries = new Decimal(0);
    let totalDuration = 0;
    let closedCount = 0;
    let totalClaims = 0;

    for (const claim of claims.values()) {
      // Filtrar por fecha si se proporcionan
      if (startDate && claim.reportedDate < startDate) continue;
      if (endDate && claim.reportedDate > endDate) continue;

      totalClaims++;

      // Por estado
      claimsByStatus[claim.status] = (claimsByStatus[claim.status] || 0) + 1;

      // Por tipo
      claimsByType[claim.type] = (claimsByType[claim.type] || 0) + 1;

      // Totales
      totalReserves = totalReserves.plus(claim.currentReserve);
      totalPaid = totalPaid.plus(claim.totalPaid);
      totalRecoveries = totalRecoveries.plus(claim.recoveries);

      // Duración (solo siniestros cerrados)
      if (claim.closedDate) {
        const duration = differenceInDays(claim.closedDate, claim.reportedDate);
        totalDuration += duration;
        closedCount++;
      }
    }

    const averageClaimDuration = closedCount > 0 ? totalDuration / closedCount : 0;

    return {
      totalClaims,
      claimsByStatus,
      claimsByType,
      totalReserves: totalReserves.toDecimalPlaces(2).toNumber(),
      totalPaid: totalPaid.toDecimalPlaces(2).toNumber(),
      totalRecoveries: totalRecoveries.toDecimalPlaces(2).toNumber(),
      averageClaimDuration: Math.round(averageClaimDuration),
    };
  }
}

// Exportar instancia singleton
export const claimService = new ClaimService();
