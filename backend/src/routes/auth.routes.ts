import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { requireRoles } from '../middleware/rbac.middleware.js';
import { userRepository } from '../repositories/user.repository.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

router.post('/login', (req, res, next) => void authController.login(req, res, next));

/**
 * Register:
 * - Bootstrap (0 users): open, no auth required
 * - Otherwise: ADMIN only
 */
async function registerGate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await userRepository.count();
    if (count === 0) {
      next();
      return;
    }
    authenticate(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      requireRoles('ADMIN')(req, res, next);
    });
  } catch (error) {
    next(error);
  }
}

router.post('/register', (req, res, next) => void registerGate(req, res, next), (req, res, next) =>
  void authController.register(req, res, next),
);

router.get('/me', authenticate, (req, res, next) => void authController.me(req, res, next));

// Keep optionalAuthenticate exported usage available for future soft-auth routes
void optionalAuthenticate;

export default router;
