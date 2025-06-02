import { envVars, getLogger } from '@metallichq/shared';
import express, { type Express } from 'express';
import http from 'http';
import { router } from './routes/base.router.js';

const logger = getLogger('Server');

function createApp(): Express {
  const app = express();
  app.set('trust proxy', true);
  app.use('/', router);
  return app;
}

async function start() {
  const app = createApp();
  const server = http.createServer(app);
  server.listen(envVars.SERVER_PORT, () => {
    logger.info(`Metallic API running on port ${envVars.SERVER_PORT}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
