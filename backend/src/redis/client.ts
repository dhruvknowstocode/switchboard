import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Two Redis connections are required: one for commands/publish, one for subscribe.
 */

const redisOptions = {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
};

export const redis = new Redis(env.REDIS_URL, redisOptions);
export const redisSubscriber = new Redis(env.REDIS_URL, redisOptions);

redis.on('error', (error) => {
  logger.warn('Redis client error', { error: error.message });
});

redisSubscriber.on('error', (error) => {
  logger.warn('Redis subscriber error', { error: error.message });
});

export async function connectRedis(): Promise<void> {
  try {
    if (redis.status === 'wait') await redis.connect();
    if (redisSubscriber.status === 'wait') await redisSubscriber.connect();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis unavailable — continuing in degraded mode', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (redis.status !== 'ready') {
      await connectRedis();
    }
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/** Cache key: feature-flag:{env}:{key} */
export function featureFlagCacheKey(environment: string, flagKey: string): string {
  return `feature-flag:${environment}:${flagKey}`;
}
