/**
 * Cache Service
 * Simple in-memory caching for frequently generated content
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // For cache invalidation
}

interface CacheEntry {
  data: string;
  expiresAt: number;
  tags: string[];
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private isConnected = true;

  async connect(): Promise<void> {
    console.log('✅ In-memory cache initialized');
    this.isConnected = true;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.data) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    if (!this.isConnected) return;

    const ttl = options.ttl || 3600; // Default 1 hour
    const tags = options.tags || [];

    const entry: CacheEntry = {
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
      this.tagIndex.get(tag)!.add(key);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;

    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }

    this.cache.delete(key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    if (!this.isConnected) return;

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

  async clear(): Promise<void> {
    if (!this.isConnected) return;

    this.cache.clear();
    this.tagIndex.clear();
    console.log('🗑️ Cache cleared');
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.isConnected = false;
    console.log('In-memory cache disconnected');
  }

  generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const keyParts = sortedKeys.map(key => `${key}:${params[key]}`);
    return `${prefix}:${keyParts.join(':')}`;
  }

  get isAvailable(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
