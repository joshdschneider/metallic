import { OrganizationMemberObject } from '@metallichq/types';
import { api } from './api';

export const listOrganizationMembers = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: OrganizationMemberObject[] }>(
    `/web/organizations/${organizationId}/members`
  );
  return response.data;
};
