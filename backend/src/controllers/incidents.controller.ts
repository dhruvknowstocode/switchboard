import type { Request, Response, NextFunction } from 'express';
import { incidentsService } from '../services/incidents.service.js';
import {
  createIncidentSchema,
  updateIncidentStatusSchema,
  incidentFlagActionSchema,
  reduceRolloutSchema,
} from '../validators/incidents.validators.js';
import { AppError } from '../middleware/error-handler.js';

export const incidentsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, severity } = req.query as {
        status?: string;
        severity?: string;
      };
      const incidents = await incidentsService.list({ status, severity });
      res.status(200).json({ data: incidents });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentsService.getById(req.params.id);
      res.status(200).json({ data: incident });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const incident = await incidentsService.create({
        ...parsed.data,
        createdById: req.user.id,
      });
      res.status(201).json({ data: incident });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateIncidentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const incident = await incidentsService.updateStatus(
        req.params.id,
        parsed.data.status,
        req.user.id,
      );
      res.status(200).json({ data: incident });
    } catch (error) {
      next(error);
    }
  },

  async killFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = incidentFlagActionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const incident = await incidentsService.killAffectedFlag({
        incidentId: req.params.id,
        ...parsed.data,
        actorId: req.user.id,
      });
      res.status(200).json({ data: incident });
    } catch (error) {
      next(error);
    }
  },

  async reduceRollout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = reduceRolloutSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten());
      }
      if (!req.user) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      const incident = await incidentsService.reduceRollout({
        incidentId: req.params.id,
        ...parsed.data,
        actorId: req.user.id,
      });
      res.status(200).json({ data: incident });
    } catch (error) {
      next(error);
    }
  },

  /** Alias for kill — older route name */
  async disableFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.killFlag(req, res, next);
  },
};
