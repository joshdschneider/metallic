import { ProjectObject } from '@metallichq/types';
import { api } from './api';

export const listProjects = async (organizationId: string) => {
  const response = await api.get<{ object: 'list'; data: ProjectObject[] }>(
    `/web/organizations/${organizationId}/projects`
  );
  return response.data;
};
