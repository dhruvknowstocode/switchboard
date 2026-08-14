import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/index.js';

/**
 * Express application factory.
 * Separated from server bootstrap so tests can import the app without listening.
 */
export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        const allowed = env.CORS_ORIGIN.split(',').map((value) => value.trim());
        if (!origin || allowed.includes('*') || allowed.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  app.get('/', (_req, res) => {
    res.json({
      name: 'SWITCHBOARD API',
      version: 'v1',
      status: 'ok',
    });
  });

  app.use('/api/v1', createApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
