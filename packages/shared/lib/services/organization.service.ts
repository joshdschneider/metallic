import { database } from '@metallichq/database';
import {
  type Organization,
  OrganizationMembership,
  OrganizationMembershipSchema,
  OrganizationSchema
} from '@metallichq/types';
import { z } from 'zod';
import { generateId, now, Resource } from '../utils/index.js';

export const getOrganizationById = async (id: string): Promise<Organization | null> => {
  const organization = await database.organization.findUnique({
    where: { id, deleted_at: null }
  });

  if (!organization) {
    return null;
  }

  return OrganizationSchema.parse(organization);
};

export const getOrganizationByWorkosOrganizationId = async (
  workosOrganizationId: string
): Promise<Organization | null> => {
  const organization = await database.organization.findUnique({
    where: { workos_organization_id: workosOrganizationId, deleted_at: null }
  });

  return organization ? OrganizationSchema.parse(organization) : null;
};

export const getOrganizationsByUserId = async (userId: string): Promise<Organization[]> => {
  const memberships = await database.organizationMembership.findMany({
    where: { user_id: userId, deleted_at: null },
    include: { organization: true }
  });

  return z.array(OrganizationSchema).parse(memberships.map((membership) => membership.organization));
};

export const createOrganization = async (
  organization: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Organization> => {
  const newOrganization = await database.organization.create({
    data: {
      ...organization,
      id: generateId(Resource.Organization),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return OrganizationSchema.parse(newOrganization);
};

export const updateOrganization = async (id: string, organization: Partial<Organization>): Promise<Organization> => {
  const updatedOrganization = await database.organization.update({
    where: { id, deleted_at: null },
    data: { ...organization, updated_at: now() }
  });

  return OrganizationSchema.parse(updatedOrganization);
};

export const deleteOrganization = async (id: string): Promise<Organization> => {
  const deletedOrganization = await database.organization.update({
    where: { id, deleted_at: null },
    data: { deleted_at: now() }
  });

  return OrganizationSchema.parse(deletedOrganization);
};

export const getOrganizationMembershipById = async (
  organizationMembershipId: string
): Promise<OrganizationMembership | null> => {
  const membership = await database.organizationMembership.findUnique({
    where: { id: organizationMembershipId, deleted_at: null }
  });

  return membership ? OrganizationMembershipSchema.parse(membership) : null;
};

export const getOrganizationMembership = async (
  userId: string,
  organizationId: string
): Promise<OrganizationMembership | null> => {
  const membership = await database.organizationMembership.findUnique({
    where: { organization_id_user_id: { organization_id: organizationId, user_id: userId }, deleted_at: null }
  });

  return membership ? OrganizationMembershipSchema.parse(membership) : null;
};

export const getOrganizationMembershipByWorkosOrganizationMembershipId = async (
  workosOrganizationMembershipId: string
): Promise<OrganizationMembership | null> => {
  const membership = await database.organizationMembership.findUnique({
    where: { workos_organization_membership_id: workosOrganizationMembershipId, deleted_at: null }
  });

  return membership ? OrganizationMembershipSchema.parse(membership) : null;
};

export const getOrganizationMembershipsByUserId = async (userId: string): Promise<OrganizationMembership[]> => {
  const memberships = await database.organizationMembership.findMany({
    where: { user_id: userId, deleted_at: null }
  });

  return z.array(OrganizationMembershipSchema).parse(memberships);
};

export const getOrganizationMembershipsByOrganizationId = async (
  organizationId: string
): Promise<OrganizationMembership[]> => {
  const memberships = await database.organizationMembership.findMany({
    where: { organization_id: organizationId, deleted_at: null }
  });

  return z.array(OrganizationMembershipSchema).parse(memberships);
};

export const createOrganizationMembership = async (
  organizationMembership: Omit<OrganizationMembership, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<OrganizationMembership> => {
  const newOrganizationMembership = await database.organizationMembership.create({
    data: {
      ...organizationMembership,
      id: generateId(Resource.OrganizationMembership),
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    }
  });

  return OrganizationMembershipSchema.parse(newOrganizationMembership);
};

export const updateOrganizationMembership = async (
  organizationMembershipId: string,
  organizationMembership: Partial<OrganizationMembership>
): Promise<OrganizationMembership> => {
  const updatedOrganizationMembership = await database.organizationMembership.update({
    where: { id: organizationMembershipId, deleted_at: null },
    data: { ...organizationMembership, updated_at: now() }
  });

  return OrganizationMembershipSchema.parse(updatedOrganizationMembership);
};

export const deleteOrganizationMembership = async (
  organizationMembershipId: string
): Promise<OrganizationMembership> => {
  const deletedOrganizationMembership = await database.organizationMembership.update({
    where: { id: organizationMembershipId, deleted_at: null },
    data: { deleted_at: now() }
  });

  return OrganizationMembershipSchema.parse(deletedOrganizationMembership);
};
