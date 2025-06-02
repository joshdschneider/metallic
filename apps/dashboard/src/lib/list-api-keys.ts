import { ApiKeyObject } from '@metallichq/types';
import { api } from './api';

export const listApiKeys = async (projectId: string) => {
  const response = await api.get<{ object: 'list'; data: ApiKeyObject[] }>(`/web/api-keys?project_id=${projectId}`);
  return response.data;
};
