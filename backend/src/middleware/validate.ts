import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from './error-handler.js';

/**
 * Zod request validation helpers (body / query).
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

    (req as Request & { validatedQuery?: T }).validatedQuery = result.data;
    next();
  };
}
