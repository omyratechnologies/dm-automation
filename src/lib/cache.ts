import { redis } from "./redis";

/**
 * Cache TTL (Time To Live) configurations in seconds
 */
export const CACHE_TTL = {
  USER_DATA: 60 * 5, // 5 minutes
  AUTOMATION_DATA: 60 * 10, // 10 minutes
  AUTOMATION_LIST: 60 * 3, // 3 minutes
  INSTAGRAM_MEDIA: 60 * 30, // 30 minutes
  KEYWORD_MATCH: 60 * 15, // 15 minutes
  CHAT_HISTORY: 60 * 5, // 5 minutes
  SUBSCRIPTION_DATA: 60 * 10, // 10 minutes
  SHORT: 60, // 1 minute
  MEDIUM: 60 * 5, // 5 minutes
  LONG: 60 * 30, // 30 minutes
} as const;

/**
 * Cache key prefixes for organization
 */
export const CACHE_KEYS = {
  USER: "user",
  AUTOMATION: "automation",
  AUTOMATION_LIST: "automation:list",
  KEYWORD: "keyword",
  CHAT_HISTORY: "chat",
  SUBSCRIPTION: "subscription",
  INSTAGRAM_TOKEN: "ig:token",
  COOLDOWN: "cooldown",
} as const;

/**
 * Generate a cache key with prefix
 */
export function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(":")}`;
}

/**
 * Get data from cache
 * Returns null if not found or Redis not configured
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }

    console.log(`🎯 Cache HIT: ${key}`);
    return data as T;
  } catch (error) {
    console.error(`❌ Cache GET error for ${key}:`, error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 * Silently fails if Redis not configured
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.set(key, data, { ex: ttl });
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error(`❌ Cache SET error for ${key}:`, error);
    return false;
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    console.log(`🗑️ Cache DELETE: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Cache DELETE error for ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(`🗑️ Cache DELETE pattern: ${pattern} (${keys.length} keys)`);
    return keys.length;
  } catch (error) {
    console.error(`❌ Cache DELETE pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Cache wrapper for database queries
 * Automatically caches the result and returns cached data on subsequent calls
 * 
 * IMPORTANT: Never use this to cache API calls that return Response objects
 * or other non-serializable data (like Clerk's currentUser())
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  console.log(`🔄 Cache MISS: ${key} - Fetching fresh data...`);
  
  try {
    const data = await fetcher();

    // Store in cache (only if data is valid and serializable)
    if (data !== null && data !== undefined) {
      // Try to cache, but don't fail if serialization fails
      try {
        await setCache(key, data, ttl);
      } catch (cacheError) {
        console.error(`⚠️ Failed to cache data for ${key}:`, cacheError);
        // Return the data anyway, just skip caching
      }
    }

    return data;
  } catch (error) {
    console.error(`❌ Error fetching data for cache key ${key}:`, error);
    throw error; // Re-throw to let caller handle
  }
}

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  if (!redis) return;

  const patterns = [
    cacheKey(CACHE_KEYS.USER, userId, "*"),
    cacheKey(CACHE_KEYS.AUTOMATION_LIST, userId),
    cacheKey(CACHE_KEYS.SUBSCRIPTION, userId),
  ];

  for (const pattern of patterns) {
    await deleteCachePattern(pattern);
  }

  console.log(`🔄 Invalidated all cache for user: ${userId}`);
}

/**
 * Invalidate automation-related caches
 */
export async function invalidateAutomationCache(
  automationId: string,
  userId?: string
): Promise<void> {
  if (!redis) return;

  const keys = [cacheKey(CACHE_KEYS.AUTOMATION, automationId)];

  if (userId) {
    keys.push(cacheKey(CACHE_KEYS.AUTOMATION_LIST, userId));
  }

  for (const key of keys) {
    await deleteCache(key);
  }

  console.log(`🔄 Invalidated cache for automation: ${automationId}`);
}

/**
 * Get or set cache with automatic refresh
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return withCache(key, ttl, fetcher);
}

/**
 * Check if a key exists in cache
 */
export async function hasCache(key: string): Promise<boolean> {
  if (!redis) return false;

  try {
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error(`❌ Cache EXISTS error for ${key}:`, error);
    return false;
  }
}

/**
 * Get remaining TTL for a key (in seconds)
 */
export async function getCacheTTL(key: string): Promise<number> {
  if (!redis) return -1;

  try {
    const ttl = await redis.ttl(key);
    return ttl;
  } catch (error) {
    console.error(`❌ Cache TTL error for ${key}:`, error);
    return -1;
  }
}

/**
 * Increment a counter in cache
 * Useful for rate limiting or usage tracking
 */
export async function incrementCache(
  key: string,
  ttl?: number
): Promise<number> {
  if (!redis) return 0;

  try {
    const value = await redis.incr(key);
    if (ttl && value === 1) {
      await redis.expire(key, ttl);
    }
    return value;
  } catch (error) {
    console.error(`❌ Cache INCR error for ${key}:`, error);
    return 0;
  }
}

/**
 * Get multiple keys at once
 */
export async function getCacheMultiple<T>(
  keys: string[]
): Promise<(T | null)[]> {
  if (!redis || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const values = await redis.mget(...keys);
    console.log(`🎯 Cache MGET: ${keys.length} keys`);
    return values as (T | null)[];
  } catch (error) {
    console.error(`❌ Cache MGET error:`, error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple keys at once
 */
export async function setCacheMultiple(
  items: Array<{ key: string; value: any; ttl?: number }>
): Promise<boolean> {
  if (!redis || items.length === 0) {
    return false;
  }

  try {
    // Use pipeline for better performance
    const pipeline = redis.pipeline();

    for (const item of items) {
      const ttl = item.ttl || CACHE_TTL.MEDIUM;
      pipeline.set(item.key, item.value, { ex: ttl });
    }

    await pipeline.exec();
    console.log(`💾 Cache MSET: ${items.length} keys`);
    return true;
  } catch (error) {
    console.error(`❌ Cache MSET error:`, error);
    return false;
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  keysByPrefix: Record<string, number>;
}> {
  if (!redis) {
    return { totalKeys: 0, keysByPrefix: {} };
  }

  try {
    const allKeys = await redis.keys("*");
    const keysByPrefix: Record<string, number> = {};

    for (const key of allKeys) {
      const prefix = key.split(":")[0];
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
    }

    return {
      totalKeys: allKeys.length,
      keysByPrefix,
    };
  } catch (error) {
    console.error(`❌ Cache STATS error:`, error);
    return { totalKeys: 0, keysByPrefix: {} };
  }
}

/**
 * Warm up cache with data
 * Useful for preloading frequently accessed data
 */
export async function warmupCache(
  items: Array<{ key: string; fetcher: () => Promise<any>; ttl: number }>
): Promise<void> {
  if (!redis) return;

  console.log(`🔥 Warming up cache with ${items.length} items...`);

  const promises = items.map(async (item) => {
    try {
      const data = await item.fetcher();
      await setCache(item.key, data, item.ttl);
    } catch (error) {
      console.error(`❌ Failed to warm up cache for ${item.key}:`, error);
    }
  });

  await Promise.all(promises);
  console.log(`✅ Cache warmup complete`);
}
