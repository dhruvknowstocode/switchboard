import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './database/prisma.js';
import { redis, redisSubscriber } from './redis/client.js';
import { initWebSocketServer } from './websocket/index.js';
import { initPubSubSubscriptions } from './redis/pubsub.js';

/**
 * HTTP + WebSocket server bootstrap.
 * TODO: Phase 6 — full graceful shutdown, metrics, rate limiting.
 */
async function main(): Promise<void> {
  const app = createApp();
  const server = http.createServer(app);

  // Attach WebSocket server on the same HTTP server
  initWebSocketServer(server);

  // Subscribe to Redis Pub/Sub channels and fan out to WS clients
  await initPubSubSubscriptions();

  server.listen(env.PORT, () => {
    logger.info('SWITCHBOARD backend listening', {
      port: env.PORT,
      env: env.NODE_ENV,
      wsPath: '/ws',
    });
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    server.close();
    try {
      await prisma.$disconnect();
      redis.disconnect();
      redisSubscriber.disconnect();
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
