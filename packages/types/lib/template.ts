import { z } from 'zod';

export const InitSchema = z.object({
  cmd: z.array(z.string()),
  entrypoint: z.array(z.string())
});

export const TemplateSchema = z.object({
  slug: z.string(),
  project_id: z.string().nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  instance_type: z.string(),
  storage_gb: z.number(),
  image: z.string(),
  init: InitSchema.nullable(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type Template = z.infer<typeof TemplateSchema>;

export type TemplateObject = Omit<Template, 'project_id' | 'deleted_at'> & {
  object: 'template';
};

export type TemplateDestroyedObject = {
  object: 'template';
  slug: string;
  destroyed: true;
};
