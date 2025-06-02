import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  organization_id: z.string(),
  name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type Project = z.infer<typeof ProjectSchema>;

export type ProjectObject = Omit<Project, 'deleted_at'> & {
  object: 'project';
};

export type ProjectDeletedObject = {
  object: 'project';
  id: string;
  deleted: true;
};
