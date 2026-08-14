import type { Request, Response, NextFunction } from 'express';
import { environmentsService } from '../services/environments.service.js';
import {
  createEnvironmentSchema,
  updateEnvironmentSchema,
} from '../validators/feature-flags.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const environmentsController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const environments = await environmentsService.list();
      res.status(200).json({ data: environments });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createEnvironmentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const environment = await environmentsService.create(parsed.data, req.user.id);
      res.status(201).json({ data: environment });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateEnvironmentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const environment = await environmentsService.update(req.params.id, parsed.data, req.user.id);
      res.status(200).json({ data: environment });
    } catch (error) {
      next(error);
    }
  },
};
