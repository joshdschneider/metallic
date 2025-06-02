import {
  DEFAULT_INSTANCE_TYPE,
  HttpError,
  INSTANCE_TYPES,
  MAX_STORAGE_GB,
  MIN_STORAGE_GB,
  TemplateService
} from '@metallichq/shared';
import { InitSchema, PaginationParametersSchema, TemplateDestroyedObject, TemplateObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema } from '../utils/locals.js';
import { getProjectIdFromLocals } from '../utils/project.js';

const ListTemplatesRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  query: PaginationParametersSchema.optional()
});

export const listTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListTemplatesRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      query: req.query
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { templates, cursorFirst, cursorLast, hasMore } = await TemplateService.getTemplatesByProjectId(projectId, {
      ...parsedReq.data.query
    });

    const templateObjects: TemplateObject[] = templates.map((template) => {
      return {
        object: 'template',
        slug: template.slug,
        name: template.name,
        description: template.description,
        instance_type: template.instance_type,
        storage_gb: template.storage_gb,
        image: template.image,
        init: template.init,
        created_at: template.created_at,
        updated_at: template.updated_at
      };
    });

    res.status(200).json({
      object: 'list',
      data: templateObjects,
      first: cursorFirst,
      last: cursorLast,
      has_more: hasMore
    });
  } catch (err) {
    next(err);
  }
};

const CreateTemplateRequestSchema = z.object({
  method: z.literal('POST'),
  locals: ResponseLocalsSchema,
  body: z.object({
    slug: z.string(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    instance_type: z.string().optional(),
    storage_gb: z.number().optional(),
    image: z.string(),
    init: InitSchema.nullable().optional()
  })
});

export const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateTemplateRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { slug, name, description, instance_type, storage_gb, image, init } = parsedReq.data.body;

    const instanceType = instance_type || DEFAULT_INSTANCE_TYPE;
    const instanceDetails = INSTANCE_TYPES[instanceType];
    if (!instanceDetails) {
      throw HttpError.badRequest('Invalid instance type');
    }

    if (storage_gb && storage_gb > MAX_STORAGE_GB) {
      throw HttpError.badRequest(`Max "storage_gb" of ${MAX_STORAGE_GB} exceeded`);
    } else if (storage_gb && storage_gb < MIN_STORAGE_GB) {
      throw HttpError.badRequest(`Min "storage_gb" is ${MIN_STORAGE_GB}`);
    }

    const storageGb = storage_gb ?? instanceDetails.default_storage_gb;
    const template = await TemplateService.createTemplate({
      project_id: projectId,
      slug,
      name: name || null,
      description: description || null,
      instance_type: instanceType,
      storage_gb: storageGb,
      image,
      init: init || null
    });

    const templateObject: TemplateObject = {
      object: 'template',
      slug: template.slug,
      name: template.name,
      description: template.description,
      instance_type: template.instance_type,
      storage_gb: template.storage_gb,
      image: template.image,
      init: template.init,
      created_at: template.created_at,
      updated_at: template.updated_at
    };

    res.status(200).json(templateObject);
  } catch (err) {
    next(err);
  }
};

const RetrieveTemplateRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  params: z.object({ template_slug: z.string() })
});

export const retrieveTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RetrieveTemplateRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { template_slug } = parsedReq.data.params;
    const template = await TemplateService.getTemplateBySlug(projectId, template_slug);
    if (!template) {
      throw HttpError.notFound(`Template not found by slug: "${template_slug}"`);
    }

    const templateObject: TemplateObject = {
      object: 'template',
      slug: template.slug,
      name: template.name,
      description: template.description,
      instance_type: template.instance_type,
      storage_gb: template.storage_gb,
      image: template.image,
      init: template.init,
      created_at: template.created_at,
      updated_at: template.updated_at
    };

    res.status(200).json(templateObject);
  } catch (err) {
    next(err);
  }
};

const UpdateTemplateRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: ResponseLocalsSchema,
  params: z.object({ template_slug: z.string() }),
  body: z.object({
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional()
  })
});

export const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateTemplateRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { template_slug } = parsedReq.data.params;
    const { name, description } = parsedReq.data.body;

    const template = await TemplateService.getTemplateBySlug(projectId, template_slug);
    if (!template) {
      throw HttpError.notFound(`Template not found by slug: "${template_slug}"`);
    }

    const updatedTemplate = await TemplateService.updateTemplate(projectId, template_slug, {
      name,
      description
    });

    const templateObject: TemplateObject = {
      object: 'template',
      slug: updatedTemplate.slug,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      instance_type: updatedTemplate.instance_type,
      storage_gb: updatedTemplate.storage_gb,
      image: updatedTemplate.image,
      init: updatedTemplate.init,
      created_at: updatedTemplate.created_at,
      updated_at: updatedTemplate.updated_at
    };

    res.status(200).json(templateObject);
  } catch (err) {
    next(err);
  }
};

const DestroyTemplateRequestSchema = z.object({
  method: z.literal('DELETE'),
  locals: ResponseLocalsSchema,
  params: z.object({ template_slug: z.string() })
});

export const destroyTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DestroyTemplateRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const projectId = getProjectIdFromLocals(parsedReq.data.locals);
    if (!projectId) {
      throw HttpError.badRequest('Project not found');
    }

    const { template_slug } = parsedReq.data.params;
    const template = await TemplateService.getTemplateBySlug(projectId, template_slug);
    if (!template) {
      throw HttpError.notFound(`Template not found by slug: "${template_slug}"`);
    } else if (template.project_id !== projectId) {
      throw HttpError.badRequest(`You do not have permission to update template "${template_slug}"`);
    }

    await TemplateService.destroyTemplate(projectId, template_slug);

    const templateDestroyedObject: TemplateDestroyedObject = {
      object: 'template',
      slug: template.slug,
      destroyed: true
    };

    res.status(200).json(templateDestroyedObject);
  } catch (err) {
    next(err);
  }
};
