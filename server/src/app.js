import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config.js';
import { requestIdMiddleware, securityHeadersMiddleware } from './middleware/security.js';

export function createApp() {
  const app = express();
  const corsOrigins = env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((value) => value.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'Study Abroad Consultancy API is running.',
      status: 'ok',
    });
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'consultancy-server',
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
