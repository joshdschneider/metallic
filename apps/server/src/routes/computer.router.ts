import express from 'express';
import {
  countComputers,
  createComputer,
  destroyComputer,
  forkComputer,
  listComputers,
  retrieveComputer,
  startComputer,
  stopComputer,
  updateComputer,
  waitForState
} from '../controllers/computer.controller.js';

const computerRouter = express.Router();

computerRouter.route('/').get(listComputers);
computerRouter.route('/').post(createComputer);
computerRouter.route('/count').get(countComputers);
computerRouter.route('/:computer_id').get(retrieveComputer);
computerRouter.route('/:computer_id').put(updateComputer);
computerRouter.route('/:computer_id').delete(destroyComputer);
computerRouter.route('/:computer_id/wait').get(waitForState);
computerRouter.route('/:computer_id/start').post(startComputer);
computerRouter.route('/:computer_id/stop').post(stopComputer);
computerRouter.route('/:computer_id/fork').post(forkComputer);

export { computerRouter };
