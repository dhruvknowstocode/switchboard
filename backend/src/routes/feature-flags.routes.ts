import { Router } from 'express';
import { featureFlagsController } from '../controllers/feature-flags.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRoles('VIEWER'), (req, res, next) =>
  void featureFlagsController.list(req, res, next),
);
router.get('/:key', requireRoles('VIEWER'), (req, res, next) =>
  void featureFlagsController.getByKey(req, res, next),
);
router.post('/', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void featureFlagsController.create(req, res, next),
);
router.patch('/:key', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void featureFlagsController.update(req, res, next),
);
router.patch('/:key/configs/:env', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void featureFlagsController.updateConfig(req, res, next),
);
router.post('/:key/kill', requireRoles('RELEASE_MANAGER'), (req, res, next) =>
  void featureFlagsController.kill(req, res, next),
);
router.delete('/:key', requireRoles('ADMIN'), (req, res, next) =>
  void featureFlagsController.remove(req, res, next),
);

export default router;
