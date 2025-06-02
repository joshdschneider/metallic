import { api } from './api';

export const deleteApiKey = async ({ projectId, apiKeyId }: { projectId: string; apiKeyId: string }) => {
  const response = await api.delete(`/web/api-keys/${apiKeyId}?project_id=${projectId}`);
  return response.data;
};
