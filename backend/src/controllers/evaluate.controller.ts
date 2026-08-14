import type { Request, Response, NextFunction } from 'express';
import { evaluateService } from '../services/evaluate.service.js';
import { evaluateBodySchema } from '../validators/feature-flags.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const evaluateController = {
  async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = evaluateBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }

      const result = await evaluateService.evaluate(req.params.key, parsed.data);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  },
};
