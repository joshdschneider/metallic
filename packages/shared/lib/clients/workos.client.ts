import {
  GenericServerException,
  Invitation,
  Organization,
  OrganizationMembership,
  User,
  WorkOS
} from '@workos-inc/node';
import { envVars } from '../utils/index.js';

const workos = new WorkOS(envVars.WORKOS_API_KEY, {
  clientId: envVars.WORKOS_CLIENT_ID
});

export const sendCode = async (email: string): Promise<void> => {
  await workos.userManagement.createMagicAuth({ email });
};

export const verifyCode = async (email: string, code: string): Promise<{ user: User; session: string }> => {
  if (!envVars.WORKOS_CLIENT_ID || !envVars.WORKOS_COOKIE_PASSWORD) {
    throw new Error('WORKOS_CLIENT_ID and WORKOS_COOKIE_PASSWORD must be set');
  }

  try {
    const res = await workos.userManagement.authenticateWithMagicAuth({
      clientId: envVars.WORKOS_CLIENT_ID,
      email,
      code,
      session: { sealSession: true, cookiePassword: envVars.WORKOS_COOKIE_PASSWORD }
    });

    if (!res.sealedSession) {
      throw new Error('Failed to seal session during magic auth');
    }

    return { user: res.user, session: res.sealedSession };
  } catch (err) {
    if (
      err instanceof GenericServerException &&
      err.rawData &&
      typeof err.rawData === 'object' &&
      'code' in err.rawData &&
      err.rawData.code === 'organization_selection_required'
    ) {
      const data = err.rawData as {
        code: string;
        pending_authentication_token: string;
        user: User;
        organizations: { id: string; name: string }[];
      };

      const res = await workos.userManagement.authenticateWithOrganizationSelection({
        clientId: envVars.WORKOS_CLIENT_ID,
        pendingAuthenticationToken: data.pending_authentication_token,
        organizationId: data.organizations[0]!.id,
        session: { sealSession: true, cookiePassword: envVars.WORKOS_COOKIE_PASSWORD }
      });

      if (!res.sealedSession) {
        throw new Error('Failed to seal session during magic auth');
      }

      return { user: res.user, session: res.sealedSession };
    }

    throw err;
  }
};

