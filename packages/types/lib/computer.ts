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

export const ComputerEventTypeSchema = z.enum([
  'created',
  'starting',
  'started',
  'stopping',
  'stopped',
  'destroying',
  'destroyed',
  'heartbeat'
]);

export type ComputerEventType = z.infer<typeof ComputerEventTypeSchema>;

export const ComputerEventSchema = z.object({
  id: z.string(),
  computer_id: z.string(),
  type: ComputerEventTypeSchema,
  timestamp: z.number(),
  metadata: z.record(z.string(), z.any()).nullable()
});

export type ComputerEvent = z.infer<typeof ComputerEventSchema>;
