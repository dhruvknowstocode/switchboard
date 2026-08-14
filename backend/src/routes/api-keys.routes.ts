import { Router } from 'express';
import { apiKeysController } from '../controllers/api-keys.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate, requireRoles('ADMIN'));

router.get('/', (req, res, next) => void apiKeysController.list(req, res, next));
router.post('/', (req, res, next) => void apiKeysController.create(req, res, next));
router.delete('/:id', (req, res, next) => void apiKeysController.revoke(req, res, next));

export default router;
