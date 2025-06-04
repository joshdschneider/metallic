import { z } from 'zod';

export const ComputerStateSchema = z.enum([
  'created',
  'starting',
  'started',
  'stopping',
  'stopped',
  'destroying',
  'destroyed'
]);

export type ComputerState = z.infer<typeof ComputerStateSchema>;

export const ComputerSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  template_slug: z.string(),
  provider: z.string(),
  provider_id: z.string(),
  region: z.string(),
  state: ComputerStateSchema,
  ttl_seconds: z.number().nullable(),
  auto_destroy: z.boolean(),
  metadata: z.record(z.string(), z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type Computer = z.infer<typeof ComputerSchema>;

export type ComputerObject = Omit<Computer, 'provider' | 'provider_id' | 'template_slug' | 'deleted_at'> & {
  object: 'computer';
  instance_id: string;
  template: string;
};

export type ComputerDestroyedObject = {
  object: 'computer';
  id: string;
  destroyed: true;
};
