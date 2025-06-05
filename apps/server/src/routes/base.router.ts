import { HttpError } from '@metallichq/shared';
import express from 'express';
import helmet from 'helmet';
import { heartbeat } from '../controllers/heartbeat.controller.js';
import { errorMiddleware } from '../middleware/error.middleware.js';
import { helmetOptions } from '../utils/helmet.js';
import { apiV1Router } from './api-v1.router.js';
import { webRouter } from './web.router.js';

const router = express.Router();

// Middleware
router.use(helmet(helmetOptions));
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

// Catch all
router.all('*', (req, _, next): void => {
  next(HttpError.notFound(`Endpoint not found: ${req.originalUrl}`));
});

// Handle errors
router.use(errorMiddleware);

export { router };
