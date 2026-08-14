import { redis, redisSubscriber, connectRedis } from './client.js';
import { logger } from '../utils/logger.js';
import type { RealtimeEvent, RealtimeChannel } from '../websocket/event-types.js';
import { broadcastToClients } from '../websocket/connection-manager.js';

/**
 * Redis Pub/Sub channels for realtime fanout.
 *
 * Architecture:
 * Service mutation → publish(channel, event) → subscriber → WebSocket broadcast
 *
 * Always publish via Redis (even single-instance) so multi-instance scaling works.
 * Feature-flag publishers are wired from featureFlagsService (Phase 4).
 */

export const PUBSUB_CHANNELS = {
  FEATURE_FLAGS: 'feature-flags',
  INCIDENTS: 'incidents',
  SYSTEM_EVENTS: 'system-events',
} as const satisfies Record<string, RealtimeChannel>;

export async function publishEvent(
  channel: RealtimeChannel,
  event: RealtimeEvent,
): Promise<void> {
  try {
    await redis.publish(channel, JSON.stringify(event));
  } catch (error) {
    logger.warn('Redis publish failed', {
      channel,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function initPubSubSubscriptions(): Promise<void> {
  await connectRedis();

  const channels = Object.values(PUBSUB_CHANNELS);

  try {
    if (redisSubscriber.status !== 'ready') {
      logger.warn('Redis subscriber not ready — skipping Pub/Sub init (scaffold)');
      return;
    }

    await redisSubscriber.subscribe(...channels);

    redisSubscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        broadcastToClients(event);
      } catch (error) {
        logger.warn('Failed to handle Pub/Sub message', {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info('Redis Pub/Sub subscribed', { channels });
  } catch (error) {
    logger.warn('Redis Pub/Sub subscription failed (scaffold degraded mode)', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
