"use strict";
/**
 * AI Provider Factory
 * Manages multiple AI providers and allows easy switching
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const OpenAIProvider_1 = require("./OpenAIProvider");
class AIProviderFactory {
    static initialize() {
        // Initialize available providers
        this.providers.set('openai', new OpenAIProvider_1.OpenAIProvider());
        // Future providers can be added here
        // this.providers.set('claude', new ClaudeProvider());
        // this.providers.set('gemini', new GeminiProvider());
    }
    static getProvider(type) {
        const providerType = type || this.defaultProvider;
        if (!this.providers.has(providerType)) {
            throw new Error(`AI Provider '${providerType}' is not available`);
        }
        return this.providers.get(providerType);
    }
    static setDefaultProvider(type) {
        if (!this.providers.has(type)) {
            throw new Error(`AI Provider '${type}' is not available`);
        }
        this.defaultProvider = type;
    }
    static getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
    static registerProvider(type, provider) {
        this.providers.set(type, provider);
    }
}
exports.AIProviderFactory = AIProviderFactory;
AIProviderFactory.providers = new Map();
AIProviderFactory.defaultProvider = 'openai';
// Initialize factory on module load
AIProviderFactory.initialize();
