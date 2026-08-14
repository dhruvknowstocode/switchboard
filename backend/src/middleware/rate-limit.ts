import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

/**
 * Simple in-memory sliding-window rate limiter (per IP).
 * Good enough for local/demo; replace with Redis for multi-instance prod.
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const hits = new Map<string, number[]>();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    const recent = (hits.get(key) ?? []).filter((ts) => ts > windowStart);

    if (recent.length >= options.max) {
      next(
        new AppError(
          429,
          'RATE_LIMITED',
          options.message ?? 'Too many requests — slow down',
        ),
      );
      return;
    }

    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
