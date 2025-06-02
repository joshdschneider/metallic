import { ProjectObject } from '@metallichq/types';
import { api } from './api';

export const updateProject = async (req: { organizationId: string; projectId: string; name: string }) => {
  const response = await api.put<ProjectObject>(`/web/organizations/${req.organizationId}/projects/${req.projectId}`, {
    name: req.name
  });
  return response.data;
};
