import { HttpError, SESSION_COOKIE_KEY, UserService, WorkOSClient } from '@metallichq/shared';
import { UserDeletedObject, UserObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SessionAuthResponseLocalsSchema } from '../utils/locals.js';

export const UpdateUserRequstSchema = z.object({
  method: z.literal('PUT'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ user_id: z.string() }),
  body: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email_subscriptions: z.array(z.string()).optional()
  })
});

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateUserRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { user_id } = parsedReq.data.params;
    const { first_name, last_name, email_subscriptions } = parsedReq.data.body;

    const user = await UserService.getUserById(user_id);
    if (!user) {
      throw HttpError.notFound('User not found');
    }

    if (first_name !== undefined || last_name !== undefined) {
      await WorkOSClient.updateUser(user.workos_user_id, {
        firstName: first_name,
        lastName: last_name
      });
    }

    const updatedUser = await UserService.updateUser(user_id, {
      first_name,
      last_name,
      email_subscriptions
    });

    const { deleted_at, ...rest } = updatedUser;
    const userObject: UserObject = {
      object: 'user',
      ...rest
    };

    res.status(200).json(userObject);
  } catch (err) {
    next(err);
  }
};

export const DeleteUserRequstSchema = z.object({
  method: z.literal('DELETE'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ user_id: z.string() })
});

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DeleteUserRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { user } = parsedReq.data.locals;
    const { user_id } = parsedReq.data.params;

    if (user.id !== user_id) {
      throw HttpError.forbidden('You do not have permission to delete this user');
    }

    await UserService.deleteUser(user_id);
    const userDeletedObject: UserDeletedObject = {
      object: 'user',
      id: user_id,
      deleted: true
    };

    res.clearCookie(SESSION_COOKIE_KEY);
    res.status(200).json(userDeletedObject);
  } catch (err) {
    next(err);
  }
};
