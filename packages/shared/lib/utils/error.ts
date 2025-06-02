import { z } from 'zod';

export const captureException = (e: unknown): void => {
  // todo: report to sentry
  console.dir(e, { depth: null });
};

enum HttpStatusCode {
  Ok = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Conflict = 409,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Timeout = 408,
  InternalServerError = 500,
  ServiceUnavailable = 503
}

interface HttpErrorOptions {
  name?: string;
  statusCode: HttpStatusCode;
  message: string;
}

export class HttpError extends Error {
  public override name: string;
  public readonly statusCode: HttpStatusCode;

  constructor(options: HttpErrorOptions) {
    super(options.message);
    this.name = options.name ?? 'HttpError';
    this.statusCode = options.statusCode;
  }

  static validation(error: z.ZodError): HttpError {
    return new HttpError({
      name: 'BadRequestError',
      message: zodErrorToString(error.issues),
      statusCode: HttpStatusCode.BadRequest
    });
  }

  static badRequest(message: string): HttpError {
    return new HttpError({ name: 'BadRequestError', message, statusCode: HttpStatusCode.BadRequest });
  }

  static conflict(message: string): HttpError {
    return new HttpError({ name: 'ConflictError', message, statusCode: HttpStatusCode.Conflict });
  }

  static unauthorized(message: string): HttpError {
    return new HttpError({ name: 'UnauthorizedError', message, statusCode: HttpStatusCode.Unauthorized });
  }

  static forbidden(message: string): HttpError {
    return new HttpError({ name: 'ForbiddenError', message, statusCode: HttpStatusCode.Forbidden });
  }

  static notFound(message: string): HttpError {
    return new HttpError({ name: 'NotFoundError', message, statusCode: HttpStatusCode.NotFound });
  }

  static timeout(message: string): HttpError {
    return new HttpError({ name: 'TimeoutError', message, statusCode: HttpStatusCode.Timeout });
  }

  static internalServer(message: string): HttpError {
    return new HttpError({ name: 'InternalServerError', message, statusCode: HttpStatusCode.InternalServerError });
  }

  static serviceUnavailable(message: string): HttpError {
    return new HttpError({ name: 'ServiceUnavailableError', message, statusCode: HttpStatusCode.ServiceUnavailable });
  }
}

export function zodErrorToString(issues: z.ZodIssue[]) {
  return issues.map((i) => `${i.path.join('')} (${i.code} ${i.message})`).join(', ');
}
