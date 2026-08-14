import type { Request, Response, NextFunction } from 'express';
import { checkDatabaseHealth } from '../database/prisma.js';
import { checkRedisHealth } from '../redis/client.js';

/**
 * Health controller — app / Postgres / Redis probes.
 * TODO: Phase 6 — deeper readiness vs liveness split.
 */
export const healthController = {
  async check(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [postgres, redis] = await Promise.all([
        checkDatabaseHealth(),
        checkRedisHealth(),
      ]);

      const healthy = postgres && redis;
      res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        checks: {
          app: true,
          postgres,
          redis,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
