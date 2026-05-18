"use strict";
/**
 * Cache Service
 * Simple in-memory caching for frequently generated content
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
class CacheService {
    constructor() {
        this.cache = new Map();
        this.tagIndex = new Map();
        this.isConnected = true;
    }
    async connect() {
        console.log('✅ In-memory cache initialized');
        this.isConnected = true;
    }
    async get(key) {
        if (!this.isConnected)
            return null;
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        try {
            return JSON.parse(entry.data);
        }
        catch {
            return null;
        }
    }
    async set(key, data, options = {}) {
        if (!this.isConnected)
            return;
        const ttl = options.ttl || 3600; // Default 1 hour
        const tags = options.tags || [];
        const entry = {
            data: JSON.stringify(data),
            expiresAt: Date.now() + ttl * 1000,
            tags,
        };
        this.cache.set(key, entry);
        // Update tag index
        for (const tag of tags) {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(key);
        }
    }
    async del(key) {
        if (!this.isConnected)
            return;
        const entry = this.cache.get(key);
        if (entry) {
            // Remove from tag index
            for (const tag of entry.tags) {
                this.tagIndex.get(tag)?.delete(key);
            }
        }
        this.cache.delete(key);
    }
    async invalidateByTag(tag) {
        if (!this.isConnected)
            return;
        const keys = this.tagIndex.get(tag);
        if (keys) {
            for (const key of keys) {
                const entry = this.cache.get(key);
                if (entry) {
                    // Remove from other tags
                    for (const otherTag of entry.tags) {
                        if (otherTag !== tag) {
                            this.tagIndex.get(otherTag)?.delete(key);
                        }
                    }
                }
                this.cache.delete(key);
            }
            this.tagIndex.delete(tag);
        }
    }
    async clear() {
        if (!this.isConnected)
            return;
        this.cache.clear();
        this.tagIndex.clear();
        console.log('🗑️ Cache cleared');
    }
    async disconnect() {
        this.cache.clear();
        this.tagIndex.clear();
        this.isConnected = false;
        console.log('In-memory cache disconnected');
    }
    generateCacheKey(prefix, params) {
        const sortedKeys = Object.keys(params).sort();
        const keyParts = sortedKeys.map(key => `${key}:${params[key]}`);
        return `${prefix}:${keyParts.join(':')}`;
    }
    get isAvailable() {
        return this.isConnected;
    }
}
exports.CacheService = CacheService;
// Export singleton instance
exports.cacheService = new CacheService();
