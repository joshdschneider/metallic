import { ApiKeyObject } from '@metallichq/types';
import { api } from './api';

type UpdateApiKeyParams = {
  projectId: string;
  apiKeyId: string;
  name: string;
};

export const updateApiKey = async ({ projectId, apiKeyId, name }: UpdateApiKeyParams) => {
  const response = await api.put<ApiKeyObject>(`/web/api-keys/${apiKeyId}?project_id=${projectId}`, { name });
  return response.data;
};
