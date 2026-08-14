import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { apiKeysService } from '../services/api-keys.service.js';
import { AppError } from '../middleware/error-handler.js';

const createSchema = z.object({
  name: z.string().min(2).max(80),
});

export const apiKeysController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keys = await apiKeysService.list();
      res.status(200).json({ data: keys });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid API key payload', parsed.error.flatten());
      }
      const created = await apiKeysService.create(parsed.data.name, req.user.id);
      res.status(201).json({ data: created });
    } catch (error) {
      next(error);
    }
  },

  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const revoked = await apiKeysService.revoke(req.params.id, req.user.id);
      res.status(200).json({ data: revoked });
    } catch (error) {
      next(error);
    }
  },
};
