import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import environmentsRoutes from './environments.routes.js';
import featureFlagsRoutes from './feature-flags.routes.js';
import evaluateRoutes from './evaluate.routes.js';
import incidentsRoutes from './incidents.routes.js';
import auditLogsRoutes from './audit-logs.routes.js';
import healthRoutes from './health.routes.js';
import apiKeysRoutes from './api-keys.routes.js';

export function createApiRouter(): Router {
  const router = Router();

  router.use('/auth', authRoutes);
  router.use('/users', usersRoutes);
  router.use('/environments', environmentsRoutes);
  router.use('/feature-flags', featureFlagsRoutes);
  router.use('/evaluate', evaluateRoutes);
  router.use('/incidents', incidentsRoutes);
  router.use('/audit-logs', auditLogsRoutes);
  router.use('/api-keys', apiKeysRoutes);
  router.use('/health', healthRoutes);

  return router;
}
