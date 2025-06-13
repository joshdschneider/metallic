import { HttpError, OrganizationService, UserService, WorkOSClient } from '@metallichq/shared';
import {
  OrganizationMemberObject,
  OrganizationMemberRemovedObject,
  OrganizationMembershipRole,
  OrganizationMembershipStatus,
  OrganizationObject
} from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SessionAuthResponseLocalsSchema } from '../utils/locals.js';

export const ListOrganizationsRequestSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema
});

export const listOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListOrganizationsRequestSchema.safeParse({
      method: req.method,
      locals: res.locals
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { user } = parsedReq.data.locals;
    const organizations = await OrganizationService.getOrganizationsByUserId(user.id);

    const organizationObjects: OrganizationObject[] = organizations.map((organization) => {
      const { deleted_at, workos_organization_id, ...rest } = organization;
      return { object: 'organization', ...rest };
    });

    res.status(200).json({ object: 'list', data: organizationObjects });
  } catch (err) {
    next(err);
  }
};

export const CreateOrganizationRequestSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  body: z.object({ name: z.string() })
});

export const createOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = CreateOrganizationRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { name } = parsedReq.data.body;
    const { user } = parsedReq.data.locals;

    const workosOrg = await WorkOSClient.createOrganization(name);
    const organization = await OrganizationService.createOrganization({
      name,
      workos_organization_id: workosOrg.id,
      stripe_customer_id: null
    });

    const workosOrgMembership = await WorkOSClient.createOrganizationMembership({
      organizationId: workosOrg.id,
      userId: user.workos_user_id,
      roleSlug: OrganizationMembershipRole.Owner
    });

    await OrganizationService.createOrganizationMembership({
      organization_id: organization.id,
      user_id: user.id,
      role: OrganizationMembershipRole.Owner,
      status: workosOrgMembership.status as OrganizationMembershipStatus,
      workos_organization_membership_id: workosOrgMembership.id
    });

    const { deleted_at, workos_organization_id, ...rest } = organization;
    const organizationObject: OrganizationObject = { object: 'organization', ...rest };

    res.status(201).json(organizationObject);
  } catch (err) {
    next(err);
  }
};

export const UpdateOrganizationRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string() }),
  body: z.object({ name: z.string().optional() })
});

export const updateOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateOrganizationRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { user } = parsedReq.data.locals;
    const { organization_id } = parsedReq.data.params;
    const { name } = parsedReq.data.body;

    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
    }

    const membership = await OrganizationService.getOrganizationMembership(user.id, organization_id);
    if (
      !membership ||
      ![OrganizationMembershipRole.Owner, OrganizationMembershipRole.Admin].includes(membership.role)
    ) {
      throw HttpError.forbidden('You do not have permission to update this organization');
    }

    await WorkOSClient.updateOrganization(organization.workos_organization_id, { name });
    const updatedOrganization = await OrganizationService.updateOrganization(organization_id, { name });

    const { deleted_at, workos_organization_id, ...rest } = updatedOrganization;
    const organizationObject: OrganizationObject = { object: 'organization', ...rest };

    res.status(200).json(organizationObject);
  } catch (err) {
    next(err);
  }
};

export const ListOrganizationMembersRequstSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string() })
});

export const listOrganizationMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListOrganizationMembersRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id } = parsedReq.data.params;
    const organizationMembers = await OrganizationService.getOrganizationMembershipsByOrganizationId(organization_id);

    let organizationMemberObjects: OrganizationMemberObject[] = [];
    for (const member of organizationMembers) {
      const user = await UserService.getUserById(member.user_id);
      if (user) {
        organizationMemberObjects.push({
          object: 'organization_member',
          user_id: user.id,
          organization_id: member.organization_id,
          organization_membership_id: member.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: member.role,
          status: member.status,
          created_at: member.created_at,
          updated_at: member.updated_at
        });
      }
    }

    res.status(200).json({ object: 'list', data: organizationMemberObjects });
  } catch (err) {
    next(err);
  }
};

export const UpdateOrganizationMemberRequestSchema = z.object({
  method: z.literal('PUT'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), membership_id: z.string() }),
  body: z.object({ role: z.nativeEnum(OrganizationMembershipRole) })
});

export const updateOrganizationMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = UpdateOrganizationMemberRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { membership_id } = parsedReq.data.params;
    const { role } = parsedReq.data.body;

    const membership = await OrganizationService.getOrganizationMembershipById(membership_id);
    if (!membership) {
      throw HttpError.notFound(`Membership not found with ID: ${membership_id}`);
    }

    const user = await UserService.getUserById(membership.user_id);
    if (!user) {
      throw HttpError.notFound(`User not found with ID: ${membership.user_id}`);
    }

    await WorkOSClient.updateOrganizationMembership(membership.workos_organization_membership_id, { roleSlug: role });
    const updatedMembership = await OrganizationService.updateOrganizationMembership(membership.id, { role });

    const organizationMemberObject: OrganizationMemberObject = {
      object: 'organization_member',
      user_id: updatedMembership.user_id,
      organization_id: updatedMembership.organization_id,
      organization_membership_id: updatedMembership.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: updatedMembership.role,
      status: updatedMembership.status,
      created_at: updatedMembership.created_at,
      updated_at: updatedMembership.updated_at
    };

    res.status(200).json(organizationMemberObject);
  } catch (err) {
    next(err);
  }
};

export const RemoveOrganizationMemberRequestSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), membership_id: z.string() })
});

export const removeOrganizationMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RemoveOrganizationMemberRequestSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { membership_id } = parsedReq.data.params;
    const membership = await OrganizationService.getOrganizationMembershipById(membership_id);
    if (!membership) {
      throw HttpError.notFound(`Membership not found with ID: ${membership_id}`);
    }

    await WorkOSClient.deleteOrganizationMembership(membership.workos_organization_membership_id);
    await OrganizationService.deleteOrganizationMembership(membership.id);

    const organizationMemberRemovedObject: OrganizationMemberRemovedObject = {
      object: 'organization_member',
      id: membership.id,
      removed: true
    };

    res.status(200).json(organizationMemberRemovedObject);
  } catch (err) {
    next(err);
  }
};
