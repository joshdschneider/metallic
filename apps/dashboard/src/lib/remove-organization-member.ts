import { OrganizationMemberRemovedObject } from '@metallichq/types';
import { api } from './api';

type RemoveOrganizationMemberRequest = {
  organizationId: string;
  membershipId: string;
};

export const removeOrganizationMember = async ({ organizationId, membershipId }: RemoveOrganizationMemberRequest) => {
  const response = await api.post<OrganizationMemberRemovedObject>(
    `/web/organizations/${organizationId}/members/${membershipId}/remove`
  );
  return response.data;
};
