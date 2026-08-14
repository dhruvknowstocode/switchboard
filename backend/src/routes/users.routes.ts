import { Router } from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('ADMIN'), (req, res, next) =>
  void usersController.list(req, res, next),
);
router.get('/:id', requireRoles('ADMIN'), (req, res, next) =>
  void usersController.getById(req, res, next),
);
router.patch('/:id', requireRoles('ADMIN'), (req, res, next) =>
  void usersController.updateRole(req, res, next),
);

export default router;
