import type { Request, Response, NextFunction } from 'express';
import { usersService } from '../services/users.service.js';
import { updateRoleBodySchema } from '../validators/auth.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const usersController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await usersService.list();
      res.status(200).json({ data: users });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getById(req.params.id);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateRoleBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }

      const user = await usersService.updateRole(req.params.id, parsed.data.role);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  },
};
