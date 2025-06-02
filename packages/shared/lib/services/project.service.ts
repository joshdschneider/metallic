import { database, Prisma } from '@metallichq/database';
import { type Organization, OrganizationSchema, type Project, ProjectSchema } from '@metallichq/types';
import { z } from 'zod';
import { generateId, now, Resource } from '../utils/helpers.js';
import { hashApiKey } from './encryption.service.js';

export const getProjectByApiKey = async (
  apiKey: string
): Promise<(Project & { organization: Organization }) | null> => {
  const keyHash = await hashApiKey(apiKey);

  let where: Prisma.ApiKeyWhereUniqueInput;
  if (keyHash) {
    where = { key_hash: keyHash };
  } else {
    where = { key: apiKey, key_hash: undefined };
  }

  const key = await database.apiKey.findUnique({
    where,
    select: { project: { include: { organization: true } } }
  });

  if (!key) {
    return null;
  }

  return ProjectSchema.extend({ organization: OrganizationSchema }).parse(key.project);
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  const project = await database.project.findUnique({
    where: { id, deleted_at: null }
  });

  if (!project) {
    return null;
  }

  return ProjectSchema.parse(project);
};

export const getProjectsByOrganizationId = async (organizationId: string): Promise<Project[]> => {
  const projects = await database.project.findMany({
    where: { organization_id: organizationId, deleted_at: null }
  });

  return z.array(ProjectSchema).parse(projects);
};

export const createProject = async (
  project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Project> => {
  const newProject = await database.project.create({
    data: {
      ...project,
      id: generateId(Resource.Project),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return ProjectSchema.parse(newProject);
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  const updatedProject = await database.project.update({
    where: { id, deleted_at: null },
    data: { ...project, updated_at: now() }
  });

  return ProjectSchema.parse(updatedProject);
};

export const deleteProject = async (id: string): Promise<Project> => {
  const deletedProject = await database.project.update({
    where: { id, deleted_at: null },
    data: { deleted_at: now() }
  });

  return ProjectSchema.parse(deletedProject);
};
