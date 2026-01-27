/**
 * Policy Service Tests
 * Tests for the PolicyService class - insurance policy management
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

import { PolicyService } from '../src/services/policy.service';
import {
  PolicyStatus,
  PolicyType,
  InsuranceBranch,
  PaymentFrequency,
  PaymentMethod,
  CoverageType,
  EndorsementType,
} from '../src/types';

describe('PolicyService', () => {
  let policyService: PolicyService;

  const mockRiskDataAuto = {
    vehicle: {
      make: 'Volkswagen',
      model: 'Golf',
      year: 2022,
      enginePower: 110,
      vehicleValue: 25000,
      parkingType: 'GARAGE',
      plate: '1234ABC',
    },
    driver: {
      age: 35,
      licenseYears: 15,
      accidentsLast5Years: 0,
    },
  };

  const mockRiskDataHogar = {
    property: {
      type: 'APARTMENT',
      surfaceM2: 100,
      year: 2010,
      postalCode: '28001',
      continenteValue: 150000,
      contenidoValue: 30000,
      hasAlarm: true,
    },
  };

  beforeEach(() => {
    policyService = new PolicyService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Premium Calculation Tests
  // ==========================================================================

  describe('calculatePremium', () => {
    it('should calculate premium for auto product', async () => {
      const result = await policyService.calculatePremium('AUTO-TR', mockRiskDataAuto);

      expect(result).toBeDefined();
      expect(result.netPremium).toBeGreaterThan(0);
      expect(result.totalPremium).toBeGreaterThan(result.netPremium);
      expect(result.ips).toBeGreaterThanOrEqual(0);
      expect(result.consortiumSurcharge).toBeGreaterThanOrEqual(0);
      expect(result.coverageBreakdown).toBeInstanceOf(Array);
    });

    it('should calculate premium for home product', async () => {
      const result = await policyService.calculatePremium('HOGAR-PLUS', mockRiskDataHogar);

      expect(result).toBeDefined();
      expect(result.netPremium).toBeGreaterThan(0);
      expect(result.totalPremium).toBeGreaterThan(0);
    });

    it('should calculate premium for life product', async () => {
      const result = await policyService.calculatePremium('VIDA-RIESGO', {
        insuredPerson: {
          age: 40,
          smoker: false,
        },
      });

      expect(result).toBeDefined();
      expect(result.ipsRate).toBe(0); // Life insurance exempt from IPS
    });

    it('should apply installment surcharge for monthly payments', async () => {
      const annual = await policyService.calculatePremium(
        'AUTO-TR',
        mockRiskDataAuto,
        undefined,
        PaymentFrequency.ANNUAL
      );

      const monthly = await policyService.calculatePremium(
        'AUTO-TR',
        mockRiskDataAuto,
        undefined,
        PaymentFrequency.MONTHLY
      );

      expect(monthly.installmentSurcharge).toBeGreaterThan(annual.installmentSurcharge);
    });

    it('should throw error for unknown product', async () => {
      await expect(
        policyService.calculatePremium('UNKNOWN-PRODUCT', mockRiskDataAuto)
      ).rejects.toThrow('Producto no encontrado');
    });

    it('should include all mandatory coverages', async () => {
      const result = await policyService.calculatePremium('AUTO-TR', mockRiskDataAuto);

      const coverageTypes = result.coverageBreakdown.map(c => c.coverageType);
      expect(coverageTypes).toContain(CoverageType.RC_OBLIGATORIO);
      expect(coverageTypes).toContain(CoverageType.DEFENSA_JURIDICA);
    });

    it('should calculate coverage breakdown correctly', async () => {
      const result = await policyService.calculatePremium('AUTO-TR', mockRiskDataAuto);

      for (const coverage of result.coverageBreakdown) {
        expect(coverage.netPremium).toBeGreaterThan(0);
        expect(coverage.totalPremium).toBeGreaterThanOrEqual(coverage.netPremium);
      }
    });
  });

  // ==========================================================================
  // Policy Creation Tests
  // ==========================================================================

  describe('createPolicy', () => {
    it('should create a new auto policy successfully', async () => {
      const policy = await policyService.createPolicy(
        'party-123',
        'AUTO-TR',
        mockRiskDataAuto,
        {
          paymentMethod: PaymentMethod.DIRECT_DEBIT,
          paymentFrequency: PaymentFrequency.ANNUAL,
        }
      );

      expect(policy).toBeDefined();
      expect(policy.id).toBeDefined();
      expect(policy.policyNumber).toBeDefined();
      expect(policy.partyId).toBe('party-123');
      expect(policy.status).toBe(PolicyStatus.ACTIVE);
      expect(policy.branch).toBe(InsuranceBranch.AUTO);
    });

    it('should create a new home policy successfully', async () => {
      const policy = await policyService.createPolicy(
        'party-456',
        'HOGAR-PLUS',
        mockRiskDataHogar
      );

      expect(policy).toBeDefined();
      expect(policy.branch).toBe(InsuranceBranch.HOGAR);
      expect(policy.coverages.length).toBeGreaterThan(0);
    });

    it('should generate unique policy numbers', async () => {
      const policy1 = await policyService.createPolicy('party-1', 'AUTO-TR', mockRiskDataAuto);
      const policy2 = await policyService.createPolicy('party-2', 'AUTO-TR', mockRiskDataAuto);

      expect(policy1.policyNumber).not.toBe(policy2.policyNumber);
    });

    it('should set effective and expiration dates', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      expect(policy.effectiveDate).toBeDefined();
      expect(policy.expirationDate).toBeDefined();
      expect(policy.expirationDate > policy.effectiveDate).toBe(true);
    });

    it('should accept custom effective date', async () => {
      const customDate = new Date('2025-06-01');
      const policy = await policyService.createPolicy(
        'party-123',
        'AUTO-TR',
        mockRiskDataAuto,
        { effectiveDate: customDate }
      );

      expect(policy.effectiveDate.toDateString()).toBe(customDate.toDateString());
    });

    it('should throw error for unknown product code', async () => {
      await expect(
        policyService.createPolicy('party-123', 'INVALID-PRODUCT', mockRiskDataAuto)
      ).rejects.toThrow('Producto no encontrado');
    });

    it('should create initial policy version', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const versions = await policyService.getPolicyVersions(policy.id);

      expect(versions.length).toBe(1);
      expect(versions[0].version).toBe(1);
    });

    it('should set auto renewal by default', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      expect(policy.autoRenewal).toBe(true);
    });
  });

  // ==========================================================================
  // Policy Retrieval Tests
  // ==========================================================================

  describe('getPolicyById', () => {
    it('should retrieve policy by ID', async () => {
      const created = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const retrieved = await policyService.getPolicyById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent policy', async () => {
      const result = await policyService.getPolicyById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getPolicyByNumber', () => {
    it('should retrieve policy by number', async () => {
      const created = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const retrieved = await policyService.getPolicyByNumber(created.policyNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved?.policyNumber).toBe(created.policyNumber);
    });

    it('should return null for non-existent policy number', async () => {
      const result = await policyService.getPolicyByNumber('INVALID-NUMBER');
      expect(result).toBeNull();
    });
  });

  describe('getActivePolicies', () => {
    it('should return active policies for a party', async () => {
      await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.createPolicy('party-123', 'HOGAR-PLUS', mockRiskDataHogar);

      const activePolicies = await policyService.getActivePolicies('party-123');

      expect(activePolicies.length).toBe(2);
      activePolicies.forEach(p => expect(p.status).toBe(PolicyStatus.ACTIVE));
    });

    it('should return empty array for party with no policies', async () => {
      const policies = await policyService.getActivePolicies('party-no-policies');
      expect(policies).toEqual([]);
    });
  });

  describe('getPoliciesByParty', () => {
    it('should return all policies for a party', async () => {
      const policy = await policyService.createPolicy('party-789', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'Test cancellation');

      await policyService.createPolicy('party-789', 'HOGAR-PLUS', mockRiskDataHogar);

      const allPolicies = await policyService.getPoliciesByParty('party-789');

      expect(allPolicies.length).toBe(2);
    });
  });

  // ==========================================================================
  // Policy Renewal Tests
  // ==========================================================================

  describe('renewPolicy', () => {
    it('should renew an active policy', async () => {
      const original = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const renewed = await policyService.renewPolicy(original.id);

      expect(renewed).toBeDefined();
      expect(renewed.id).not.toBe(original.id);
      expect(renewed.policyNumber).toBe(original.policyNumber);
      expect(renewed.status).toBe(PolicyStatus.ACTIVE);
    });

    it('should update original policy status to RENEWED', async () => {
      const original = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.renewPolicy(original.id);

      const originalAfter = await policyService.getPolicyById(original.id);
      expect(originalAfter?.status).toBe(PolicyStatus.RENEWED);
    });

    it('should set new effective date after original expiration', async () => {
      const original = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const renewed = await policyService.renewPolicy(original.id);

      expect(renewed.effectiveDate > original.expirationDate).toBe(true);
    });

    it('should throw error for non-existent policy', async () => {
      await expect(
        policyService.renewPolicy('non-existent-id')
      ).rejects.toThrow('Poliza no encontrada');
    });

    it('should throw error when renewing cancelled policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'Cancelled');

      await expect(
        policyService.renewPolicy(policy.id)
      ).rejects.toThrow('no se puede renovar');
    });
  });

  // ==========================================================================
  // Policy Cancellation Tests
  // ==========================================================================

  describe('cancelPolicy', () => {
    it('should cancel an active policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const cancelled = await policyService.cancelPolicy(policy.id, 'Customer request');

      expect(cancelled.status).toBe(PolicyStatus.CANCELLED);
    });

    it('should throw error for non-existent policy', async () => {
      await expect(
        policyService.cancelPolicy('non-existent-id', 'Test')
      ).rejects.toThrow('Poliza no encontrada');
    });

    it('should throw error when cancelling already cancelled policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'First cancellation');

      await expect(
        policyService.cancelPolicy(policy.id, 'Second cancellation')
      ).rejects.toThrow('no se puede anular');
    });

    it('should throw error for cancellation date before effective date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const policy = await policyService.createPolicy(
        'party-123',
        'AUTO-TR',
        mockRiskDataAuto,
        { effectiveDate: futureDate }
      );

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      await expect(
        policyService.cancelPolicy(policy.id, 'Test', pastDate)
      ).rejects.toThrow('fecha de anulacion no puede ser anterior');
    });

    it('should create cancellation version', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'Test cancellation');

      const versions = await policyService.getPolicyVersions(policy.id);
      expect(versions.length).toBe(2);
      expect(versions[1].endorsementType).toBe(EndorsementType.CANCELLATION);
    });
  });

  // ==========================================================================
  // Endorsement Tests
  // ==========================================================================

  describe('createEndorsement', () => {
    it('should create modification endorsement', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      const endorsement = await policyService.createEndorsement(
        policy.id,
        EndorsementType.MODIFICATION,
        { riskDataChanges: { vehicle: { ...mockRiskDataAuto.vehicle, plate: '5678XYZ' } } }
      );

      expect(endorsement).toBeDefined();
      expect(endorsement.type).toBe(EndorsementType.MODIFICATION);
      expect(endorsement.status).toBe('APPLIED');
    });

    it('should add coverage endorsement', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TC', mockRiskDataAuto);

      const endorsement = await policyService.createEndorsement(
        policy.id,
        EndorsementType.ADD_COVERAGE,
        {
          coverageChanges: [
            {
              action: 'ADD',
              coverageType: CoverageType.DANOS_PROPIOS,
              newValues: { sumInsured: 25000, deductible: 300 },
            },
          ],
        }
      );

      expect(endorsement).toBeDefined();
      expect(endorsement.type).toBe(EndorsementType.ADD_COVERAGE);
    });

    it('should remove coverage endorsement', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      const endorsement = await policyService.createEndorsement(
        policy.id,
        EndorsementType.REMOVE_COVERAGE,
        {
          coverageChanges: [
            {
              action: 'REMOVE',
              coverageType: CoverageType.LUNAS,
            },
          ],
        }
      );

      expect(endorsement).toBeDefined();
    });

    it('should calculate premium difference', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      const endorsement = await policyService.createEndorsement(
        policy.id,
        EndorsementType.ADD_COVERAGE,
        {
          coverageChanges: [
            {
              action: 'ADD',
              coverageType: CoverageType.ASISTENCIA_VIAJE,
              newValues: { sumInsured: 10000 },
            },
          ],
        }
      );

      expect(endorsement.premiumDifference).toBeDefined();
    });

    it('should increment policy version', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      expect(policy.currentVersion).toBe(1);

      await policyService.createEndorsement(
        policy.id,
        EndorsementType.MODIFICATION,
        { riskDataChanges: {} }
      );

      const updated = await policyService.getPolicyById(policy.id);
      expect(updated?.currentVersion).toBe(2);
    });

    it('should throw error for non-existent policy', async () => {
      await expect(
        policyService.createEndorsement('invalid-id', EndorsementType.MODIFICATION, {})
      ).rejects.toThrow('Poliza no encontrada');
    });

    it('should throw error for non-active policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'Cancelled');

      await expect(
        policyService.createEndorsement(policy.id, EndorsementType.MODIFICATION, {})
      ).rejects.toThrow('No se puede crear suplemento');
    });
  });

  // ==========================================================================
  // Suspend/Reinstate Tests
  // ==========================================================================

  describe('suspendPolicy', () => {
    it('should suspend an active policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      const suspended = await policyService.suspendPolicy(policy.id, 'Non-payment');

      expect(suspended.status).toBe(PolicyStatus.SUSPENDED);
    });

    it('should throw error for non-existent policy', async () => {
      await expect(
        policyService.suspendPolicy('invalid-id', 'Test')
      ).rejects.toThrow('Poliza no encontrada');
    });

    it('should throw error for non-active policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.cancelPolicy(policy.id, 'Cancelled');

      await expect(
        policyService.suspendPolicy(policy.id, 'Test')
      ).rejects.toThrow('no se puede suspender');
    });
  });

  describe('reinstatePolicy', () => {
    it('should reinstate a suspended policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.suspendPolicy(policy.id, 'Non-payment');

      const reinstated = await policyService.reinstatePolicy(policy.id);

      expect(reinstated.status).toBe(PolicyStatus.ACTIVE);
    });

    it('should throw error for non-suspended policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);

      await expect(
        policyService.reinstatePolicy(policy.id)
      ).rejects.toThrow('Solo se pueden rehabilitar polizas suspendidas');
    });

    it('should create reinstatement endorsement', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.suspendPolicy(policy.id, 'Non-payment');
      await policyService.reinstatePolicy(policy.id);

      const endorsements = await policyService.getPolicyEndorsements(policy.id);
      const reinstatementEndorsement = endorsements.find(
        e => e.type === EndorsementType.REINSTATEMENT
      );

      expect(reinstatementEndorsement).toBeDefined();
    });
  });

  // ==========================================================================
  // Version History Tests
  // ==========================================================================

  describe('getPolicyVersions', () => {
    it('should return version history', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.createEndorsement(policy.id, EndorsementType.MODIFICATION, {});

      const versions = await policyService.getPolicyVersions(policy.id);

      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
    });

    it('should return empty array for non-existent policy', async () => {
      const versions = await policyService.getPolicyVersions('non-existent');
      expect(versions).toEqual([]);
    });
  });

  describe('getPolicyEndorsements', () => {
    it('should return all endorsements for a policy', async () => {
      const policy = await policyService.createPolicy('party-123', 'AUTO-TR', mockRiskDataAuto);
      await policyService.createEndorsement(policy.id, EndorsementType.MODIFICATION, {});
      await policyService.createEndorsement(policy.id, EndorsementType.MODIFICATION, {});

      const endorsements = await policyService.getPolicyEndorsements(policy.id);

      expect(endorsements.length).toBe(2);
    });
  });
});
