/**
 * LLM Provider Mocks
 * Common mocks for LLM providers (Anthropic, OpenAI)
 */

import { jest } from '@jest/globals';

// ============================================================================
// Anthropic SDK Mock
// ============================================================================

export const mockAnthropicMessage = {
  id: 'msg_mock_123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'This is a mock response from Anthropic Claude.',
    },
  ],
  model: 'claude-3-opus-20240229',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
};

export const mockAnthropicStream = {
  async *[Symbol.asyncIterator]() {
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'Hello' },
    };
    yield {
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: ' world' },
    };
    yield {
      type: 'message_delta',
      usage: { output_tokens: 10 },
    };
  },
};

export const createAnthropicMock = () => ({
  messages: {
    create: jest.fn().mockResolvedValue(mockAnthropicMessage),
  },
});

// ============================================================================
// OpenAI SDK Mock
// ============================================================================

export const mockOpenAICompletion = {
  id: 'chatcmpl-mock-123',
  object: 'chat.completion',
  created: Date.now(),
  model: 'gpt-4',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is a mock response from OpenAI GPT.',
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

export const mockOpenAIStream = {
  async *[Symbol.asyncIterator]() {
    yield {
      choices: [
        {
          delta: { content: 'Hello' },
          index: 0,
        },
      ],
    };
    yield {
      choices: [
        {
          delta: { content: ' world' },
          index: 0,
        },
      ],
    };
    yield {
      choices: [
        {
          delta: {},
          finish_reason: 'stop',
          index: 0,
        },
      ],
    };
  },
};

export const mockOpenAIEmbedding = {
  object: 'list',
  data: [
    {
      object: 'embedding',
      embedding: new Array(1536).fill(0).map(() => Math.random()),
      index: 0,
    },
  ],
  model: 'text-embedding-ada-002',
  usage: {
    prompt_tokens: 10,
    total_tokens: 10,
  },
};

export const createOpenAIMock = () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockOpenAICompletion),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue(mockOpenAIEmbedding),
  },
});

// ============================================================================
// Generic LLM Response Builder
// ============================================================================

export const buildLLMResponse = (content: string, options?: {
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
}) => ({
  content,
  usage: {
    inputTokens: options?.inputTokens || 100,
    outputTokens: options?.outputTokens || 50,
    totalTokens: (options?.inputTokens || 100) + (options?.outputTokens || 50),
  },
  model: options?.model || 'mock-model',
  finishReason: 'stop',
});

export default {
  createAnthropicMock,
  createOpenAIMock,
  mockAnthropicMessage,
  mockOpenAICompletion,
  mockOpenAIEmbedding,
  buildLLMResponse,
};
