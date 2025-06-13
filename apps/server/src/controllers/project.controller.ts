import * as ControlPlane from '@metallichq/control-plane';
import {
  ApiKeyService,
  DEFAULT_PROJECT_NAME,
  HttpError,
  OrganizationService,
  ProjectService
} from '@metallichq/shared';
import { ProjectDeletedObject, ProjectObject } from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ResponseLocalsSchema, SessionAuthResponseLocalsSchema } from '../utils/locals.js';

export const ListProjectsRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  params: z.object({ organization_id: z.string() })
});

export const listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListProjectsRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID ${organization_id}`);
    }

    const projects = await ProjectService.getProjectsByOrganizationId(organization.id);
    const projectObjects: ProjectObject[] = projects.map((project) => {
      return {
        object: 'project',
        id: project.id,
        name: project.name,
        organization_id: project.organization_id,
        created_at: project.created_at,
        updated_at: project.updated_at
      };
    });

    res.status(200).json({ object: 'list', data: projectObjects });
  } catch (err) {
    next(err);
  }
};

export const RetrieveProjectRequestSchema = z.object({
  method: z.literal('GET'),
  locals: ResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), project_id: z.string() })
});

export const retrieveProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RetrieveProjectRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id, project_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID ${organization_id}`);
    }

    const project = await ProjectService.getProjectById(project_id);
    if (!project || project.organization_id !== organization.id) {
      throw HttpError.notFound(`Project not found with ID ${project_id}`);
    }

    const projectObject: ProjectObject = {
      object: 'project',
      id: project.id,
      name: project.name,
      organization_id: project.organization_id,
      created_at: project.created_at,
      updated_at: project.updated_at
    };

    res.status(200).json(projectObject);
  } catch (err) {
    next(err);
  }
};

export const CreateProjectRequestSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string() }),
  body: z.object({ name: z.string().optional() })
});

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateProjectRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID ${organization_id}`);
    }

    const { name } = parsedReq.data.body;
    const project = await ProjectService.createProject({
      organization_id: organization.id,
      name: name ?? DEFAULT_PROJECT_NAME
    });

    await ControlPlane.onProjectCreated(project.id);
    await ApiKeyService.createApiKey({ projectId: project.id, name: null });

    const projectObject: ProjectObject = {
      object: 'project',
      id: project.id,
      name: project.name,
      organization_id: project.organization_id,
      created_at: project.created_at,
      updated_at: project.updated_at
    };

    res.status(201).json(projectObject);
  } catch (err) {
    next(err);
  }
};

export const UpdateProjectRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), project_id: z.string() }),
  body: z.object({ name: z.string() })
});

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateProjectRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id, project_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID ${organization_id}`);
    }

    const { name } = parsedReq.data.body;
    const project = await ProjectService.updateProject(project_id, { name });

    const projectObject: ProjectObject = {
      object: 'project',
      id: project.id,
      name: project.name,
      organization_id: project.organization_id,
      created_at: project.created_at,
      updated_at: project.updated_at
    };

    res.status(200).json(projectObject);
  } catch (err) {
    next(err);
  }
};

export const DeleteProjectRequestSchema = z.object({
  method: z.literal('DELETE'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), project_id: z.string() })
});

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = DeleteProjectRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id, project_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID ${organization_id}`);
    }

    const project = await ProjectService.getProjectById(project_id);
    if (!project || project.organization_id !== organization.id) {
      throw HttpError.notFound(`Project not found with ID ${project_id}`);
    }

    await ProjectService.deleteProject(project_id);
    await ControlPlane.onProjectDeleted(project_id);

    const projectDeletedObject: ProjectDeletedObject = {
      object: 'project',
      id: project_id,
      deleted: true
    };

    res.status(200).json(projectDeletedObject);
  } catch (err) {
    next(err);
  }
};
