import { ProjectDeletedObject } from '@metallichq/types';
import { api } from './api';

export const deleteProject = async (req: { organizationId: string; projectId: string }) => {
  const response = await api.delete<ProjectDeletedObject>(
    `/web/organizations/${req.organizationId}/projects/${req.projectId}`
  );
  return response.data;
};
