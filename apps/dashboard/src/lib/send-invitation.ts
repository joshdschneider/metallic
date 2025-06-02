import { InvitationObject } from '@metallichq/types';
import { api } from './api';

export const sendInvitation = async (organizationId: string, { email, role }: { email: string; role: string }) => {
  const response = await api.post<InvitationObject>(`/web/organizations/${organizationId}/invitations`, {
    email,
    role
  });
  return response.data;
};
