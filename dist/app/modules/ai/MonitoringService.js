"use strict";
/**
 * Monitoring and Logging Service
 * Tracks API calls, usage metrics, and performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringService = exports.MonitoringService = void 0;
class MonitoringService {
    constructor() {
        this.metrics = [];
        this.aiMetrics = new Map();
        this.maxMetricsToStore = 10000;
    }
    recordRequest(metric) {
        this.metrics.push(metric);
        // Keep memory bounded
        if (this.metrics.length > this.maxMetricsToStore) {
            this.metrics = this.metrics.slice(-this.maxMetricsToStore);
        }
        console.log(`📊 [${metric.method}] ${metric.endpoint} - ${metric.statusCode} (${metric.responseTime}ms)`);
    }
    recordAIUsage(provider, tokens, success) {
        const existing = this.aiMetrics.get(provider) || {
            provider,
            totalRequests: 0,
            totalTokens: 0,
            averageTokensPerRequest: 0,
            successRate: 100,
            lastUsedAt: new Date(),
        };
        existing.totalRequests++;
        existing.totalTokens += tokens;
        existing.averageTokensPerRequest = existing.totalTokens / existing.totalRequests;
        existing.lastUsedAt = new Date();
        this.aiMetrics.set(provider, existing);
        console.log(`🤖 [${provider}] Tokens used: ${tokens}, Total: ${existing.totalTokens}`);
    }
    getMetrics(limit = 100) {
        return this.metrics.slice(-limit);
    }
    getAIMetrics() {
        return Array.from(this.aiMetrics.values());
    }
    getStats() {
        const totalRequests = this.metrics.length;
        const avgResponseTime = this.metrics.length > 0
            ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length
            : 0;
        const errors = this.metrics.filter(m => m.statusCode >= 400).length;
        const successRate = totalRequests > 0 ? ((totalRequests - errors) / totalRequests) * 100 : 100;
        return {
            totalRequests,
            avgResponseTime: Math.round(avgResponseTime),
            errorCount: errors,
            successRate: Math.round(successRate),
            aiMetrics: this.getAIMetrics(),
        };
    }
    clearMetrics() {
        this.metrics = [];
        this.aiMetrics.clear();
        console.log('📊 Metrics cleared');
    }
}
exports.MonitoringService = MonitoringService;
exports.monitoringService = new MonitoringService();
