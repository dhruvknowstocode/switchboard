import { flagCache } from './cache.js';
import { publishEvent, PUBSUB_CHANNELS } from './pubsub.js';
import { connectRedis } from './client.js';
import {
  createRealtimeEvent,
  type FeatureFlagEventType,
  type FeatureFlagUpdatedPayload,
} from '../websocket/event-types.js';
import { environmentRepository } from '../repositories/environment.repository.js';
import type { ResolvedFlagConfig } from '../services/evaluation-engine.service.js';
import { logger } from '../utils/logger.js';

const CACHE_TTL_SECONDS = 60;

/** Ensure Redis command client is connected (best-effort). */
export async function ensureRedisReady(): Promise<boolean> {
  try {
    await connectRedis();
    return true;
  } catch {
    return false;
  }
}

export async function getCachedFlagConfig(
  environment: string,
  flagKey: string,
): Promise<ResolvedFlagConfig | null> {
  await ensureRedisReady();
  return flagCache.get<ResolvedFlagConfig>(environment, flagKey);
}

export async function setCachedFlagConfig(
  environment: string,
  flagKey: string,
  config: ResolvedFlagConfig,
): Promise<void> {
  await ensureRedisReady();
  await flagCache.set(environment, flagKey, config, CACHE_TTL_SECONDS);
}

export async function invalidateFlagCache(
  flagKey: string,
  environmentKeys?: string[],
): Promise<void> {
  await ensureRedisReady();
  const keys =
    environmentKeys ??
    (await environmentRepository.findAll()).map((env) => env.key);

  await Promise.all(keys.map((env) => flagCache.invalidate(env, flagKey)));
  logger.debug('Invalidated flag cache', { flagKey, environments: keys });
}

export async function publishFeatureFlagEvent(
  type: FeatureFlagEventType,
  payload: FeatureFlagUpdatedPayload & { deleted?: boolean; name?: string },
  requestId?: string,
): Promise<void> {
  await ensureRedisReady();
  const event = createRealtimeEvent(type, PUBSUB_CHANNELS.FEATURE_FLAGS, payload, requestId);
  await publishEvent(PUBSUB_CHANNELS.FEATURE_FLAGS, event);
}
