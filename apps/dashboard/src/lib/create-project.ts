import { ProjectObject } from '@metallichq/types';
import { api } from './api';

export const createProject = async (req: { organizationId: string; name: string }) => {
  const response = await api.post<ProjectObject>(`/web/organizations/${req.organizationId}/projects`, {
    name: req.name
  });
  return response.data;
};
