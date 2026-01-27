/**
 * Providers Index
 * Export all LLM providers
 */

export { BaseProvider, type ProviderFactory } from './base.provider';
export { OpenAIProvider } from './openai.provider';
export { AnthropicProvider } from './anthropic.provider';
export { GoogleProvider } from './google.provider';
export { LiteLLMProvider } from './litellm.provider';

import { ProviderType, type ProviderConfig, type IProvider } from '../types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleProvider } from './google.provider';
import { LiteLLMProvider } from './litellm.provider';

/**
 * Provider Registry
 */
const providerRegistry: Map<ProviderType, new (config: ProviderConfig) => IProvider> = new Map([
  [ProviderType.OPENAI, OpenAIProvider],
  [ProviderType.ANTHROPIC, AnthropicProvider],
  [ProviderType.GOOGLE, GoogleProvider],
  [ProviderType.LITELLM, LiteLLMProvider],
]);

/**
 * Create a provider instance
 */
export function createProvider(config: ProviderConfig): IProvider {
  const ProviderClass = providerRegistry.get(config.type);

  if (!ProviderClass) {
    throw new Error(`Unknown provider type: ${config.type}`);
  }

  return new ProviderClass(config);
}

/**
 * Get available provider types
 */
export function getAvailableProviders(): ProviderType[] {
  return Array.from(providerRegistry.keys());
}

/**
 * Check if a provider type is supported
 */
export function isProviderSupported(type: ProviderType): boolean {
  return providerRegistry.has(type);
}

/**
 * Provider Manager - Manages multiple providers
 */
export class ProviderManager {
  private providers: Map<ProviderType, IProvider> = new Map();
  private defaultProvider?: ProviderType;

  constructor(configs?: Record<ProviderType, ProviderConfig>, defaultProvider?: ProviderType) {
    if (configs) {
      for (const [type, config] of Object.entries(configs) as [ProviderType, ProviderConfig][]) {
        this.addProvider(type, config);
      }
    }
    this.defaultProvider = defaultProvider;
  }

  /**
   * Add a provider
   */
  addProvider(type: ProviderType, config: ProviderConfig): void {
    const provider = createProvider({ ...config, type });
    this.providers.set(type, provider);
  }

  /**
   * Get a provider
   */
  getProvider(type?: ProviderType): IProvider {
    const providerType = type || this.defaultProvider;

    if (!providerType) {
      throw new Error('No provider type specified and no default provider set');
    }

    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider not configured: ${providerType}`);
    }

    return provider;
  }

  /**
   * Set default provider
   */
  setDefaultProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Provider not configured: ${type}`);
    }
    this.defaultProvider = type;
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Health check all providers
   */
  async healthCheckAll(): Promise<Record<ProviderType, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [type, provider] of this.providers) {
      try {
        results[type] = await provider.healthCheck();
      } catch {
        results[type] = false;
      }
    }

    return results as Record<ProviderType, boolean>;
  }

  /**
   * Get provider for model
   */
  getProviderForModel(modelId: string): IProvider | null {
    // Detect provider from model ID
    if (modelId.includes('gpt') || modelId.includes('text-embedding')) {
      return this.providers.get(ProviderType.OPENAI) || null;
    }
    if (modelId.includes('claude')) {
      return this.providers.get(ProviderType.ANTHROPIC) || null;
    }
    if (modelId.includes('gemini')) {
      return this.providers.get(ProviderType.GOOGLE) || null;
    }

    // Use LiteLLM as fallback if configured
    return this.providers.get(ProviderType.LITELLM) || null;
  }
}
