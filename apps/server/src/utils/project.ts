import { ProjectService } from '@metallichq/shared';
import type { Project } from '@metallichq/types';
import { Request } from 'express';
import { ResponseLocals } from './locals.js';

export const getProjectFromRequest = async (req: Request): Promise<Project | null> => {
  const projectId = req.query['project_id'];
  if (!projectId || typeof projectId !== 'string') {
    return null;
  }

  return ProjectService.getProjectById(projectId);
};

export function getProjectIdFromLocals(locals: ResponseLocals): string | undefined {
  if ('project' in locals && locals.project) {
    return locals.project.id;
  }

  return undefined;
}
