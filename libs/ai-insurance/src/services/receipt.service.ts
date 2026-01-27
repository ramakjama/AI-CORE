/**
 * Receipt Service
 * Servicio de gestión de recibos y cobros
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { addDays, addMonths, format, isBefore, isAfter, startOfMonth, endOfMonth } from 'date-fns';

import {
  Receipt,
  ReceiptStatus,
  PaymentMethod,
  PaymentFrequency,
  PaymentPlan,
  BankMovement,
  Policy,
  PolicyStatus,
  SPAIN_TAX_RATES,
} from '../types';

import { policyService } from './policy.service';

// ============================================================================
// Datos simulados
// ============================================================================

const receipts: Map<string, Receipt> = new Map();
const paymentPlans: Map<string, PaymentPlan> = new Map();
const bankMovements: Map<string, BankMovement> = new Map();

// ============================================================================
// Tipos internos
// ============================================================================

export interface PaymentData {
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paidDate?: Date;
  iban?: string;
  amount?: number;
}

export interface ReconciliationResult {
  matched: ReceiptMatch[];
  unmatched: BankMovement[];
  errors: ReconciliationError[];
}

export interface ReceiptMatch {
  receiptId: string;
  movementId: string;
  confidence: number;
}

export interface ReconciliationError {
  movementId: string;
  error: string;
}

// ============================================================================
// Clase ReceiptService
// ============================================================================

export class ReceiptService {
  /**
   * Genera un número de recibo único
   */
  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    return `REC${year}${sequence}`;
  }

  /**
   * Calcula las fechas de vencimiento según frecuencia de pago
   */
  private calculateDueDates(
    effectiveDate: Date,
    frequency: PaymentFrequency,
    installments: number
  ): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(effectiveDate);

    for (let i = 0; i < installments; i++) {
      dates.push(new Date(currentDate));

      switch (frequency) {
        case PaymentFrequency.MONTHLY:
          currentDate = addMonths(currentDate, 1);
          break;
        case PaymentFrequency.QUARTERLY:
          currentDate = addMonths(currentDate, 3);
          break;
        case PaymentFrequency.BIANNUAL:
          currentDate = addMonths(currentDate, 6);
          break;
        case PaymentFrequency.ANNUAL:
          currentDate = addMonths(currentDate, 12);
          break;
        default:
          // Pago único, solo una fecha
          break;
      }
    }

    return dates;
  }

  /**
   * Obtiene el número de fracciones según frecuencia
   */
  private getInstallmentCount(frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        return 12;
      case PaymentFrequency.QUARTERLY:
        return 4;
      case PaymentFrequency.BIANNUAL:
        return 2;
      case PaymentFrequency.ANNUAL:
      case PaymentFrequency.SINGLE:
      default:
        return 1;
    }
  }

  /**
   * Genera los recibos de una póliza
   */
  async generateReceipts(policyId: string): Promise<Receipt[]> {
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    const installments = this.getInstallmentCount(policy.paymentFrequency);
    const dueDates = this.calculateDueDates(
      policy.effectiveDate,
      policy.paymentFrequency,
      installments
    );

    // Calcular importe por recibo
    const totalPremium = new Decimal(policy.premium.totalPremium);
    const installmentAmount = totalPremium.div(installments).toDecimalPlaces(2);

    // Ajustar último recibo para cuadrar céntimos
    const adjustedLastInstallment = totalPremium
      .minus(installmentAmount.mul(installments - 1))
      .toDecimalPlaces(2);

    const generatedReceipts: Receipt[] = [];

    for (let i = 0; i < installments; i++) {
      const isLast = i === installments - 1;
      const amount = isLast ? adjustedLastInstallment : installmentAmount;

      // Desglosar impuestos proporcionalmente
      const netRatio = new Decimal(policy.premium.netPremium).div(policy.premium.totalPremium);
      const taxRatio = new Decimal(1).minus(netRatio);

      const netAmount = amount.mul(netRatio).toDecimalPlaces(2);
      const taxes = amount.mul(taxRatio).toDecimalPlaces(2);

      const receipt: Receipt = {
        id: uuidv4(),
        receiptNumber: this.generateReceiptNumber(),
        policyId,
        policyNumber: policy.policyNumber,
        status: ReceiptStatus.PENDING,
        receiptType: i === 0 ? 'INITIAL' : 'RENEWAL',
        installmentNumber: i + 1,
        totalInstallments: installments,
        netAmount: netAmount.toNumber(),
        taxes: taxes.toNumber(),
        surcharges: 0,
        totalAmount: amount.toNumber(),
        currency: 'EUR',
        issueDate: new Date(),
        dueDate: dueDates[i],
        paymentMethod: policy.paymentMethod,
        iban: policy.iban,
        collectionAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      receipts.set(receipt.id, receipt);
      generatedReceipts.push(receipt);
    }

    return generatedReceipts;
  }

  /**
   * Genera recibos para un suplemento
   */
  async generateEndorsementReceipts(
    policyId: string,
    endorsementId: string,
    premiumDifference: number
  ): Promise<Receipt[]> {
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    // Si hay diferencia positiva (cobro adicional)
    if (premiumDifference > 0) {
      const receipt: Receipt = {
        id: uuidv4(),
        receiptNumber: this.generateReceiptNumber(),
        policyId,
        policyNumber: policy.policyNumber,
        endorsementId,
        status: ReceiptStatus.PENDING,
        receiptType: 'ENDORSEMENT',
        installmentNumber: 1,
        totalInstallments: 1,
        netAmount: new Decimal(premiumDifference).mul(0.94).toDecimalPlaces(2).toNumber(), // Aprox sin IPS
        taxes: new Decimal(premiumDifference).mul(0.06).toDecimalPlaces(2).toNumber(),
        surcharges: 0,
        totalAmount: premiumDifference,
        currency: 'EUR',
        issueDate: new Date(),
        dueDate: addDays(new Date(), 15), // 15 días para pagar
        paymentMethod: policy.paymentMethod,
        iban: policy.iban,
        collectionAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      receipts.set(receipt.id, receipt);
      return [receipt];
    }

    // Si hay diferencia negativa (extorno/devolución)
    if (premiumDifference < 0) {
      const refundAmount = Math.abs(premiumDifference);
      const receipt: Receipt = {
        id: uuidv4(),
        receiptNumber: this.generateReceiptNumber(),
        policyId,
        policyNumber: policy.policyNumber,
        endorsementId,
        status: ReceiptStatus.PENDING,
        receiptType: 'REFUND',
        installmentNumber: 1,
        totalInstallments: 1,
        netAmount: -new Decimal(refundAmount).mul(0.94).toDecimalPlaces(2).toNumber(),
        taxes: -new Decimal(refundAmount).mul(0.06).toDecimalPlaces(2).toNumber(),
        surcharges: 0,
        totalAmount: -refundAmount,
        currency: 'EUR',
        issueDate: new Date(),
        dueDate: new Date(), // Devolución inmediata
        paymentMethod: policy.paymentMethod,
        iban: policy.iban,
        collectionAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      receipts.set(receipt.id, receipt);
      return [receipt];
    }

    return [];
  }

  /**
   * Procesa el pago de un recibo
   */
  async processPayment(receiptId: string, paymentData: PaymentData): Promise<Receipt> {
    const receipt = receipts.get(receiptId);
    if (!receipt) {
      throw new Error(`Recibo no encontrado: ${receiptId}`);
    }

    if (receipt.status === ReceiptStatus.PAID) {
      throw new Error('El recibo ya está cobrado');
    }

    if (receipt.status === ReceiptStatus.CANCELLED) {
      throw new Error('El recibo está anulado');
    }

    // Verificar importe si se proporciona
    if (paymentData.amount !== undefined) {
      const diff = Math.abs(paymentData.amount - receipt.totalAmount);
      if (diff > 0.01) { // Tolerancia de 1 céntimo
        if (paymentData.amount < receipt.totalAmount) {
          // Pago parcial
          receipt.status = ReceiptStatus.PARTIAL;
          receipt.notes = `Pago parcial: ${paymentData.amount.toFixed(2)} EUR de ${receipt.totalAmount.toFixed(2)} EUR`;
        } else {
          throw new Error(`Importe de pago (${paymentData.amount}) no coincide con el recibo (${receipt.totalAmount})`);
        }
      } else {
        receipt.status = ReceiptStatus.PAID;
      }
    } else {
      receipt.status = ReceiptStatus.PAID;
    }

    receipt.paidDate = paymentData.paidDate || new Date();
    receipt.paymentMethod = paymentData.paymentMethod;
    receipt.paymentReference = paymentData.paymentReference;
    receipt.updatedAt = new Date();

    // Si la póliza estaba suspendida y se paga, verificar rehabilitación
    if (receipt.status === ReceiptStatus.PAID) {
      const policy = await policyService.getPolicyById(receipt.policyId);
      if (policy && policy.status === PolicyStatus.SUSPENDED) {
        // Verificar si hay más recibos pendientes
        const pendingReceipts = await this.getPendingReceiptsByPolicy(receipt.policyId);
        if (pendingReceipts.length === 0) {
          await policyService.reinstatePolicy(receipt.policyId);
        }
      }
    }

    return receipt;
  }

  /**
   * Marca un recibo como impagado (devuelto)
   */
  async markAsUnpaid(receiptId: string, returnReason?: string): Promise<Receipt> {
    const receipt = receipts.get(receiptId);
    if (!receipt) {
      throw new Error(`Recibo no encontrado: ${receiptId}`);
    }

    receipt.status = ReceiptStatus.UNPAID;
    receipt.returnReason = returnReason || 'Devolución bancaria';
    receipt.collectionAttempts += 1;
    receipt.lastCollectionAttempt = new Date();
    receipt.updatedAt = new Date();

    // Si hay más de 2 intentos fallidos, poner en gestión de cobro
    if (receipt.collectionAttempts >= 2) {
      receipt.status = ReceiptStatus.IN_COLLECTION;
    }

    // Verificar si hay que suspender la póliza
    const policy = await policyService.getPolicyById(receipt.policyId);
    if (policy && policy.status === PolicyStatus.ACTIVE) {
      // Si el recibo tiene más de 30 días de retraso, suspender
      const daysSinceDue = Math.floor(
        (new Date().getTime() - receipt.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDue > 30 && receipt.collectionAttempts >= 2) {
        await policyService.suspendPolicy(receipt.policyId, 'Impago reiterado de recibos');
      }
    }

    return receipt;
  }

  /**
   * Anula un recibo
   */
  async cancelReceipt(receiptId: string, reason: string): Promise<Receipt> {
    const receipt = receipts.get(receiptId);
    if (!receipt) {
      throw new Error(`Recibo no encontrado: ${receiptId}`);
    }

    if (receipt.status === ReceiptStatus.PAID) {
      throw new Error('No se puede anular un recibo ya cobrado. Use reembolso.');
    }

    receipt.status = ReceiptStatus.CANCELLED;
    receipt.notes = `Anulado: ${reason}`;
    receipt.updatedAt = new Date();

    return receipt;
  }

  /**
   * Crea un plan de pago personalizado
   */
  async createPaymentPlan(
    policyId: string,
    installments: number,
    options?: {
      applySurcharge?: boolean;
      customSurchargeRate?: number;
      startDate?: Date;
    }
  ): Promise<PaymentPlan> {
    const policy = await policyService.getPolicyById(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    // Validar número de fracciones
    if (installments < 1 || installments > 12) {
      throw new Error('El número de fracciones debe estar entre 1 y 12');
    }

    // Calcular recargo por fraccionamiento
    let surchargeRate = 0;
    if (options?.applySurcharge !== false && installments > 1) {
      if (options?.customSurchargeRate !== undefined) {
        surchargeRate = options.customSurchargeRate;
      } else {
        // Recargo estándar según número de fracciones
        if (installments === 2) {
          surchargeRate = SPAIN_TAX_RATES.INSTALLMENT_BIANNUAL;
        } else if (installments <= 4) {
          surchargeRate = SPAIN_TAX_RATES.INSTALLMENT_QUARTERLY;
        } else {
          surchargeRate = SPAIN_TAX_RATES.INSTALLMENT_MONTHLY;
        }
      }
    }

    const basePremium = new Decimal(policy.premium.totalPremium);
    const surchargeAmount = basePremium.mul(surchargeRate).toDecimalPlaces(2);
    const totalAmount = basePremium.plus(surchargeAmount).toDecimalPlaces(2);
    const installmentAmount = totalAmount.div(installments).toDecimalPlaces(2);

    // Ajustar último recibo
    const adjustedLastInstallment = totalAmount
      .minus(installmentAmount.mul(installments - 1))
      .toDecimalPlaces(2);

    const startDate = options?.startDate || new Date();
    const planReceipts: Receipt[] = [];

    // Anular recibos pendientes existentes
    const existingReceipts = await this.getReceiptsByPolicy(policyId);
    for (const existingReceipt of existingReceipts) {
      if (existingReceipt.status === ReceiptStatus.PENDING) {
        await this.cancelReceipt(existingReceipt.id, 'Nuevo plan de pago');
      }
    }

    // Generar nuevos recibos
    for (let i = 0; i < installments; i++) {
      const isLast = i === installments - 1;
      const amount = isLast ? adjustedLastInstallment : installmentAmount;
      const dueDate = addMonths(startDate, i);

      const receipt: Receipt = {
        id: uuidv4(),
        receiptNumber: this.generateReceiptNumber(),
        policyId,
        policyNumber: policy.policyNumber,
        status: ReceiptStatus.PENDING,
        receiptType: i === 0 ? 'INITIAL' : 'RENEWAL',
        installmentNumber: i + 1,
        totalInstallments: installments,
        netAmount: amount.mul(0.94).toDecimalPlaces(2).toNumber(),
        taxes: amount.mul(0.06).toDecimalPlaces(2).toNumber(),
        surcharges: i === 0 ? surchargeAmount.toNumber() : 0,
        totalAmount: amount.toNumber(),
        currency: 'EUR',
        issueDate: new Date(),
        dueDate,
        paymentMethod: policy.paymentMethod,
        iban: policy.iban,
        collectionAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      receipts.set(receipt.id, receipt);
      planReceipts.push(receipt);
    }

    const paymentPlan: PaymentPlan = {
      id: uuidv4(),
      policyId,
      totalAmount: totalAmount.toNumber(),
      installments,
      frequency: installments === 12 ? PaymentFrequency.MONTHLY :
                 installments === 4 ? PaymentFrequency.QUARTERLY :
                 installments === 2 ? PaymentFrequency.BIANNUAL : PaymentFrequency.ANNUAL,
      surchargeRate,
      surchargeAmount: surchargeAmount.toNumber(),
      receipts: planReceipts,
      createdAt: new Date(),
    };

    paymentPlans.set(paymentPlan.id, paymentPlan);

    return paymentPlan;
  }

  /**
   * Concilia movimientos bancarios con recibos
   */
  async reconcileWithBank(movements: BankMovement[]): Promise<ReconciliationResult> {
    const result: ReconciliationResult = {
      matched: [],
      unmatched: [],
      errors: [],
    };

    for (const movement of movements) {
      // Ignorar movimientos ya conciliados
      if (movement.matched) {
        continue;
      }

      try {
        // Buscar recibo coincidente
        const match = await this.findMatchingReceipt(movement);

        if (match) {
          // Marcar como cobrado
          await this.processPayment(match.receiptId, {
            paymentMethod: PaymentMethod.DIRECT_DEBIT,
            paymentReference: movement.reference || movement.id,
            paidDate: movement.valueDate,
            amount: movement.amount,
          });

          movement.matched = true;
          movement.matchedReceiptId = match.receiptId;
          bankMovements.set(movement.id, movement);

          result.matched.push(match);
        } else {
          result.unmatched.push(movement);
        }
      } catch (error) {
        result.errors.push({
          movementId: movement.id,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return result;
  }

  /**
   * Busca recibo coincidente con movimiento bancario
   */
  private async findMatchingReceipt(movement: BankMovement): Promise<ReceiptMatch | null> {
    // Buscar por referencia
    if (movement.reference) {
      for (const receipt of receipts.values()) {
        if (
          receipt.receiptNumber === movement.reference ||
          receipt.policyNumber === movement.reference
        ) {
          // Verificar importe
          if (Math.abs(receipt.totalAmount - movement.amount) < 0.01) {
            return {
              receiptId: receipt.id,
              movementId: movement.id,
              confidence: 1.0,
            };
          }
        }
      }
    }

    // Buscar por IBAN y importe
    for (const receipt of receipts.values()) {
      if (
        receipt.status === ReceiptStatus.PENDING &&
        receipt.iban === movement.iban &&
        Math.abs(receipt.totalAmount - movement.amount) < 0.01
      ) {
        // Verificar que la fecha del movimiento sea cercana al vencimiento
        const daysDiff = Math.abs(
          (movement.valueDate.getTime() - receipt.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 10) {
          return {
            receiptId: receipt.id,
            movementId: movement.id,
            confidence: 0.85,
          };
        }
      }
    }

    // Buscar solo por importe (menor confianza)
    for (const receipt of receipts.values()) {
      if (
        receipt.status === ReceiptStatus.PENDING &&
        Math.abs(receipt.totalAmount - movement.amount) < 0.01
      ) {
        return {
          receiptId: receipt.id,
          movementId: movement.id,
          confidence: 0.5,
        };
      }
    }

    return null;
  }

  /**
   * Envía recordatorio de pago
   */
  async sendPaymentReminder(receiptId: string): Promise<{ success: boolean; message: string }> {
    const receipt = receipts.get(receiptId);
    if (!receipt) {
      throw new Error(`Recibo no encontrado: ${receiptId}`);
    }

    if (receipt.status !== ReceiptStatus.PENDING && receipt.status !== ReceiptStatus.UNPAID) {
      return {
        success: false,
        message: `No se puede enviar recordatorio para recibo en estado: ${receipt.status}`,
      };
    }

    // Calcular días hasta/desde vencimiento
    const today = new Date();
    const daysToDue = Math.floor(
      (receipt.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let message: string;
    let urgency: 'low' | 'medium' | 'high';

    if (daysToDue > 7) {
      message = `Recordatorio: Su recibo ${receipt.receiptNumber} vence el ${format(receipt.dueDate, 'dd/MM/yyyy')}. Importe: ${receipt.totalAmount.toFixed(2)} EUR`;
      urgency = 'low';
    } else if (daysToDue > 0) {
      message = `Próximo vencimiento: Su recibo ${receipt.receiptNumber} vence en ${daysToDue} días. Importe: ${receipt.totalAmount.toFixed(2)} EUR`;
      urgency = 'medium';
    } else if (daysToDue === 0) {
      message = `Vencimiento hoy: Su recibo ${receipt.receiptNumber} vence hoy. Importe: ${receipt.totalAmount.toFixed(2)} EUR`;
      urgency = 'high';
    } else {
      const daysOverdue = Math.abs(daysToDue);
      message = `URGENTE: Su recibo ${receipt.receiptNumber} está vencido hace ${daysOverdue} días. Importe: ${receipt.totalAmount.toFixed(2)} EUR. Por favor, regularice el pago para evitar la suspensión de cobertura.`;
      urgency = 'high';
    }

    // En producción, aquí se integraría con el servicio de notificaciones
    console.log(`[${urgency.toUpperCase()}] Recordatorio enviado: ${message}`);

    return {
      success: true,
      message,
    };
  }

  /**
   * Obtiene recibos por póliza
   */
  async getReceiptsByPolicy(policyId: string): Promise<Receipt[]> {
    const result: Receipt[] = [];
    for (const receipt of receipts.values()) {
      if (receipt.policyId === policyId) {
        result.push(receipt);
      }
    }
    return result.sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  /**
   * Obtiene recibos pendientes por póliza
   */
  async getPendingReceiptsByPolicy(policyId: string): Promise<Receipt[]> {
    const allReceipts = await this.getReceiptsByPolicy(policyId);
    return allReceipts.filter(
      (r) =>
        r.status === ReceiptStatus.PENDING ||
        r.status === ReceiptStatus.UNPAID ||
        r.status === ReceiptStatus.PARTIAL
    );
  }

  /**
   * Obtiene recibos vencidos
   */
  async getOverdueReceipts(daysOverdue: number = 0): Promise<Receipt[]> {
    const today = new Date();
    const result: Receipt[] = [];

    for (const receipt of receipts.values()) {
      if (
        (receipt.status === ReceiptStatus.PENDING || receipt.status === ReceiptStatus.UNPAID) &&
        isBefore(addDays(receipt.dueDate, daysOverdue), today)
      ) {
        result.push(receipt);
      }
    }

    return result.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Obtiene recibos por estado
   */
  async getReceiptsByStatus(status: ReceiptStatus): Promise<Receipt[]> {
    const result: Receipt[] = [];
    for (const receipt of receipts.values()) {
      if (receipt.status === status) {
        result.push(receipt);
      }
    }
    return result;
  }

  /**
   * Obtiene recibo por ID
   */
  async getReceiptById(receiptId: string): Promise<Receipt | null> {
    return receipts.get(receiptId) || null;
  }

  /**
   * Obtiene recibo por número
   */
  async getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
    for (const receipt of receipts.values()) {
      if (receipt.receiptNumber === receiptNumber) {
        return receipt;
      }
    }
    return null;
  }

  /**
   * Genera informe de cobros del período
   */
  async getCollectionReport(startDate: Date, endDate: Date): Promise<{
    totalIssued: number;
    totalCollected: number;
    totalPending: number;
    totalUnpaid: number;
    collectionRate: number;
    receiptsByStatus: Record<ReceiptStatus, number>;
    receiptsByMethod: Record<PaymentMethod, number>;
  }> {
    let totalIssued = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalUnpaid = 0;

    const receiptsByStatus: Record<ReceiptStatus, number> = {
      [ReceiptStatus.PENDING]: 0,
      [ReceiptStatus.PAID]: 0,
      [ReceiptStatus.UNPAID]: 0,
      [ReceiptStatus.CANCELLED]: 0,
      [ReceiptStatus.REFUNDED]: 0,
      [ReceiptStatus.PARTIAL]: 0,
      [ReceiptStatus.IN_COLLECTION]: 0,
    };

    const receiptsByMethod: Record<PaymentMethod, number> = {
      [PaymentMethod.DIRECT_DEBIT]: 0,
      [PaymentMethod.BANK_TRANSFER]: 0,
      [PaymentMethod.CREDIT_CARD]: 0,
      [PaymentMethod.DEBIT_CARD]: 0,
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CHECK]: 0,
      [PaymentMethod.BIZUM]: 0,
      [PaymentMethod.FINANCING]: 0,
    };

    for (const receipt of receipts.values()) {
      // Filtrar por fecha de emisión
      if (isBefore(receipt.issueDate, startDate) || isAfter(receipt.issueDate, endDate)) {
        continue;
      }

      totalIssued += receipt.totalAmount;
      receiptsByStatus[receipt.status]++;

      switch (receipt.status) {
        case ReceiptStatus.PAID:
          totalCollected += receipt.totalAmount;
          receiptsByMethod[receipt.paymentMethod]++;
          break;
        case ReceiptStatus.PENDING:
          totalPending += receipt.totalAmount;
          break;
        case ReceiptStatus.UNPAID:
        case ReceiptStatus.IN_COLLECTION:
          totalUnpaid += receipt.totalAmount;
          break;
      }
    }

    const collectionRate = totalIssued > 0 ? (totalCollected / totalIssued) * 100 : 0;

    return {
      totalIssued: new Decimal(totalIssued).toDecimalPlaces(2).toNumber(),
      totalCollected: new Decimal(totalCollected).toDecimalPlaces(2).toNumber(),
      totalPending: new Decimal(totalPending).toDecimalPlaces(2).toNumber(),
      totalUnpaid: new Decimal(totalUnpaid).toDecimalPlaces(2).toNumber(),
      collectionRate: new Decimal(collectionRate).toDecimalPlaces(2).toNumber(),
      receiptsByStatus,
      receiptsByMethod,
    };
  }

  /**
   * Procesa remesa de recibos para domiciliación SEPA
   */
  async generateSEPARemittance(receiptIds: string[]): Promise<{
    remittanceId: string;
    totalAmount: number;
    receiptCount: number;
    receipts: Receipt[];
  }> {
    const remittanceReceipts: Receipt[] = [];
    let totalAmount = new Decimal(0);

    for (const receiptId of receiptIds) {
      const receipt = receipts.get(receiptId);
      if (!receipt) {
        throw new Error(`Recibo no encontrado: ${receiptId}`);
      }

      if (receipt.status !== ReceiptStatus.PENDING) {
        throw new Error(`Recibo ${receipt.receiptNumber} no está pendiente`);
      }

      if (receipt.paymentMethod !== PaymentMethod.DIRECT_DEBIT) {
        throw new Error(`Recibo ${receipt.receiptNumber} no es domiciliación bancaria`);
      }

      if (!receipt.iban) {
        throw new Error(`Recibo ${receipt.receiptNumber} no tiene IBAN`);
      }

      remittanceReceipts.push(receipt);
      totalAmount = totalAmount.plus(receipt.totalAmount);
    }

    // Generar ID de remesa
    const remittanceId = `REM${format(new Date(), 'yyyyMMdd')}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;

    return {
      remittanceId,
      totalAmount: totalAmount.toDecimalPlaces(2).toNumber(),
      receiptCount: remittanceReceipts.length,
      receipts: remittanceReceipts,
    };
  }
}

// Exportar instancia singleton
export const receiptService = new ReceiptService();
