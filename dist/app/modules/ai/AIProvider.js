"use strict";
/**
 * Abstract AI Provider Interface
 * Defines the contract for all AI providers (Strategy Pattern)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProvider = void 0;
class AIProvider {
    buildPrompt(request) {
        return request.prompt;
    }
    getTemperature(tone) {
        const temperatureMap = {
            professional: 0.3,
            casual: 0.7,
            creative: 0.9,
            formal: 0.2,
        };
        return temperatureMap[tone || 'professional'] ?? 0.5;
    }
    getMaxTokens(length, defaultMax = 2000) {
        const tokensMap = {
            short: 500,
            medium: 1500,
            long: defaultMax,
        };
        return tokensMap[length || 'medium'] ?? defaultMax;
    }
}
exports.AIProvider = AIProvider;
