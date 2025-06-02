import { OrganizationMemberObject, OrganizationMembershipRole } from '@metallichq/types';
import { api } from './api';

type UpdateOrganizationMemberRequest = {
  organizationId: string;
  membershipId: string;
  role: OrganizationMembershipRole;
};
export const updateOrganizationMember = async ({
  organizationId,
  membershipId,
  role
}: UpdateOrganizationMemberRequest) => {
  const response = await api.put<OrganizationMemberObject>(
    `/web/organizations/${organizationId}/members/${membershipId}`,
    { role }
  );
  return response.data;
};
