import { InvitationObject } from '@metallichq/types';
import { api } from './api';

export const listInvitations = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: InvitationObject[] }>(
    `/web/organizations/${organizationId}/invitations`
  );
  return response.data;
};
