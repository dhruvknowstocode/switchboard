import { redis, featureFlagCacheKey } from './client.js';
import { logger } from '../utils/logger.js';

/**
 * Feature flag cache layer.
 *
 * Key pattern: feature-flag:{environment}:{flagKey}
 *
 * Stores ResolvedFlagConfig JSON for evaluate hot-path (TTL set by callers).
 */
export const flagCache = {
  async get<T = unknown>(environment: string, flagKey: string): Promise<T | null> {
    try {
      const raw = await redis.get(featureFlagCacheKey(environment, flagKey));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.warn('Redis cache get failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  },

  async set(environment: string, flagKey: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      await redis.set(
        featureFlagCacheKey(environment, flagKey),
        JSON.stringify(value),
        'EX',
        ttlSeconds,
      );
    } catch (error) {
      logger.warn('Redis cache set failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async invalidate(environment: string, flagKey: string): Promise<void> {
    try {
      await redis.del(featureFlagCacheKey(environment, flagKey));
    } catch (error) {
      logger.warn('Redis cache invalidate failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
