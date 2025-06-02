import { api } from './api';

export const acceptInvitation = async (invitationId: string) => {
  const response = await api.post(`/web/auth/accept-invitation`, {
    invitation_id: invitationId
  });
  return response.data;
};
