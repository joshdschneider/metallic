import { z } from 'zod';

export const PaginationParametersSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
  after: z.string().optional(),
  before: z.string().optional()
});

export type PaginationParameters = z.infer<typeof PaginationParametersSchema>;

export enum HttpStatusCode {
  Ok = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Conflict = 409,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500
}
