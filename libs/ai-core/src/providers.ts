// AI-CORE AI Providers

import { type AIProviderConfig, type AIProviderInterface } from './types';

// Provider registry
const providers = new Map<string, AIProviderInterface>();

export function registerProvider(
  name: string,
  provider: AIProviderInterface
): void {
  providers.set(name, provider);
}

export function getProvider(name: string): AIProviderInterface {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`AI Provider "${name}" not found. Available providers: ${Array.from(providers.keys()).join(', ')}`);
  }
  return provider;
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}

// Provider factory
export function createProviderConfig(
  provider: AIProviderConfig['provider'],
  apiKey: string,
  options?: Partial<Omit<AIProviderConfig, 'provider' | 'apiKey'>>
): AIProviderConfig {
  return {
    provider,
    apiKey,
    ...options,
  };
}

// Default provider management
let defaultProviderName: string | null = null;

export function setDefaultProvider(name: string): void {
  if (!providers.has(name)) {
    throw new Error(`Cannot set default provider: "${name}" not found`);
  }
  defaultProviderName = name;
}

export function getDefaultProvider(): AIProviderInterface {
  if (!defaultProviderName) {
    throw new Error('No default AI provider configured');
  }
  return getProvider(defaultProviderName);
}
