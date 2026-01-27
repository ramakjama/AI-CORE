/**
 * Sales Agent Tests
 * Tests for the SalesAgent class - lead qualification and quote generation
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock LLM provider before importing agent
jest.mock('../../ai-llm/src/providers/anthropic.provider', () => ({
  anthropicProvider: {
    complete: jest.fn(),
    stream: jest.fn(),
  },
}));

// Mock external dependencies
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Import after mocking
import { SalesAgent } from '../src/agents/specialized/sales.agent';

describe('SalesAgent', () => {
  let salesAgent: SalesAgent;
  let mockLLMProvider: jest.Mocked<any>;

  beforeEach(() => {
    // Create fresh instance for each test
    salesAgent = new SalesAgent();

    // Get mock reference
    mockLLMProvider = require('../../ai-llm/src/providers/anthropic.provider').anthropicProvider;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Constructor and Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create a SalesAgent instance', () => {
      expect(salesAgent).toBeDefined();
      expect(salesAgent).toBeInstanceOf(SalesAgent);
    });

    it('should have required agent properties', () => {
      expect(salesAgent.name).toBeDefined();
      expect(salesAgent.description).toBeDefined();
    });

    it('should register sales-specific tools', () => {
      const tools = salesAgent.getTools();
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  // ==========================================================================
  // Lead Qualification Tests
  // ==========================================================================

  describe('qualifyLead', () => {
    const mockLeadData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
      company: 'Acme Corp',
      budget: 10000,
      timeline: '1 month',
      source: 'website',
    };

    it('should qualify a high-value lead successfully', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          score: 85,
          qualified: true,
          reasons: ['High budget', 'Urgent timeline', 'Decision maker'],
          nextSteps: ['Schedule demo', 'Send proposal'],
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const result = await salesAgent.qualifyLead(mockLeadData);

      expect(result).toBeDefined();
      expect(result.qualified).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(mockLLMProvider.complete).toHaveBeenCalled();
    });

    it('should disqualify a low-value lead', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          score: 30,
          qualified: false,
          reasons: ['Low budget', 'No timeline', 'Not decision maker'],
          nextSteps: ['Nurture campaign'],
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const lowValueLead = {
        ...mockLeadData,
        budget: 100,
        timeline: 'unknown',
      };

      const result = await salesAgent.qualifyLead(lowValueLead);

      expect(result.qualified).toBe(false);
      expect(result.score).toBeLessThan(70);
    });

    it('should handle missing lead data gracefully', async () => {
      const incompleteLeadData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          score: 50,
          qualified: false,
          reasons: ['Incomplete data'],
          nextSteps: ['Request more information'],
        }),
        usage: { inputTokens: 50, outputTokens: 30 },
      });

      const result = await salesAgent.qualifyLead(incompleteLeadData);

      expect(result).toBeDefined();
      expect(result.reasons).toContain('Incomplete data');
    });

    it('should throw error for invalid lead data', async () => {
      await expect(salesAgent.qualifyLead(null as any)).rejects.toThrow();
      await expect(salesAgent.qualifyLead({} as any)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Quote Generation Tests
  // ==========================================================================

  describe('generateQuote', () => {
    const mockQuoteRequest = {
      leadId: 'LEAD-001',
      productType: 'AUTO_INSURANCE',
      coverage: {
        liability: 100000,
        collision: 50000,
        comprehensive: 50000,
      },
      applicant: {
        name: 'John Doe',
        age: 35,
        drivingHistory: 'clean',
      },
      vehicle: {
        make: 'Honda',
        model: 'Accord',
        year: 2023,
        value: 35000,
      },
    };

    it('should generate a quote successfully', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          quoteId: 'QUOTE-001',
          premium: {
            annual: 1200,
            monthly: 100,
          },
          coverages: [
            { type: 'LIABILITY', limit: 100000, premium: 500 },
            { type: 'COLLISION', limit: 50000, premium: 400 },
            { type: 'COMPREHENSIVE', limit: 50000, premium: 300 },
          ],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const quote = await salesAgent.generateQuote(mockQuoteRequest);

      expect(quote).toBeDefined();
      expect(quote.quoteId).toBeDefined();
      expect(quote.premium).toBeDefined();
      expect(quote.premium.annual).toBeGreaterThan(0);
    });

    it('should apply discounts for good driving history', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          quoteId: 'QUOTE-002',
          premium: {
            annual: 1000,
            monthly: 83.33,
          },
          discounts: [
            { type: 'GOOD_DRIVER', percentage: 10 },
            { type: 'MULTI_POLICY', percentage: 5 },
          ],
          coverages: [],
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const quote = await salesAgent.generateQuote({
        ...mockQuoteRequest,
        applicant: {
          ...mockQuoteRequest.applicant,
          drivingHistory: 'excellent',
        },
      });

      expect(quote.discounts).toBeDefined();
      expect(quote.discounts.length).toBeGreaterThan(0);
    });

    it('should handle high-risk applicants', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: JSON.stringify({
          quoteId: 'QUOTE-003',
          premium: {
            annual: 2500,
            monthly: 208.33,
          },
          surcharges: [
            { type: 'HIGH_RISK', percentage: 50 },
          ],
          coverages: [],
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const quote = await salesAgent.generateQuote({
        ...mockQuoteRequest,
        applicant: {
          ...mockQuoteRequest.applicant,
          drivingHistory: 'poor',
          accidents: 3,
        },
      });

      expect(quote.surcharges).toBeDefined();
      expect(quote.premium.annual).toBeGreaterThan(1200);
    });

    it('should throw error for unsupported product types', async () => {
      const invalidRequest = {
        ...mockQuoteRequest,
        productType: 'UNKNOWN_PRODUCT',
      };

      mockLLMProvider.complete.mockRejectedValue(new Error('Unsupported product type'));

      await expect(salesAgent.generateQuote(invalidRequest)).rejects.toThrow();
    });
  });

  // ==========================================================================
  // Think/Reasoning Tests
  // ==========================================================================

  describe('think', () => {
    it('should process customer inquiry and generate response', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'I understand you are looking for auto insurance. Let me help you with a quote.',
        usage: { inputTokens: 50, outputTokens: 30 },
      });

      const response = await salesAgent.think({
        message: 'I need auto insurance for my new car',
        context: { customerId: 'CUST-001' },
      });

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(mockLLMProvider.complete).toHaveBeenCalled();
    });

    it('should handle multi-turn conversations', async () => {
      // First turn
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: 'What type of coverage are you looking for?',
        usage: { inputTokens: 50, outputTokens: 20 },
      });

      const response1 = await salesAgent.think({
        message: 'I need insurance',
        context: { conversationId: 'CONV-001' },
      });

      // Second turn
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: 'Great! Let me prepare a comprehensive quote for you.',
        usage: { inputTokens: 100, outputTokens: 30 },
      });

      const response2 = await salesAgent.think({
        message: 'I want full coverage',
        context: { conversationId: 'CONV-001' },
      });

      expect(response1).not.toBe(response2);
      expect(mockLLMProvider.complete).toHaveBeenCalledTimes(2);
    });

    it('should handle LLM errors gracefully', async () => {
      mockLLMProvider.complete.mockRejectedValue(new Error('LLM service unavailable'));

      await expect(salesAgent.think({
        message: 'Help me',
        context: {},
      })).rejects.toThrow('LLM service unavailable');
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('integration', () => {
    it('should complete full sales flow: qualify -> quote -> follow-up', async () => {
      // Step 1: Qualify lead
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          score: 90,
          qualified: true,
          reasons: ['High intent'],
          nextSteps: ['Generate quote'],
        }),
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const qualification = await salesAgent.qualifyLead({
        name: 'Premium Customer',
        email: 'premium@example.com',
        budget: 50000,
      });

      expect(qualification.qualified).toBe(true);

      // Step 2: Generate quote
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: JSON.stringify({
          quoteId: 'QUOTE-FLOW-001',
          premium: { annual: 2000 },
          coverages: [],
        }),
        usage: { inputTokens: 150, outputTokens: 100 },
      });

      const quote = await salesAgent.generateQuote({
        leadId: 'LEAD-PREMIUM',
        productType: 'AUTO_INSURANCE',
        coverage: { liability: 200000 },
        applicant: { name: 'Premium Customer' },
        vehicle: { make: 'BMW', model: 'X5', year: 2024 },
      });

      expect(quote.quoteId).toBeDefined();

      // Step 3: Follow-up message
      mockLLMProvider.complete.mockResolvedValueOnce({
        content: 'Thank you for your interest! Your quote is ready.',
        usage: { inputTokens: 50, outputTokens: 30 },
      });

      const followUp = await salesAgent.think({
        message: 'What are the next steps?',
        context: { quoteId: quote.quoteId },
      });

      expect(followUp).toContain('quote');
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle empty conversation history', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'Hello! How can I help you with insurance today?',
        usage: { inputTokens: 10, outputTokens: 15 },
      });

      const response = await salesAgent.think({
        message: 'Hello',
        context: { conversationHistory: [] },
      });

      expect(response).toBeDefined();
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);

      mockLLMProvider.complete.mockResolvedValue({
        content: 'I received your detailed message.',
        usage: { inputTokens: 5000, outputTokens: 20 },
      });

      const response = await salesAgent.think({
        message: longMessage,
        context: {},
      });

      expect(response).toBeDefined();
    });

    it('should handle special characters in input', async () => {
      mockLLMProvider.complete.mockResolvedValue({
        content: 'Understood your request.',
        usage: { inputTokens: 50, outputTokens: 10 },
      });

      const response = await salesAgent.think({
        message: 'Test <script>alert("xss")</script> message',
        context: {},
      });

      expect(response).toBeDefined();
    });

    it('should timeout for very slow LLM responses', async () => {
      jest.useFakeTimers();

      mockLLMProvider.complete.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 60000))
      );

      const promise = salesAgent.think({
        message: 'Hello',
        context: {},
      });

      jest.advanceTimersByTime(30000);

      // Cleanup
      jest.useRealTimers();
    });
  });
});
