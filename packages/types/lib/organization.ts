import { z } from 'zod';

export const OrganizationSchema = z.object({
  id: z.string(),
  workos_organization_id: z.string(),
  name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type Organization = z.infer<typeof OrganizationSchema>;

export type OrganizationObject = Omit<Organization, 'workos_organization_id' | 'deleted_at'> & {
  object: 'organization';
};

export enum OrganizationMembershipRole {
  Owner = 'owner',
  Admin = 'admin',
  Member = 'member'
}

export enum OrganizationMembershipStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}

export const OrganizationMembershipSchema = z.object({
  id: z.string(),
  workos_organization_membership_id: z.string(),
  organization_id: z.string(),
  user_id: z.string(),
  role: z.nativeEnum(OrganizationMembershipRole),
  status: z.nativeEnum(OrganizationMembershipStatus),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable()
});

export type OrganizationMembership = z.infer<typeof OrganizationMembershipSchema>;

export type OrganizationMembershipObject = Omit<
  OrganizationMembership,
  'workos_organization_membership_id' | 'deleted_at'
> & {
  object: 'organization_membership';
};

export type OrganizationMemberObject = {
  object: 'organization_member';
  user_id: string;
  organization_id: string;
  organization_membership_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: OrganizationMembershipRole;
  status: OrganizationMembershipStatus;
  created_at: string;
  updated_at: string;
};

export enum InvitationState {
  Pending = 'pending',
  Accepted = 'accepted',
  Expired = 'expired',
  Revoked = 'revoked'
}

export type InvitationObject = {
  object: 'invitation';
  id: string;
  email: string;
  state: InvitationState;
  expires_at: string;
  token: string;
  accept_url: string;
  created_at: string;
  updated_at: string;
};

export type InvitationRevokedObject = {
  object: 'invitation';
  id: string;
  revoked: true;
};

export type OrganizationMemberRemovedObject = {
  object: 'organization_member';
  id: string;
  removed: true;
};
