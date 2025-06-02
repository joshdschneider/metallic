import { api } from './api';

export const countComputers = async (projectId: string) => {
  const response = await api.get<{ count: number }>(`/web/computers/count?project_id=${projectId}`);
  return response.data.count;
};
