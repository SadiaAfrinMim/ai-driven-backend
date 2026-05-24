/**
 * AI Provider Factory
 * Manages multiple AI providers and allows easy switching
 */

import { AIProvider } from './AIProvider';
import { OpenAIProvider } from './OpenAIProvider';

export type ProviderType = 'openai' | 'claude' | 'gemini';

export class AIProviderFactory {
  private static providers: Map<ProviderType, AIProvider> = new Map();
  private static defaultProvider: ProviderType = 'openai';

  static initialize(): void {
    // Initialize available providers
    this.providers.set('openai', new OpenAIProvider());
    // Future providers can be added here
    // this.providers.set('claude', new ClaudeProvider());
    // this.providers.set('gemini', new GeminiProvider());
  }

  static getProvider(type?: ProviderType): AIProvider {
    const providerType = type || this.defaultProvider;

    if (!this.providers.has(providerType)) {
      throw new Error(`AI Provider '${providerType}' is not available`);
    }

    return this.providers.get(providerType)!;
  }

  static setDefaultProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`AI Provider '${type}' is not available`);
    }
    this.defaultProvider = type;
  }

  static getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  static registerProvider(type: ProviderType, provider: AIProvider): void {
    this.providers.set(type, provider);
  }
}

// Initialize factory on module load
AIProviderFactory.initialize();
