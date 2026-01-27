/**
 * Claims Agent Tests
 * Tests for the ClaimsAgent class - claims intake and processing
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies before importing
jest.mock('../../ai-llm/src/providers/anthropic.provider', () => ({
  anthropicProvider: {
    complete: jest.fn(),
    stream: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-claim-uuid'),
}));

import { ClaimsAgent } from '../src/agents/specialized/claims.agent';

describe('ClaimsAgent', () => {
  let claimsAgent: ClaimsAgent;
  let mockLLMProvider: jest.Mocked<any>;

  beforeEach(() => {
    claimsAgent = new ClaimsAgent();
    mockLLMProvider = require('../../ai-llm/src/providers/anthropic.provider').anthropicProvider;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a ClaimsAgent instance', () => {
      expect(claimsAgent).toBeDefined();
      expect(claimsAgent).toBeInstanceOf(ClaimsAgent);
    });

    it('should have claims-specific tools registered', () => {
      const tools = claimsAgent.getTools();
      expect(tools).toBeDefined();
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain('lookup_policy');
      expect(toolNames).toContain('create_claim');
    });
  });

  // ==========================================================================
  // Claim Opening Tests
  // ==========================================================================

  describe('openClaim', () => {
    const mockClaimData = {
      policyNumber: 'POL-2024-001',
      dateOfLoss: new Date('2024-02-15'),
      lossType: 'COLLISION',
      description: 'Vehicle collision at intersection',
      claimantInfo: {
        name: 'John Doe',
        phone: '+1-555-123-4567',
        email: 'john.doe@example.com',
      },
      location: {
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'CA',
      },
    };

    it('should open a new claim successfully', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          claimNumber: 'CLM-2024-00001',
          status: 'OPEN',
          assignedAdjuster: 'ADJ-001',
          estimatedReserve: 5000,
          nextSteps: ['Collect documents', 'Schedule inspection'],
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const result = await claimsAgent.openClaim(mockClaimData);

      expect(result).toBeDefined();
      expect(result.claimNumber).toBeDefined();
      expect(result.status).toBe('OPEN');
      expect(mockLLMProvider.complete).toHaveBeenCalled();
    });

    it('should validate policy before opening claim', async () => {
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          policyValid: true,
          coverages: ['LIABILITY', 'COLLISION', 'COMPREHENSIVE'],
          effectiveDate: '2024-01-01',
          expirationDate: '2025-01-01',
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      }).mockResolvedValueOnce({
        content: JSON.stringify({
          claimNumber: 'CLM-2024-00002',
          status: 'OPEN',
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const result = await claimsAgent.openClaim(mockClaimData);

      expect(result.claimNumber).toBeDefined();
      expect(mockLLMProvider.complete).toHaveBeenCalledTimes(2);
    });

    it('should reject claim for expired policy', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          policyValid: false,
          reason: 'Policy expired',
          expirationDate: '2023-12-31',
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      await expect(claimsAgent.openClaim({
        ...mockClaimData,
        policyNumber: 'EXPIRED-POL-001',
      })).rejects.toThrow(/policy/i);
    });

    it('should reject claim for non-existent policy', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          policyValid: false,
          reason: 'Policy not found',
        }),
        usage: { inputTokens: 50, outputTokens: 30 },
      });

      await expect(claimsAgent.openClaim({
        ...mockClaimData,
        policyNumber: 'INVALID-POL-999',
      })).rejects.toThrow(/not found/i);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        policyNumber: 'POL-2024-001',
        // Missing dateOfLoss, lossType, etc.
      };

      await expect(claimsAgent.openClaim(incompleteData as any)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Fraud Detection Tests
  // ==========================================================================

  describe('checkFraudScore', () => {
    const mockClaimForFraudCheck = {
      claimNumber: 'CLM-2024-00001',
      policyNumber: 'POL-2024-001',
      amount: 25000,
      dateOfLoss: new Date('2024-02-15'),
      description: 'Major collision',
      claimantHistory: {
        previousClaims: 2,
        totalPaidAmount: 15000,
      },
    };

    it('should return low fraud score for legitimate claim', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          fraudScore: 15,
          riskLevel: 'LOW',
          indicators: [],
          recommendation: 'PROCEED',
        }),
        usage: { inputTokens: 150, outputTokens: 80 },
      });

      const result = await claimsAgent.checkFraudScore(mockClaimForFraudCheck);

      expect(result).toBeDefined();
      expect(result.fraudScore).toBeLessThan(50);
      expect(result.riskLevel).toBe('LOW');
      expect(result.recommendation).toBe('PROCEED');
    });

    it('should flag high-risk claim for review', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          fraudScore: 85,
          riskLevel: 'HIGH',
          indicators: [
            'Multiple claims in short period',
            'Claim amount exceeds vehicle value',
            'Inconsistent witness statements',
          ],
          recommendation: 'INVESTIGATE',
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const result = await claimsAgent.checkFraudScore({
        ...mockClaimForFraudCheck,
        amount: 100000,
        claimantHistory: {
          previousClaims: 5,
          totalPaidAmount: 75000,
        },
      });

      expect(result.fraudScore).toBeGreaterThan(70);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.indicators.length).toBeGreaterThan(0);
      expect(result.recommendation).toBe('INVESTIGATE');
    });

    it('should identify specific fraud patterns', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          fraudScore: 65,
          riskLevel: 'MEDIUM',
          indicators: [
            'Claim filed immediately after policy inception',
            'Loss location far from registered address',
          ],
          recommendation: 'REVIEW',
          patterns: ['STAGED_ACCIDENT', 'PREMIUM_FRAUD'],
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const result = await claimsAgent.checkFraudScore(mockClaimForFraudCheck);

      expect(result.patterns).toBeDefined();
      expect(result.patterns.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Think/Reasoning Tests
  // ==========================================================================

  describe('think', () => {
    it('should handle claim status inquiry', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'Your claim CLM-2024-00001 is currently under review. An adjuster has been assigned.',
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const response = await claimsAgent.think({
        message: 'What is the status of my claim?',
        context: { claimNumber: 'CLM-2024-00001' },
      });

      expect(response).toContain('CLM-2024-00001');
    });

    it('should guide user through claim filing process', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'To file a claim, I need the following information: 1) Policy number 2) Date of loss 3) Description of incident',
        usage: { inputTokens: 50, outputTokens: 40 },
      });

      const response = await claimsAgent.think({
        message: 'I want to file a claim',
        context: {},
      });

      expect(response).toContain('information');
    });

    it('should handle document submission guidance', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'Please submit: police report, photos of damage, repair estimates.',
        usage: { inputTokens: 80, outputTokens: 30 },
      });

      const response = await claimsAgent.think({
        message: 'What documents do I need to submit?',
        context: { claimNumber: 'CLM-2024-00001' },
      });

      expect(response).toContain('document');
    });
  });

  // ==========================================================================
  // Tool Execution Tests
  // ==========================================================================

  describe('tool execution', () => {
    it('should lookup policy using tool', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          toolCall: 'lookup_policy',
          result: {
            policyNumber: 'POL-2024-001',
            status: 'ACTIVE',
            coverages: ['LIABILITY', 'COLLISION'],
          },
        }),
        usage: { inputTokens: 50, outputTokens: 80 },
      });

      const result = await claimsAgent.executeTool('lookup_policy', {
        policyNumber: 'POL-2024-001',
      });

      expect(result).toBeDefined();
    });

    it('should create claim using tool', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          toolCall: 'create_claim',
          result: {
            claimNumber: 'CLM-2024-00003',
            created: true,
          },
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result = await claimsAgent.executeTool('create_claim', {
        policyNumber: 'POL-2024-001',
        dateOfLoss: '2024-02-15',
        lossType: 'COLLISION',
      });

      expect(result.claimNumber).toBeDefined();
    });

    it('should send email notification using tool', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          toolCall: 'send_email',
          result: {
            sent: true,
            messageId: 'MSG-001',
          },
        }),
        usage: { inputTokens: 80, outputTokens: 30 },
      });

      const result = await claimsAgent.executeTool('send_email', {
        to: 'customer@example.com',
        subject: 'Claim Update',
        body: 'Your claim has been approved.',
      });

      expect(result.sent).toBe(true);
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle claim with extreme monetary values', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          claimNumber: 'CLM-BIG-001',
          status: 'OPEN',
          flagged: true,
          flagReason: 'High value claim',
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const result = await claimsAgent.openClaim({
        policyNumber: 'POL-2024-001',
        dateOfLoss: new Date(),
        lossType: 'TOTAL_LOSS',
        description: 'Complete property loss',
        claimantInfo: { name: 'John Doe' },
        estimatedAmount: 1000000,
      });

      expect(result.flagged).toBe(true);
    });

    it('should handle claim with past date of loss', async () => {
      const pastDate = new Date('2020-01-01');

      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          warning: 'Late reported claim',
          claimNumber: 'CLM-LATE-001',
          status: 'OPEN',
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const result = await claimsAgent.openClaim({
        policyNumber: 'POL-2024-001',
        dateOfLoss: pastDate,
        lossType: 'THEFT',
        description: 'Late reported theft',
        claimantInfo: { name: 'John Doe' },
      });

      expect(result.warning).toContain('Late');
    });

    it('should handle concurrent claim submissions', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          claimNumber: 'CLM-CONCURRENT',
          status: 'OPEN',
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const claimData = {
        policyNumber: 'POL-2024-001',
        dateOfLoss: new Date(),
        lossType: 'COLLISION',
        description: 'Concurrent test',
        claimantInfo: { name: 'Test User' },
      };

      // Submit multiple claims concurrently
      const results = await Promise.all([
        claimsAgent.openClaim(claimData),
        claimsAgent.openClaim(claimData),
        claimsAgent.openClaim(claimData),
      ]);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.claimNumber).toBeDefined();
      });
    });

    it('should handle LLM timeout gracefully', async () => {
      mockLLMProvider.complete.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(claimsAgent.openClaim({
        policyNumber: 'POL-2024-001',
        dateOfLoss: new Date(),
        lossType: 'COLLISION',
        description: 'Test',
        claimantInfo: { name: 'Test' },
      })).rejects.toThrow('Timeout');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('integration', () => {
    it('should complete full claim lifecycle', async () => {
      // 1. Open claim
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          claimNumber: 'CLM-LIFECYCLE-001',
          status: 'OPEN',
        }),
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const claim = await claimsAgent.openClaim({
        policyNumber: 'POL-2024-001',
        dateOfLoss: new Date(),
        lossType: 'COLLISION',
        description: 'Lifecycle test',
        claimantInfo: { name: 'Test User' },
      });

      // 2. Check fraud score
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          fraudScore: 10,
          riskLevel: 'LOW',
          recommendation: 'PROCEED',
        }),
        usage: { inputTokens: 150, outputTokens: 80 },
      });

      const fraudCheck = await claimsAgent.checkFraudScore({
        claimNumber: claim.claimNumber,
        policyNumber: 'POL-2024-001',
        amount: 5000,
      });

      expect(fraudCheck.recommendation).toBe('PROCEED');

      // 3. Get status update
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: 'Your claim is being processed and should be resolved within 5 business days.',
        usage: { inputTokens: 50, outputTokens: 30 },
      });

      const statusMessage = await claimsAgent.think({
        message: 'When will my claim be resolved?',
        context: { claimNumber: claim.claimNumber },
      });

      expect(statusMessage).toContain('claim');
    });
  });
});
