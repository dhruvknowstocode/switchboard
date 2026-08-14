import type { Request, Response, NextFunction } from 'express';
import { auditLogsService } from '../services/audit-logs.service.js';

export const auditLogsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityType, entityId, actorId, limit, cursor } = req.query as {
        entityType?: string;
        entityId?: string;
        actorId?: string;
        limit?: string;
        cursor?: string;
      };

      const logs = await auditLogsService.list({
        entityType,
        entityId,
        actorId,
        limit: limit ? Number(limit) : undefined,
        cursor,
      });

      res.status(200).json({ data: logs, meta: { count: logs.length } });
    } catch (error) {
      next(error);
    }
  },
};
