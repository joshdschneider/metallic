import { HttpError, captureException } from '@metallichq/shared';
import { HttpStatusCode } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';

export const errorMiddleware = (error: unknown, req: Request, res: Response, next: NextFunction): void => {
  captureException(error);
  if (error instanceof HttpError) {
    res.status(error.statusCode || HttpStatusCode.InternalServerError).json({
      name: error.name,
      message: error.message
    });
  } else {
    res.status(HttpStatusCode.InternalServerError).json({
      name: 'InternalServerError',
      message: 'Something went wrong'
    });
  }
};
