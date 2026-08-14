import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from './error-handler.js';

/**
 * Request validation middleware stub using Zod.
 * TODO: Phase 2+ — wire schemas per route (body / query / params).
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', result.error.flatten()),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid query parameters',
          result.error.flatten(),
        ),
      );
      return;
    }

    // Attach validated query for handlers until Phase 2 types this on Request.
    (req as Request & { validatedQuery?: T }).validatedQuery = result.data;
    next();
  };
}
