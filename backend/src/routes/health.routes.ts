import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

router.get('/', (req, res, next) => void healthController.check(req, res, next));

export default router;
