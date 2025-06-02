import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  workos_user_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string(),
  email_verified: z.boolean(),
  email_subscriptions: z.array(z.string()),
  profile_picture_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type User = z.infer<typeof UserSchema>;

export type UserObject = Omit<User, 'workos_user_id' | 'deleted_at'> & {
  object: 'user';
};

export type UserDeletedObject = {
  object: 'user';
  id: string;
  deleted: true;
};
