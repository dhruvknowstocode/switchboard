import { Router } from 'express';
import { evaluateController } from '../controllers/evaluate.controller.js';
import { authenticateJwtOrApiKey } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import { rateLimit } from '../middleware/rate-limit.js';

const router = Router();

const evaluateRateLimit = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: 'Evaluate rate limit exceeded (120/min)',
});

// Evaluation API — operators (JWT) or apps (API key / SDK)
router.post(
  '/:key',
  evaluateRateLimit,
  (req, res, next) => void authenticateJwtOrApiKey(req, res, next),
  requireRoles('DEVELOPER'),
  (req, res, next) => void evaluateController.evaluate(req, res, next),
);

export default router;
