/**
 * Anthropic Configuration
 * Configuration for Claude API integration
 */

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  models: {
    opus: string;
    sonnet: string;
    haiku: string;
  };
  costs: {
    opus: {
      input: number; // per 1M tokens
      output: number; // per 1M tokens
    };
    sonnet: {
      input: number;
      output: number;
    };
    haiku: {
      input: number;
      output: number;
    };
  };
}

/**
 * Default Anthropic configuration
 */
export const defaultAnthropicConfig: AnthropicConfig = {
  apiKey: process.env['ANTHROPIC_API_KEY'] || '',
  baseURL: process.env['ANTHROPIC_BASE_URL'],
  timeout: parseInt(process.env['ANTHROPIC_TIMEOUT'] || '60000', 10),
  maxRetries: parseInt(process.env['ANTHROPIC_MAX_RETRIES'] || '3', 10),
  models: {
    opus: 'claude-opus-4-5-20251101',
    sonnet: 'claude-sonnet-4-5-20250929',
    haiku: 'claude-3-5-haiku-20241022',
  },
  costs: {
    opus: {
      input: 15.0, // $15 per 1M input tokens
      output: 75.0, // $75 per 1M output tokens
    },
    sonnet: {
      input: 3.0, // $3 per 1M input tokens
      output: 15.0, // $15 per 1M output tokens
    },
    haiku: {
      input: 0.8, // $0.80 per 1M input tokens
      output: 4.0, // $4 per 1M output tokens
    },
  },
};

/**
 * Validate Anthropic configuration
 */
export function validateAnthropicConfig(config: AnthropicConfig): void {
  if (!config.apiKey) {
    throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
  }

  if (config.timeout && config.timeout < 1000) {
    throw new Error('Anthropic timeout must be at least 1000ms');
  }

  if (config.maxRetries && (config.maxRetries < 0 || config.maxRetries > 10)) {
    throw new Error('Anthropic max retries must be between 0 and 10');
  }
}

/**
 * Get model name from alias
 */
export function getModelName(modelAlias: 'opus' | 'sonnet' | 'haiku', config: AnthropicConfig): string {
  return config.models[modelAlias];
}

/**
 * Calculate cost for tokens
 */
export function calculateCost(
  modelAlias: 'opus' | 'sonnet' | 'haiku',
  inputTokens: number,
  outputTokens: number,
  config: AnthropicConfig,
): number {
  const costs = config.costs[modelAlias];
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}
