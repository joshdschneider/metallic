import express from 'express';
import {
  createTemplate,
  destroyTemplate,
  listTemplates,
  retrieveTemplate,
  updateTemplate
} from '../controllers/template.controller.js';

const templateRouter = express.Router();

templateRouter.route('/').post(createTemplate);
templateRouter.route('/').get(listTemplates);
templateRouter.route('/:template_slug').get(retrieveTemplate);
templateRouter.route('/:template_slug').put(updateTemplate);
templateRouter.route('/:template_slug').delete(destroyTemplate);

export { templateRouter };
