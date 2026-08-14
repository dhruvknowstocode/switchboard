import { Router } from 'express';
import { environmentsController } from '../controllers/environments.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('VIEWER'), (req, res, next) =>
  void environmentsController.list(req, res, next),
);
router.post('/', requireRoles('ADMIN'), (req, res, next) =>
  void environmentsController.create(req, res, next),
);
router.patch('/:id', requireRoles('ADMIN'), (req, res, next) =>
  void environmentsController.update(req, res, next),
);

export default router;
