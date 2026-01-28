import { ApprovalEngineService } from '../approval/approval-engine.service';
import { Claim } from '../entities/claim.entity';
import { ClaimType, ClaimState } from '../enums/claim-state.enum';

describe('ApprovalEngineService', () => {
  let service: ApprovalEngineService;
  let mockClaim: Claim;

  beforeEach(() => {
    service = new ApprovalEngineService();

    mockClaim = {
      id: 'claim_123',
      claimNumber: 'CLM-2026-001',
      state: ClaimState.UNDER_REVIEW,
      type: ClaimType.AUTO_ACCIDENT,
      estimatedAmount: 3000,
      requiresApproval: true,
    } as Claim;
  });

  describe('configure', () => {
    it('should return approval configuration', async () => {
      const config = await service.configure();

      expect(config).toBeDefined();
      expect(config.rules).toBeDefined();
      expect(config.rules.length).toBeGreaterThan(0);
      expect(config.escalationRules).toBeDefined();
    });

    it('should have rules for different amount ranges', async () => {
      const config = await service.configure();

      const levels = config.rules.map(r => r.level);
      expect(levels).toContain(1);
      expect(levels).toContain(2);
      expect(levels).toContain(3);
      expect(levels).toContain(4);
    });
  });

  describe('requiresApproval', () => {
    it('should always require approval', async () => {
      const result = await service.requiresApproval(mockClaim);
      expect(result).toBe(true);
    });
  });

  describe('getRequiredApprovers', () => {
    it('should return level 1 approvers for claims under €1000', async () => {
      mockClaim.estimatedAmount = 500;

      const approvers = await service.getRequiredApprovers(mockClaim);

      expect(approvers).toContain('adjuster');
      expect(approvers.length).toBe(1);
    });

    it('should return level 2 approvers for claims €1000-€5000', async () => {
      mockClaim.estimatedAmount = 3000;

      const approvers = await service.getRequiredApprovers(mockClaim);

      expect(approvers).toContain('adjuster');
      expect(approvers).toContain('supervisor');
      expect(approvers.length).toBeGreaterThan(1);
    });

    it('should return level 3 approvers for claims €5000-€20000', async () => {
      mockClaim.estimatedAmount = 10000;

      const approvers = await service.getRequiredApprovers(mockClaim);

      expect(approvers).toContain('adjuster');
      expect(approvers).toContain('supervisor');
      expect(approvers).toContain('manager');
    });

    it('should return level 4 approvers for claims over €20000', async () => {
      mockClaim.estimatedAmount = 50000;

      const approvers = await service.getRequiredApprovers(mockClaim);

      expect(approvers).toContain('director');
      expect(approvers.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle special rules for health claims', async () => {
      mockClaim.type = ClaimType.HEALTH;
      mockClaim.estimatedAmount = 3000;

      const approvers = await service.getRequiredApprovers(mockClaim);

      expect(approvers).toContain('health_specialist');
    });
  });

  describe('getApprovalLevel', () => {
    it('should return level 1 for low amounts', async () => {
      mockClaim.estimatedAmount = 500;
      const level = await service.getApprovalLevel(mockClaim);
      expect(level).toBe(1);
    });

    it('should return level 4 for very high amounts', async () => {
      mockClaim.estimatedAmount = 50000;
      const level = await service.getApprovalLevel(mockClaim);
      expect(level).toBe(4);
    });
  });

  describe('requestApproval', () => {
    it('should create approval request', async () => {
      const request = await service.requestApproval(mockClaim, 'adj_001');

      expect(request).toBeDefined();
      expect(request.id).toBeDefined();
      expect(request.claimId).toBe(mockClaim.id);
      expect(request.level).toBeGreaterThan(0);
      expect(request.approvers.length).toBeGreaterThan(0);
      expect(request.status).toBe('PENDING');
    });

    it('should set expiration date', async () => {
      const request = await service.requestApproval(mockClaim, 'adj_001');

      expect(request.expiresAt).toBeDefined();
      expect(request.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should update claim with approval info', async () => {
      await service.requestApproval(mockClaim, 'adj_001');

      expect(mockClaim.approvalLevel).toBeGreaterThan(0);
      expect(mockClaim.approvers).toBeDefined();
      expect(mockClaim.approvers!.length).toBeGreaterThan(0);
    });
  });

  describe('approve', () => {
    it('should approve request', async () => {
      const request = await service.requestApproval(mockClaim, 'adj_001');
      const approverId = request.approvers[0].userId;

      await service.approve(request.id, approverId, 'Looks good');

      const approver = request.approvers.find(a => a.userId === approverId);
      expect(approver!.status).toBe('APPROVED');
      expect(approver!.approvedAt).toBeDefined();
    });

    it('should mark request as approved when all approve', async () => {
      mockClaim.estimatedAmount = 500; // Level 1 - solo 1 aprobador
      const request = await service.requestApproval(mockClaim, 'adj_001');

      await service.approve(request.id, request.approvers[0].userId, 'OK');

      expect(request.status).toBe('APPROVED');
    });

    it('should throw error for invalid request id', async () => {
      await expect(service.approve('invalid', 'user', 'note')).rejects.toThrow();
    });
  });

  describe('reject', () => {
    it('should reject request', async () => {
      const request = await service.requestApproval(mockClaim, 'adj_001');
      const approverId = request.approvers[0].userId;

      await service.reject(request.id, approverId, 'Not acceptable');

      const approver = request.approvers.find(a => a.userId === approverId);
      expect(approver!.status).toBe('REJECTED');
      expect(request.status).toBe('REJECTED');
    });

    it('should immediately reject entire request on single rejection', async () => {
      const request = await service.requestApproval(mockClaim, 'adj_001');

      await service.reject(request.id, request.approvers[0].userId, 'Rejected');

      expect(request.status).toBe('REJECTED');
    });
  });

  describe('isFullyApproved', () => {
    it('should return true when all approvers approved', async () => {
      mockClaim.approvers = [
        {
          userId: 'user1',
          userName: 'User 1',
          role: 'adjuster',
          level: 1,
          status: 'APPROVED',
        },
      ];

      const result = await service.isFullyApproved(mockClaim);
      expect(result).toBe(true);
    });

    it('should return false when some approvers pending', async () => {
      mockClaim.approvers = [
        {
          userId: 'user1',
          userName: 'User 1',
          role: 'adjuster',
          level: 1,
          status: 'APPROVED',
        },
        {
          userId: 'user2',
          userName: 'User 2',
          role: 'supervisor',
          level: 2,
          status: 'PENDING',
        },
      ];

      const result = await service.isFullyApproved(mockClaim);
      expect(result).toBe(false);
    });
  });

  describe('shouldEscalate', () => {
    it('should escalate for high amounts', async () => {
      mockClaim.estimatedAmount = 60000;

      const result = await service.shouldEscalate(mockClaim);
      expect(result).toBe(true);
    });

    it('should escalate for high fraud risk', async () => {
      mockClaim.estimatedAmount = 1000;
      mockClaim.fraudScore = 75;

      const result = await service.shouldEscalate(mockClaim);
      expect(result).toBe(true);
    });

    it('should escalate for long duration', async () => {
      mockClaim.estimatedAmount = 1000;
      mockClaim.submittedDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 días atrás

      const result = await service.shouldEscalate(mockClaim);
      expect(result).toBe(true);
    });
  });

  describe('escalate', () => {
    it('should increase approval level', async () => {
      mockClaim.approvalLevel = 1;

      await service.escalate(mockClaim, 'High value');

      expect(mockClaim.approvalLevel).toBe(2);
    });
  });

  describe('getPendingApprovers', () => {
    it('should return only pending approvers', async () => {
      mockClaim.approvers = [
        {
          userId: 'user1',
          userName: 'User 1',
          role: 'adjuster',
          level: 1,
          status: 'APPROVED',
        },
        {
          userId: 'user2',
          userName: 'User 2',
          role: 'supervisor',
          level: 2,
          status: 'PENDING',
        },
        {
          userId: 'user3',
          userName: 'User 3',
          role: 'manager',
          level: 3,
          status: 'PENDING',
        },
      ];

      const pending = await service.getPendingApprovers(mockClaim);

      expect(pending).toHaveLength(2);
      expect(pending.every(a => a.status === 'PENDING')).toBe(true);
    });
  });
});
