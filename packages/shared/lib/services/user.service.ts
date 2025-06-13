import { database } from '@metallichq/database';
import {
  Organization,
  OrganizationMembership,
  OrganizationMembershipSchema,
  OrganizationSchema,
  Subscription,
  SubscriptionSchema,
  type User
} from '@metallichq/types';
import { z } from 'zod';
import { deleted, generateId, HttpError, now, Resource } from '../utils/index.js';

export const getUserAccount = async (
  userId: string,
  opts?: {
    organizationIdFromCookie?: string;
    organizationIdFromQueryParams?: string;
  }
): Promise<{
  organization: Organization;
  membership: OrganizationMembership;
  subscriptions: Subscription[];
} | null> => {
  const user = await database.user.findUnique({
    where: { id: userId, deleted_at: null },
    include: { organization_memberships: { include: { organization: { include: { subscriptions: true } } } } }
  });

  if (!user) {
    return null;
  }

  const memberships = user.organization_memberships.filter((membership) => membership.deleted_at === null);
  if (opts?.organizationIdFromCookie) {
    const membershipFromCookie = memberships.find(
      (membership) => membership.organization.workos_organization_id === opts.organizationIdFromCookie
    );
    if (membershipFromCookie) {
      const {
        organization: { subscriptions, ...org },
        ...membership
      } = membershipFromCookie;
      return {
        organization: OrganizationSchema.parse(org),
        subscriptions: z.array(SubscriptionSchema).parse(subscriptions),
        membership: OrganizationMembershipSchema.parse(membership)
      };
    }
  }

  if (opts?.organizationIdFromQueryParams) {
    const membershipFromQueryParams = memberships.find(
      (membership) => membership.organization.id === opts.organizationIdFromQueryParams
    );
    if (membershipFromQueryParams) {
      const {
        organization: { subscriptions, ...org },
        ...membership
      } = membershipFromQueryParams;
      return {
        organization: OrganizationSchema.parse(org),
        subscriptions: z.array(SubscriptionSchema).parse(subscriptions),
        membership: OrganizationMembershipSchema.parse(membership)
      };
    }
  }

  const firstMembership = memberships.pop();
  if (!firstMembership) {
    return null;
  }

  const {
    organization: { subscriptions, ...org },
    ...membership
  } = firstMembership;
  return {
    organization: OrganizationSchema.parse(org),
    subscriptions: z.array(SubscriptionSchema).parse(subscriptions),
    membership: OrganizationMembershipSchema.parse(membership)
  };
};

export const getUserById = async (id: string): Promise<User | null> => {
  return await database.user.findUnique({
    where: { id, deleted_at: null }
  });
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  return await database.user.findUnique({
    where: { email, deleted_at: null }
  });
};

export const createUser = async (
  user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<User> => {
  return await database.user.create({
    data: {
      ...user,
      id: generateId(Resource.User),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });
};

export const updateUser = async (id: string, user: Partial<User>): Promise<User> => {
  return await database.user.update({
    where: { id, deleted_at: null },
    data: { ...user, updated_at: now() }
  });
};

export const deleteUser = async (id: string): Promise<User> => {
  const user = await database.user.findUnique({ where: { id, deleted_at: null } });
  if (!user) {
    throw HttpError.notFound(`User not found with ID: ${id}`);
  }

  return await database.user.update({
    where: { id, deleted_at: null },
    data: { email: deleted(user.email), deleted_at: now() }
  });
};
