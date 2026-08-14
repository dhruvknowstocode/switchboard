import { Router } from 'express';
import { incidentsController } from '../controllers/incidents.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('VIEWER'), (req, res, next) =>
  void incidentsController.list(req, res, next),
);
router.get('/:id', requireRoles('VIEWER'), (req, res, next) =>
  void incidentsController.getById(req, res, next),
);
router.post('/', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void incidentsController.create(req, res, next),
);
router.patch('/:id/status', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void incidentsController.updateStatus(req, res, next),
);
router.post('/:id/actions/kill-flag', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void incidentsController.killFlag(req, res, next),
);
router.post('/:id/actions/reduce-rollout', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void incidentsController.reduceRollout(req, res, next),
);
router.post('/:id/actions/disable-flag', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void incidentsController.disableFlag(req, res, next),
);

export default router;
