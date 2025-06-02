import express from 'express';
import { deleteUser, updateUser } from '../controllers/user.controller.js';

const userRouter = express.Router();

userRouter.route('/:user_id').put(updateUser);
userRouter.route('/:user_id').delete(deleteUser);

export { userRouter };