export const getOAuthUrl = ({ provider, organizationId }: { provider: 'google'; organizationId?: string }): string => {
  if (!envVars.WORKOS_CLIENT_ID) {
    throw new Error('WORKOS_CLIENT_ID must be set');
  }

  switch (provider) {
    case 'google':
      return workos.userManagement.getAuthorizationUrl({
        clientId: envVars.WORKOS_CLIENT_ID,
        provider: 'GoogleOAuth',
        organizationId,
        redirectUri: `${envVars.SERVER_URL}/web/auth/oauth-callback`
      });
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export const oauthCallback = async (code: string): Promise<{ user: User; session: string }> => {
  if (!envVars.WORKOS_CLIENT_ID || !envVars.WORKOS_COOKIE_PASSWORD) {
    throw new Error('WORKOS_CLIENT_ID and WORKOS_COOKIE_PASSWORD must be set');
  }

  try {
    const res = await workos.userManagement.authenticateWithCode({
      clientId: envVars.WORKOS_CLIENT_ID,
      code,
      session: { sealSession: true, cookiePassword: envVars.WORKOS_COOKIE_PASSWORD }
    });

    if (!res.sealedSession) {
      throw new Error('Failed to seal session during magic auth');
    }

    return { user: res.user, session: res.sealedSession };
  } catch (err) {
    if (
      err instanceof GenericServerException &&
      err.rawData &&
      typeof err.rawData === 'object' &&
      'code' in err.rawData &&
      err.rawData.code === 'organization_selection_required'
    ) {
      const data = err.rawData as {
        code: string;
        pending_authentication_token: string;
        user: User;
        organizations: { id: string; name: string }[];
      };

      const res = await workos.userManagement.authenticateWithOrganizationSelection({
        clientId: envVars.WORKOS_CLIENT_ID,
        pendingAuthenticationToken: data.pending_authentication_token,
        organizationId: data.organizations[0]!.id,
        session: { sealSession: true, cookiePassword: envVars.WORKOS_COOKIE_PASSWORD }
      });

      if (!res.sealedSession) {
        throw new Error('Failed to seal session during magic auth');
      }

      return { user: res.user, session: res.sealedSession };
    }

    throw err;
  }
};

export const findInvitationByToken = async (invitationToken: string): Promise<Invitation> => {
  return await workos.userManagement.findInvitationByToken(invitationToken);
};

export const acceptInvitation = async (invitationId: string): Promise<Invitation> => {
  return await workos.userManagement.acceptInvitation(invitationId);
};

export const loadSessionFromCookie = (cookie: string) => {
  if (!envVars.WORKOS_COOKIE_PASSWORD) {
    throw new Error('WORKOS_COOKIE_PASSWORD must be set');
  }

  return workos.userManagement.loadSealedSession({
    sessionData: cookie,
    cookiePassword: envVars.WORKOS_COOKIE_PASSWORD
  });
};

export const getOrganization = async (organizationId: string): Promise<Organization> => {
  return await workos.organizations.getOrganization(organizationId);
};

export const createOrganization = async (name: string): Promise<Organization> => {
  return await workos.organizations.createOrganization({ name });
};

export const listOrganizationMemberships = async (props: {
  organizationId?: string;
  userId?: string;
}): Promise<OrganizationMembership[]> => {
  const memberships = await workos.userManagement.listOrganizationMemberships({
    ...props,
    statuses: ['active'],
    limit: 100
  });
  return memberships.data;
};

export const createOrganizationMembership = async (organizationMembership: {
  organizationId: string;
  userId: string;
  roleSlug: string;
}): Promise<OrganizationMembership> => {
  return await workos.userManagement.createOrganizationMembership({
    organizationId: organizationMembership.organizationId,
    userId: organizationMembership.userId,
    roleSlug: organizationMembership.roleSlug
  });
};

export const updateOrganizationMembership = async (
  organizationMembershipId: string,
  data: { roleSlug?: string }
): Promise<OrganizationMembership> => {
  return await workos.userManagement.updateOrganizationMembership(organizationMembershipId, {
    roleSlug: data.roleSlug
  });
};

export const deleteOrganizationMembership = async (organizationMembershipId: string): Promise<void> => {
  return await workos.userManagement.deleteOrganizationMembership(organizationMembershipId);
};

export const updateUser = async (userId: string, data: { firstName?: string; lastName?: string }): Promise<User> => {
  return await workos.userManagement.updateUser({
    userId,
    firstName: data.firstName,
    lastName: data.lastName
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  return await workos.userManagement.deleteUser(userId);
};

export const updateOrganization = async (organizationId: string, data: { name?: string }): Promise<Organization> => {
  return await workos.organizations.updateOrganization({
    organization: organizationId,
    name: data.name
  });
};

export const listInvitations = async (organizationId: string): Promise<Invitation[]> => {
  const invitations = await workos.userManagement.listInvitations({ organizationId });
  return invitations.data;
};

export const sendInvitation = async (
  organizationId: string,
  invitation: { email: string; role: string; expiresInDays?: number }
): Promise<Invitation> => {
  return await workos.userManagement.sendInvitation({
    organizationId,
    email: invitation.email,
    roleSlug: invitation.role,
    expiresInDays: invitation.expiresInDays
  });
};

export const revokeInvitation = async (invitationId: string): Promise<Invitation> => {
  return await workos.userManagement.revokeInvitation(invitationId);
};

export const deleteOrganization = async (organizationId: string): Promise<void> => {
  return await workos.organizations.deleteOrganization(organizationId);
};
