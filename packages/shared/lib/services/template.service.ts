import { database, Prisma } from '@metallichq/database';
import { PaginationParameters, Template, TemplateSchema } from '@metallichq/types';
import { z } from 'zod';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT, PAGINATION_MIN_LIMIT } from '../utils/constants.js';
import { deleted, now } from '../utils/helpers.js';

export const getTemplateBySlug = async (projectId: string, slug: string): Promise<Template | null> => {
  const template = await database.template.findUnique({
    where: {
      slug_project_id: { project_id: projectId, slug },
      deleted_at: null
    }
  });

  if (!template) {
    return null;
  }

  return TemplateSchema.parse(template);
};

export const getTemplatesByProjectId = async (
  projectId: string,
  options?: PaginationParameters
): Promise<{
  templates: Template[];
  hasMore: boolean;
  cursorFirst: string | null;
  cursorLast: string | null;
}> => {
  const where: Prisma.TemplateWhereInput = {
    deleted_at: null,
    project_id: projectId
  };

  let cursor: Prisma.TemplateWhereUniqueInput | undefined;
  const orderBy: Prisma.TemplateOrderByWithRelationInput = {
    created_at: options?.order || 'desc'
  };

  const limit = Math.min(
    PAGINATION_MAX_LIMIT,
    Math.max(PAGINATION_MIN_LIMIT, options?.limit || PAGINATION_DEFAULT_LIMIT)
  );

  let take = limit + 1;
  let skip = 0;

  if (options?.after) {
    cursor = { slug_project_id: { project_id: projectId, slug: options.after } };
    skip = 1;
  } else if (options?.before) {
    cursor = { slug_project_id: { project_id: projectId, slug: options.before } };
    skip = 1;
    take = -take;
    orderBy.created_at = orderBy.created_at === 'asc' ? 'desc' : 'asc';
  }

  const templatesRaw = await database.template.findMany({
    where,
    cursor,
    skip,
    take,
    orderBy
  });

  let templates = z.array(TemplateSchema).parse(templatesRaw);
  const hasMore = templates.length > limit;
  if (hasMore) {
    templates = templates.slice(0, -1);
  }

  if (options?.before) {
    templates.reverse();
  }

  const cursorFirst = templates[0]?.slug || null;
  const cursorLast = templates[templates.length - 1]?.slug || null;

  return { templates, hasMore, cursorFirst, cursorLast };
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
    where: { slug_project_id: { project_id: projectId, slug }, deleted_at: null },
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
    where: { slug_project_id: { project_id: projectId, slug } },
    data: { slug: deleted(slug), deleted_at: now() }
  });
};
