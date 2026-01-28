import { ClaimAutomationService } from '../automation/claim-automation.service';
import { ClaimStateMachine } from '../workflow/claim-state-machine';
import { Claim } from '../entities/claim.entity';
import { ClaimType, ClaimState } from '../enums/claim-state.enum';

describe('ClaimAutomationService', () => {
  let service: ClaimAutomationService;
  let stateMachine: ClaimStateMachine;
  let mockClaim: Claim;

  beforeEach(() => {
    stateMachine = new ClaimStateMachine();
    service = new ClaimAutomationService(stateMachine);

    mockClaim = {
      id: 'claim_123',
      claimNumber: 'CLM-2026-001',
      state: ClaimState.SUBMITTED,
      type: ClaimType.AUTO_ACCIDENT,
      estimatedAmount: 300,
      hasRequiredDocuments: true,
      fraudScore: 10,
      incidentDate: new Date(),
      stateHistory: [],
    } as Claim;
  });

  describe('autoProcess', () => {
    it('should auto-approve low value claims with documents', async () => {
      mockClaim.estimatedAmount = 400;
      mockClaim.hasRequiredDocuments = true;
      mockClaim.fraudScore = 20;

      const result = await service.autoProcess(mockClaim);

      expect(result.success).toBe(true);
      expect(result.rulesApplied.length).toBeGreaterThan(0);
    });

    it('should auto-reject high fraud risk claims', async () => {
      mockClaim.fraudScore = 85;

      const result = await service.autoProcess(mockClaim);

      expect(result.rulesApplied).toContain('auto_reject_high_fraud');
    });

    it('should escalate high value claims', async () => {
      mockClaim.estimatedAmount = 15000;

      const result = await service.autoProcess(mockClaim);

      expect(result.rulesApplied).toContain('auto_escalate_high_value');
    });
  });

  describe('autoAssignAdjuster', () => {
    it('should assign adjuster based on claim type', async () => {
      mockClaim.type = ClaimType.AUTO_ACCIDENT;

      const adjusterId = await service.autoAssignAdjuster(mockClaim);

      expect(adjusterId).toBeDefined();
      expect(adjusterId).toContain('adj_');
    });

    it('should assign different adjusters for different types', async () => {
      const autoClaim = { ...mockClaim, type: ClaimType.AUTO_ACCIDENT };
      const healthClaim = { ...mockClaim, type: ClaimType.HEALTH };

      const autoAdjuster = await service.autoAssignAdjuster(autoClaim as Claim);
      const healthAdjuster = await service.autoAssignAdjuster(healthClaim as Claim);

      expect(autoAdjuster).not.toBe(healthAdjuster);
    });
  });

  describe('autoCalculateEstimate', () => {
    it('should calculate estimate based on claim type', async () => {
      mockClaim.estimatedAmount = 1000;
      mockClaim.type = ClaimType.AUTO_ACCIDENT;

      const estimate = await service.autoCalculateEstimate(mockClaim);

      expect(estimate).toBeGreaterThan(mockClaim.estimatedAmount);
    });

    it('should adjust for urgent priority', async () => {
      mockClaim.estimatedAmount = 1000;
      mockClaim.priority = 'URGENT';

      const estimate = await service.autoCalculateEstimate(mockClaim);

      expect(estimate).toBeGreaterThan(mockClaim.estimatedAmount);
    });
  });

  describe('autoDetectDuplicates', () => {
    it('should detect duplicate claims', async () => {
      const claim1 = {
        id: 'claim_1',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        incidentDate: new Date('2026-01-20'),
        estimatedAmount: 1000,
      } as Claim;

      const claim2 = {
        id: 'claim_2',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        incidentDate: new Date('2026-01-22'),
        estimatedAmount: 1050,
      } as Claim;

      const duplicates = await service.autoDetectDuplicates(claim1, [claim2]);

      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('should not flag different customers as duplicates', async () => {
      const claim1 = {
        id: 'claim_1',
        customerId: 'cust_123',
        type: ClaimType.AUTO_ACCIDENT,
        incidentDate: new Date('2026-01-20'),
        estimatedAmount: 1000,
      } as Claim;

      const claim2 = {
        id: 'claim_2',
        customerId: 'cust_456',
        type: ClaimType.AUTO_ACCIDENT,
        incidentDate: new Date('2026-01-20'),
        estimatedAmount: 1000,
      } as Claim;

      const duplicates = await service.autoDetectDuplicates(claim1, [claim2]);

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('autoFlagHighValue', () => {
    it('should flag claims above threshold', async () => {
      mockClaim.estimatedAmount = 15000;

      await service.autoFlagHighValue(mockClaim, 10000);

      expect(mockClaim.metadata?.highValue).toBe(true);
    });

    it('should not flag claims below threshold', async () => {
      mockClaim.estimatedAmount = 5000;
      mockClaim.metadata = {};

      await service.autoFlagHighValue(mockClaim, 10000);

      expect(mockClaim.metadata?.highValue).toBeUndefined();
    });
  });

  describe('autoNotifyDelays', () => {
    it('should detect delays in submitted state', async () => {
      mockClaim.state = ClaimState.SUBMITTED;
      mockClaim.submittedDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 días atrás

      await service.autoNotifyDelays(mockClaim);

      expect(mockClaim.metadata?.delayed).toBe(true);
    });

    it('should not flag recent claims as delayed', async () => {
      mockClaim.state = ClaimState.SUBMITTED;
      mockClaim.submittedDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 día atrás
      mockClaim.metadata = {};

      await service.autoNotifyDelays(mockClaim);

      expect(mockClaim.metadata?.delayed).toBeUndefined();
    });
  });

  describe('autoCloseStaleClaims', () => {
    it('should close stale pending_documents claims', async () => {
      const staleClaim = {
        ...mockClaim,
        state: ClaimState.PENDING_DOCUMENTS,
        updatedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 días
      } as Claim;

      const count = await service.autoCloseStaleClaims([staleClaim], 90);

      expect(count).toBe(1);
      expect(staleClaim.state).toBe(ClaimState.CLOSED);
    });

    it('should not close recent claims', async () => {
      const recentClaim = {
        ...mockClaim,
        state: ClaimState.PENDING_DOCUMENTS,
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días
      } as Claim;

      const count = await service.autoCloseStaleClaims([recentClaim], 90);

      expect(count).toBe(0);
    });
  });

  describe('checkSLA', () => {
    it('should detect SLA breach', async () => {
      mockClaim.type = ClaimType.HEALTH; // SLA: 7 días
      mockClaim.submittedDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 días atrás

      const result = await service.checkSLA(mockClaim);

      expect(result.breached).toBe(true);
      expect(result.daysRemaining).toBeLessThan(0);
    });

    it('should not breach SLA within target', async () => {
      mockClaim.type = ClaimType.HEALTH; // SLA: 7 días
      mockClaim.submittedDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 días atrás

      const result = await service.checkSLA(mockClaim);

      expect(result.breached).toBe(false);
      expect(result.daysRemaining).toBeGreaterThan(0);
    });

    it('should use different SLA targets for different types', async () => {
      const autoClaim = { ...mockClaim, type: ClaimType.AUTO_ACCIDENT };
      const healthClaim = { ...mockClaim, type: ClaimType.HEALTH };

      autoClaim.submittedDate = new Date();
      healthClaim.submittedDate = new Date();

      const autoSLA = await service.checkSLA(autoClaim as Claim);
      const healthSLA = await service.checkSLA(healthClaim as Claim);

      // AUTO_ACCIDENT tiene SLA de 10 días, HEALTH de 7
      expect(autoSLA.daysRemaining).toBeGreaterThan(healthSLA.daysRemaining);
    });
  });
});
