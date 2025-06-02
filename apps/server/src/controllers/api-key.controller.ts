import { ApiKeyService, HttpError } from '@metallichq/shared';
import { ApiKeyDeletedObject, ApiKeyObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SessionAuthResponseLocalsSchema } from '../utils/locals.js';

export const ListApiKeysRequstSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema
});

export const listApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListApiKeysRequstSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { project } = parsedReq.data.locals;
    if (!project) {
      throw HttpError.badRequest('Project not found');
    }

    const apiKeys = await ApiKeyService.getApiKeysByProjectId(project.id);
    const apiKeyObjects: ApiKeyObject[] = apiKeys.map((apiKey) => {
      return {
        object: 'api_key',
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key,
        created_at: apiKey.created_at,
        updated_at: apiKey.updated_at
      };
    });

    res.status(200).json({ object: 'list', data: apiKeyObjects });
  } catch (err) {
    next(err);
  }
};

export const CreateApiKeyRequestSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  body: z.object({ name: z.string().nullable().optional() })
});

export const createApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateApiKeyRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { project } = parsedReq.data.locals;
    if (!project) {
      throw HttpError.badRequest('Project not found');
    }

    const { name } = parsedReq.data.body;
    const apiKey = await ApiKeyService.createApiKey({
      projectId: project.id,
      name
    });

    const apiKeyObject: ApiKeyObject = {
      object: 'api_key',
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };

    res.status(201).json(apiKeyObject);
  } catch (err) {
    next(err);
  }
};

export const RetrieveApiKeyRequstSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ api_key_id: z.string() })
});

export const retrieveApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RetrieveApiKeyRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { api_key_id } = parsedReq.data.params;
    const apiKey = await ApiKeyService.getApiKeyById(api_key_id);

    if (!apiKey) {
      throw HttpError.notFound(`API Key not found with ID ${api_key_id}`);
    }

    const apiKeyObject: ApiKeyObject = {
      object: 'api_key',
      id: apiKey.id,
      name: apiKey.name,
      key: apiKey.key,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at
    };

    res.status(200).json(apiKeyObject);
  } catch (err) {
    next(err);
  }
};

export const UpdateApiKeyRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ api_key_id: z.string() }),
  body: z.object({ name: z.string().nullable() })
});

export const updateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateApiKeyRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { api_key_id } = parsedReq.data.params;
    const { name } = parsedReq.data.body;

    const apiKey = await ApiKeyService.getApiKeyById(api_key_id);
    if (!apiKey) {
      throw HttpError.notFound(`API Key not found with ID ${api_key_id}`);
    }

    const updatedApiKey = await ApiKeyService.updateApiKey(api_key_id, {
      name
    });

    const apiKeyObject: ApiKeyObject = {
      object: 'api_key',
      id: updatedApiKey.id,
      name: updatedApiKey.name,
      key: updatedApiKey.key,
      created_at: updatedApiKey.created_at,
      updated_at: updatedApiKey.updated_at
    };

    res.status(200).json(apiKeyObject);
  } catch (err) {
    next(err);
  }
};

export const DeleteApiKeyRequestSchema = z.object({
  method: z.literal('DELETE'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ api_key_id: z.string() })
});

export const deleteApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DeleteApiKeyRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { api_key_id } = parsedReq.data.params;
    await ApiKeyService.deleteApiKey(api_key_id);

    const apiKeyDeletedObject: ApiKeyDeletedObject = {
      object: 'api_key',
      id: api_key_id,
      deleted: true
    };

    res.status(200).json(apiKeyDeletedObject);
  } catch (err) {
    next(err);
  }
};
