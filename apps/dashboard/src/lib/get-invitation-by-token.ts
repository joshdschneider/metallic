import { InvitationObject } from '@metallichq/types';
import { api } from './api';

export const getInvitationByToken = async (invitationToken: string) => {
  const response = await api.get<InvitationObject>(`/web/auth/invitation?invitation_token=${invitationToken}`);
  return response.data;
};
