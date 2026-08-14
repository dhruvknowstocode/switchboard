import type { Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../types/index.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { hashApiKey } from '../utils/api-key.js';
import { apiKeyRepository } from '../repositories/api-key.repository.js';
import { AppError } from './error-handler.js';

/**
 * JWT authentication middleware.
 * Requires `Authorization: Bearer <token>` and attaches `req.user`.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // API keys use sb_live_ prefix — reject here so JWT-only routes stay strict
    if (token.startsWith('sb_live_')) {
      throw new AppError(401, 'UNAUTHORIZED', 'API keys are not valid for this endpoint');
    }

    const payload = verifyAccessToken(token);
    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      via: 'jwt',
    };
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Accepts either operator JWT or machine API key (`Bearer sb_live_…` / `X-API-Key`).
 * Used by the evaluate endpoint for SDK clients.
 */
export async function authenticateJwtOrApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const apiKeyHeader = req.header('x-api-key')?.trim();
    const authHeader = req.header('authorization');
    const bearer =
      authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

    const candidate = apiKeyHeader || bearer;

    if (!candidate) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (candidate.startsWith('sb_live_')) {
      const record = await apiKeyRepository.findByHash(hashApiKey(candidate));
      if (!record || record.revokedAt) {
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid or revoked API key');
      }

      void apiKeyRepository.touchLastUsed(record.id).catch(() => undefined);

      req.user = {
        id: record.createdBy.id,
        email: record.createdBy.email,
        name: `${record.name} (API key)`,
        role: 'DEVELOPER',
        via: 'api_key',
      };
      next();
      return;
    }

    const payload = verifyAccessToken(candidate);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      via: 'jwt',
    };
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth — attaches user if token present, never blocks on missing token.
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token || token.startsWith('sb_live_')) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      via: 'jwt',
    };
    next();
  } catch {
    next();
  }
}
