import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { loginBodySchema, registerBodySchema } from '../validators/auth.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }

      const result = await authService.login(parsed.data.email, parsed.data.password);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }

      const actorIsAdmin = req.user?.role === 'ADMIN';
      const result = await authService.register(parsed.data, { actorIsAdmin });
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const result = await authService.me(req.user.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },
};
