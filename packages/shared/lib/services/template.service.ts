import { database } from '@metallichq/database';
import { Template, TemplateSchema } from '@metallichq/types';
import { z } from 'zod';
import { INITIAL_TEMPLATES } from '../utils/constants.js';
import { deleted, now } from '../utils/helpers.js';

export const getTemplateBySlug = async (slug: string): Promise<Template | null> => {
  const template = await database.template.findUnique({
    where: { slug, deleted_at: null }
  });

  if (!template) {
    return null;
  }

  return TemplateSchema.parse(template);
};

export const listAllTemplates = async (): Promise<Template[]> => {
  const templates = await database.template.findMany({
    where: { deleted_at: null }
  });

  return z.array(TemplateSchema).parse(templates);
};

export const listPrivateTemplates = async (projectId: string): Promise<Template[]> => {
  const templates = await database.template.findMany({
    where: { deleted_at: null, is_public: false, project_id: projectId }
  });

  return z.array(TemplateSchema).parse(templates);
};

export const listPublicTemplates = async (): Promise<Template[]> => {
  const templates = await database.template.findMany({
    where: { deleted_at: null, is_public: true }
  });

  return z.array(TemplateSchema).parse(templates);
};

export const createTemplate = async (
  template: Omit<Template, 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Template> => {
  const createdTemplate = await database.template.create({
    data: {
      ...template,
      init: template.init ?? undefined,
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return TemplateSchema.parse(createdTemplate);
};

export const updateTemplate = async (
  projectId: string,
  slug: string,
  template: Partial<Template>
): Promise<Template> => {
  const updatedTemplate = await database.template.update({
    where: { slug, project_id: projectId, deleted_at: null },
    data: {
      ...template,
      init: template.init ?? undefined,
      updated_at: now()
    }
  });

  return TemplateSchema.parse(updatedTemplate);
};

export const destroyTemplate = async (projectId: string, slug: string): Promise<void> => {
  await database.template.update({
    where: { slug, project_id: projectId, deleted_at: null },
    data: { slug: deleted(slug), deleted_at: now() }
  });
};

export const seedTemplates = async (): Promise<void> => {
  const publicTemplates = await listPublicTemplates();
  const templatesToSeed = INITIAL_TEMPLATES.filter((t) => !publicTemplates.map((pt) => pt.slug).includes(t.slug));
  if (templatesToSeed.length === 0) {
    return;
  }

  await Promise.all(templatesToSeed.map((t) => createTemplate(t)));
};
