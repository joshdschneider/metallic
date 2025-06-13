import { HttpError, OrganizationService, PaywallClient, WorkOSClient } from '@metallichq/shared';
import {
  InvitationObject,
  InvitationRevokedObject,
  InvitationState,
  OrganizationMembershipRole
} from '@metallichq/types';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { SessionAuthResponseLocalsSchema } from '../utils/locals.js';

export const ListInvitationsRequstSchema = z.object({
  method: z.literal('GET'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string() })
});

export const listInvitations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = ListInvitationsRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
    }

    const invitations = await WorkOSClient.listInvitations(organization.workos_organization_id);
    const invitationObjects: InvitationObject[] = invitations.map((invitation) => {
      if (!invitation.organizationId) {
        throw new Error('Organization ID missing from invitation object');
      }

      return {
        object: 'invitation',
        id: invitation.id,
        email: invitation.email,
        state: invitation.state as InvitationState,
        expires_at: invitation.expiresAt,
        token: invitation.token,
        accept_url: invitation.acceptInvitationUrl,
        created_at: invitation.createdAt,
        updated_at: invitation.updatedAt
      };
    });

    res.status(200).json({
      object: 'list',
      data: invitationObjects
    });
  } catch (err) {
    next(err);
  }
};

export const SendInvitationRequstSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string() }),
  body: z.object({
    email: z.string(),
    role: z.nativeEnum(OrganizationMembershipRole).optional(),
    expires_in_days: z.number().optional()
  })
});

export const sendInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = SendInvitationRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params,
      body: req.body
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id } = parsedReq.data.params;
    const { email, role, expires_in_days } = parsedReq.data.body;

    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
    }

    const { subscriptions } = parsedReq.data.locals;
    PaywallClient.checkAllowedInvitations({ subscriptions });

    const invitation = await WorkOSClient.sendInvitation(organization.workos_organization_id, {
      email,
      role: role || OrganizationMembershipRole.Member,
      expiresInDays: expires_in_days
    });

    if (!invitation.organizationId) {
      throw new Error('Organization ID missing from invitation object');
    }

    const invitationObject: InvitationObject = {
      object: 'invitation',
      id: invitation.id,
      email: invitation.email,
      state: invitation.state as InvitationState,
      expires_at: invitation.expiresAt,
      token: invitation.token,
      accept_url: invitation.acceptInvitationUrl,
      created_at: invitation.createdAt,
      updated_at: invitation.updatedAt
    };

    res.status(200).json(invitationObject);
  } catch (err) {
    next(err);
  }
};

export const RevokeInvitationRequstSchema = z.object({
  method: z.literal('POST'),
  locals: SessionAuthResponseLocalsSchema,
  params: z.object({ organization_id: z.string(), invitation_id: z.string() })
});

export const revokeInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedReq = RevokeInvitationRequstSchema.safeParse({
      method: req.method,
      locals: res.locals,
      params: req.params
    });

    if (!parsedReq.success) {
      throw HttpError.validation(parsedReq.error);
    }

    const { organization_id, invitation_id } = parsedReq.data.params;
    const organization = await OrganizationService.getOrganizationById(organization_id);
    if (!organization) {
      throw HttpError.notFound(`Organization not found with ID: ${organization_id}`);
    }

    const invitation = await WorkOSClient.revokeInvitation(invitation_id);
    if (!invitation.organizationId) {
      throw new Error('Organization ID missing from invitation object');
    }

    const invitationRevokedObject: InvitationRevokedObject = {
      object: 'invitation',
      id: invitation.id,
      revoked: true
    };

    res.status(200).json(invitationRevokedObject);
  } catch (err) {
    next(err);
  }
};
