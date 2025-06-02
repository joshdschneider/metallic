import { TemplateObject } from '@metallichq/types';
import { api } from './api';

export const listTemplates = async (projectId: string) => {
  const response = await api.get<{
    object: 'list';
    data: TemplateObject[];
  }>(`/web/templates?project_id=${projectId}`);
  return response.data;
};
