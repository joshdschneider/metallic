import { ComputerObject } from '@metallichq/types';
import { api } from './api';

export const listComputers = async (
  projectId: string,
  options: {
    limit?: number;
    after?: string;
    query?: string;
  }
) => {
  const params = new URLSearchParams();
  params.set('project_id', projectId);
  if (options.limit) {
    params.set('limit', options.limit.toString());
  }

  if (options.after) {
    params.set('after', options.after);
  }

  if (options.query) {
    params.set('query', options.query);
  }

  const response = await api.get<{
    object: 'list';
    data: ComputerObject[];
    first: string | null;
    last: string | null;
    has_more: boolean;
  }>(`/web/computers?${params.toString()}`);
  return response.data;
};
