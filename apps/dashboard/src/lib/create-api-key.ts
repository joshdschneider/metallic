import { ApiKeyObject } from '@metallichq/types';
import { api } from './api';

export const createApiKey = async (projectId: string, name: string) => {
  const response = await api.post<ApiKeyObject>(`/web/api-keys?project_id=${projectId}`, { name });
  return response.data;
};
