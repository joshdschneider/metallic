import express from 'express';
import {
  createApiKey,
  deleteApiKey,
  listApiKeys,
  retrieveApiKey,
  updateApiKey
} from '../controllers/api-key.controller.js';

const apiKeyRouter = express.Router();

apiKeyRouter.route('/').get(listApiKeys);
apiKeyRouter.route('/').post(createApiKey);
apiKeyRouter.route('/:api_key_id').get(retrieveApiKey);
apiKeyRouter.route('/:api_key_id').put(updateApiKey);
apiKeyRouter.route('/:api_key_id').delete(deleteApiKey);

export { apiKeyRouter };
