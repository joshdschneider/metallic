import { z } from 'zod';

export const ApiKeySchema = z.object({
  id: z.string(),
  project_id: z.string(),
  key: z.string(),
  key_hash: z.string().nullable(),
  key_iv: z.string().nullable(),
  key_tag: z.string().nullable(),
  name: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

export type ApiKeyObject = {
  object: 'api_key';
  id: string;
  key: string;
  name?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKeyDeletedObject = {
  object: 'api_key';
  id: string;
  deleted: true;
};
