import cors from 'cors';
import express from 'express';
import { apiKeyAuth } from '../middleware/access.middleware.js';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware.js';
import { apiCorsOptions } from '../utils/cors.js';
import { computerRouter } from './computer.router.js';
import { templateRouter } from './template.router.js';

const apiV1Router = express.Router();

apiV1Router.use(cors(apiCorsOptions));
apiV1Router.use(rateLimitMiddleware);
apiV1Router.use(apiKeyAuth);

apiV1Router.use('/computers', computerRouter);
apiV1Router.use('/templates', templateRouter);

export { apiV1Router };
