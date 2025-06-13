import { HttpError } from '@metallichq/shared';
import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';
import { heartbeat } from '../controllers/heartbeat.controller.js';
import { webhook } from '../controllers/webhook.controller.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { helmetOptions } from '../utils/helmet.js';
import { apiV1Router } from './api-v1.router.js';
import { webRouter } from './web.router.js';

const router = express.Router();

// Middleware
router.use(helmet(helmetOptions));

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// JSON and URL encoded body parsers
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Health check
router.get('/health', (_, res) => {
  res.status(200).json({ result: 'ok' });
});

// Computer heartbeat
router.post('/heartbeat', heartbeat);

// Routes
router.use('/web', webRouter);
router.use('/v1', apiV1Router);

// Capture errors with Sentry
Sentry.setupExpressErrorHandler(router);

// Catch all
router.all('*', (req, _, next): void => {
  next(HttpError.notFound(`Endpoint not found: ${req.originalUrl}`));
});

// Handle errors
router.use(errorMiddleware);

export { router };
