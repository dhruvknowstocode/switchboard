import { Router } from 'express';
import { auditLogsController } from '../controllers/audit-logs.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.get('/', authenticate, requireRoles('VIEWER'), (req, res, next) =>
  void auditLogsController.list(req, res, next),
);

export default router;
