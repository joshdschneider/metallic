import {
  OrganizationMembershipSchema,
  OrganizationSchema,
  ProjectSchema,
  SubscriptionSchema,
  UserSchema
} from '@metallichq/types';
import { z } from 'zod';

export const ApiKeyAuthResponseLocalsSchema = z.object({
  auth_method: z.literal('api_key'),
  organization: OrganizationSchema,
  subscriptions: z.array(SubscriptionSchema),
  project: ProjectSchema
});

export type ApiKeyAuthResponseLocals = z.infer<typeof ApiKeyAuthResponseLocalsSchema>;

export const SessionAuthResponseLocalsSchema = z.object({
  auth_method: z.literal('session'),
  user: UserSchema,
  organization: OrganizationSchema,
  organization_membership: OrganizationMembershipSchema,
  subscriptions: z.array(SubscriptionSchema),
  project: ProjectSchema.nullable().optional()
});

export type SessionAuthResponseLocals = z.infer<typeof SessionAuthResponseLocalsSchema>;

export const ResponseLocalsSchema = z.union([ApiKeyAuthResponseLocalsSchema, SessionAuthResponseLocalsSchema]);

export type ResponseLocals = z.infer<typeof ResponseLocalsSchema>;
