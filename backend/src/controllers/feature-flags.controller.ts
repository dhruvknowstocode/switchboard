import type { Request, Response, NextFunction } from 'express';
import { featureFlagsService } from '../services/feature-flags.service.js';
import {
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  updateFeatureFlagConfigSchema,
} from '../validators/feature-flags.validators.js';
import { killSwitchBodySchema } from '../validators/incidents.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const featureFlagsController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flags = await featureFlagsService.list();
      res.status(200).json({ data: flags });
    } catch (error) {
      next(error);
    }
  },

  async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const flag = await featureFlagsService.getByKey(req.params.key);
      res.status(200).json({ data: flag });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const flag = await featureFlagsService.create({
        key: parsed.data.key,
        name: parsed.data.name,
        description: parsed.data.description,
        createdById: req.user.id,
        initialConfig: parsed.data.initialConfig,
      });
      res.status(201).json({ data: flag });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateFeatureFlagSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const flag = await featureFlagsService.update(req.params.key, {
        ...parsed.data,
        updatedById: req.user.id,
      });
      res.status(200).json({ data: flag });
    } catch (error) {
      next(error);
    }
  },

  async updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateFeatureFlagConfigSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const flag = await featureFlagsService.updateConfig(req.params.key, req.params.env, {
        ...parsed.data,
        updatedById: req.user.id,
      });
      res.status(200).json({ data: flag });
    } catch (error) {
      next(error);
    }
  },

  async kill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = killSwitchBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const result = await featureFlagsService.killSwitch(
        req.params.key,
        parsed.data.environment,
        {
          reason: parsed.data.reason,
          actorId: req.user.id,
        },
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      await featureFlagsService.remove(req.params.key, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
