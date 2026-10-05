/**
 * High-Performance In-Memory Cache Layer
 * Provides sub-millisecond responses and automatic TTL expiration.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes default

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidates all keys starting with the given prefix or matching a substring
   */
  delPattern(prefix: string): number {
    let deleted = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.store.delete(key);
        deleted++;
      }
    }
    return deleted;
  }

  flush(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%';
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate,
    };
  }
}

export const memoryCache = new MemoryCache();
