import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types/index.js';
import { AppError } from './error-handler.js';

/**
 * Role-based access control.
 *
 * Hierarchy (highest → lowest):
 * ADMIN > RELEASE_MANAGER > DEVELOPER > VIEWER
 *
 * `requireRoles('VIEWER')` allows VIEWER and everyone above.
 * `requireRoles('ADMIN')` allows ADMIN only.
 */
const ROLE_RANK: Record<Role, number> = {
  ADMIN: 40,
  RELEASE_MANAGER: 30,
  DEVELOPER: 20,
  VIEWER: 10,
};

export function requireRoles(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    const userRank = ROLE_RANK[req.user.role];
    const allowedOk = allowed.some((role) => userRank >= ROLE_RANK[role]);

    if (!allowedOk) {
      next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
      return;
    }

    next();
  };
}
