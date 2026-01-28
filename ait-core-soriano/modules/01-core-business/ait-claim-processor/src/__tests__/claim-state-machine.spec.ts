import { ClaimStateMachine, claimTransitions } from '../workflow/claim-state-machine';
import { ClaimState } from '../enums/claim-state.enum';
import { Claim } from '../entities/claim.entity';

describe('ClaimStateMachine', () => {
  let stateMachine: ClaimStateMachine;
  let mockClaim: Claim;

  beforeEach(() => {
    stateMachine = new ClaimStateMachine();

    mockClaim = {
      id: 'claim_123',
      claimNumber: 'CLM-2026-001',
      state: ClaimState.DRAFT,
      type: 'AUTO_ACCIDENT',
      policyId: 'pol_123',
      customerId: 'cust_123',
      estimatedAmount: 1000,
      stateHistory: [],
    } as Claim;
  });

  describe('canTransition', () => {
    it('should allow valid transition from DRAFT to SUBMITTED', () => {
      const result = stateMachine.canTransition(ClaimState.DRAFT, ClaimState.SUBMITTED);
      expect(result).toBe(true);
    });

    it('should not allow invalid transition from DRAFT to PAID', () => {
      const result = stateMachine.canTransition(ClaimState.DRAFT, ClaimState.PAID);
      expect(result).toBe(false);
    });

    it('should allow transition from SUBMITTED to UNDER_REVIEW', () => {
      const result = stateMachine.canTransition(ClaimState.SUBMITTED, ClaimState.UNDER_REVIEW);
      expect(result).toBe(true);
    });

    it('should allow transition from CLOSED to UNDER_REVIEW (reopen)', () => {
      const result = stateMachine.canTransition(ClaimState.CLOSED, ClaimState.UNDER_REVIEW);
      expect(result).toBe(true);
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for DRAFT state', () => {
      const transitions = stateMachine.getAvailableTransitions(ClaimState.DRAFT);
      expect(transitions).toContain(ClaimState.SUBMITTED);
      expect(transitions).toHaveLength(1);
    });

    it('should return multiple transitions for UNDER_REVIEW state', () => {
      const transitions = stateMachine.getAvailableTransitions(ClaimState.UNDER_REVIEW);
      expect(transitions.length).toBeGreaterThan(1);
      expect(transitions).toContain(ClaimState.APPROVED);
      expect(transitions).toContain(ClaimState.REJECTED);
    });
  });

  describe('transition', () => {
    it('should successfully transition from DRAFT to SUBMITTED', async () => {
      const result = await stateMachine.transition(mockClaim, ClaimState.SUBMITTED);

      expect(result.state).toBe(ClaimState.SUBMITTED);
      expect(result.lastStateChange).toBeDefined();
      expect(result.stateHistory).toHaveLength(1);
    });

    it('should throw error for invalid transition', async () => {
      await expect(
        stateMachine.transition(mockClaim, ClaimState.PAID),
      ).rejects.toThrow('Transición inválida');
    });

    it('should record transition in history', async () => {
      await stateMachine.transition(mockClaim, ClaimState.SUBMITTED, 'Test reason');

      const history = mockClaim.stateHistory[0];
      expect(history.fromState).toBe(ClaimState.DRAFT);
      expect(history.toState).toBe(ClaimState.SUBMITTED);
      expect(history.reason).toBe('Test reason');
    });

    it('should support userId in transition', async () => {
      await stateMachine.transition(
        mockClaim,
        ClaimState.SUBMITTED,
        'Test',
        'CODE',
        'user_123',
      );

      expect(mockClaim.stateHistory[0].userId).toBe('user_123');
    });
  });

  describe('canTransitionAsync', () => {
    it('should validate APPROVED transition requires documents', async () => {
      mockClaim.state = ClaimState.UNDER_REVIEW;
      mockClaim.hasRequiredDocuments = false;

      const result = await stateMachine.canTransitionAsync(mockClaim, ClaimState.APPROVED);
      expect(result).toBe(false);
    });

    it('should allow APPROVED transition with documents', async () => {
      mockClaim.state = ClaimState.UNDER_REVIEW;
      mockClaim.hasRequiredDocuments = true;
      mockClaim.fraudRiskLevel = 'LOW';

      const result = await stateMachine.canTransitionAsync(mockClaim, ClaimState.APPROVED);
      expect(result).toBe(true);
    });

    it('should prevent APPROVED transition with CRITICAL fraud risk', async () => {
      mockClaim.state = ClaimState.UNDER_REVIEW;
      mockClaim.hasRequiredDocuments = true;
      mockClaim.fraudRiskLevel = 'CRITICAL';

      const result = await stateMachine.canTransitionAsync(mockClaim, ClaimState.APPROVED);
      expect(result).toBe(false);
    });
  });

  describe('getAvailableTransitionsForClaim', () => {
    it('should return only valid transitions for specific claim', async () => {
      mockClaim.state = ClaimState.UNDER_REVIEW;
      mockClaim.hasRequiredDocuments = false;

      const transitions = await stateMachine.getAvailableTransitionsForClaim(mockClaim);

      expect(transitions).not.toContain(ClaimState.APPROVED);
    });
  });

  describe('isStuck', () => {
    it('should detect stuck claim after threshold', () => {
      mockClaim.lastStateChange = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 días atrás

      const result = stateMachine.isStuck(mockClaim, 7);
      expect(result).toBe(true);
    });

    it('should not detect stuck claim within threshold', () => {
      mockClaim.lastStateChange = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 días atrás

      const result = stateMachine.isStuck(mockClaim, 7);
      expect(result).toBe(false);
    });
  });

  describe('calculateTimeInState', () => {
    it('should calculate time spent in a state', () => {
      const now = Date.now();
      mockClaim.stateHistory = [
        {
          id: '1',
          claimId: mockClaim.id,
          fromState: ClaimState.DRAFT,
          toState: ClaimState.SUBMITTED,
          timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
          userId: 'user',
        },
        {
          id: '2',
          claimId: mockClaim.id,
          fromState: ClaimState.SUBMITTED,
          toState: ClaimState.UNDER_REVIEW,
          timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
          userId: 'user',
        },
      ];

      const time = stateMachine.calculateTimeInState(mockClaim, ClaimState.SUBMITTED);

      // Debería ser ~3 días en ms
      expect(time).toBeGreaterThan(0);
    });
  });
});
