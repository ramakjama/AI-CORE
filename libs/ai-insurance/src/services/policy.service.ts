/**
 * Policy Service
 * Servicio de gestión de pólizas de seguros
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { addDays, addMonths, addYears, differenceInDays, format, isAfter, isBefore } from 'date-fns';

import {
  Policy,
  PolicyStatus,
  PolicyType,
  PolicyVersion,
  Coverage,
  CoverageType,
  Premium,
  CoveragePremium,
  RiskData,
  Endorsement,
  EndorsementType,
  EndorsementChanges,
  InsuranceBranch,
  PaymentFrequency,
  PaymentMethod,
  SPAIN_TAX_RATES,
} from '../types';

// ============================================================================
// Tipos internos
// ============================================================================

export interface PremiumCalculationResult {
  netPremium: number;
  installmentSurcharge: number;
  ips: number;
  ipsRate: number;
  consortiumSurcharge: number;
  consortiumRate: number;
  otherSurcharges: number;
  discounts: number;
  totalPremium: number;
  coverageBreakdown: CoveragePremium[];
}

interface ProductDefinition {
  code: string;
  name: string;
  branch: InsuranceBranch;
  basePremium: number;
  mandatoryCoverages: CoverageType[];
  optionalCoverages: CoverageType[];
  ratingFactors: RatingFactor[];
}

interface RatingFactor {
  field: string;
  type: 'multiplier' | 'additive' | 'discount';
  values: Record<string, number>;
}

// ============================================================================
// Datos simulados (en producción vendrían de la base de datos)
// ============================================================================

const policies: Map<string, Policy> = new Map();
const policyVersions: Map<string, PolicyVersion[]> = new Map();
const endorsements: Map<string, Endorsement> = new Map();

// Catálogo de productos simplificado
const PRODUCT_CATALOG: Record<string, ProductDefinition> = {
  'AUTO-TR': {
    code: 'AUTO-TR',
    name: 'Seguro de Automóvil Todo Riesgo',
    branch: InsuranceBranch.AUTO,
    basePremium: 350,
    mandatoryCoverages: [CoverageType.RC_OBLIGATORIO, CoverageType.DEFENSA_JURIDICA],
    optionalCoverages: [
      CoverageType.RC_VOLUNTARIO,
      CoverageType.ROBO,
      CoverageType.INCENDIO,
      CoverageType.LUNAS,
      CoverageType.DANOS_PROPIOS,
      CoverageType.ASISTENCIA_VIAJE,
    ],
    ratingFactors: [
      {
        field: 'vehicle.enginePower',
        type: 'multiplier',
        values: { '0-90': 1.0, '91-150': 1.2, '151-200': 1.4, '200+': 1.8 },
      },
      {
        field: 'vehicle.year',
        type: 'discount',
        values: { 'new': 0.05, '1-3': 0, '4-7': -0.05, '8+': -0.10 },
      },
      {
        field: 'vehicle.parkingType',
        type: 'multiplier',
        values: { 'GARAGE': 0.95, 'PARKING_LOT': 1.0, 'STREET': 1.15 },
      },
    ],
  },
  'AUTO-TC': {
    code: 'AUTO-TC',
    name: 'Seguro de Automóvil Terceros Completo',
    branch: InsuranceBranch.AUTO,
    basePremium: 200,
    mandatoryCoverages: [CoverageType.RC_OBLIGATORIO, CoverageType.DEFENSA_JURIDICA],
    optionalCoverages: [
      CoverageType.RC_VOLUNTARIO,
      CoverageType.ROBO,
      CoverageType.INCENDIO,
      CoverageType.LUNAS,
      CoverageType.ASISTENCIA_VIAJE,
    ],
    ratingFactors: [],
  },
  'HOGAR-PLUS': {
    code: 'HOGAR-PLUS',
    name: 'Seguro de Hogar Plus',
    branch: InsuranceBranch.HOGAR,
    basePremium: 180,
    mandatoryCoverages: [CoverageType.CONTINENTE, CoverageType.CONTENIDO, CoverageType.RC_FAMILIAR],
    optionalCoverages: [
      CoverageType.AGUA,
      CoverageType.ROTURA_CRISTALES,
      CoverageType.ROBO,
    ],
    ratingFactors: [
      {
        field: 'property.surfaceM2',
        type: 'multiplier',
        values: { '0-80': 0.9, '81-120': 1.0, '121-180': 1.2, '180+': 1.5 },
      },
      {
        field: 'property.hasAlarm',
        type: 'discount',
        values: { 'true': 0.10, 'false': 0 },
      },
    ],
  },
  'VIDA-RIESGO': {
    code: 'VIDA-RIESGO',
    name: 'Seguro de Vida Riesgo',
    branch: InsuranceBranch.VIDA,
    basePremium: 120,
    mandatoryCoverages: [CoverageType.FALLECIMIENTO],
    optionalCoverages: [CoverageType.IPA, CoverageType.IPT, CoverageType.ENFERMEDADES_GRAVES],
    ratingFactors: [
      {
        field: 'insuredPerson.smoker',
        type: 'multiplier',
        values: { 'true': 1.5, 'false': 1.0 },
      },
    ],
  },
};

// ============================================================================
// Clase PolicyService
// ============================================================================

export class PolicyService {
  /**
   * Genera un número de póliza único
   */
  private generatePolicyNumber(branch: InsuranceBranch): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const branchCode = branch.slice(0, 3).toUpperCase();
    const sequence = Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    return `${branchCode}${year}${sequence}`;
  }

  /**
   * Genera un número de suplemento
   */
  private generateEndorsementNumber(policyNumber: string, version: number): string {
    return `${policyNumber}-S${version.toString().padStart(3, '0')}`;
  }

  /**
   * Obtiene la tasa de IPS según el ramo
   */
  private getIpsRate(branch: InsuranceBranch): number {
    // Vida está exento de IPS
    if (branch === InsuranceBranch.VIDA || branch === InsuranceBranch.SALUD) {
      return SPAIN_TAX_RATES.IPS_EXEMPT;
    }
    return SPAIN_TAX_RATES.IPS_GENERAL;
  }

  /**
   * Obtiene la tasa del Consorcio según el ramo
   */
  private getConsortiumRate(branch: InsuranceBranch): number {
    switch (branch) {
      case InsuranceBranch.AUTO:
        return SPAIN_TAX_RATES.CONSORTIUM_AUTO;
      case InsuranceBranch.HOGAR:
      case InsuranceBranch.COMERCIO:
      case InsuranceBranch.PYME:
      case InsuranceBranch.COMUNIDADES:
        return SPAIN_TAX_RATES.CONSORTIUM_FIRE;
      case InsuranceBranch.VIDA:
      case InsuranceBranch.SALUD:
      case InsuranceBranch.DECESOS:
        return 0; // Exentos
      default:
        return SPAIN_TAX_RATES.CONSORTIUM_OTHER;
    }
  }

  /**
   * Obtiene el recargo por fraccionamiento
   */
  private getInstallmentSurchargeRate(frequency: PaymentFrequency): number {
    switch (frequency) {
      case PaymentFrequency.BIANNUAL:
        return SPAIN_TAX_RATES.INSTALLMENT_BIANNUAL;
      case PaymentFrequency.QUARTERLY:
        return SPAIN_TAX_RATES.INSTALLMENT_QUARTERLY;
      case PaymentFrequency.MONTHLY:
        return SPAIN_TAX_RATES.INSTALLMENT_MONTHLY;
      default:
        return 0; // Pago anual o único sin recargo
    }
  }

  /**
   * Aplica los factores de tarificación al premium base
   */
  private applyRatingFactors(
    basePremium: number,
    riskData: RiskData,
    factors: RatingFactor[]
  ): number {
    let premium = new Decimal(basePremium);
    let totalDiscount = new Decimal(0);

    for (const factor of factors) {
      const fieldParts = factor.field.split('.');
      let value: unknown = riskData;

      for (const part of fieldParts) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[part];
        }
      }

      if (value === undefined || value === null) continue;

      const stringValue = String(value);
      let factorValue: number | undefined;

      // Buscar el valor correspondiente en el factor
      for (const [range, val] of Object.entries(factor.values)) {
        if (range.includes('-') && typeof value === 'number') {
          const [min, max] = range.split('-').map(Number);
          if (value >= min && value <= max) {
            factorValue = val;
            break;
          }
        } else if (range.includes('+') && typeof value === 'number') {
          const min = parseInt(range.replace('+', ''));
          if (value > min) {
            factorValue = val;
            break;
          }
        } else if (range === stringValue) {
          factorValue = val;
          break;
        }
      }

      if (factorValue !== undefined) {
        switch (factor.type) {
          case 'multiplier':
            premium = premium.mul(factorValue);
            break;
          case 'additive':
            premium = premium.plus(factorValue);
            break;
          case 'discount':
            totalDiscount = totalDiscount.plus(factorValue);
            break;
        }
      }
    }

    // Aplicar descuentos acumulados
    if (!totalDiscount.isZero()) {
      premium = premium.mul(new Decimal(1).minus(totalDiscount));
    }

    return premium.toDecimalPlaces(2).toNumber();
  }

  /**
   * Calcula el premium para un producto y datos de riesgo
   */
  async calculatePremium(
    productCode: string,
    riskData: RiskData,
    coverages?: CoverageType[],
    paymentFrequency: PaymentFrequency = PaymentFrequency.ANNUAL
  ): Promise<PremiumCalculationResult> {
    const product = PRODUCT_CATALOG[productCode];
    if (!product) {
      throw new Error(`Producto no encontrado: ${productCode}`);
    }

    // Calcular prima base con factores de tarificación
    const basePremium = this.applyRatingFactors(
      product.basePremium,
      riskData,
      product.ratingFactors
    );

    // Determinar coberturas a incluir
    const selectedCoverages = coverages || product.mandatoryCoverages;
    const allCoverages = [...new Set([...product.mandatoryCoverages, ...selectedCoverages])];

    // Calcular prima por cobertura
    const coverageBreakdown: CoveragePremium[] = [];
    let totalNetPremium = new Decimal(0);

    for (const coverage of allCoverages) {
      // Factor de prima por cobertura (simplificado)
      const coverageFactor = this.getCoverageFactor(coverage);
      const coverageNet = new Decimal(basePremium).mul(coverageFactor);

      const ipsRate = this.getIpsRate(product.branch);
      const consortiumRate = this.getConsortiumRate(product.branch);

      const coverageIps = coverageNet.mul(ipsRate);
      const coverageConsortium = coverageNet.mul(consortiumRate);
      const coverageTotal = coverageNet.plus(coverageIps).plus(coverageConsortium);

      coverageBreakdown.push({
        coverageId: uuidv4(),
        coverageType: coverage,
        netPremium: coverageNet.toDecimalPlaces(2).toNumber(),
        ips: coverageIps.toDecimalPlaces(2).toNumber(),
        consortiumSurcharge: coverageConsortium.toDecimalPlaces(2).toNumber(),
        totalPremium: coverageTotal.toDecimalPlaces(2).toNumber(),
      });

      totalNetPremium = totalNetPremium.plus(coverageNet);
    }

    // Calcular impuestos y recargos
    const ipsRate = this.getIpsRate(product.branch);
    const consortiumRate = this.getConsortiumRate(product.branch);
    const installmentSurchargeRate = this.getInstallmentSurchargeRate(paymentFrequency);

    const netPremium = totalNetPremium.toDecimalPlaces(2).toNumber();
    const installmentSurcharge = new Decimal(netPremium).mul(installmentSurchargeRate).toDecimalPlaces(2).toNumber();
    const netPremiumWithSurcharge = new Decimal(netPremium).plus(installmentSurcharge);
    const ips = netPremiumWithSurcharge.mul(ipsRate).toDecimalPlaces(2).toNumber();
    const consortiumSurcharge = netPremiumWithSurcharge.mul(consortiumRate).toDecimalPlaces(2).toNumber();

    const totalPremium = netPremiumWithSurcharge
      .plus(ips)
      .plus(consortiumSurcharge)
      .toDecimalPlaces(2)
      .toNumber();

    return {
      netPremium,
      installmentSurcharge,
      ips,
      ipsRate,
      consortiumSurcharge,
      consortiumRate,
      otherSurcharges: 0,
      discounts: 0,
      totalPremium,
      coverageBreakdown,
    };
  }

  /**
   * Factor de prima para cada tipo de cobertura
   */
  private getCoverageFactor(coverage: CoverageType): number {
    const factors: Partial<Record<CoverageType, number>> = {
      [CoverageType.RC_OBLIGATORIO]: 0.35,
      [CoverageType.RC_VOLUNTARIO]: 0.15,
      [CoverageType.DEFENSA_JURIDICA]: 0.05,
      [CoverageType.ROBO]: 0.10,
      [CoverageType.INCENDIO]: 0.08,
      [CoverageType.LUNAS]: 0.07,
      [CoverageType.DANOS_PROPIOS]: 0.30,
      [CoverageType.ASISTENCIA_VIAJE]: 0.05,
      [CoverageType.CONTINENTE]: 0.40,
      [CoverageType.CONTENIDO]: 0.30,
      [CoverageType.RC_FAMILIAR]: 0.10,
      [CoverageType.AGUA]: 0.08,
      [CoverageType.ROTURA_CRISTALES]: 0.05,
      [CoverageType.FALLECIMIENTO]: 0.70,
      [CoverageType.IPA]: 0.15,
      [CoverageType.IPT]: 0.15,
      [CoverageType.ENFERMEDADES_GRAVES]: 0.20,
    };

    return factors[coverage] || 0.10;
  }

  /**
   * Crea una nueva póliza
   */
  async createPolicy(
    partyId: string,
    productCode: string,
    riskData: RiskData,
    options?: {
      insuredPartyId?: string;
      paymentMethod?: PaymentMethod;
      paymentFrequency?: PaymentFrequency;
      iban?: string;
      agentId?: string;
      effectiveDate?: Date;
      coverages?: CoverageType[];
    }
  ): Promise<Policy> {
    const product = PRODUCT_CATALOG[productCode];
    if (!product) {
      throw new Error(`Producto no encontrado: ${productCode}`);
    }

    const effectiveDate = options?.effectiveDate || new Date();
    const expirationDate = addYears(effectiveDate, 1);
    const paymentFrequency = options?.paymentFrequency || PaymentFrequency.ANNUAL;

    // Calcular prima
    const premiumCalc = await this.calculatePremium(
      productCode,
      riskData,
      options?.coverages,
      paymentFrequency
    );

    // Crear coberturas
    const coverages: Coverage[] = premiumCalc.coverageBreakdown.map((cp) => ({
      id: cp.coverageId,
      policyId: '', // Se asignará después
      type: cp.coverageType,
      name: this.getCoverageName(cp.coverageType),
      sumInsured: this.getDefaultSumInsured(cp.coverageType, riskData),
      deductible: this.getDefaultDeductible(cp.coverageType),
      deductibleType: 'FIXED' as const,
      netPremium: cp.netPremium,
      mandatory: product.mandatoryCoverages.includes(cp.coverageType),
      active: true,
      effectiveDate,
      expirationDate,
    }));

    const policyId = uuidv4();
    const policyNumber = this.generatePolicyNumber(product.branch);

    // Actualizar IDs en coberturas
    coverages.forEach((c) => (c.policyId = policyId));

    const premium: Premium = {
      id: uuidv4(),
      policyId,
      netPremium: premiumCalc.netPremium,
      installmentSurcharge: premiumCalc.installmentSurcharge,
      ips: premiumCalc.ips,
      ipsRate: premiumCalc.ipsRate,
      consortiumSurcharge: premiumCalc.consortiumSurcharge,
      consortiumRate: premiumCalc.consortiumRate,
      otherSurcharges: premiumCalc.otherSurcharges,
      discounts: premiumCalc.discounts,
      totalPremium: premiumCalc.totalPremium,
      currency: 'EUR',
      calculatedAt: new Date(),
      coverageBreakdown: premiumCalc.coverageBreakdown,
    };

    const policy: Policy = {
      id: policyId,
      policyNumber,
      partyId,
      insuredPartyId: options?.insuredPartyId,
      productCode,
      productName: product.name,
      branch: product.branch,
      type: PolicyType.INDIVIDUAL,
      status: PolicyStatus.ACTIVE,
      currentVersion: 1,
      effectiveDate,
      expirationDate,
      autoRenewal: true,
      riskData,
      coverages,
      premium,
      paymentMethod: options?.paymentMethod || PaymentMethod.DIRECT_DEBIT,
      paymentFrequency,
      iban: options?.iban,
      agentId: options?.agentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Guardar póliza
    policies.set(policyId, policy);

    // Crear versión inicial
    const initialVersion: PolicyVersion = {
      id: uuidv4(),
      policyId,
      version: 1,
      effectiveDate,
      riskData,
      coverages,
      premium,
      changeDescription: 'Emisión inicial de póliza',
      createdAt: new Date(),
      createdBy: 'system',
    };
    policyVersions.set(policyId, [initialVersion]);

    return policy;
  }

  /**
   * Obtiene el nombre de una cobertura
   */
  private getCoverageName(type: CoverageType): string {
    const names: Partial<Record<CoverageType, string>> = {
      [CoverageType.RC_OBLIGATORIO]: 'Responsabilidad Civil Obligatoria',
      [CoverageType.RC_VOLUNTARIO]: 'Responsabilidad Civil Voluntaria',
      [CoverageType.DEFENSA_JURIDICA]: 'Defensa Jurídica',
      [CoverageType.ROBO]: 'Robo',
      [CoverageType.INCENDIO]: 'Incendio',
      [CoverageType.LUNAS]: 'Rotura de Lunas',
      [CoverageType.DANOS_PROPIOS]: 'Daños Propios',
      [CoverageType.ASISTENCIA_VIAJE]: 'Asistencia en Viaje',
      [CoverageType.CONTINENTE]: 'Continente',
      [CoverageType.CONTENIDO]: 'Contenido',
      [CoverageType.RC_FAMILIAR]: 'RC Familiar',
      [CoverageType.FALLECIMIENTO]: 'Fallecimiento',
      [CoverageType.IPA]: 'Invalidez Permanente Absoluta',
      [CoverageType.IPT]: 'Invalidez Permanente Total',
    };
    return names[type] || type;
  }

  /**
   * Capital asegurado por defecto
   */
  private getDefaultSumInsured(type: CoverageType, riskData: RiskData): number {
    const defaults: Partial<Record<CoverageType, number>> = {
      [CoverageType.RC_OBLIGATORIO]: 70000000, // 70M obligatorio
      [CoverageType.RC_VOLUNTARIO]: 50000000,
      [CoverageType.DEFENSA_JURIDICA]: 15000,
      [CoverageType.ROBO]: riskData.vehicle?.vehicleValue || 20000,
      [CoverageType.INCENDIO]: riskData.vehicle?.vehicleValue || 20000,
      [CoverageType.LUNAS]: 2000,
      [CoverageType.DANOS_PROPIOS]: riskData.vehicle?.vehicleValue || 20000,
      [CoverageType.CONTINENTE]: riskData.property?.continenteValue || 150000,
      [CoverageType.CONTENIDO]: riskData.property?.contenidoValue || 30000,
      [CoverageType.RC_FAMILIAR]: 600000,
    };
    return defaults[type] || 10000;
  }

  /**
   * Franquicia por defecto
   */
  private getDefaultDeductible(type: CoverageType): number {
    const defaults: Partial<Record<CoverageType, number>> = {
      [CoverageType.DANOS_PROPIOS]: 300,
      [CoverageType.ROBO]: 150,
      [CoverageType.LUNAS]: 0,
      [CoverageType.AGUA]: 60,
    };
    return defaults[type] || 0;
  }

  /**
   * Renueva una póliza
   */
  async renewPolicy(policyId: string): Promise<Policy> {
    const policy = policies.get(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (policy.status !== PolicyStatus.ACTIVE && policy.status !== PolicyStatus.EXPIRED) {
      throw new Error(`La póliza no se puede renovar en estado: ${policy.status}`);
    }

    // Marcar póliza actual como renovada
    policy.status = PolicyStatus.RENEWED;
    policy.updatedAt = new Date();

    // Crear nueva póliza renovada
    const newEffectiveDate = addDays(policy.expirationDate, 1);
    const newExpirationDate = addYears(newEffectiveDate, 1);

    // Recalcular prima (puede haber cambios en tarifas)
    const premiumCalc = await this.calculatePremium(
      policy.productCode,
      policy.riskData,
      policy.coverages.map((c) => c.type),
      policy.paymentFrequency
    );

    const newPolicyId = uuidv4();
    const newPremium: Premium = {
      id: uuidv4(),
      policyId: newPolicyId,
      netPremium: premiumCalc.netPremium,
      installmentSurcharge: premiumCalc.installmentSurcharge,
      ips: premiumCalc.ips,
      ipsRate: premiumCalc.ipsRate,
      consortiumSurcharge: premiumCalc.consortiumSurcharge,
      consortiumRate: premiumCalc.consortiumRate,
      otherSurcharges: premiumCalc.otherSurcharges,
      discounts: premiumCalc.discounts,
      totalPremium: premiumCalc.totalPremium,
      currency: 'EUR',
      calculatedAt: new Date(),
      coverageBreakdown: premiumCalc.coverageBreakdown,
    };

    const newCoverages = policy.coverages.map((c) => ({
      ...c,
      id: uuidv4(),
      policyId: newPolicyId,
      effectiveDate: newEffectiveDate,
      expirationDate: newExpirationDate,
    }));

    const renewedPolicy: Policy = {
      ...policy,
      id: newPolicyId,
      policyNumber: policy.policyNumber, // Mantiene el número
      status: PolicyStatus.ACTIVE,
      currentVersion: 1,
      effectiveDate: newEffectiveDate,
      expirationDate: newExpirationDate,
      coverages: newCoverages,
      premium: newPremium,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    policies.set(newPolicyId, renewedPolicy);

    // Crear versión inicial de la renovación
    const renewalVersion: PolicyVersion = {
      id: uuidv4(),
      policyId: newPolicyId,
      version: 1,
      effectiveDate: newEffectiveDate,
      riskData: policy.riskData,
      coverages: newCoverages,
      premium: newPremium,
      changeDescription: `Renovación de póliza. Período anterior: ${format(policy.effectiveDate, 'dd/MM/yyyy')} - ${format(policy.expirationDate, 'dd/MM/yyyy')}`,
      createdAt: new Date(),
      createdBy: 'system',
    };
    policyVersions.set(newPolicyId, [renewalVersion]);

    return renewedPolicy;
  }

  /**
   * Cancela una póliza
   */
  async cancelPolicy(
    policyId: string,
    reason: string,
    effectiveDate?: Date
  ): Promise<Policy> {
    const policy = policies.get(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new Error(`La póliza no se puede anular en estado: ${policy.status}`);
    }

    const cancellationDate = effectiveDate || new Date();

    if (isBefore(cancellationDate, policy.effectiveDate)) {
      throw new Error('La fecha de anulación no puede ser anterior al efecto de la póliza');
    }

    // Calcular extorno prorrata temporis si la anulación es anticipada
    let refundAmount = 0;
    if (isBefore(cancellationDate, policy.expirationDate)) {
      const totalDays = differenceInDays(policy.expirationDate, policy.effectiveDate);
      const remainingDays = differenceInDays(policy.expirationDate, cancellationDate);
      const dailyPremium = policy.premium.netPremium / totalDays;
      refundAmount = new Decimal(dailyPremium).mul(remainingDays).toDecimalPlaces(2).toNumber();
    }

    policy.status = PolicyStatus.CANCELLED;
    policy.expirationDate = cancellationDate;
    policy.currentVersion += 1;
    policy.updatedAt = new Date();
    policy.notes = `${policy.notes || ''}\nAnulación: ${reason}. Extorno: ${refundAmount.toFixed(2)} EUR`;

    // Crear versión de anulación
    const versions = policyVersions.get(policyId) || [];
    const cancellationVersion: PolicyVersion = {
      id: uuidv4(),
      policyId,
      version: policy.currentVersion,
      effectiveDate: cancellationDate,
      endorsementType: EndorsementType.CANCELLATION,
      riskData: policy.riskData,
      coverages: policy.coverages,
      premium: policy.premium,
      changeDescription: `Anulación de póliza. Motivo: ${reason}. Extorno: ${refundAmount.toFixed(2)} EUR`,
      createdAt: new Date(),
      createdBy: 'system',
    };
    versions.push(cancellationVersion);
    policyVersions.set(policyId, versions);

    return policy;
  }

  /**
   * Crea un suplemento de póliza
   */
  async createEndorsement(
    policyId: string,
    type: EndorsementType,
    changes: EndorsementChanges,
    effectiveDate?: Date
  ): Promise<Endorsement> {
    const policy = policies.get(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new Error(`No se puede crear suplemento para póliza en estado: ${policy.status}`);
    }

    const endorsementEffectiveDate = effectiveDate || new Date();

    if (isBefore(endorsementEffectiveDate, policy.effectiveDate)) {
      throw new Error('La fecha del suplemento no puede ser anterior al efecto de la póliza');
    }

    // Aplicar cambios según el tipo de suplemento
    let newRiskData = { ...policy.riskData };
    let newCoverages = [...policy.coverages];
    let premiumDifference = 0;

    if (changes.riskDataChanges) {
      newRiskData = { ...newRiskData, ...changes.riskDataChanges };
    }

    if (changes.coverageChanges) {
      for (const change of changes.coverageChanges) {
        switch (change.action) {
          case 'ADD':
            if (change.newValues) {
              const newCoverage: Coverage = {
                id: uuidv4(),
                policyId,
                type: change.coverageType,
                name: this.getCoverageName(change.coverageType),
                sumInsured: change.newValues.sumInsured || this.getDefaultSumInsured(change.coverageType, newRiskData),
                deductible: change.newValues.deductible || this.getDefaultDeductible(change.coverageType),
                deductibleType: 'FIXED',
                netPremium: change.newValues.netPremium || 0,
                mandatory: false,
                active: true,
                effectiveDate: endorsementEffectiveDate,
                expirationDate: policy.expirationDate,
              };
              newCoverages.push(newCoverage);
            }
            break;
          case 'REMOVE':
            newCoverages = newCoverages.filter((c) => c.type !== change.coverageType);
            break;
          case 'MODIFY':
            newCoverages = newCoverages.map((c) => {
              if (c.type === change.coverageType && change.newValues) {
                return { ...c, ...change.newValues };
              }
              return c;
            });
            break;
        }
      }
    }

    // Recalcular prima
    const newPremiumCalc = await this.calculatePremium(
      policy.productCode,
      newRiskData,
      newCoverages.map((c) => c.type),
      policy.paymentFrequency
    );

    // Calcular diferencia de prima prorrata temporis
    const totalDays = differenceInDays(policy.expirationDate, policy.effectiveDate);
    const remainingDays = differenceInDays(policy.expirationDate, endorsementEffectiveDate);
    const prorateFactor = remainingDays / totalDays;

    const oldPremiumProrata = new Decimal(policy.premium.totalPremium).mul(prorateFactor);
    const newPremiumProrata = new Decimal(newPremiumCalc.totalPremium).mul(prorateFactor);
    premiumDifference = newPremiumProrata.minus(oldPremiumProrata).toDecimalPlaces(2).toNumber();

    // Crear suplemento
    const endorsement: Endorsement = {
      id: uuidv4(),
      endorsementNumber: this.generateEndorsementNumber(policy.policyNumber, policy.currentVersion + 1),
      policyId,
      policyNumber: policy.policyNumber,
      type,
      description: this.getEndorsementDescription(type, changes),
      effectiveDate: endorsementEffectiveDate,
      previousPolicyVersion: policy.currentVersion,
      newPolicyVersion: policy.currentVersion + 1,
      changes,
      premiumDifference,
      receipts: [], // Se generarán aparte
      status: 'APPLIED',
      requestedBy: 'system',
      createdAt: new Date(),
      appliedAt: new Date(),
    };

    endorsements.set(endorsement.id, endorsement);

    // Actualizar póliza
    policy.riskData = newRiskData;
    policy.coverages = newCoverages;
    policy.currentVersion += 1;
    policy.updatedAt = new Date();

    // Actualizar prima
    policy.premium = {
      ...policy.premium,
      id: uuidv4(),
      netPremium: newPremiumCalc.netPremium,
      installmentSurcharge: newPremiumCalc.installmentSurcharge,
      ips: newPremiumCalc.ips,
      consortiumSurcharge: newPremiumCalc.consortiumSurcharge,
      totalPremium: newPremiumCalc.totalPremium,
      calculatedAt: new Date(),
      coverageBreakdown: newPremiumCalc.coverageBreakdown,
    };

    // Crear versión
    const versions = policyVersions.get(policyId) || [];
    const endorsementVersion: PolicyVersion = {
      id: uuidv4(),
      policyId,
      version: policy.currentVersion,
      effectiveDate: endorsementEffectiveDate,
      endorsementId: endorsement.id,
      endorsementType: type,
      riskData: newRiskData,
      coverages: newCoverages,
      premium: policy.premium,
      changeDescription: endorsement.description,
      createdAt: new Date(),
      createdBy: 'system',
    };
    versions.push(endorsementVersion);
    policyVersions.set(policyId, versions);

    return endorsement;
  }

  /**
   * Genera descripción del suplemento
   */
  private getEndorsementDescription(type: EndorsementType, changes: EndorsementChanges): string {
    switch (type) {
      case EndorsementType.MODIFICATION:
        return 'Modificación de datos de la póliza';
      case EndorsementType.COVERAGE_INCREASE:
        return 'Aumento de capitales/coberturas';
      case EndorsementType.COVERAGE_DECREASE:
        return 'Reducción de capitales/coberturas';
      case EndorsementType.ADD_COVERAGE:
        return `Alta de cobertura: ${changes.coverageChanges?.map((c) => c.coverageType).join(', ')}`;
      case EndorsementType.REMOVE_COVERAGE:
        return `Baja de cobertura: ${changes.coverageChanges?.map((c) => c.coverageType).join(', ')}`;
      case EndorsementType.RISK_CHANGE:
        return 'Cambio de riesgo asegurado';
      case EndorsementType.BENEFICIARY_CHANGE:
        return 'Cambio de beneficiario';
      case EndorsementType.HOLDER_CHANGE:
        return 'Cambio de tomador';
      case EndorsementType.REINSTATEMENT:
        return 'Rehabilitación de póliza';
      default:
        return 'Suplemento de póliza';
    }
  }

  /**
   * Obtiene una póliza por número
   */
  async getPolicyByNumber(policyNumber: string): Promise<Policy | null> {
    for (const policy of policies.values()) {
      if (policy.policyNumber === policyNumber) {
        return policy;
      }
    }
    return null;
  }

  /**
   * Obtiene una póliza por ID
   */
  async getPolicyById(policyId: string): Promise<Policy | null> {
    return policies.get(policyId) || null;
  }

  /**
   * Obtiene las pólizas activas de un cliente
   */
  async getActivePolicies(partyId: string): Promise<Policy[]> {
    const result: Policy[] = [];
    for (const policy of policies.values()) {
      if (policy.partyId === partyId && policy.status === PolicyStatus.ACTIVE) {
        result.push(policy);
      }
    }
    return result;
  }

  /**
   * Obtiene todas las pólizas de un cliente
   */
  async getPoliciesByParty(partyId: string): Promise<Policy[]> {
    const result: Policy[] = [];
    for (const policy of policies.values()) {
      if (policy.partyId === partyId) {
        result.push(policy);
      }
    }
    return result;
  }

  /**
   * Obtiene el historial de versiones de una póliza
   */
  async getPolicyVersions(policyId: string): Promise<PolicyVersion[]> {
    return policyVersions.get(policyId) || [];
  }

  /**
   * Obtiene los suplementos de una póliza
   */
  async getPolicyEndorsements(policyId: string): Promise<Endorsement[]> {
    const result: Endorsement[] = [];
    for (const endorsement of endorsements.values()) {
      if (endorsement.policyId === policyId) {
        result.push(endorsement);
      }
    }
    return result;
  }

  /**
   * Suspende una póliza por impago
   */
  async suspendPolicy(policyId: string, reason: string): Promise<Policy> {
    const policy = policies.get(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (policy.status !== PolicyStatus.ACTIVE) {
      throw new Error(`La póliza no se puede suspender en estado: ${policy.status}`);
    }

    policy.status = PolicyStatus.SUSPENDED;
    policy.updatedAt = new Date();
    policy.notes = `${policy.notes || ''}\nSuspendida: ${reason}`;

    return policy;
  }

  /**
   * Rehabilita una póliza suspendida
   */
  async reinstatePolicy(policyId: string): Promise<Policy> {
    const policy = policies.get(policyId);
    if (!policy) {
      throw new Error(`Póliza no encontrada: ${policyId}`);
    }

    if (policy.status !== PolicyStatus.SUSPENDED) {
      throw new Error('Solo se pueden rehabilitar pólizas suspendidas');
    }

    // Verificar que la póliza no ha vencido
    if (isAfter(new Date(), policy.expirationDate)) {
      throw new Error('La póliza ha vencido y no puede rehabilitarse');
    }

    policy.status = PolicyStatus.ACTIVE;
    policy.updatedAt = new Date();
    policy.notes = `${policy.notes || ''}\nRehabilitada: ${format(new Date(), 'dd/MM/yyyy')}`;

    // Crear suplemento de rehabilitación
    await this.createEndorsement(policyId, EndorsementType.REINSTATEMENT, {});

    return policy;
  }
}

// Exportar instancia singleton
export const policyService = new PolicyService();
