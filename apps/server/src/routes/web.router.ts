import cors from 'cors';
import express from 'express';
import { sessionAuth } from '../middleware/access.middleware.js';
import { webCorsOptions } from '../utils/cors.js';
import { apiKeyRouter } from './api-key.router.js';
import { authRouter } from './auth.router.js';
import { computerRouter } from './computer.router.js';
import { organizationRouter } from './organization.router.js';
import { templateRouter } from './template.router.js';
import { userRouter } from './user.router.js';

const webRouter = express.Router();

webRouter.use(cors(webCorsOptions));
webRouter.use('/auth', authRouter);

webRouter.use(sessionAuth);
webRouter.use('/users', userRouter);
webRouter.use('/organizations', organizationRouter);
webRouter.use('/api-keys', apiKeyRouter);
webRouter.use('/computers', computerRouter);
webRouter.use('/templates', templateRouter);

export { webRouter };
