import { InvitationRevokedObject } from '@metallichq/types';
import { api } from './api';

type RevokeInvitationProps = {
  organizationId: string;
  invitationId: string;
};

export const revokeInvitation = async ({ organizationId, invitationId }: RevokeInvitationProps) => {
  const response = await api.post<InvitationRevokedObject>(
    `/web/organizations/${organizationId}/invitations/${invitationId}/revoke`
  );
  return response.data;
};
