/**
 * Claim Service Tests
 * Tests for the ClaimService class - insurance claim management
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

// Mock policy service
jest.mock('../src/services/policy.service', () => {
  const mockPolicy = {
    id: 'policy-123',
    policyNumber: 'AUT231234567',
    partyId: 'party-123',
    status: 'ACTIVE',
    effectiveDate: new Date('2024-01-01'),
    expirationDate: new Date('2025-01-01'),
    coverages: [
      {
        id: 'coverage-1',
        type: 'RC_OBLIGATORIO',
        active: true,
        sumInsured: 70000000,
        deductible: 0,
        deductibleType: 'FIXED',
      },
      {
        id: 'coverage-2',
        type: 'DANOS_PROPIOS',
        active: true,
        sumInsured: 25000,
        deductible: 300,
        deductibleType: 'FIXED',
      },
      {
        id: 'coverage-3',
        type: 'LUNAS',
        active: true,
        sumInsured: 2000,
        deductible: 0,
        deductibleType: 'FIXED',
      },
    ],
  };

  return {
    policyService: {
      getPolicyById: jest.fn().mockResolvedValue(mockPolicy),
    },
  };
});

import { ClaimService } from '../src/services/claim.service';
import { policyService } from '../src/services/policy.service';
import {
  ClaimStatus,
  ClaimType,
  ReserveType,
  PaymentMethod,
} from '../src/types';

describe('ClaimService', () => {
  let claimService: ClaimService;

  const mockIncidentData = {
    type: ClaimType.COLLISION,
    incidentDate: new Date(),
    description: 'Collision with another vehicle at intersection',
    location: {
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      coordinates: { lat: 40.4168, lng: -3.7038 },
    },
    circumstances: 'The other driver ran a red light',
    hasThirdParties: true,
    thirdParties: [
      {
        name: 'John Doe',
        vehiclePlate: '5678XYZ',
        insuranceCompany: 'Mapfre',
        policyNumber: 'POL-12345',
      },
    ],
  };

  beforeEach(() => {
    claimService = new ClaimService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Open Claim Tests
  // ==========================================================================

  describe('openClaim', () => {
    it('should open a new claim successfully', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      expect(claim).toBeDefined();
      expect(claim.id).toBeDefined();
      expect(claim.claimNumber).toBeDefined();
      expect(claim.status).toBe(ClaimStatus.REPORTED);
      expect(claim.type).toBe(ClaimType.COLLISION);
    });

    it('should generate unique claim numbers', async () => {
      const claim1 = await claimService.openClaim('policy-123', mockIncidentData);
      const claim2 = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        incidentDate: new Date(),
      });

      expect(claim1.claimNumber).not.toBe(claim2.claimNumber);
    });

    it('should set initial reserve', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      expect(claim.currentReserve).toBeGreaterThan(0);
    });

    it('should use estimated amount as initial reserve when provided', async () => {
      const estimatedAmount = 5000;
      const claim = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        estimatedAmount,
      });

      expect(claim.currentReserve).toBe(estimatedAmount);
    });

    it('should throw error for non-existent policy', async () => {
      (policyService.getPolicyById as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        claimService.openClaim('non-existent-policy', mockIncidentData)
      ).rejects.toThrow('Poliza no encontrada');
    });

    it('should throw error for cancelled policy', async () => {
      (policyService.getPolicyById as jest.Mock).mockResolvedValueOnce({
        id: 'policy-123',
        status: 'CANCELLED',
      });

      await expect(
        claimService.openClaim('policy-123', mockIncidentData)
      ).rejects.toThrow('No se puede abrir siniestro');
    });

    it('should throw error for incident outside coverage period', async () => {
      const pastDate = new Date('2020-01-01');

      await expect(
        claimService.openClaim('policy-123', {
          ...mockIncidentData,
          incidentDate: pastDate,
        })
      ).rejects.toThrow('fecha del siniestro no esta dentro del periodo');
    });

    it('should throw error for uncovered claim type', async () => {
      (policyService.getPolicyById as jest.Mock).mockResolvedValueOnce({
        id: 'policy-123',
        status: 'ACTIVE',
        effectiveDate: new Date('2024-01-01'),
        expirationDate: new Date('2025-01-01'),
        coverages: [], // No coverages
      });

      await expect(
        claimService.openClaim('policy-123', mockIncidentData)
      ).rejects.toThrow('no cubierto');
    });

    it('should record third party information', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      expect(claim.hasThirdParties).toBe(true);
      expect(claim.thirdParties).toBeDefined();
      expect(claim.thirdParties?.length).toBe(1);
    });
  });

  // ==========================================================================
  // Claim Retrieval Tests
  // ==========================================================================

  describe('getClaimById', () => {
    it('should retrieve claim by ID', async () => {
      const created = await claimService.openClaim('policy-123', mockIncidentData);
      const retrieved = await claimService.getClaimById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent claim', async () => {
      const result = await claimService.getClaimById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getClaimByNumber', () => {
    it('should retrieve claim by number', async () => {
      const created = await claimService.openClaim('policy-123', mockIncidentData);
      const retrieved = await claimService.getClaimByNumber(created.claimNumber);

      expect(retrieved).toBeDefined();
      expect(retrieved?.claimNumber).toBe(created.claimNumber);
    });
  });

  describe('getClaimsByPolicy', () => {
    it('should return all claims for a policy', async () => {
      await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        type: ClaimType.GLASS_BREAKAGE,
      });

      const claims = await claimService.getClaimsByPolicy('policy-123');

      expect(claims.length).toBe(2);
    });

    it('should return claims sorted by date descending', async () => {
      await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.openClaim('policy-123', mockIncidentData);

      const claims = await claimService.getClaimsByPolicy('policy-123');

      expect(claims[0].reportedDate >= claims[1].reportedDate).toBe(true);
    });
  });

  describe('getClaimsByStatus', () => {
    it('should return claims with specific status', async () => {
      await claimService.openClaim('policy-123', mockIncidentData);

      const reportedClaims = await claimService.getClaimsByStatus(ClaimStatus.REPORTED);

      expect(reportedClaims.length).toBeGreaterThan(0);
      reportedClaims.forEach(c => expect(c.status).toBe(ClaimStatus.REPORTED));
    });
  });

  // ==========================================================================
  // Adjuster Assignment Tests
  // ==========================================================================

  describe('assignAdjuster', () => {
    it('should assign adjuster to claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const updated = await claimService.assignAdjuster(claim.id, 'adjuster-001', 'John Smith');

      expect(updated.adjusterId).toBe('adjuster-001');
      expect(updated.adjusterName).toBe('John Smith');
      expect(updated.status).toBe(ClaimStatus.ASSIGNED);
    });

    it('should throw error for non-existent claim', async () => {
      await expect(
        claimService.assignAdjuster('invalid-id', 'adjuster-001')
      ).rejects.toThrow('Siniestro no encontrado');
    });

    it('should throw error for closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.closeClaim(claim.id, 'Resolved');

      await expect(
        claimService.assignAdjuster(claim.id, 'adjuster-001')
      ).rejects.toThrow('No se puede asignar perito a un siniestro cerrado');
    });
  });

  describe('getClaimsByAdjuster', () => {
    it('should return claims assigned to adjuster', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.assignAdjuster(claim.id, 'adjuster-001');

      const claims = await claimService.getClaimsByAdjuster('adjuster-001');

      expect(claims.length).toBe(1);
      expect(claims[0].adjusterId).toBe('adjuster-001');
    });
  });

  // ==========================================================================
  // Reserve Management Tests
  // ==========================================================================

  describe('updateReserve', () => {
    it('should update claim reserve', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const reserve = await claimService.updateReserve(
        claim.id,
        5000,
        ReserveType.ADJUSTED,
        'Updated based on inspection'
      );

      expect(reserve).toBeDefined();
      expect(reserve.amount).toBe(5000);
      expect(reserve.type).toBe(ReserveType.ADJUSTED);

      const updatedClaim = await claimService.getClaimById(claim.id);
      expect(updatedClaim?.currentReserve).toBe(5000);
    });

    it('should track reserve history', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.updateReserve(claim.id, 3000, ReserveType.ADJUSTED);
      await claimService.updateReserve(claim.id, 5000, ReserveType.ADJUSTED);

      const history = await claimService.getReserveHistory(claim.id);

      expect(history.length).toBeGreaterThanOrEqual(3); // Initial + 2 updates
    });

    it('should throw error for negative reserve', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      await expect(
        claimService.updateReserve(claim.id, -100, ReserveType.ADJUSTED)
      ).rejects.toThrow('reserva no puede ser negativa');
    });

    it('should throw error for closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.closeClaim(claim.id, 'Resolved');

      await expect(
        claimService.updateReserve(claim.id, 5000, ReserveType.ADJUSTED)
      ).rejects.toThrow('No se puede modificar la reserva de un siniestro cerrado');
    });
  });

  // ==========================================================================
  // Payment Processing Tests
  // ==========================================================================

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const payment = await claimService.processPayment(
        claim.id,
        1000,
        'Juan Garcia',
        {
          beneficiaryType: 'INSURED',
          concept: 'Repair cost reimbursement',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          iban: 'ES1234567890123456789012',
        }
      );

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(1000);
      expect(payment.status).toBe('PENDING');
      expect(payment.beneficiary).toBe('Juan Garcia');
    });

    it('should update total paid on claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.processPayment(claim.id, 1000, 'Beneficiary 1');
      await claimService.processPayment(claim.id, 500, 'Beneficiary 2');

      const updated = await claimService.getClaimById(claim.id);
      expect(updated?.totalPaid).toBe(1500);
    });

    it('should auto-adjust reserve when payment exceeds it', async () => {
      const claim = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        estimatedAmount: 1000,
      });

      await claimService.processPayment(claim.id, 2000, 'Beneficiary');

      const updated = await claimService.getClaimById(claim.id);
      expect(updated?.currentReserve).toBeGreaterThanOrEqual(2000);
    });

    it('should throw error for zero or negative amount', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      await expect(
        claimService.processPayment(claim.id, 0, 'Beneficiary')
      ).rejects.toThrow('importe del pago debe ser positivo');

      await expect(
        claimService.processPayment(claim.id, -100, 'Beneficiary')
      ).rejects.toThrow('importe del pago debe ser positivo');
    });

    it('should throw error for closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.closeClaim(claim.id, 'Resolved');

      await expect(
        claimService.processPayment(claim.id, 1000, 'Beneficiary')
      ).rejects.toThrow('No se puede procesar pago');
    });

    it('should change claim status to IN_PROGRESS', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.processPayment(claim.id, 1000, 'Beneficiary');

      const updated = await claimService.getClaimById(claim.id);
      expect(updated?.status).toBe(ClaimStatus.IN_PROGRESS);
    });
  });

  describe('approvePayment', () => {
    it('should approve pending payment', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const payment = await claimService.processPayment(claim.id, 1000, 'Beneficiary');

      const approved = await claimService.approvePayment(claim.id, payment.id, 'approver-001');

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('approver-001');
      expect(approved.approvedAt).toBeDefined();
    });

    it('should throw error for non-pending payment', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const payment = await claimService.processPayment(claim.id, 1000, 'Beneficiary');
      await claimService.approvePayment(claim.id, payment.id, 'approver-001');

      await expect(
        claimService.approvePayment(claim.id, payment.id, 'approver-002')
      ).rejects.toThrow('no esta pendiente de aprobacion');
    });
  });

  describe('markPaymentAsPaid', () => {
    it('should mark approved payment as paid', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const payment = await claimService.processPayment(claim.id, 1000, 'Beneficiary');
      await claimService.approvePayment(claim.id, payment.id, 'approver-001');

      const paid = await claimService.markPaymentAsPaid(claim.id, payment.id);

      expect(paid.status).toBe('PAID');
    });

    it('should throw error for unapproved payment', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const payment = await claimService.processPayment(claim.id, 1000, 'Beneficiary');

      await expect(
        claimService.markPaymentAsPaid(claim.id, payment.id)
      ).rejects.toThrow('debe estar aprobado');
    });
  });

  // ==========================================================================
  // Recovery Tests
  // ==========================================================================

  describe('registerRecovery', () => {
    it('should register recovery amount', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.processPayment(claim.id, 2000, 'Beneficiary');

      const updated = await claimService.registerRecovery(
        claim.id,
        1000,
        'Third party insurance'
      );

      expect(updated.recoveries).toBe(1000);
    });

    it('should throw error for invalid recovery amount', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      await expect(
        claimService.registerRecovery(claim.id, 0, 'Source')
      ).rejects.toThrow('importe del recobro debe ser positivo');
    });
  });

  // ==========================================================================
  // Close/Reopen Claim Tests
  // ==========================================================================

  describe('closeClaim', () => {
    it('should close a claim successfully', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const closed = await claimService.closeClaim(claim.id, 'All payments completed');

      expect(closed.status).toBe(ClaimStatus.CLOSED);
      expect(closed.resolution).toBe('All payments completed');
      expect(closed.closedDate).toBeDefined();
    });

    it('should reject a claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const rejected = await claimService.closeClaim(
        claim.id,
        'Claim not covered',
        ClaimStatus.REJECTED
      );

      expect(rejected.status).toBe(ClaimStatus.REJECTED);
    });

    it('should throw error for already closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.closeClaim(claim.id, 'Resolved');

      await expect(
        claimService.closeClaim(claim.id, 'Try again')
      ).rejects.toThrow('siniestro ya esta cerrado');
    });

    it('should throw error when pending payments exist', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.processPayment(claim.id, 1000, 'Beneficiary');

      await expect(
        claimService.closeClaim(claim.id, 'Resolved')
      ).rejects.toThrow('pago(s) pendientes');
    });

    it('should adjust final reserve to total paid', async () => {
      const claim = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        estimatedAmount: 5000,
      });

      const payment = await claimService.processPayment(claim.id, 1000, 'Beneficiary');
      await claimService.approvePayment(claim.id, payment.id, 'approver');
      await claimService.markPaymentAsPaid(claim.id, payment.id);

      await claimService.closeClaim(claim.id, 'Complete');

      const closed = await claimService.getClaimById(claim.id);
      expect(closed?.currentReserve).toBe(1000);
    });
  });

  describe('reopenClaim', () => {
    it('should reopen a closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.closeClaim(claim.id, 'Resolved');

      const reopened = await claimService.reopenClaim(claim.id, 'New information received');

      expect(reopened.status).toBe(ClaimStatus.REOPENED);
      expect(reopened.closedDate).toBeUndefined();
    });

    it('should throw error for non-closed claim', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);

      await expect(
        claimService.reopenClaim(claim.id, 'Test')
      ).rejects.toThrow('Solo se pueden reabrir siniestros cerrados');
    });
  });

  // ==========================================================================
  // Coverage Check Tests
  // ==========================================================================

  describe('checkCoverage', () => {
    it('should return covered for valid claim type', async () => {
      const result = await claimService.checkCoverage('policy-123', ClaimType.COLLISION);

      expect(result.covered).toBe(true);
      expect(result.coverage).toBeDefined();
      expect(result.sumInsured).toBeGreaterThan(0);
    });

    it('should return not covered for missing coverage', async () => {
      (policyService.getPolicyById as jest.Mock).mockResolvedValueOnce({
        id: 'policy-123',
        coverages: [],
      });

      const result = await claimService.checkCoverage('policy-123', ClaimType.THEFT);

      expect(result.covered).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should include deductible information', async () => {
      const result = await claimService.checkCoverage('policy-123', ClaimType.COLLISION);

      expect(result.deductible).toBeDefined();
    });
  });

  // ==========================================================================
  // Deductible Calculation Tests
  // ==========================================================================

  describe('calculateDeductible', () => {
    it('should calculate fixed deductible correctly', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const result = await claimService.calculateDeductible(claim.id, 5000);

      expect(result).toBeDefined();
      expect(result.deductibleType).toBe('FIXED');
      expect(result.payableAmount).toBe(result.claimAmount - result.deductibleAmount);
    });

    it('should not exceed claim amount for deductible', async () => {
      const claim = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        estimatedAmount: 100,
      });

      const result = await claimService.calculateDeductible(claim.id, 100);

      expect(result.deductibleAmount).toBeLessThanOrEqual(result.claimAmount);
      expect(result.payableAmount).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Special Status Tests
  // ==========================================================================

  describe('flagAsFraud', () => {
    it('should flag claim as fraud suspected', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const flagged = await claimService.flagAsFraud(claim.id, 'Inconsistent statements');

      expect(flagged.status).toBe(ClaimStatus.FRAUD_SUSPECTED);
    });
  });

  describe('sendToLitigation', () => {
    it('should mark claim as in litigation', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const litigated = await claimService.sendToLitigation(claim.id, 'Dispute with third party');

      expect(litigated.status).toBe(ClaimStatus.IN_LITIGATION);
    });

    it('should increase reserve for litigation', async () => {
      const claim = await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        estimatedAmount: 1000,
      });
      const originalReserve = claim.currentReserve;

      await claimService.sendToLitigation(claim.id, 'Legal action');

      const updated = await claimService.getClaimById(claim.id);
      expect(updated?.currentReserve).toBeGreaterThan(originalReserve);
    });
  });

  describe('requestDocumentation', () => {
    it('should mark claim as pending documentation', async () => {
      const claim = await claimService.openClaim('policy-123', mockIncidentData);
      const updated = await claimService.requestDocumentation(
        claim.id,
        ['Police report', 'Photos of damage', 'Repair estimate']
      );

      expect(updated.status).toBe(ClaimStatus.PENDING_DOCS);
    });
  });

  // ==========================================================================
  // Statistics Tests
  // ==========================================================================

  describe('getClaimStatistics', () => {
    it('should return claim statistics', async () => {
      await claimService.openClaim('policy-123', mockIncidentData);
      await claimService.openClaim('policy-123', {
        ...mockIncidentData,
        type: ClaimType.GLASS_BREAKAGE,
      });

      const stats = await claimService.getClaimStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalClaims).toBeGreaterThanOrEqual(2);
      expect(stats.claimsByStatus).toBeDefined();
      expect(stats.claimsByType).toBeDefined();
    });

    it('should filter statistics by date range', async () => {
      await claimService.openClaim('policy-123', mockIncidentData);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const stats = await claimService.getClaimStatistics(futureDate);

      expect(stats.totalClaims).toBe(0);
    });
  });
});
